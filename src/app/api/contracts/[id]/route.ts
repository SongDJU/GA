import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(session.user.isAdmin ? {} : { userId: session.user.id }),
      },
      include: {
        category: true,
        user: { select: { name: true } },
        attachments: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Failed to fetch contract:', error);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await prisma.contract.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(session.user.isAdmin ? {} : { userId: session.user.id }),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        name,
        company: company || null,
        amount: amount ? parseFloat(amount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: new Date(endDate),
        contactInfo: contactInfo || null,
        notes: notes || null,
        categoryId,
      },
    });

    // Handle new file uploads
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
    console.error('Failed to update contract:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await prisma.contract.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(session.user.isAdmin ? {} : { userId: session.user.id }),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contract:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
