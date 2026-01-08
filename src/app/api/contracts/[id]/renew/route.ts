import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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
    const { newEndDate, newStartDate, newAmount, newContactInfo, newNotes } = body;

    if (!newEndDate) {
      return NextResponse.json({ error: '새로운 계약 만료일이 필요합니다.' }, { status: 400 });
    }

    // 기존 계약 조회
    const existingContract = await prisma.contract.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(session.user.isAdmin ? {} : { userId: session.user.id }),
      },
      include: {
        category: { select: { name: true } },
        user: { select: { name: true } },
      },
    });

    if (!existingContract) {
      return NextResponse.json({ error: '계약을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 트랜잭션으로 처리: 기존 계약을 히스토리로 저장 + 새 계약 생성
    const result = await prisma.$transaction(async (tx) => {
      // 1. 기존 계약을 종료 내역에 저장
      await tx.contractHistory.create({
        data: {
          originalId: existingContract.id,
          name: existingContract.name,
          company: existingContract.company,
          amount: existingContract.amount,
          startDate: existingContract.startDate,
          endDate: existingContract.endDate,
          contactInfo: existingContract.contactInfo,
          notes: existingContract.notes,
          categoryName: existingContract.category.name,
          userName: existingContract.user.name,
          createdAt: existingContract.createdAt,
        },
      });

      // 2. 기존 계약 업데이트 (갱신)
      const renewedContract = await tx.contract.update({
        where: { id },
        data: {
          startDate: newStartDate ? new Date(newStartDate) : existingContract.endDate,
          endDate: new Date(newEndDate),
          amount: newAmount !== undefined ? (newAmount ? parseFloat(newAmount) : null) : existingContract.amount,
          contactInfo: newContactInfo !== undefined ? newContactInfo : existingContract.contactInfo,
          notes: newNotes !== undefined ? newNotes : existingContract.notes,
          updatedAt: new Date(),
        },
        include: {
          category: { select: { name: true } },
          user: { select: { name: true } },
          attachments: true,
        },
      });

      return renewedContract;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to renew contract:', error);
    return NextResponse.json({ error: 'Failed to renew contract' }, { status: 500 });
  }
}
