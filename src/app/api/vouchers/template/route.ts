import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Sample template data
    const data = [
      {
        적요명: '사무실 임대료',
        금액: 1500000,
        부가세액: 150000,
        계정과목명: '임차료',
        반복일자: '25일',
      },
      {
        적요명: '인터넷 요금',
        금액: 55000,
        부가세액: 5500,
        계정과목명: '통신비',
        반복일자: '말일',
      },
      {
        적요명: '전기요금',
        금액: '',
        부가세액: '',
        계정과목명: '수도광열비',
        반복일자: '15일',
      },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // 적요명
      { wch: 15 }, // 금액
      { wch: 15 }, // 부가세액
      { wch: 20 }, // 계정과목명
      { wch: 12 }, // 반복일자
    ];

    // Add instruction sheet
    const instructions = [
      { 안내사항: '=== 전표 업로드 템플릿 사용 안내 ===' },
      { 안내사항: '' },
      { 안내사항: '1. 적요명: 필수 입력 (전표 설명)' },
      { 안내사항: '2. 금액: 선택 입력 (숫자만)' },
      { 안내사항: '3. 부가세액: 선택 입력 (숫자만)' },
      { 안내사항: '4. 계정과목명: 필수 입력' },
      { 안내사항: '5. 반복일자: 필수 입력 (1일~31일 또는 "말일")' },
      { 안내사항: '' },
      { 안내사항: '※ 예시 데이터를 참고하여 작성해주세요.' },
      { 안내사항: '※ 첫 번째 행(헤더)은 삭제하지 마세요.' },
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 50 }];

    XLSX.utils.book_append_sheet(wb, ws, '전표목록');
    XLSX.utils.book_append_sheet(wb, wsInstructions, '사용안내');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="voucher_template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Failed to generate template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
