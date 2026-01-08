import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
        category: { select: { id: true, name: true } },
        user: { select: { name: true } },
        attachments: { select: { id: true, originalName: true, filename: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Failed to fetch contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const company = formData.get('company') as string | null;
    const amount = formData.get('amount') as string | null;
    const startDate = formData.get('startDate') as string | null;
    const endDate = formData.get('endDate') as string;
    const contactInfo = formData.get('contactInfo') as string | null;
    const notes = formData.get('notes') as string | null;
    const categoryId = formData.get('categoryId') as string;
    const files = formData.getAll('files') as File[];

    if (!name || !endDate || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        name,
        company: company || null,
        amount: amount ? parseFloat(amount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: new Date(endDate),
        contactInfo: contactInfo || null,
        notes: notes || null,
        categoryId,
        userId: session.user.id,
      },
    });

    // Handle file uploads
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'uploads', contract.id);
      await mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        if (file.size === 0) continue;

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}-${file.name}`;
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);

        await prisma.attachment.create({
          data: {
            filename,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            path: filePath,
            contractId: contract.id,
          },
        });
      }
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Failed to create contract:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
