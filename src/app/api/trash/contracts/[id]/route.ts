import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink, rmdir } from 'fs/promises';
import path from 'path';

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

    const existing = await prisma.contract.findFirst({
      where: {
        id,
        deletedAt: { not: null },
        ...(session.user.isAdmin ? {} : { userId: session.user.id }),
      },
      include: {
        attachments: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete attachment files
    for (const attachment of existing.attachments) {
      try {
        await unlink(attachment.path);
      } catch (e) {
        console.error('Failed to delete file:', attachment.path);
      }
    }

    // Try to remove the upload directory
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', id);
      await rmdir(uploadDir);
    } catch (e) {
      // Directory might not exist or not empty
    }

    // Delete attachments and contract
    await prisma.attachment.deleteMany({
      where: { contractId: id },
    });

    await prisma.contract.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to permanently delete contract:', error);
    return NextResponse.json({ error: 'Failed to permanently delete contract' }, { status: 500 });
  }
}
