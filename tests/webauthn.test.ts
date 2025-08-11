import { test, beforeAll, afterAll, expect } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

let webauthn: typeof import('../lib/webauthn');

beforeAll(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'prisma-user-'));
  process.env.DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
  execSync('npx prisma migrate deploy', { env: process.env });
  webauthn = await import('../lib/webauthn');
});

afterAll(async () => {
  await webauthn.prisma.$disconnect();
});

test('getOrCreateUser returns persistent user', async () => {
  const created = await webauthn.getOrCreateUser('123');
  expect(created.phoneNumber).toBe('123');
  const fetched = await webauthn.getOrCreateUser('123');
  expect(fetched.id).toBe(created.id);
});

test('setChallenge stores challenge', async () => {
  await webauthn.setChallenge('555', 'foo');
  const user = await webauthn.getUser('555');
  expect(user?.currentChallenge).toBe('foo');
});

test('saveCredential and updateCounter persist data', async () => {
  await webauthn.getOrCreateUser('999');
  const credential = {
    credentialID: Buffer.from('id'),
    publicKey: Buffer.from('pk'),
    counter: 1,
  };
  await webauthn.saveCredential('999', credential);
  await webauthn.updateCounter('999', 2);
  const user = await webauthn.getUser('999');
  expect(user?.counter).toBe(2);
  expect(Buffer.from(user?.credentialId ?? []).toString('hex')).toBe(
    credential.credentialID.toString('hex'),
  );
  expect(Buffer.from(user?.publicKey ?? []).toString('hex')).toBe(
    credential.publicKey.toString('hex'),
  );
});
