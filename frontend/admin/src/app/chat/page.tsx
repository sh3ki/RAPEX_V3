'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Send, MessageSquare } from 'lucide-react';

interface Thread {
  id: string;
  participant_id: string;
  participant_role: string;
  unread_admin: number;
  last_message_at: string;
}

interface Message {
  id: string;
  sender_role: string;
  body: string;
  message_type: string;
  created_at: string;
}

export default function ChatPage() {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: threads = [] } = useQuery<Thread[]>({
    queryKey: ['admin-chat-threads'],
    queryFn: () => api.get('/chat/threads/').then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['admin-chat-messages', selectedThread],
    queryFn: () => api.get(`/chat/threads/${selectedThread}/messages/`).then((r) => r.data),
    enabled: !!selectedThread,
    refetchInterval: 5_000,
  });

  const sendMut = useMutation({
    mutationFn: () =>
      api.post('/chat/messages/', { thread_id: selectedThread, body: newMessage, message_type: 'TEXT' }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-chat-messages', selectedThread] });
      queryClient.invalidateQueries({ queryKey: ['admin-chat-threads'] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection for real-time
  useEffect(() => {
    if (!selectedThread) return;
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';
    const wsUrl = `${wsBase}/ws/chat/${selectedThread}/`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-messages', selectedThread] });
    };

    return () => ws.close();
  }, [selectedThread, queryClient]);

  return (
    <DashboardLayout>
        <div className="flex -m-6 h-[calc(100vh-5rem)]">
        {/* Thread List */}
        <div className="w-80 border-r border-gray-200 h-full overflow-y-auto bg-white">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare size={20} /> Chats
            </h2>
          </div>
          {threads.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No conversations</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedThread(t.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedThread === t.id ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {t.participant_role} · {t.participant_id.slice(0, 8)}
                  </span>
                  {t.unread_admin > 0 && (
                    <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {t.unread_admin}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t.last_message_at ? new Date(t.last_message_at).toLocaleString() : 'No messages'}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col h-full">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_role === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                        m.sender_role === 'ADMIN'
                          ? 'bg-primary text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-700 rounded-bl-md'
                      }`}
                    >
                      <p>{m.body}</p>
                      <p className="text-[10px] opacity-60 mt-1">
                        {new Date(m.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newMessage.trim()) sendMut.mutate();
                  }}
                  className="flex gap-3"
                >
                  <input
                    className="input flex-1"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendMut.isPending}
                    className="btn-primary px-4"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
        </div>
    </DashboardLayout>
  );
}
