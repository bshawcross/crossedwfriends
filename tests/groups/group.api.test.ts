import { execSync } from 'child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const dbFile = path.join(
  projectRoot,
  'tests',
  `group-api-${process.env.VITEST_POOL_ID || '0'}.db`
);
process.env.DATABASE_URL = `file:${dbFile}`;
execSync('npx prisma migrate deploy', { stdio: 'ignore', cwd: projectRoot });

import { POST as invitePost } from '../../app/api/groups/[groupId]/invite/route';
import { DELETE as removeUserDelete } from '../../app/api/groups/[groupId]/users/[userId]/route';
import { prisma } from '../../lib/group';

describe('group API routes', () => {
  beforeEach(async () => {
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('invite adds user to group', async () => {
    const group = await prisma.group.create({ data: { name: 'api group' } });
    const res = await invitePost(
      new Request(`http://localhost/api/groups/${group.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '123' }),
      }),
      { params: { groupId: group.id } }
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.groupId).toBe(group.id);
    expect(data).toHaveProperty('userId');
    const count = await prisma.groupMember.count({ where: { groupId: group.id } });
    expect(count).toBe(1);
  });

  it('invite does not create duplicate membership', async () => {
    const group = await prisma.group.create({ data: { name: 'dup group' } });
    const reqInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '321' }),
    };
    await invitePost(
      new Request(`http://localhost/api/groups/${group.id}/invite`, reqInit),
      { params: { groupId: group.id } }
    );
    await invitePost(
      new Request(`http://localhost/api/groups/${group.id}/invite`, reqInit),
      { params: { groupId: group.id } }
    );
    const count = await prisma.groupMember.count({ where: { groupId: group.id } });
    expect(count).toBe(1);
  });

  it('invite returns 404 for missing group', async () => {
    const res = await invitePost(
      new Request('http://localhost/api/groups/missing/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '123' }),
      }),
      { params: { groupId: 'missing' } }
    );
    expect(res.status).toBe(404);
  });

  it('remove deletes membership', async () => {
    const group = await prisma.group.create({ data: { name: 'remove group' } });
    await invitePost(
      new Request(`http://localhost/api/groups/${group.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '555' }),
      }),
      { params: { groupId: group.id } }
    );
    const user = await prisma.user.findUnique({ where: { phoneNumber: '555' } });
    const res = await removeUserDelete(
      new Request(`http://localhost/api/groups/${group.id}/users/${user!.id}`, {
        method: 'DELETE',
      }),
      { params: { groupId: group.id, userId: user!.id } }
    );
    expect(res.status).toBe(204);
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user!.id } },
    });
    expect(membership).toBeNull();
  });

  it('remove returns 404 for non-member', async () => {
    const group = await prisma.group.create({ data: { name: 'none' } });
    const res = await removeUserDelete(
      new Request(`http://localhost/api/groups/${group.id}/users/bad`, {
        method: 'DELETE',
      }),
      { params: { groupId: group.id, userId: 'bad' } }
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/not found/i);
  });
});

