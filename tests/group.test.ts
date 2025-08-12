import { test, beforeAll, afterAll, expect } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

let group: typeof import('../lib/group');

beforeAll(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'prisma-group-'));
  process.env.DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
  execSync('npx prisma migrate deploy', { env: process.env });
  group = await import('../lib/group');
});

afterAll(async () => {
  await group.prisma.$disconnect();
});

test('addUserToGroup upserts membership', async () => {
  const g = await group.prisma.group.create({ data: { name: 'test group' } });
  await group.addUserToGroup(g.id, '111');
  await group.addUserToGroup(g.id, '111');
  const user = await group.prisma.user.findUnique({ where: { phoneNumber: '111' } });
  expect(user).toBeTruthy();
  const count = await group.prisma.groupMember.count({ where: { groupId: g.id } });
  expect(count).toBe(1);
});

test('removeUserFromGroup deletes membership', async () => {
  const g = await group.prisma.group.create({ data: { name: 'group2' } });
  await group.addUserToGroup(g.id, '222');
  const user = await group.prisma.user.findUnique({ where: { phoneNumber: '222' } });
  await group.removeUserFromGroup(g.id, user!.id);
  const membership = await group.prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: g.id, userId: user!.id } },
  });
  expect(membership).toBeNull();
});
