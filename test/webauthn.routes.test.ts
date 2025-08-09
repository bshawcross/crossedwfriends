import { describe, it, expect } from 'vitest';
import { POST as registerRoute } from '../app/api/auth/register/route';
import { POST as loginRoute } from '../app/api/auth/login/route';

function createRequest(url: string, body: object) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('WebAuthn routes', () => {
  it('registration returns success', async () => {
    const req = createRequest('http://localhost/api/auth/register', { phone: '123' });
    const res = await registerRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ success: true });
  });

  it('login returns success', async () => {
    const req = createRequest('http://localhost/api/auth/login', { phone: '123' });
    const res = await loginRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ success: true });
  });
});
