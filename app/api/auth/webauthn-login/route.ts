import { NextResponse } from 'next/server';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { userStore, rpID, expectedOrigin } from '@/lib/webauthn';

/**
 * Initiate authentication. Provide a `username` query parameter.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username') ?? '';

  const user = userStore.get(username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const allowCreds = user.credentials.map(c => ({
    id: Buffer.isBuffer(c.credentialID)
      ? c.credentialID
      : Buffer.from(c.credentialID as any, 'base64url'),
    type: 'public-key',
  }));

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCreds,
    userVerification: 'preferred',
  });
  user.currentChallenge = options.challenge;

  // Encode IDs for the client
  options.allowCredentials = options.allowCredentials?.map(c => ({
    ...c,
    id: c.id.toString('base64url'),
  }));

  return NextResponse.json(options);
}

/**
 * Verify authentication response from the browser. Expects `username` and
 * `assertionResponse` in the request body.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { username, assertionResponse } = body as {
    username: string;
    assertionResponse: any;
  };

  const user = userStore.get(username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const idBuffer = Buffer.from(assertionResponse.rawId, 'base64url');
  const authenticator = user.credentials.find(c => {
    const stored = Buffer.isBuffer(c.credentialID)
      ? c.credentialID
      : Buffer.from(c.credentialID as any, 'base64url');
    return stored.equals(idBuffer);
  });
  if (!authenticator) {
    return NextResponse.json({ error: 'Authenticator not registered' }, { status: 400 });
  }

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge: user.currentChallenge ?? '',
    expectedOrigin,
    expectedRPID: rpID,
    authenticator: {
      ...authenticator,
      credentialID: Buffer.isBuffer(authenticator.credentialID)
        ? authenticator.credentialID
        : Buffer.from(authenticator.credentialID as any, 'base64url'),
    },
  });

  if (verification.verified) {
    authenticator.counter = verification.authenticationInfo.newCounter;
  }

  return NextResponse.json({ verified: verification.verified });
}

