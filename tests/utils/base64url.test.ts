import { describe, it, expect } from 'vitest';
import { toArrayBuffer, fromArrayBuffer } from '../../utils/base64url';

describe('base64url helpers', () => {
  it('round-trips base64url string', () => {
    const message = 'Hello, world!';
    const original = Buffer.from(message).toString('base64url');
    const buf = toArrayBuffer(original);
    const encoded = fromArrayBuffer(buf);
    expect(encoded).toBe(original);
    expect(Buffer.from(buf).toString()).toBe(message);
  });

  it('round-trips ArrayBuffer', () => {
    const bytes = new Uint8Array([251, 239, 190, 173]).buffer;
    const encoded = fromArrayBuffer(bytes);
    expect(encoded).toBe(Buffer.from(bytes).toString('base64url'));
    const decoded = toArrayBuffer(encoded);
    expect(new Uint8Array(decoded)).toEqual(new Uint8Array(bytes));
  });
});
