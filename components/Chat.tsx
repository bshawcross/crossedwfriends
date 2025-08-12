'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Message {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export default function Chat({ groupId, userId }: { groupId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');

  async function fetchMessages() {
    const res = await fetch(`/api/groups/${groupId}/messages`, {
      headers: { 'x-user-id': userId },
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [groupId, userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await fetch(`/api/groups/${groupId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ content }),
    });
    setContent('');
    fetchMessages();
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex-1 overflow-y-auto border p-2">
        {messages.map((m) => (
          <div key={m.id} className="mb-1">
            <span className="font-bold mr-1">{m.userId}:</span>
            <span>{m.content}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-1 flex-1"
        />
        <button type="submit" className="px-2 py-1 bg-blue-500 text-white">
          Send
        </button>
      </form>
    </div>
  );
}
