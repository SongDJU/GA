import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FileSignature, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate, getDaysUntilExpiry, getRepeatDayText } from '@/lib/utils';
import Link from 'next/link';

async function getDashboardData(userId: string, isAdmin: boolean) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get vouchers for current month (not completed, not deleted)
  const voucherWhere = {
    deletedAt: null,
    isCompleted: false,
    ...(isAdmin ? {} : { userId }),
  };

  const vouchers = await prisma.voucher.findMany({
    where: voucherWhere,
    include: {
      user: { select: { name: true } },
    },
    orderBy: { repeatDay: 'asc' },
  });

  // Filter vouchers that should appear this month
  const thisMonthVouchers = vouchers.filter((v) => {
    const repeatDay = v.repeatDay === 0 ? lastDayOfMonth : v.repeatDay;
    return repeatDay >= currentDay;
  });

  // Get contracts with upcoming expiry
  const contractWhere = {
    deletedAt: null,
    ...(isAdmin ? {} : { userId }),
  };

  const contracts = await prisma.contract.findMany({
    where: contractWhere,
    include: {
      category: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { endDate: 'asc' },
  });

  // Filter contracts by expiry alerts (45, 30, 20, 10, 3, 2, 1 days)
  const alertDays = [45, 30, 20, 10, 3, 2, 1];
  const expiringContracts = contracts
    .map((c) => ({
      ...c,
      daysUntil: getDaysUntilExpiry(c.endDate),
    }))
    .filter((c) => c.daysUntil >= 0 && c.daysUntil <= 45);

  // Stats
  const totalVouchers = await prisma.voucher.count({
    where: { deletedAt: null, ...(isAdmin ? {} : { userId }) },
  });

  const completedVouchers = await prisma.voucher.count({
    where: { deletedAt: null, isCompleted: true, ...(isAdmin ? {} : { userId }) },
  });

  const totalContracts = await prisma.contract.count({
    where: { deletedAt: null, ...(isAdmin ? {} : { userId }) },
  });

  const expiredContracts = contracts.filter((c) => getDaysUntilExpiry(c.endDate) < 0).length;

  return {
    thisMonthVouchers,
    expiringContracts,
    stats: {
      totalVouchers,
      completedVouchers,
      pendingVouchers: totalVouchers - completedVouchers,
      totalContracts,
      expiredContracts,
      activeContracts: totalContracts - expiredContracts,
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { thisMonthVouchers, expiringContracts, stats } = await getDashboardData(
    session.user.id,
    session.user.isAdmin
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">
          안녕하세요, {session.user.name}님! 오늘의 업무 현황을 확인하세요.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">전체 전표</CardTitle>
            <FileText className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalVouchers}</div>
            <p className="text-sm opacity-80 mt-1">
              처리 완료: {stats.completedVouchers}건
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">미처리 전표</CardTitle>
            <Clock className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingVouchers}</div>
            <p className="text-sm opacity-80 mt-1">이번 달 처리 필요</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">전체 계약</CardTitle>
            <FileSignature className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalContracts}</div>
            <p className="text-sm opacity-80 mt-1">
              활성 계약: {stats.activeContracts}건
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-rose-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">만료 임박</CardTitle>
            <AlertTriangle className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{expiringContracts.length}</div>
            <p className="text-sm opacity-80 mt-1">45일 이내 만료</p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* This Month Vouchers */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">이번 달 처리 전표</CardTitle>
                <CardDescription>처리해야 할 전표 목록입니다</CardDescription>
              </div>
              <Link
                href="/dashboard/vouchers"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                전체 보기 →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {thisMonthVouchers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <CheckCircle className="h-12 w-12 text-green-400 mb-3" />
                <p className="font-medium">모든 전표가 처리되었습니다!</p>
              </div>
            ) : (
              <div className="divide-y">
                {thisMonthVouchers.slice(0, 5).map((voucher) => (
                  <div key={voucher.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{voucher.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{voucher.accountName}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {getRepeatDayText(voucher.repeatDay)}
                        </span>
                        {session.user.isAdmin && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-sm text-gray-400">{voucher.user.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {voucher.amount && (
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(voucher.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Contracts */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">만료 임박 계약</CardTitle>
                <CardDescription>곧 만료되는 계약 목록입니다</CardDescription>
              </div>
              <Link
                href="/dashboard/contracts"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                전체 보기 →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {expiringContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <CheckCircle className="h-12 w-12 text-green-400 mb-3" />
                <p className="font-medium">만료 임박 계약이 없습니다!</p>
              </div>
            ) : (
              <div className="divide-y">
                {expiringContracts.slice(0, 5).map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{contract.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {contract.category.name}
                        </Badge>
                        {contract.company && (
                          <span className="text-sm text-gray-500">{contract.company}</span>
                        )}
                        {session.user.isAdmin && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-sm text-gray-400">{contract.user.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <Badge
                        variant={
                          contract.daysUntil <= 3
                            ? 'destructive'
                            : contract.daysUntil <= 10
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        D-{contract.daysUntil}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(contract.endDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
