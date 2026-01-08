'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bell, CheckCircle, XCircle, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AlertHistory {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  voucherCount: number;
  contractCount: number;
  status: string;
  errorMessage: string | null;
  sentAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AlertsPage() {
  const { data: session } = useSession();
  const [histories, setHistories] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchHistory = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/alerts/history?page=${page}&limit=20`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setHistories(data.histories);
      setPagination(data.pagination);
    } catch (error) {
      toast({ title: '오류', description: '알림 히스토리를 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          성공
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        실패
      </Badge>
    );
  };

  // 통계 계산
  const stats = {
    total: pagination.total,
    success: histories.filter(h => h.status === 'success').length,
    failed: histories.filter(h => h.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">알림 히스토리</h1>
          <p className="text-gray-500 mt-1">발송된 알림 이메일 내역을 확인하세요</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">전체 발송</p>
                <p className="text-3xl font-bold">{pagination.total}</p>
              </div>
              <Mail className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">성공</p>
                <p className="text-3xl font-bold">{stats.success}</p>
              </div>
              <CheckCircle className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">실패</p>
                <p className="text-3xl font-bold">{stats.failed}</p>
              </div>
              <XCircle className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            발송 내역
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : histories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="h-12 w-12 text-gray-300 mb-3" />
              <p className="font-medium">알림 발송 내역이 없습니다</p>
              <p className="text-sm">알림이 발송되면 여기에 표시됩니다</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>발송일시</TableHead>
                    <TableHead>수신자</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead className="text-center">전표 알림</TableHead>
                    <TableHead className="text-center">계약 알림</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>오류 메시지</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {histories.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell className="font-medium">
                        {formatDate(history.sentAt)}
                      </TableCell>
                      <TableCell>{history.userName}</TableCell>
                      <TableCell className="text-gray-500">{history.userEmail}</TableCell>
                      <TableCell className="text-center">
                        {history.voucherCount > 0 ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {history.voucherCount}건
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {history.contractCount > 0 ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700">
                            {history.contractCount}건
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(history.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-red-500">
                        {history.errorMessage || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
                  <div className="text-sm text-gray-500">
                    총 {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1} -{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchHistory(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Button>
                    <span className="text-sm text-gray-600">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchHistory(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
