import { describe, it, expect, beforeEach } from 'vitest';
import { GET as loginGet, POST as loginPost } from '../../app/api/auth/webauthn-login/route';
import { prisma } from '../../lib/webauthn';


describe('webauthn-login route', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('GET returns error for missing user', async () => {
    const res = await loginGet(
      new Request('http://localhost/api/auth/webauthn-login?phone=missing')
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/User not found/);
  });

  it('GET returns authentication options for existing user', async () => {
    await prisma.user.create({ data: { phoneNumber: 'bob' } });
    const res = await loginGet(
      new Request('http://localhost/api/auth/webauthn-login?phone=bob')
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('challenge');
    expect(data.userVerification).toBe('required');
  });

  it('POST returns error for unknown user', async () => {
    const res = await loginPost(
      new Request('http://localhost/api/auth/webauthn-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: 'missing', assertionResponse: {} }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/User not found/);
  });
});
