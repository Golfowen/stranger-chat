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
        return <MessageCircle size={18} className="text-green-600" />;
      case 'reveal_request':
        return <Eye size={18} className="text-gray-600" />;
      default:
        return <Info size={18} className="text-gray-500" />;
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
    <div className="space-y-4 animate-slide-up max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{t('notifications')}</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <CheckCheck size={16} />
            {t('markAllRead')}
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bell size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t('noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`w-full glass-card p-4 flex items-start gap-3 text-left transition-all
                ${!notif.read ? 'bg-gray-50 border-gray-300' : 'opacity-60'}`}
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                {getNotifIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notif.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{formatTime(notif.createdAt)}</span>
                  {notif.mode && (
                    <span className="text-xs text-gray-400">
                      {notif.mode === 'anonymous' ? '🎭' : '👤'} {notif.mode}
                    </span>
                  )}
                </div>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
