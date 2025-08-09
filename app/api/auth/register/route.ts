import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const { phone } = await req.json();
  if (!phone) {
    return NextResponse.json({ error: 'Phone required' }, { status: 400 });
  }

  await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  return NextResponse.json({ ok: true });
}
