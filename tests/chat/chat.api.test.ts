import { execSync } from 'child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const dbFile = path.join(projectRoot, 'tests', `chat-api-${process.env.VITEST_POOL_ID || '0'}.db`);
process.env.DATABASE_URL = `file:${dbFile}`;
execSync('npx prisma migrate deploy', { stdio: 'ignore', cwd: projectRoot });

const { GET: messagesGet, POST: messagesPost } = await import(
  '../../app/api/groups/[groupId]/messages/route'
);
const { prisma } = await import('../../lib/chat');

describe('chat API routes', () => {
  beforeEach(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST creates message for member', async () => {
    const group = await prisma.group.create({ data: { name: 'api g1' } });
    const user = await prisma.user.create({ data: { phoneNumber: '111' } });
    await prisma.groupMember.create({ data: { groupId: group.id, userId: user.id } });
    const res = await messagesPost(
      new Request(`http://localhost/api/groups/${group.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ content: 'hello' }),
      }),
      { params: { groupId: group.id } }
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.content).toBe('hello');
  });

  it('GET returns messages in order', async () => {
    const group = await prisma.group.create({ data: { name: 'api g2' } });
    const user = await prisma.user.create({ data: { phoneNumber: '222' } });
    await prisma.groupMember.create({ data: { groupId: group.id, userId: user.id } });
    await messagesPost(
      new Request(`http://localhost/api/groups/${group.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ content: 'first' }),
      }),
      { params: { groupId: group.id } }
    );
    await messagesPost(
      new Request(`http://localhost/api/groups/${group.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ content: 'second' }),
      }),
      { params: { groupId: group.id } }
    );
    const res = await messagesGet(
      new Request(`http://localhost/api/groups/${group.id}/messages`, {
        headers: { 'x-user-id': user.id },
      }),
      { params: { groupId: group.id } }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.map((m: any) => m.content)).toEqual(['first', 'second']);
  });

  it('POST rejects non-member', async () => {
    const group = await prisma.group.create({ data: { name: 'api g3' } });
    const user = await prisma.user.create({ data: { phoneNumber: '333' } });
    const res = await messagesPost(
      new Request(`http://localhost/api/groups/${group.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ content: 'hi' }),
      }),
      { params: { groupId: group.id } }
    );
    expect(res.status).toBe(403);
  });

  it('GET rejects non-member', async () => {
    const group = await prisma.group.create({ data: { name: 'api g4' } });
    const user = await prisma.user.create({ data: { phoneNumber: '444' } });
    const res = await messagesGet(
      new Request(`http://localhost/api/groups/${group.id}/messages`, {
        headers: { 'x-user-id': user.id },
      }),
      { params: { groupId: group.id } }
    );
    expect(res.status).toBe(403);
  });
});
