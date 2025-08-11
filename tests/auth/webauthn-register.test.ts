import { execSync } from 'child_process';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
// Use a per-worker SQLite DB to avoid test interference
const dbFile = `../tests/test-${process.env.VITEST_POOL_ID || '0'}.db`;
process.env.DATABASE_URL = `file:${dbFile}`;
execSync('npx prisma migrate deploy', { stdio: 'ignore' });

import { GET as registerGet, POST as registerPost } from '../../app/api/auth/webauthn-register/route';
import { prisma } from '../../lib/webauthn';


describe('webauthn-register route', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET returns registration options', async () => {
    const res = await registerGet(
      new Request('http://localhost/api/auth/webauthn-register?phone=alice')
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('challenge');
    expect(data.authenticatorSelection.authenticatorAttachment).toBe('platform');
    expect(data.authenticatorSelection.userVerification).toBe('required');
  });

  it('POST returns error for unknown user', async () => {
    const res = await registerPost(
      new Request('http://localhost/api/auth/webauthn-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: 'missing', attestationResponse: {} }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/User not found/);
  });
});
