import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { removeUserFromGroup } from '@/lib/group';

export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string; userId: string } }
) {
  const { groupId, userId } = params;

  try {
    await removeUserFromGroup(groupId, userId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

