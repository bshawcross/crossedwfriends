import { NextResponse } from 'next/server';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import {
  getUser,
  setChallenge,
  updateCounter,
  rpID,
  expectedOrigin,
} from '@/lib/webauthn';

/**
 * Initiate authentication. Provide a `phone` query parameter.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') ?? '';

  const user = await getUser(phone);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const allowCreds = user.credentialId
    ? [
        {
          id: Buffer.isBuffer(user.credentialId)
            ? user.credentialId
            : Buffer.from(user.credentialId as any, 'base64url'),
          type: 'public-key' as const,
        },
      ]
    : [];

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCreds,
    userVerification: 'required',
  });
  await setChallenge(phone, options.challenge);

  // Encode IDs for the client
  options.allowCredentials = options.allowCredentials?.map(c => ({
    ...c,
    id:
      typeof c.id === 'string'
        ? c.id
        : (c.id as Buffer).toString('base64url'),
  }));

  return NextResponse.json(options);
}

/**
 * Verify authentication response from the browser. Expects `phone` and
 * `assertionResponse` in the request body.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { phone, assertionResponse } = body as {
    phone: string;
    assertionResponse: any;
  };

  const user = await getUser(phone);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }
  if (!user.credentialId || !user.publicKey) {
    return NextResponse.json({ error: 'Authenticator not registered' }, { status: 400 });
  }

  const idBuffer = Buffer.from(assertionResponse.rawId, 'base64url');
  const storedId = Buffer.isBuffer(user.credentialId)
    ? user.credentialId
    : Buffer.from(user.credentialId as any, 'base64url');
  if (!storedId.equals(idBuffer)) {
    return NextResponse.json({ error: 'Authenticator not registered' }, { status: 400 });
  }

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge: user.currentChallenge ?? '',
    expectedOrigin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: storedId,
      credentialPublicKey: Buffer.isBuffer(user.publicKey)
        ? user.publicKey
        : Buffer.from(user.publicKey as any, 'base64url'),
      counter: user.counter ?? 0,
    },
  });

  if (verification.verified) {
    await updateCounter(phone, verification.authenticationInfo.newCounter);
  }

  return NextResponse.json({ verified: verification.verified });
}

