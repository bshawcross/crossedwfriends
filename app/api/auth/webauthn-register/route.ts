import { NextResponse } from 'next/server';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { userStore, rpID, rpName, expectedOrigin } from '@/lib/webauthn';

/**
 * Start WebAuthn registration for a user. Expect a `phone` query parameter.
 * Returns PublicKeyCredentialCreationOptions with credential IDs encoded for the client.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') ?? '';

  let user = userStore.get(phone);
  if (!user) {
    user = { id: phone, phone, credentials: [] };
    userStore.set(phone, user);
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.phone,
    attestationType: 'none',
    excludeCredentials: user.credentials.map(cred => ({
      id: cred.credentialID,
      type: 'public-key',
    })),
  });

  user.currentChallenge = options.challenge;

  // Encode credential IDs for transport to client
  options.excludeCredentials = options.excludeCredentials?.map(c => ({
    ...c,
    id: c.id.toString('base64url'),
  }));

  return NextResponse.json(options);
}

/**
 * Verify the registration response sent back from the browser.
 * Body should contain `phone` and the attestation `response` from the browser.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { phone, attestationResponse } = body as {
    phone: string;
    attestationResponse: any;
  };

  const user = userStore.get(phone);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge: user.currentChallenge ?? '',
    expectedOrigin,
    expectedRPID: rpID,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    // Store raw credential ID Buffer
    user.credentials.push({
      credentialID,
      publicKey: credentialPublicKey,
      counter,
    });
  }

  return NextResponse.json({ verified: verification.verified });
}

