'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Bell, Clock, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { listenToNotifications } from '@/lib/firestore';

const navItems = [
  { key: 'home' as const, icon: Home, href: '/home' },
  { key: 'history' as const, icon: Clock, href: '/history' },
  { key: 'notifications' as const, icon: Bell, href: '/notifications' },
  { key: 'profile' as const, icon: User, href: '/profile' },
  { key: 'settings' as const, icon: Settings, href: '/settings' },
] as const;

export default function BottomNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToNotifications(user.uid, (notifs) => {
      const unread = notifs.filter((n) => !n.read).length;
      setUnreadCount(unread);
    });
    return () => unsub();
  }, [user]);

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const IconComponent = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => router.push(item.href)}
              className={`bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}
            >
              <div className="relative">
                <IconComponent size={20} />
                {item.key === 'notifications' && unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="font-medium">{t(item.key)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
