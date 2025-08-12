import { getOrCreateUser, prisma } from './webauthn';

export async function addUserToGroup(groupId: string, phone: string) {
  const user = await getOrCreateUser(phone);
  return prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId: user.id } },
    update: {},
    create: { groupId, userId: user.id },
  });
}

export async function removeUserFromGroup(groupId: string, userId: string) {
  return prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

export { prisma };
