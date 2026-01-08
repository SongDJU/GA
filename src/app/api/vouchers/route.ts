import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        user: { select: { name: true } },
        completions: {
          select: { year: true, month: true },
        },
      },
      orderBy: [{ repeatDay: 'asc' }],
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Failed to fetch vouchers:', error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description, amount, vatAmount, accountName, repeatDay } = body;

    if (!description || !accountName || repeatDay === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const voucher = await prisma.voucher.create({
      data: {
        description,
        amount: amount || null,
        vatAmount: vatAmount || null,
        accountName,
        repeatDay,
        userId: session.user.id,
      },
    });

    return NextResponse.json(voucher);
  } catch (error) {
    console.error('Failed to create voucher:', error);
    return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 });
  }
}
