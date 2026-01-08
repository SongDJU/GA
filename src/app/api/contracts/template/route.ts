import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Sample template data
    const data = [
      {
        계약명: '본사 사무실 임대계약',
        카테고리: '임대계약',
        계약업체: '(주)부동산관리',
        계약금액: 50000000,
        계약시작일: '2024-01-01',
        계약만료일: '2025-12-31',
        담당자연락처: '02-1234-5678',
        비고: '2년 계약, 자동연장 조항 있음',
      },
      {
        계약명: '복합기 유지보수',
        카테고리: '유지보수',
        계약업체: '(주)사무기기',
        계약금액: 1200000,
        계약시작일: '2024-03-01',
        계약만료일: '2025-02-28',
        담당자연락처: '010-9876-5432',
        비고: '',
      },
      {
        계약명: '법인차량 리스',
        카테고리: '차량',
        계약업체: '현대캐피탈',
        계약금액: 36000000,
        계약시작일: '2023-06-01',
        계약만료일: '2026-05-31',
        담당자연락처: '',
        비고: '3년 리스, 월 100만원',
      },
      {
        계약명: 'ERP 서비스 이용',
        카테고리: '서비스계약',
        계약업체: '아마란스',
        계약금액: '',
        계약시작일: '',
        계약만료일: '2025-06-30',
        담당자연락처: '1588-0000',
        비고: '',
      },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // 계약명
      { wch: 12 }, // 카테고리
      { wch: 20 }, // 계약업체
      { wch: 15 }, // 계약금액
      { wch: 12 }, // 계약시작일
      { wch: 12 }, // 계약만료일
      { wch: 15 }, // 담당자연락처
      { wch: 30 }, // 비고
    ];

    // Add instruction sheet
    const instructions = [
      { 안내사항: '=== 계약 업로드 템플릿 사용 안내 ===' },
      { 안내사항: '' },
      { 안내사항: '1. 계약명: 필수 입력' },
      { 안내사항: '2. 카테고리: 필수 입력 (아래 중 선택)' },
      { 안내사항: '   - 임대계약' },
      { 안내사항: '   - 유지보수' },
      { 안내사항: '   - 서비스계약' },
      { 안내사항: '   - 구매계약' },
      { 안내사항: '   - 차량' },
      { 안내사항: '   - 기타' },
      { 안내사항: '3. 계약업체: 선택 입력' },
      { 안내사항: '4. 계약금액: 선택 입력 (숫자만)' },
      { 안내사항: '5. 계약시작일: 선택 입력 (YYYY-MM-DD 형식)' },
      { 안내사항: '6. 계약만료일: 필수 입력 (YYYY-MM-DD 형식)' },
      { 안내사항: '7. 담당자연락처: 선택 입력' },
      { 안내사항: '8. 비고: 선택 입력' },
      { 안내사항: '' },
      { 안내사항: '※ 예시 데이터를 참고하여 작성해주세요.' },
      { 안내사항: '※ 첫 번째 행(헤더)은 삭제하지 마세요.' },
      { 안내사항: '※ 카테고리가 목록에 없으면 "기타"로 저장됩니다.' },
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 50 }];

    XLSX.utils.book_append_sheet(wb, ws, '계약목록');
    XLSX.utils.book_append_sheet(wb, wsInstructions, '사용안내');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="contract_template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Failed to generate template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
