import { NextRequest, NextResponse } from 'next/server';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { getUser, upsertUser } from '@/lib/webauthn';

const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || `http://${rpID}:3000`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const user = username ? getUser(username) : undefined;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.credentials.map((cred) => ({
      id: cred.credentialID,
      type: 'public-key',
    })),
  });
  user.currentChallenge = options.challenge;
  upsertUser(user);

  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, response } = body as {
    username: string;
    response: AuthenticationResponseJSON;
  };
  const user = getUser(username);
  if (!user || !user.currentChallenge) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const credID = response.rawId;
  const dbAuthenticator = user.credentials.find(
    (cred) => cred.credentialID === credID,
  );
  if (!dbAuthenticator) {
    return NextResponse.json({ error: 'Authenticator not registered' }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: dbAuthenticator.credentialID,
        publicKey: dbAuthenticator.credentialPublicKey,
        counter: dbAuthenticator.counter,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { verified: false, error: (error as Error).message },
      { status: 400 },
    );
  }

  const { authenticationInfo, verified } = verification;
  if (verified && authenticationInfo) {
    dbAuthenticator.counter = authenticationInfo.newCounter;
    user.currentChallenge = undefined;
    upsertUser(user);
  }

  const res = NextResponse.json({ verified });
  if (verified) {
    res.cookies.set('session', user.id, {
      httpOnly: true,
      sameSite: 'lax',
    });
  }
  return res;
}
