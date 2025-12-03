import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { CHAT_MESSAGES_QUERY } from '../graphql/queries';
import { SEND_MESSAGE_MUTATION } from '../graphql/mutations';
import { MESSAGE_ADDED_SUB } from '../graphql/subscriptions';

/**
 * PUBLIC_INTERFACE
 * ChatRoom: Real-time chat using GraphQL query + subscription.
 * For demo, we use a single default room "general".
 */
export default function ChatRoom() {
  const roomId = 'general';

  const { data, loading } = useQuery(CHAT_MESSAGES_QUERY, {
    variables: { roomId, limit: 50, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });

  const { data: subData } = useSubscription(MESSAGE_ADDED_SUB, {
    variables: { roomId },
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Initialize with query data
  useEffect(() => {
    if (data?.chatMessages) {
      setMessages(data.chatMessages);
    }
  }, [data]);

  // Append message from subscription
  useEffect(() => {
    const msg = subData?.messageAdded;
    if (msg) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
  }, [subData]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    try {
      await sendMessage({ variables: { roomId, text } });
      setInput('');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Failed to send: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-gray-900">Chat Room</h1>
        <p className="text-gray-600 text-sm">Room: {roomId}</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-3 card">
        {loading && <div>Loading messages…</div>}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
              {m.user?.name?.[0] || m.user?.email?.[0] || '?'}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">{m.user?.name || m.user?.email || 'User'}</div>
              <div className="text-sm text-gray-700">{m.text}</div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn-primary" disabled={sending}>Send</button>
      </form>
    </div>
  );
}
