import { describe, it, expect, beforeEach } from 'vitest';
import { GET as registerGet, POST as registerPost } from '../../app/api/auth/webauthn-register/route';
import { userStore } from '../../lib/webauthn';


describe('webauthn-register route', () => {
  beforeEach(() => {
    userStore.clear();
  });

  it('GET returns registration options', async () => {
    const res = await registerGet(new Request('http://localhost/api/auth/webauthn-register?username=alice'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('challenge');
  });

  it('POST returns error for unknown user', async () => {
    const res = await registerPost(
      new Request('http://localhost/api/auth/webauthn-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'missing', attestationResponse: {} }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/User not found/);
  });
});
