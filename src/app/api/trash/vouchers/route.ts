import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where = {
      deletedAt: { not: null },
      ...(session.user.isAdmin ? {} : { userId: session.user.id }),
    };

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        user: { select: { name: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Failed to fetch deleted vouchers:', error);
    return NextResponse.json({ error: 'Failed to fetch deleted vouchers' }, { status: 500 });
  }
}
