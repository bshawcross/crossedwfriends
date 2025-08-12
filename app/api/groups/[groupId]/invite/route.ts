import { NextResponse } from 'next/server';
import { addUserToGroup } from '@/lib/group';
import { Prisma } from '@prisma/client';

interface InviteBody {
  phone?: string;
}

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;
  let body: InviteBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phone = body.phone;
  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
  }

  try {
    const membership = await addUserToGroup(groupId, phone);
    const { groupId: g, userId } = membership;
    return NextResponse.json({ groupId: g, userId }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2003'
    ) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

