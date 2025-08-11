import { execSync } from 'child_process';
import { describe, it, beforeEach, afterAll, expect } from 'vitest';
import { randomBytes, createHash, createSign, generateKeyPairSync } from 'crypto';
import { isoBase64URL, isoCBOR, cose } from '@simplewebauthn/server/helpers';
import { GET as registerGet, POST as registerPost } from '../../app/api/auth/webauthn-register/route';
import { GET as loginGet, POST as loginPost } from '../../app/api/auth/webauthn-login/route';

const dbFile = `../tests/test-${process.env.VITEST_POOL_ID || '0'}.db`;
process.env.DATABASE_URL = `file:${dbFile}`;
execSync('npx prisma migrate deploy', { stdio: 'ignore' });
import { prisma } from '../../lib/webauthn';

describe('webauthn register/login flow', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers and authenticates using platform authenticator', async () => {
    const phone = 'alice';

    const regRes = await registerGet(
      new Request(`http://localhost/api/auth/webauthn-register?phone=${phone}`)
    );
    expect(regRes.status).toBe(200);
    const regOpts = await regRes.json();
    expect(regOpts.authenticatorSelection.userVerification).toBe('required');

    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwk = publicKey.export({ format: 'jwk' });
    const x = isoBase64URL.toBuffer(jwk.x!);
    const y = isoBase64URL.toBuffer(jwk.y!);
    const credentialID = randomBytes(32);
    const coseKey = new Map();
    coseKey.set(cose.COSEKEYS.kty, cose.COSEKTY.EC2);
    coseKey.set(cose.COSEKEYS.alg, cose.COSEALG.ES256);
    coseKey.set(cose.COSEKEYS.crv, cose.COSECRV.P256);
    coseKey.set(cose.COSEKEYS.x, x);
    coseKey.set(cose.COSEKEYS.y, y);
    const coseKeyBytes = isoCBOR.encode(coseKey);

    const rpIdHash = createHash('sha256').update('localhost').digest();
    const flags = Buffer.from([0x45]); // UP | UV | AT
    const counter = Buffer.alloc(4);
    const aaguid = Buffer.alloc(16);
    const credIdLen = Buffer.alloc(2);
    credIdLen.writeUInt16BE(credentialID.length);
    const authData = Buffer.concat([
      rpIdHash,
      flags,
      counter,
      aaguid,
      credIdLen,
      credentialID,
      coseKeyBytes,
    ]);

    const attObj = isoCBOR.encode(
      new Map([
        ['fmt', 'none'],
        ['attStmt', new Map()],
        ['authData', new Uint8Array(authData)],
      ])
    );
    const clientData = Buffer.from(
      JSON.stringify({
        type: 'webauthn.create',
        challenge: regOpts.challenge,
        origin: 'http://localhost:3000',
        crossOrigin: false,
      })
    );

    const attestationResponse = {
      id: isoBase64URL.fromBuffer(credentialID),
      rawId: isoBase64URL.fromBuffer(credentialID),
      type: 'public-key',
      response: {
        attestationObject: isoBase64URL.fromBuffer(attObj),
        clientDataJSON: isoBase64URL.fromBuffer(clientData),
      },
    };

    const regVerify = await registerPost(
      new Request('http://localhost/api/auth/webauthn-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, attestationResponse }),
      })
    );
    expect(regVerify.status).toBe(200);
    const regVerifyJson = await regVerify.json();
    expect(regVerifyJson.verified).toBe(true);

    const authRes = await loginGet(
      new Request(`http://localhost/api/auth/webauthn-login?phone=${phone}`)
    );
    expect(authRes.status).toBe(200);
    const authOpts = await authRes.json();
    expect(authOpts.userVerification).toBe('required');

    const authClientData = Buffer.from(
      JSON.stringify({
        type: 'webauthn.get',
        challenge: authOpts.challenge,
        origin: 'http://localhost:3000',
        crossOrigin: false,
      })
    );
    const authClientHash = createHash('sha256').update(authClientData).digest();
    const authFlags = Buffer.from([0x05]); // UP | UV
    const authCounter = Buffer.alloc(4);
    authCounter.writeUInt32BE(1);
    const authDataBuf = Buffer.concat([rpIdHash, authFlags, authCounter]);
    const sigBase = Buffer.concat([authDataBuf, authClientHash]);
    const derSig = createSign('sha256').update(sigBase).sign(privateKey);

    const assertionResponse = {
      id: isoBase64URL.fromBuffer(credentialID),
      rawId: isoBase64URL.fromBuffer(credentialID),
      type: 'public-key',
      response: {
        authenticatorData: isoBase64URL.fromBuffer(authDataBuf),
        clientDataJSON: isoBase64URL.fromBuffer(authClientData),
        signature: isoBase64URL.fromBuffer(derSig),
      },
    };

    const authVerify = await loginPost(
      new Request('http://localhost/api/auth/webauthn-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, assertionResponse }),
      })
    );
    expect(authVerify.status).toBe(200);
    const authVerifyJson = await authVerify.json();
    expect(authVerifyJson.verified).toBe(true);
  });
});
