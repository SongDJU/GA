import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 관리자는 전체, 일반 사용자는 본인 것만
    const where = session.user.isAdmin ? {} : { userId: session.user.id };

    const [histories, total] = await Promise.all([
      prisma.alertHistory.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.alertHistory.count({ where }),
    ]);

    return NextResponse.json({
      histories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch alert history:', error);
    return NextResponse.json({ error: 'Failed to fetch alert history' }, { status: 500 });
  }
}
