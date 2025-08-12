import { execSync } from 'child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const dbFile = path.join(
  projectRoot,
  'tests',
  `group-unit-${process.env.VITEST_POOL_ID || '0'}.db`
);
process.env.DATABASE_URL = `file:${dbFile}`;
execSync('npx prisma migrate deploy', { stdio: 'ignore', cwd: projectRoot });

const {
  addUserToGroup,
  removeUserFromGroup,
  updateGroupName,
  prisma,
} = await import('../../lib/group');

describe('group service', () => {
  beforeEach(async () => {
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('addUserToGroup upserts membership', async () => {
    const group = await prisma.group.create({ data: { name: 'test group' } });
    await addUserToGroup(group.id, '111');
    await addUserToGroup(group.id, '111');
    const user = await prisma.user.findUnique({ where: { phoneNumber: '111' } });
    expect(user).toBeTruthy();
    const count = await prisma.groupMember.count({ where: { groupId: group.id } });
    expect(count).toBe(1);
  });

  it('removeUserFromGroup deletes membership', async () => {
    const group = await prisma.group.create({ data: { name: 'group2' } });
    await addUserToGroup(group.id, '222');
    const user = await prisma.user.findUnique({ where: { phoneNumber: '222' } });
    await removeUserFromGroup(group.id, user!.id);
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user!.id } },
    });
    expect(membership).toBeNull();
  });

  it('removeUserFromGroup throws if membership not found', async () => {
    const group = await prisma.group.create({ data: { name: 'no members' } });
    await expect(removeUserFromGroup(group.id, 'missing')).rejects.toThrow();
  });

  it('updateGroupName renames when user is member', async () => {
    const group = await prisma.group.create({ data: { name: 'old' } });
    await addUserToGroup(group.id, '333');
    const user = await prisma.user.findUnique({ where: { phoneNumber: '333' } });
    const updated = await updateGroupName(group.id, user!.id, 'new name');
    expect(updated.name).toBe('new name');
  });

  it('updateGroupName throws for non-member', async () => {
    const group = await prisma.group.create({ data: { name: 'old' } });
    const user = await prisma.user.create({ data: { phoneNumber: '444' } });
    await expect(updateGroupName(group.id, user.id, 'new')).rejects.toThrow();
  });

  it('updateGroupName validates name', async () => {
    const group = await prisma.group.create({ data: { name: 'old' } });
    await addUserToGroup(group.id, '555');
    const user = await prisma.user.findUnique({ where: { phoneNumber: '555' } });
    await expect(updateGroupName(group.id, user!.id, '')).rejects.toThrow();
  });
});

