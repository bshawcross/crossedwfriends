import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { updateGroupName, prisma } from '@/lib/group';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }
  return NextResponse.json(group);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const name = body.name;
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }
  const userId = req.headers.get('x-user-id') ?? '';
  try {
    const group = await updateGroupName(groupId, userId, name);
    return NextResponse.json(group);
  } catch (err) {
    if (err instanceof Error && /not a member/i.test(err.message)) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (err instanceof Error && /name required/i.test(err.message)) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
