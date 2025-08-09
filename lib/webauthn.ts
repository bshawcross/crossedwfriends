export interface Credential {
  credentialID: string;
  credentialPublicKey: Buffer;
  counter: number;
}

export interface User {
  id: string;
  username: string;
  credentials: Credential[];
  currentChallenge?: string;
}

export const users = new Map<string, User>();

export function getUser(username: string): User | undefined {
  return users.get(username);
}

export function upsertUser(user: User): void {
  users.set(user.username, user);
}
