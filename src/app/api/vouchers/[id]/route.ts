import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const voucher = await prisma.voucher.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(session.user.isAdmin ? {} : { userId: session.user.id }),
      },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(voucher);
  } catch (error) {
    console.error('Failed to fetch voucher:', error);
    return NextResponse.json({ error: 'Failed to fetch voucher' }, { status: 500 });
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
    const body = await request.json();
    const { description, amount, vatAmount, accountName, repeatDay } = body;

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
        description,
        amount: amount || null,
        vatAmount: vatAmount || null,
        accountName,
        repeatDay,
      },
    });

    return NextResponse.json(voucher);
  } catch (error) {
    console.error('Failed to update voucher:', error);
    return NextResponse.json({ error: 'Failed to update voucher' }, { status: 500 });
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

    // Soft delete
    await prisma.voucher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete voucher:', error);
    return NextResponse.json({ error: 'Failed to delete voucher' }, { status: 500 });
  }
}
