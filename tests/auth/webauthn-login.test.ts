import { describe, it, expect, beforeEach } from 'vitest';
import { GET as loginGet, POST as loginPost } from '../../app/api/auth/webauthn-login/route';
import { userStore } from '../../lib/webauthn';


describe('webauthn-login route', () => {
  beforeEach(() => {
    userStore.clear();
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
    userStore.set('bob', { id: 'bob', phone: 'bob', credentials: [] });
    const res = await loginGet(
      new Request('http://localhost/api/auth/webauthn-login?phone=bob')
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('challenge');
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
