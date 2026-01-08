import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where = {
      deletedAt: null,
      ...(session.user.isAdmin ? {} : { userId: session.user.id }),
    };

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        category: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    // Prepare data for Excel
    const data = contracts.map((c) => ({
      계약명: c.name,
      카테고리: c.category.name,
      계약업체: c.company,
      계약금액: c.amount,
      계약시작일: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
      계약만료일: new Date(c.endDate).toISOString().split('T')[0],
      담당자연락처: c.contactInfo,
      비고: c.notes,
      담당자: c.user.name,
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // 계약명
      { wch: 15 }, // 카테고리
      { wch: 20 }, // 계약업체
      { wch: 15 }, // 계약금액
      { wch: 12 }, // 계약시작일
      { wch: 12 }, // 계약만료일
      { wch: 15 }, // 담당자연락처
      { wch: 30 }, // 비고
      { wch: 10 }, // 담당자
    ];

    XLSX.utils.book_append_sheet(wb, ws, '계약목록');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="contracts_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Failed to export contracts:', error);
    return NextResponse.json({ error: 'Failed to export contracts' }, { status: 500 });
  }
}
