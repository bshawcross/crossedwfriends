import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count === 0) {
    const user = await prisma.user.create({ data: { phoneNumber: 'seed-user' } });
    const group = await prisma.group.create({ data: { name: 'Initial Puzzle Group' } });
    await prisma.groupMember.create({
      data: {
        userId: user.id,
        groupId: group.id,
      },
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
