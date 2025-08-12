import { execSync } from 'child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const dbFile = path.join(projectRoot, 'tests', `chat-unit-${process.env.VITEST_POOL_ID || '0'}.db`);
process.env.DATABASE_URL = `file:${dbFile}`;
execSync('npx prisma migrate deploy', { stdio: 'ignore', cwd: projectRoot });

const { sendMessage, listMessages, prisma } = await import('../../lib/chat');

describe('chat service', () => {
  beforeEach(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('sendMessage creates message', async () => {
    const group = await prisma.group.create({ data: { name: 'g1' } });
    const user = await prisma.user.create({ data: { phoneNumber: '111' } });
    await prisma.groupMember.create({ data: { groupId: group.id, userId: user.id } });
    const msg = await sendMessage(group.id, user.id, 'hello');
    expect(msg.content).toBe('hello');
  });

  it('listMessages returns in order', async () => {
    const group = await prisma.group.create({ data: { name: 'g2' } });
    const user = await prisma.user.create({ data: { phoneNumber: '222' } });
    await prisma.groupMember.create({ data: { groupId: group.id, userId: user.id } });
    await sendMessage(group.id, user.id, 'first');
    await sendMessage(group.id, user.id, 'second');
    const msgs = await listMessages(group.id, user.id);
    expect(msgs.map((m) => m.content)).toEqual(['first', 'second']);
  });

  it('sendMessage rejects non-member', async () => {
    const group = await prisma.group.create({ data: { name: 'g3' } });
    const user = await prisma.user.create({ data: { phoneNumber: '333' } });
    await expect(sendMessage(group.id, user.id, 'hi')).rejects.toThrow();
  });

  it('listMessages rejects non-member', async () => {
    const group = await prisma.group.create({ data: { name: 'g4' } });
    const user = await prisma.user.create({ data: { phoneNumber: '444' } });
    await expect(listMessages(group.id, user.id)).rejects.toThrow();
  });
});
