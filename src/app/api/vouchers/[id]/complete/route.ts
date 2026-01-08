import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const body = await request.json();
    const { isCompleted } = body;

    // Check ownership
    const existing = await prisma.voucher.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(session.user.isAdmin ? {} : { userId: session.user.id }),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return NextResponse.json(voucher);
  } catch (error) {
    console.error('Failed to update voucher completion:', error);
    return NextResponse.json(
      { error: 'Failed to update voucher completion' },
      { status: 500 }
    );
  }
}
