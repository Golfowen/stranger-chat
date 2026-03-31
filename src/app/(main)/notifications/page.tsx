'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { listenToNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/firestore';
import { Bell, CheckCheck, MessageCircle, Eye, Info } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  message: string;
  chatId?: string;
  mode?: string;
  read: boolean;
  createdAt: any;
  [key: string]: unknown;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToNotifications(user.uid, (notifs) => {
      setNotifications(notifs as Notification[]);
    });
    return () => unsub();
  }, [user]);

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
    if (notif.chatId) {
      router.push(`/chat/${notif.chatId}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'match_found':
        return <MessageCircle size={18} className="text-[#8B6D3B]" />;
      case 'reveal_request':
        return <Eye size={18} className="text-[#84796B]" />;
      default:
        return <Info size={18} className="text-[#84796B]" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4 animate-slide-up max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-[#F4EED9]">{t('notifications')}</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-400">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-[#84796B] hover:text-[#F4EED9] transition-colors"
          >
            <CheckCheck size={16} />
            {t('markAllRead')}
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="mori-card p-12 text-center">
          <Bell size={40} className="text-[#3b3324] mx-auto mb-3" />
          <p className="text-[#84796B] text-sm">{t('noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`w-full mori-card p-4 flex items-start gap-3 text-left transition-all
                ${!notif.read ? 'bg-[#26231d] border-[#8B6D3B]' : 'opacity-60'}`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#26231d] flex items-center justify-center flex-shrink-0">
                {getNotifIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notif.read ? 'font-medium text-[#F4EED9]' : 'text-[#84796B]'}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#84796B]">{formatTime(notif.createdAt)}</span>
                  {notif.mode && (
                    <span className="text-xs text-[#84796B]">
                      {notif.mode === 'anonymous' ? '🎭' : '👤'} {notif.mode}
                    </span>
                  )}
                </div>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-[#8B6D3B] flex-shrink-0 mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
