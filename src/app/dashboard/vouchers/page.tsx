'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Download, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  ListChecks,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, getRepeatDayText } from '@/lib/utils';

interface VoucherCompletion {
  year: number;
  month: number;
}

interface Voucher {
  id: string;
  description: string;
  amount: number | null;
  vatAmount: number | null;
  accountName: string;
  repeatDay: number;
  userId: string;
  user: { name: string };
  completions: VoucherCompletion[];
  createdAt: string;
}

type TabType = 'monthly' | 'master';

export default function VouchersPage() {
  const { data: session } = useSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('monthly');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    vatAmount: '',
    accountName: '',
    repeatDay: '1',
  });

  // 월별 필터링을 위한 상태
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/vouchers');
      const data = await res.json();
      setVouchers(data);
    } catch (error) {
      toast({ title: '오류', description: '전표 목록을 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.accountName) {
      toast({ title: '오류', description: '적요명과 계정과목명은 필수입니다.', variant: 'destructive' });
      return;
    }

    try {
      const url = editingVoucher ? `/api/vouchers/${editingVoucher.id}` : '/api/vouchers';
      const method = editingVoucher ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          vatAmount: formData.vatAmount ? parseFloat(formData.vatAmount) : null,
          accountName: formData.accountName,
          repeatDay: parseInt(formData.repeatDay),
        }),
      });

      if (!res.ok) throw new Error();

      toast({ title: '성공', description: editingVoucher ? '전표가 수정되었습니다.' : '전표가 등록되었습니다.' });
      setDialogOpen(false);
      resetForm();
      fetchVouchers();
    } catch (error) {
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 휴지통으로 이동됩니다.\n\n※ 삭제하면 모든 월의 처리 기록도 함께 삭제됩니다.')) return;

    try {
      const res = await fetch(`/api/vouchers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();

      toast({ title: '성공', description: '전표가 휴지통으로 이동되었습니다.' });
      fetchVouchers();
    } catch (error) {
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  // 월별 처리완료 체크
  const handleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/vouchers/${id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isCompleted,
          year: currentYear,
          month: currentMonth,
        }),
      });
      if (!res.ok) throw new Error();

      toast({ 
        title: '성공', 
        description: isCompleted 
          ? `${currentYear}년 ${currentMonth}월 처리 완료` 
          : `${currentYear}년 ${currentMonth}월 미처리로 변경` 
      });
      fetchVouchers();
    } catch (error) {
      toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      description: voucher.description,
      amount: voucher.amount?.toString() || '',
      vatAmount: voucher.vatAmount?.toString() || '',
      accountName: voucher.accountName,
      repeatDay: voucher.repeatDay.toString(),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingVoucher(null);
    setFormData({
      description: '',
      amount: '',
      vatAmount: '',
      accountName: '',
      repeatDay: '1',
    });
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/vouchers/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vouchers_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (error) {
      toast({ title: '오류', description: '내보내기에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/vouchers/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error();

      const result = await res.json();
      toast({ title: '성공', description: `${result.count}개의 전표가 가져오기되었습니다.` });
      fetchVouchers();
    } catch (error) {
      toast({ title: '오류', description: '가져오기에 실패했습니다.', variant: 'destructive' });
    }

    e.target.value = '';
  };

  // 월 이동 함수들
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // 해당 월의 마지막 날 구하기
  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 전표가 해당 월에 처리완료되었는지 확인
  const isCompletedForMonth = (voucher: Voucher, year: number, month: number) => {
    return voucher.completions?.some(c => c.year === year && c.month === month) || false;
  };

  // 해당 월에 표시해야 할 전표인지 확인
  const shouldShowInMonth = (voucher: Voucher, year: number, month: number) => {
    const lastDay = getLastDayOfMonth(year, month);
    const repeatDay = voucher.repeatDay === 0 ? lastDay : voucher.repeatDay;
    return voucher.repeatDay === 0 || repeatDay <= lastDay;
  };

  // 해당 월에 표시할 전표 필터링
  const filteredVouchers = vouchers.filter(v => shouldShowInMonth(v, currentYear, currentMonth));

  // 처리 완료/미완료 통계
  const completedCount = filteredVouchers.filter(v => isCompletedForMonth(v, currentYear, currentMonth)).length;
  const pendingCount = filteredVouchers.length - completedCount;

  const repeatDayOptions = [
    { value: '0', label: '말일' },
    ...Array.from({ length: 31 }, (_, i) => ({
      value: (i + 1).toString(),
      label: `${i + 1}일`,
    })),
  ];

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">전표 관리</h1>
          <p className="text-gray-500 mt-1">매월 반복되는 전표를 등록하고 처리 현황을 관리하세요</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'monthly'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ListChecks className="h-5 w-5" />
            월별 처리 현황
            <Badge variant={activeTab === 'monthly' ? 'default' : 'secondary'} className="ml-1">
              {pendingCount > 0 ? `${pendingCount}건 미처리` : '완료'}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'master'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            등록된 전표 목록
            <Badge variant={activeTab === 'master' ? 'default' : 'secondary'} className="ml-1 bg-indigo-100 text-indigo-700">
              {vouchers.length}건
            </Badge>
          </button>
        </nav>
      </div>

      {/* 월별 처리 현황 탭 */}
      {activeTab === 'monthly' && (
        <>
          {/* 월 선택 네비게이션 */}
          <Card className="border-2 border-blue-100 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="bg-white">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="text-xl font-bold text-gray-900">{formatMonth(currentDate)}</span>
                  </div>
                  <Button variant="outline" size="icon" onClick={goToNextMonth} className="bg-white">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {!isCurrentMonth() && (
                    <Button variant="outline" size="sm" onClick={goToCurrentMonth} className="ml-2 bg-white">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      이번 달
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">처리완료 {completedCount}건</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                    <Circle className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-amber-700">미처리 {pendingCount}건</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 월별 처리 현황 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ListChecks className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">월별 처리 현황</h3>
                <p className="text-sm text-blue-700 mt-1">
                  아래 목록은 <strong>{formatMonth(currentDate)}</strong>에 처리해야 할 전표입니다. 
                  체크박스를 클릭하여 처리 완료를 표시하세요.
                  <br />
                  <span className="text-blue-600">※ 매월 새롭게 시작되며, 다른 달의 처리 상태와는 독립적입니다.</span>
                </p>
              </div>
            </div>
          </div>

          {/* 월별 전표 목록 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {formatMonth(currentDate)} 처리 목록
              </CardTitle>
              <CardDescription>
                체크박스를 클릭하여 이번 달 처리 완료를 표시하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredVouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="font-medium">등록된 전표가 없습니다</p>
                  <p className="text-sm">먼저 &apos;등록된 전표 목록&apos; 탭에서 전표를 등록하세요</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="w-16 text-center">처리</TableHead>
                      <TableHead>적요명</TableHead>
                      <TableHead>계정과목</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead className="text-right">부가세</TableHead>
                      <TableHead className="text-center">처리일</TableHead>
                      {session?.user?.isAdmin && <TableHead>담당자</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVouchers.map((voucher) => {
                      const isCompleted = isCompletedForMonth(voucher, currentYear, currentMonth);
                      const lastDay = getLastDayOfMonth(currentYear, currentMonth);
                      const displayDay = voucher.repeatDay === 0 ? lastDay : voucher.repeatDay;
                      
                      return (
                        <TableRow 
                          key={voucher.id} 
                          className={`transition-colors ${isCompleted ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}`}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={(checked) => handleComplete(voucher.id, checked as boolean)}
                              className={isCompleted ? 'border-green-600 bg-green-600 text-white' : ''}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className={isCompleted ? 'text-green-800' : ''}>
                                {voucher.description}
                              </span>
                              {isCompleted && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  완료
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={isCompleted ? 'text-green-700' : ''}>{voucher.accountName}</TableCell>
                          <TableCell className={`text-right ${isCompleted ? 'text-green-700' : ''}`}>
                            {formatCurrency(voucher.amount)}
                          </TableCell>
                          <TableCell className={`text-right ${isCompleted ? 'text-green-700' : ''}`}>
                            {formatCurrency(voucher.vatAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={isCompleted ? 'border-green-300 text-green-700' : ''}>
                              {voucher.repeatDay === 0 ? `${displayDay}일 (말일)` : `${displayDay}일`}
                            </Badge>
                          </TableCell>
                          {session?.user?.isAdmin && (
                            <TableCell className={`${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                              {voucher.user.name}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* 등록된 전표 목록 탭 */}
      {activeTab === 'master' && (
        <>
          {/* 액션 버튼들 */}
          <div className="flex items-center justify-between">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex-1 mr-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900">등록된 전표 (마스터 데이터)</h3>
                  <p className="text-sm text-indigo-700 mt-1">
                    여기서 등록/수정/삭제한 전표는 <strong>매월 자동으로 반복</strong>됩니다.
                    <br />
                    <span className="text-indigo-600">※ 삭제하기 전까지 영구적으로 유지됩니다.</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.location.href = '/api/vouchers/template'}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                템플릿
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                내보내기
              </Button>
              <label>
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    가져오기
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    전표 등록
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingVoucher ? '전표 수정' : '새 전표 등록'}</DialogTitle>
                    <DialogDescription>
                      등록된 전표는 매월 자동으로 반복됩니다. 삭제하기 전까지 유지됩니다.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="description">적요명 *</Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="예: 사무실 임대료, 인터넷 요금 등"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="amount">금액</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="금액 (선택)"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="vatAmount">부가세액</Label>
                          <Input
                            id="vatAmount"
                            type="number"
                            value={formData.vatAmount}
                            onChange={(e) => setFormData({ ...formData, vatAmount: e.target.value })}
                            placeholder="부가세액 (선택)"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="accountName">계정과목명 *</Label>
                        <Input
                          id="accountName"
                          value={formData.accountName}
                          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                          placeholder="예: 임차료, 통신비 등"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="repeatDay">반복일자 *</Label>
                        <Select
                          value={formData.repeatDay}
                          onValueChange={(value) => setFormData({ ...formData, repeatDay: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="반복일자 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {repeatDayOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">매월 이 날짜에 처리해야 할 전표로 표시됩니다</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        취소
                      </Button>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                        {editingVoucher ? '수정' : '등록'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* 등록된 전표 테이블 */}
          <Card className="border-2 border-indigo-100 shadow-md">
            <CardHeader className="border-b bg-indigo-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
                등록된 전표 목록
                <Badge className="ml-2 bg-indigo-100 text-indigo-700">
                  총 {vouchers.length}건
                </Badge>
              </CardTitle>
              <CardDescription>
                아래 전표들은 매월 자동으로 반복됩니다. 수정/삭제 시 모든 월에 반영됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : vouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="font-medium">등록된 전표가 없습니다</p>
                  <p className="text-sm">&apos;전표 등록&apos; 버튼을 클릭하여 새 전표를 추가하세요</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-indigo-50/50">
                      <TableHead>적요명</TableHead>
                      <TableHead>계정과목</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead className="text-right">부가세</TableHead>
                      <TableHead className="text-center">반복일자</TableHead>
                      {session?.user?.isAdmin && <TableHead>담당자</TableHead>}
                      <TableHead className="text-center">등록일</TableHead>
                      <TableHead className="w-24 text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers.map((voucher) => (
                      <TableRow key={voucher.id} className="hover:bg-indigo-50/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-indigo-400" />
                            {voucher.description}
                          </div>
                        </TableCell>
                        <TableCell>{voucher.accountName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(voucher.amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(voucher.vatAmount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                            {voucher.repeatDay === 0 ? '매월 말일' : `매월 ${voucher.repeatDay}일`}
                          </Badge>
                        </TableCell>
                        {session?.user?.isAdmin && (
                          <TableCell className="text-gray-500">{voucher.user.name}</TableCell>
                        )}
                        <TableCell className="text-center text-gray-500 text-sm">
                          {new Date(voucher.createdAt).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(voucher)}
                              className="h-8 w-8 hover:bg-indigo-100"
                            >
                              <Pencil className="h-4 w-4 text-indigo-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(voucher.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </>
      )}
    </div>
  );
}
