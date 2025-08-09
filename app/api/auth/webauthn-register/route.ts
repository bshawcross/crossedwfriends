import { NextRequest, NextResponse } from 'next/server';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { getUser, upsertUser } from '@/lib/webauthn';
import { randomUUID } from 'crypto';

const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || `http://${rpID}:3000`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }
  let user = getUser(username);
  if (!user) {
    user = {
      id: randomUUID(),
      username,
      credentials: [],
    };
    upsertUser(user);
  }

  const options = await generateRegistrationOptions({
    rpName: 'CrossedWFriends',
    rpID,
    userID: Buffer.from(user.id),
    userName: user.username,
    attestationType: 'none',
  });
  user.currentChallenge = options.challenge;
  upsertUser(user);

  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, response } = body as {
    username: string;
    response: RegistrationResponseJSON;
  };
  const user = getUser(username);
  if (!user || !user.currentChallenge) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    return NextResponse.json(
      { verified: false, error: (error as Error).message },
      { status: 400 },
    );
  }

  const { registrationInfo, verified } = verification;
  if (verified && registrationInfo) {
    const { credential } = registrationInfo;
    const { id: credentialID, publicKey, counter } = credential;
    user.credentials.push({
      credentialID: Buffer.from(credentialID).toString('base64url'),
      credentialPublicKey: Buffer.from(publicKey),
      counter,
    });
    user.currentChallenge = undefined;
    upsertUser(user);
  }

  return NextResponse.json({ verified });
}
