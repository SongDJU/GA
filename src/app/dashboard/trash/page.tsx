'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, RotateCcw, FileText, FileSignature, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, getRepeatDayText } from '@/lib/utils';

interface DeletedVoucher {
  id: string;
  description: string;
  accountName: string;
  amount: number | null;
  repeatDay: number;
  deletedAt: string;
  user: { name: string };
}

interface DeletedContract {
  id: string;
  name: string;
  company: string | null;
  amount: number | null;
  endDate: string;
  category: { name: string };
  deletedAt: string;
  user: { name: string };
}

export default function TrashPage() {
  const { data: session } = useSession();
  const [vouchers, setVouchers] = useState<DeletedVoucher[]>([]);
  const [contracts, setContracts] = useState<DeletedContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const [voucherRes, contractRes] = await Promise.all([
        fetch('/api/trash/vouchers'),
        fetch('/api/trash/contracts'),
      ]);

      const vouchersData = await voucherRes.json();
      const contractsData = await contractRes.json();

      setVouchers(vouchersData);
      setContracts(contractsData);
    } catch (error) {
      toast({ title: '오류', description: '휴지통을 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (type: 'voucher' | 'contract', id: string) => {
    try {
      const res = await fetch(`/api/trash/${type}s/${id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error();

      toast({ title: '성공', description: '복구되었습니다.' });
      fetchTrash();
    } catch (error) {
      toast({ title: '오류', description: '복구에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async (type: 'voucher' | 'contract', id: string) => {
    if (!confirm('정말 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const res = await fetch(`/api/trash/${type}s/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();

      toast({ title: '성공', description: '영구 삭제되었습니다.' });
      fetchTrash();
    } catch (error) {
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('휴지통을 비우시겠습니까? 모든 항목이 영구 삭제됩니다.')) return;

    try {
      const res = await fetch('/api/trash/empty', { method: 'DELETE' });
      if (!res.ok) throw new Error();

      toast({ title: '성공', description: '휴지통이 비워졌습니다.' });
      fetchTrash();
    } catch (error) {
      toast({ title: '오류', description: '휴지통 비우기에 실패했습니다.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalItems = vouchers.length + contracts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">휴지통</h1>
          <p className="text-gray-500 mt-1">삭제된 항목을 관리하세요</p>
        </div>
        {totalItems > 0 && (
          <Button variant="destructive" onClick={handleEmptyTrash}>
            <Trash2 className="h-4 w-4 mr-2" />
            휴지통 비우기
          </Button>
        )}
      </div>

      {totalItems === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Trash2 className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">휴지통이 비어있습니다</p>
              <p className="text-sm">삭제된 항목이 여기에 표시됩니다</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="vouchers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vouchers" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              전표 ({vouchers.length})
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              계약 ({contracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vouchers">
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  삭제된 전표
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {vouchers.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    삭제된 전표가 없습니다
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead>적요명</TableHead>
                        <TableHead>계정과목</TableHead>
                        <TableHead className="text-right">금액</TableHead>
                        <TableHead>반복일자</TableHead>
                        {session?.user?.isAdmin && <TableHead>담당자</TableHead>}
                        <TableHead>삭제일</TableHead>
                        <TableHead className="w-28">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((voucher) => (
                        <TableRow key={voucher.id} className="bg-red-50/30">
                          <TableCell className="font-medium">{voucher.description}</TableCell>
                          <TableCell>{voucher.accountName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(voucher.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getRepeatDayText(voucher.repeatDay)}</Badge>
                          </TableCell>
                          {session?.user?.isAdmin && (
                            <TableCell className="text-gray-500">{voucher.user.name}</TableCell>
                          )}
                          <TableCell className="text-gray-500">{formatDate(voucher.deletedAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRestore('voucher', voucher.id)}
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="복구"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePermanentDelete('voucher', voucher.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="영구 삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-gray-600" />
                  삭제된 계약
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {contracts.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    삭제된 계약이 없습니다
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead>계약명</TableHead>
                        <TableHead>카테고리</TableHead>
                        <TableHead>계약업체</TableHead>
                        <TableHead className="text-right">금액</TableHead>
                        <TableHead>만료일</TableHead>
                        {session?.user?.isAdmin && <TableHead>담당자</TableHead>}
                        <TableHead>삭제일</TableHead>
                        <TableHead className="w-28">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => (
                        <TableRow key={contract.id} className="bg-red-50/30">
                          <TableCell className="font-medium">{contract.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{contract.category.name}</Badge>
                          </TableCell>
                          <TableCell>{contract.company || '-'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(contract.amount)}</TableCell>
                          <TableCell>{formatDate(contract.endDate)}</TableCell>
                          {session?.user?.isAdmin && (
                            <TableCell className="text-gray-500">{contract.user.name}</TableCell>
                          )}
                          <TableCell className="text-gray-500">{formatDate(contract.deletedAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRestore('contract', contract.id)}
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="복구"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePermanentDelete('contract', contract.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="영구 삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">주의사항</h4>
            <p className="text-sm text-amber-700 mt-1">
              휴지통의 항목은 영구 삭제 전까지 복구할 수 있습니다.
              영구 삭제된 항목은 복구할 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
