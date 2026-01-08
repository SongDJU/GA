import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink, rmdir } from 'fs/promises';
import path from 'path';

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where = {
      deletedAt: { not: null },
      ...(session.user.isAdmin ? {} : { userId: session.user.id }),
    };

    // Get contracts with attachments
    const contracts = await prisma.contract.findMany({
      where,
      include: { attachments: true },
    });

    // Delete attachment files
    for (const contract of contracts) {
      for (const attachment of contract.attachments) {
        try {
          await unlink(attachment.path);
        } catch (e) {
          console.error('Failed to delete file:', attachment.path);
        }
      }

      // Try to remove the upload directory
      try {
        const uploadDir = path.join(process.cwd(), 'uploads', contract.id);
        await rmdir(uploadDir);
      } catch (e) {
        // Directory might not exist or not empty
      }
    }

    // Delete all attachments for these contracts
    const contractIds = contracts.map((c) => c.id);
    if (contractIds.length > 0) {
      await prisma.attachment.deleteMany({
        where: { contractId: { in: contractIds } },
      });
    }

    // Permanently delete contracts
    await prisma.contract.deleteMany({ where });

    // Permanently delete vouchers
    await prisma.voucher.deleteMany({ where });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to empty trash:', error);
    return NextResponse.json({ error: 'Failed to empty trash' }, { status: 500 });
  }
}
