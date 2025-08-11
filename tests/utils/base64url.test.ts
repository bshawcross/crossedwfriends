import { describe, it, expect } from 'vitest';
import { toArrayBuffer, fromArrayBuffer } from '../../utils/base64url';

const textDecoder = new TextDecoder();

describe('base64url helpers', () => {
  it('round-trips base64url string', () => {
    const original = 'SGVsbG8sIHdvcmxkIQ';
    const buf = toArrayBuffer(original);
    const encoded = fromArrayBuffer(buf);
    expect(encoded).toBe(original);
    expect(textDecoder.decode(buf)).toBe('Hello, world!');
  });

  it('round-trips ArrayBuffer', () => {
    const bytes = new Uint8Array([251, 239, 190, 173]).buffer;
    const encoded = fromArrayBuffer(bytes);
    const decoded = toArrayBuffer(encoded);
    expect(new Uint8Array(decoded)).toEqual(new Uint8Array(bytes));
  });
});
