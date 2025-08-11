import { PrismaClient } from '@prisma/client';

export interface Credential {
  /** Raw credential ID bytes */
  credentialID: Buffer;
  /** Public key returned by the authenticator */
  publicKey: Buffer;
  /** Sign count for the authenticator */
  counter: number;
}

const prisma = new PrismaClient();

export async function getUser(phone: string) {
  return prisma.user.findUnique({ where: { phoneNumber: phone } });
}

export async function getOrCreateUser(phone: string) {
  let user = await getUser(phone);
  if (!user) {
    user = await prisma.user.create({ data: { phoneNumber: phone } });
  }
  return user;
}

export async function setChallenge(phone: string, challenge: string) {
  await prisma.user.upsert({
    where: { phoneNumber: phone },
    update: { currentChallenge: challenge },
    create: { phoneNumber: phone, currentChallenge: challenge },
  });
}

export async function saveCredential(phone: string, credential: Credential) {
  await prisma.user.update({
    where: { phoneNumber: phone },
    data: {
      credentialId: credential.credentialID,
      publicKey: credential.publicKey,
      counter: credential.counter,
    },
  });
}

export async function updateCounter(phone: string, counter: number) {
  await prisma.user.update({ where: { phoneNumber: phone }, data: { counter } });
}

export const rpName = 'Crossed with Friends';
export const rpID = process.env.WEBAUTHN_RPID || 'localhost';
export const expectedOrigin = process.env.WEBAUTHN_ORIGIN || `http://localhost:3000`;

export { prisma };
