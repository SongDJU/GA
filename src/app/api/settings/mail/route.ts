import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mailSetting = await prisma.mailSetting.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(mailSetting);
  } catch (error) {
    console.error('Failed to fetch mail setting:', error);
    return NextResponse.json({ error: 'Failed to fetch mail setting' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, isActive } = body;

    const mailSetting = await prisma.mailSetting.upsert({
      where: { userId: session.user.id },
      update: { email, isActive },
      create: {
        userId: session.user.id,
        email,
        isActive,
      },
    });

    return NextResponse.json(mailSetting);
  } catch (error) {
    console.error('Failed to update mail setting:', error);
    return NextResponse.json({ error: 'Failed to update mail setting' }, { status: 500 });
  }
}
