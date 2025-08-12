import { prisma } from './group';

export async function sendMessage(groupId: string, userId: string, content: string) {
  if (!content || !content.trim()) {
    throw new Error('Content required');
  }
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new Error('Not a member');
  }
  return prisma.chatMessage.create({
    data: { groupId, userId, content },
  });
}

export async function listMessages(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new Error('Not a member');
  }
  return prisma.chatMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: 'asc' },
  });
}

export { prisma };
