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

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        category: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Failed to fetch deleted contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch deleted contracts' }, { status: 500 });
  }
}
