import GroupSettingsForm from './GroupSettingsForm';
import { prisma } from '@/lib/group';

export default async function GroupSettingsPage({
  params,
}: {
  params: { groupId: string };
}) {
  const group = await prisma.group.findUnique({ where: { id: params.groupId } });
  if (!group) {
    return <main className="p-4">Group not found</main>;
  }
  return <GroupSettingsForm groupId={group.id} initialName={group.name} />;
}
