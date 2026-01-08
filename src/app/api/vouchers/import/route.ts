import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    let count = 0;

    for (const row of data) {
      const description = row['적요명'];
      const accountName = row['계정과목명'];
      let repeatDay = row['반복일자'];

      if (!description || !accountName) continue;

      // Parse repeatDay
      if (typeof repeatDay === 'string') {
        if (repeatDay === '말일') {
          repeatDay = 0;
        } else {
          repeatDay = parseInt(repeatDay.replace('일', ''));
        }
      }

      if (isNaN(repeatDay) || repeatDay < 0 || repeatDay > 31) {
        repeatDay = 1;
      }

      await prisma.voucher.create({
        data: {
          description: description.toString(),
          amount: row['금액'] ? parseFloat(row['금액']) : null,
          vatAmount: row['부가세액'] ? parseFloat(row['부가세액']) : null,
          accountName: accountName.toString(),
          repeatDay,
          userId: session.user.id,
        },
      });

      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Failed to import vouchers:', error);
    return NextResponse.json({ error: 'Failed to import vouchers' }, { status: 500 });
  }
}
