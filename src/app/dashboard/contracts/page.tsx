'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Download, Upload, FileSignature, Paperclip, FileSpreadsheet, Search, User, Users, X, RefreshCw, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, getDaysUntilExpiry } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Attachment {
  id: string;
  originalName: string;
  filename: string;
}

interface Contract {
  id: string;
  name: string;
  company: string | null;
  amount: number | null;
  startDate: string | null;
  endDate: string;
  contactInfo: string | null;
  notes: string | null;
  categoryId: string;
  category: Category;
  userId: string;
  user: { name: string };
  attachments: Attachment[];
  createdAt: string;
}

type ViewMode = 'my' | 'all';

export default function ContractsPage() {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    amount: '',
    startDate: '',
    endDate: '',
    contactInfo: '',
    notes: '',
    categoryId: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewingContract, setRenewingContract] = useState<Contract | null>(null);
  const [renewFormData, setRenewFormData] = useState({
    newStartDate: '',
    newEndDate: '',
    newAmount: '',
    newContactInfo: '',
    newNotes: '',
  });

  const isAdmin = session?.user?.isAdmin || false;

  useEffect(() => {
    fetchContracts();
    fetchCategories();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch('/api/contracts');
      const data = await res.json();
      setContracts(data);
    } catch (error) {
      toast({ title: '오류', description: '계약 목록을 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.endDate || !formData.categoryId) {
      toast({ title: '오류', description: '계약명, 계약만료일, 카테고리는 필수입니다.', variant: 'destructive' });
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('endDate', formData.endDate);
      submitData.append('categoryId', formData.categoryId);
      if (formData.company) submitData.append('company', formData.company);
      if (formData.amount) submitData.append('amount', formData.amount);
      if (formData.startDate) submitData.append('startDate', formData.startDate);
      if (formData.contactInfo) submitData.append('contactInfo', formData.contactInfo);
      if (formData.notes) submitData.append('notes', formData.notes);

      files.forEach((file) => {
        submitData.append('files', file);
      });

      const url = editingContract ? `/api/contracts/${editingContract.id}` : '/api/contracts';
      const method = editingContract ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: submitData,
      });

      if (!res.ok) throw new Error();

      toast({ title: '성공', description: editingContract ? '계약이 수정되었습니다.' : '계약이 등록되었습니다.' });
      setDialogOpen(false);
      resetForm();
      fetchContracts();
    } catch (error) {
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 휴지통으로 이동됩니다.')) return;

    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();

      toast({ title: '성공', description: '계약이 휴지통으로 이동되었습니다.' });
      fetchContracts();
    } catch (error) {
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      name: contract.name,
      company: contract.company || '',
      amount: contract.amount?.toString() || '',
      startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
      endDate: contract.endDate.split('T')[0],
      contactInfo: contract.contactInfo || '',
      notes: contract.notes || '',
      categoryId: contract.categoryId,
    });
    setFiles([]);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingContract(null);
    setFormData({
      name: '',
      company: '',
      amount: '',
      startDate: '',
      endDate: '',
      contactInfo: '',
      notes: '',
      categoryId: '',
    });
    setFiles([]);
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/contracts/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contracts_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      const res = await fetch('/api/contracts/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error();

      const result = await res.json();
      toast({ title: '성공', description: `${result.count}개의 계약이 가져오기되었습니다.` });
      fetchContracts();
    } catch (error) {
      toast({ title: '오류', description: '가져오기에 실패했습니다.', variant: 'destructive' });
    }

    e.target.value = '';
  };

  const handleRenew = (contract: Contract) => {
    setRenewingContract(contract);
    setRenewFormData({
      newStartDate: contract.endDate.split('T')[0],
      newEndDate: '',
      newAmount: contract.amount?.toString() || '',
      newContactInfo: contract.contactInfo || '',
      newNotes: contract.notes || '',
    });
    setRenewDialogOpen(true);
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!renewingContract || !renewFormData.newEndDate) {
      toast({ title: '오류', description: '새로운 계약 만료일은 필수입니다.', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch(`/api/contracts/${renewingContract.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(renewFormData),
      });

      if (!res.ok) throw new Error();

      toast({ title: '성공', description: '계약이 갱신되었습니다. 이전 계약은 종료 내역에 저장됩니다.' });
      setRenewDialogOpen(false);
      setRenewingContract(null);
      fetchContracts();
    } catch (error) {
      toast({ title: '오류', description: '계약 갱신에 실패했습니다.', variant: 'destructive' });
    }
  };

  const getDaysUntilBadge = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate);
    if (days < 0) return <Badge variant="destructive">만료됨</Badge>;
    if (days <= 3) return <Badge variant="destructive">D-{days}</Badge>;
    if (days <= 10) return <Badge variant="warning">D-{days}</Badge>;
    if (days <= 45) return <Badge variant="secondary">D-{days}</Badge>;
    return <Badge variant="outline">D-{days}</Badge>;
  };

  // 내 계약/전체 계약 필터링
  const viewFilteredContracts = useMemo(() => {
    if (!isAdmin || viewMode === 'all') {
      return contracts;
    }
    return contracts.filter(c => c.userId === session?.user?.id);
  }, [contracts, isAdmin, viewMode, session?.user?.id]);

  // 검색 필터링
  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) {
      return viewFilteredContracts;
    }
    const query = searchQuery.toLowerCase();
    return viewFilteredContracts.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.company && c.company.toLowerCase().includes(query)) ||
      c.category.name.toLowerCase().includes(query) ||
      c.user.name.toLowerCase().includes(query) ||
      (c.contactInfo && c.contactInfo.toLowerCase().includes(query))
    );
  }, [viewFilteredContracts, searchQuery]);

  // 통계
  const stats = useMemo(() => {
    const expired = filteredContracts.filter(c => getDaysUntilExpiry(c.endDate) < 0).length;
    const expiringSoon = filteredContracts.filter(c => {
      const days = getDaysUntilExpiry(c.endDate);
      return days >= 0 && days <= 45;
    }).length;
    const active = filteredContracts.filter(c => getDaysUntilExpiry(c.endDate) > 45).length;
    return { expired, expiringSoon, active, total: filteredContracts.length };
  }, [filteredContracts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">계약 관리</h1>
          <p className="text-gray-500 mt-1">계약 정보를 관리하고 만료일을 추적하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/api/contracts/template'}>
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
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                계약 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContract ? '계약 수정' : '계약 등록'}</DialogTitle>
                <DialogDescription>
                  계약 정보를 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">계약명 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="계약명을 입력하세요"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="categoryId">카테고리 *</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company">계약업체</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="계약업체 (선택)"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">계약시작일</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">계약만료일 *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">계약금액</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="계약금액 (선택)"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactInfo">담당자 연락처</Label>
                      <Input
                        id="contactInfo"
                        value={formData.contactInfo}
                        onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                        placeholder="연락처 (선택)"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">비고</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="비고 (선택)"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>첨부파일</Label>
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    />
                    {editingContract && editingContract.attachments.length > 0 && (
                      <div className="text-sm text-gray-500">
                        기존 첨부파일: {editingContract.attachments.map((a) => a.originalName).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingContract ? '수정' : '등록'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 관리자용 내 계약/전체 계약 토글 + 검색 */}
      <div className="flex items-center justify-between gap-4">
        {/* 관리자용 뷰 토글 */}
        {isAdmin && (
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('my')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'my'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4" />
              내 계약
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4" />
              전체 계약
            </button>
          </div>
        )}

        {/* 검색 */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="계약명, 업체명, 카테고리, 담당자로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 통계 배지들 */}
        <div className="flex items-center gap-2">
          {stats.expired > 0 && (
            <Badge variant="destructive">만료 {stats.expired}건</Badge>
          )}
          {stats.expiringSoon > 0 && (
            <Badge variant="warning" className="bg-amber-100 text-amber-800">만료임박 {stats.expiringSoon}건</Badge>
          )}
          <Badge variant="secondary">전체 {stats.total}건</Badge>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-blue-600" />
            계약 목록
            {isAdmin && viewMode === 'all' && (
              <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
                <Users className="h-3 w-3 mr-1" />
                전체
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="ml-2">
                검색결과: {filteredContracts.length}건
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileSignature className="h-12 w-12 text-gray-300 mb-3" />
              <p className="font-medium">
                {searchQuery ? '검색 결과가 없습니다' : '등록된 계약이 없습니다'}
              </p>
              <p className="text-sm">
                {searchQuery ? '다른 검색어를 입력해보세요' : '새 계약을 등록해보세요'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>계약명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>계약업체</TableHead>
                  <TableHead className="text-right">계약금액</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>상태</TableHead>
                  {isAdmin && viewMode === 'all' && <TableHead>담당자</TableHead>}
                  <TableHead className="w-32">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => {
                  const isMyContract = contract.userId === session?.user?.id;
                  const isExpired = getDaysUntilExpiry(contract.endDate) < 0;
                  
                  return (
                    <TableRow 
                      key={contract.id}
                      className={isExpired ? 'bg-red-50/50' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {contract.name}
                          {contract.attachments.length > 0 && (
                            <Paperclip className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.category.name}</Badge>
                      </TableCell>
                      <TableCell>{contract.company || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(contract.amount)}</TableCell>
                      <TableCell>{formatDate(contract.endDate)}</TableCell>
                      <TableCell>{getDaysUntilBadge(contract.endDate)}</TableCell>
                      {isAdmin && viewMode === 'all' && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">{contract.user.name}</span>
                            {isMyContract && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                                나
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(isMyContract || !isAdmin || viewMode === 'my') && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRenew(contract)}
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="계약 갱신"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(contract)}
                                className="h-8 w-8"
                                title="수정"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(contract.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {isAdmin && viewMode === 'all' && !isMyContract && (
                            <span className="text-xs text-gray-400">보기 전용</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 갱신 다이얼로그 */}
      <Dialog open={renewDialogOpen} onOpenChange={(open) => {
        setRenewDialogOpen(open);
        if (!open) {
          setRenewingContract(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              계약 갱신
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-gray-800">{renewingContract?.name}</span> 계약을 갱신합니다.
              <br />
              <span className="text-amber-600">기존 계약 내역은 &quot;계약 종료 내역&quot;에 저장됩니다.</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenewSubmit}>
            <div className="grid gap-4 py-4">
              {/* 기존 계약 정보 표시 */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">기존 계약 만료일</p>
                <p className="font-medium">{renewingContract ? formatDate(renewingContract.endDate) : '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newStartDate">새 계약 시작일</Label>
                  <Input
                    id="newStartDate"
                    type="date"
                    value={renewFormData.newStartDate}
                    onChange={(e) => setRenewFormData({ ...renewFormData, newStartDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">기본값: 기존 만료일 다음날</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newEndDate">새 계약 만료일 *</Label>
                  <Input
                    id="newEndDate"
                    type="date"
                    value={renewFormData.newEndDate}
                    onChange={(e) => setRenewFormData({ ...renewFormData, newEndDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newAmount">새 계약금액</Label>
                <Input
                  id="newAmount"
                  type="number"
                  value={renewFormData.newAmount}
                  onChange={(e) => setRenewFormData({ ...renewFormData, newAmount: e.target.value })}
                  placeholder="변경 없으면 비워두세요"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newContactInfo">담당자 연락처</Label>
                <Input
                  id="newContactInfo"
                  value={renewFormData.newContactInfo}
                  onChange={(e) => setRenewFormData({ ...renewFormData, newContactInfo: e.target.value })}
                  placeholder="변경 없으면 비워두세요"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newNotes">비고</Label>
                <Textarea
                  id="newNotes"
                  value={renewFormData.newNotes}
                  onChange={(e) => setRenewFormData({ ...renewFormData, newNotes: e.target.value })}
                  placeholder="변경 없으면 비워두세요"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenewDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                계약 갱신
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 계약 종료 내역 바로가기 */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/dashboard/contracts/history'}
          className="text-slate-600"
        >
          <History className="h-4 w-4 mr-2" />
          계약 종료 내역 보기
        </Button>
      </div>
    </div>
  );
}
