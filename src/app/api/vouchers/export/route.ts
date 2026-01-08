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

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        user: { select: { name: true } },
        completions: {
          select: { year: true, month: true },
        },
      },
      orderBy: [{ repeatDay: 'asc' }],
    });

    // Get current month info for completion status
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Prepare data for Excel
    const data = vouchers.map((v) => {
      const isCompletedThisMonth = v.completions.some(
        (c) => c.year === currentYear && c.month === currentMonth
      );
      return {
        적요명: v.description,
        금액: v.amount,
        부가세액: v.vatAmount,
        계정과목명: v.accountName,
        반복일자: v.repeatDay === 0 ? '말일' : `${v.repeatDay}일`,
        이번달처리완료: isCompletedThisMonth ? 'O' : 'X',
        담당자: v.user.name,
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // 적요명
      { wch: 15 }, // 금액
      { wch: 15 }, // 부가세액
      { wch: 20 }, // 계정과목명
      { wch: 10 }, // 반복일자
      { wch: 15 }, // 이번달처리완료
      { wch: 15 }, // 담당자
    ];

    XLSX.utils.book_append_sheet(wb, ws, '전표목록');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="vouchers_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Failed to export vouchers:', error);
    return NextResponse.json({ error: 'Failed to export vouchers' }, { status: 500 });
  }
}
