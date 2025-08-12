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

export async function updateGroupName(
  groupId: string,
  userId: string,
  name: string
) {
  if (!name || !name.trim()) {
    throw new Error('Name required');
  }
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new Error('Not a member');
  }
  return prisma.group.update({ where: { id: groupId }, data: { name } });
}

export { prisma };
