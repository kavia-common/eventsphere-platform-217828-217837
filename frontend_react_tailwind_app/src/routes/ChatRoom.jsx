import React, { useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * ChatRoom: UI scaffold for real-time chat room.
 */
export default function ChatRoom() {
  const [messages, setMessages] = useState([
    { id: 1, user: 'Alice', text: 'Welcome to the chat!' },
    { id: 2, user: 'Bob', text: 'Hello everyone 👋' },
  ]);
  const [input, setInput] = useState('');

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), user: 'You', text: input }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-2 p-3 card">
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">{m.user[0]}</div>
            <div>
              <div className="text-sm font-medium text-gray-800">{m.user}</div>
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
        <button className="btn-primary">Send</button>
      </form>
    </div>
  );
}
