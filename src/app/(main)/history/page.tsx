'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserChats } from '@/lib/firestore';
import UserAvatar from '@/components/UserAvatar';
import { Clock, Eye, EyeOff } from 'lucide-react';

interface ChatRecord {
  id: string;
  members: string[];
  mode: string;
  isActive: boolean;
  lastMessage?: { text: string; senderId: string; createdAt: any };
  createdAt: any;
  [key: string]: unknown;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserChats(user.uid).then((data) => {
      setChats(data as ChatRecord[]);
      setLoading(false);
    });
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 animate-slide-up max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900">{t('chatHistory')}</h1>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="matching-ring mx-auto mb-4" style={{ width: 32, height: 32 }} />
          <p className="text-gray-400 text-sm">{t('loading')}</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t('noChatHistory')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {chats.map((chat) => {
            const partnerId = chat.members.find((id: string) => id !== user?.uid) || '';
            const isAnonymous = chat.mode === 'anonymous';

            return (
              <button
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className="w-full glass-card p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-all"
              >
                <UserAvatar name={partnerId} anonymous={isAnonymous} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">
                      {t('stranger')}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      {isAnonymous ? <EyeOff size={11} /> : <Eye size={11} />}
                      {isAnonymous ? t('anonymousMode') : t('revealedMode')}
                    </span>
                  </div>
                  {chat.lastMessage && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {chat.lastMessage.senderId === user?.uid ? `${t('you')}: ` : ''}
                      {chat.lastMessage.text}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{formatDate(chat.createdAt)}</p>
                  <span className={`inline-block w-2 h-2 rounded-full mt-1 ${chat.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
