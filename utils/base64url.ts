import { Buffer } from 'buffer';

export function toArrayBuffer(base64url: string): ArrayBuffer {
  const buf = Buffer.from(base64url, 'base64url');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export function fromArrayBuffer(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64url');
}
