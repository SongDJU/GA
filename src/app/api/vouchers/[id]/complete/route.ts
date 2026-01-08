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
    const { isCompleted, year, month } = body;

    // Validate year and month
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
    }

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

    if (isCompleted) {
      // Add completion record for this month
      await prisma.voucherCompletion.upsert({
        where: {
          voucherId_year_month: {
            voucherId: id,
            year,
            month,
          },
        },
        create: {
          voucherId: id,
          year,
          month,
        },
        update: {
          completedAt: new Date(),
        },
      });
    } else {
      // Remove completion record for this month
      await prisma.voucherCompletion.deleteMany({
        where: {
          voucherId: id,
          year,
          month,
        },
      });
    }

    // Fetch updated voucher with completions
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        completions: {
          select: { year: true, month: true },
        },
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
