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

    // Get categories
    const categories = await prisma.contractCategory.findMany();
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    let count = 0;

    for (const row of data) {
      const name = row['계약명'];
      const categoryName = row['카테고리'];
      const endDate = row['계약만료일'];

      if (!name || !categoryName || !endDate) continue;

      // Find or use default category
      let categoryId = categoryMap.get(categoryName);
      if (!categoryId) {
        categoryId = categoryMap.get('기타');
      }
      if (!categoryId) continue;

      // Parse dates
      let parsedEndDate: Date;
      let parsedStartDate: Date | null = null;

      if (typeof endDate === 'number') {
        // Excel serial date
        parsedEndDate = new Date((endDate - 25569) * 86400 * 1000);
      } else {
        parsedEndDate = new Date(endDate);
      }

      const startDate = row['계약시작일'];
      if (startDate) {
        if (typeof startDate === 'number') {
          parsedStartDate = new Date((startDate - 25569) * 86400 * 1000);
        } else {
          parsedStartDate = new Date(startDate);
        }
      }

      await prisma.contract.create({
        data: {
          name: name.toString(),
          company: row['계약업체']?.toString() || null,
          amount: row['계약금액'] ? parseFloat(row['계약금액']) : null,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          contactInfo: row['담당자연락처']?.toString() || null,
          notes: row['비고']?.toString() || null,
          categoryId,
          userId: session.user.id,
        },
      });

      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Failed to import contracts:', error);
    return NextResponse.json({ error: 'Failed to import contracts' }, { status: 500 });
  }
}
