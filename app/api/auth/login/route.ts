import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { phone } = await req.json();
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Phone is required' }, { status: 400 });
  }
  // Placeholder for actual WebAuthn login logic
  return NextResponse.json({ success: true });
}
