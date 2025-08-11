import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

let webauthn: typeof import('../lib/webauthn');

before(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'prisma-user-'));
  process.env.DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
  execSync('npx prisma migrate deploy', { env: process.env });
  webauthn = await import('../lib/webauthn');
});

after(async () => {
  await webauthn.prisma.$disconnect();
});

test('getOrCreateUser returns persistent user', async () => {
  const created = await webauthn.getOrCreateUser('123');
  assert.equal(created.phoneNumber, '123');
  const fetched = await webauthn.getOrCreateUser('123');
  assert.equal(fetched.id, created.id);
});

test('setChallenge stores challenge', async () => {
  await webauthn.setChallenge('555', 'foo');
  const user = await webauthn.getUser('555');
  assert.equal(user?.currentChallenge, 'foo');
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
  assert.equal(user?.counter, 2);
  assert.equal(
    Buffer.from(user?.credentialId ?? []).toString('hex'),
    credential.credentialID.toString('hex'),
  );
  assert.equal(
    Buffer.from(user?.publicKey ?? []).toString('hex'),
    credential.publicKey.toString('hex'),
  );
});
