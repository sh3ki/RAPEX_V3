'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import Cookies from 'js-cookie';
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
    queryFn: () => api.get('/messaging/threads/').then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['admin-chat-messages', selectedThread],
    queryFn: () => api.get(`/messaging/threads/${selectedThread}/messages/`).then((r) => r.data),
    enabled: !!selectedThread,
    refetchInterval: 5_000,
  });

  const sendMut = useMutation({
    mutationFn: () =>
      api.post(`/messaging/threads/${selectedThread}/send/`, { body: newMessage, message_type: 'TEXT' }),
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
    const token = Cookies.get('access_token');
    const wsUrl = `ws://localhost:8000/ws/chat/${selectedThread}/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-messages', selectedThread] });
    };

    return () => ws.close();
  }, [selectedThread, queryClient]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex">
        {/* Thread List */}
        <div className="w-80 border-r border-dark-border h-screen overflow-y-auto bg-dark-surface">
          <div className="p-4 border-b border-dark-border">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare size={20} /> Chats
            </h2>
          </div>
          {threads.length === 0 ? (
            <p className="text-dark-muted text-sm text-center py-8">No conversations</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedThread(t.id)}
                className={`w-full text-left px-4 py-3 border-b border-dark-border/50 hover:bg-dark-bg transition-colors ${
                  selectedThread === t.id ? 'bg-dark-bg' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {t.participant_role} · {t.participant_id.slice(0, 8)}
                  </span>
                  {t.unread_admin > 0 && (
                    <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {t.unread_admin}
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-muted mt-1">
                  {t.last_message_at ? new Date(t.last_message_at).toLocaleString() : 'No messages'}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col h-screen">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-dark-muted">
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
                          : 'bg-dark-surface text-dark-text rounded-bl-md'
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
              <div className="p-4 border-t border-dark-border bg-dark-surface">
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
      </main>
    </div>
  );
}
