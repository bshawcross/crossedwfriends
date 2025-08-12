import { NextResponse } from 'next/server';
import { sendMessage, listMessages } from '@/lib/chat';

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const userId = req.headers.get('x-user-id') ?? '';
  try {
    const messages = await listMessages(params.groupId, userId);
    return NextResponse.json(messages);
  } catch (err) {
    if (err instanceof Error && /not a member/i.test(err.message)) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const userId = req.headers.get('x-user-id') ?? '';
  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const content = body.content;
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
  }
  try {
    const message = await sendMessage(params.groupId, userId, content);
    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    if (err instanceof Error && /not a member/i.test(err.message)) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
