// Basic WebAuthn support utilities and in-memory user store

export interface Credential {
  /** Raw credential ID bytes */
  credentialID: Buffer;
  /** Public key returned by the authenticator */
  publicKey: Buffer;
  /** Sign count for the authenticator */
  counter: number;
}

export interface User {
  id: string;
  username: string;
  credentials: Credential[];
  currentChallenge?: string;
}

/** In memory store keyed by username */
export const userStore = new Map<string, User>();

export const rpName = 'Crossed with Friends';
export const rpID = process.env.WEBAUTHN_RPID || 'localhost';
export const expectedOrigin = process.env.WEBAUTHN_ORIGIN || `http://localhost:3000`;

