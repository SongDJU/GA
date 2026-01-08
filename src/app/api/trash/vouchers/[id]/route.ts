import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const existing = await prisma.voucher.findFirst({
      where: {
        id,
        deletedAt: { not: null },
        ...(session.user.isAdmin ? {} : { userId: session.user.id }),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Permanent delete
    await prisma.voucher.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to permanently delete voucher:', error);
    return NextResponse.json({ error: 'Failed to permanently delete voucher' }, { status: 500 });
  }
}
