'use client';

import { useState } from 'react';

export default function GroupSettingsForm({
  groupId,
  initialName,
}: {
  groupId: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update');
      }
      const data = await res.json();
      setName(data.name);
      setStatus('Saved');
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-4">Group Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Save
        </button>
      </form>
      {status && <p className="mt-4">{status}</p>}
    </main>
  );
}
