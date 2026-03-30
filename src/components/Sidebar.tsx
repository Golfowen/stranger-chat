'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Home, User, Bell, Clock, Settings, LogOut, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { listenToNotifications } from '@/lib/firestore';

const navItems = [
  { key: 'home' as const, icon: Home, href: '/home' },
  { key: 'history' as const, icon: Clock, href: '/history' },
  { key: 'notifications' as const, icon: Bell, href: '/notifications' },
  { key: 'profile' as const, icon: User, href: '/profile' },
  { key: 'settings' as const, icon: Settings, href: '/settings' },
] as const;

export default function Sidebar() {
  const { t, locale, setLocale } = useLanguage();
  const { user, userProfile, logout } = useAuth();
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

  const handleLogout = async () => {
    try {
      router.push('/login');
      await logout();
    } catch {
      // Ignore errors during logout transition
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen fixed left-0 top-0 bg-white border-r border-gray-200 p-3">
      {/* Logo */}
      <div className="px-3 py-4 mb-2">
        <h1 className="text-lg font-semibold text-gray-900">{t('appName')}</h1>
      </div>

      {/* User info */}
      {userProfile && (
        <div className="px-3 py-3 mb-4 rounded-lg bg-gray-50 border border-gray-100">
          <p className="font-medium text-sm text-gray-900 truncate">{userProfile.displayName}</p>
          <p className="text-xs text-muted truncate">{userProfile.email}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const IconComponent = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => router.push(item.href)}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                ${isActive
                  ? 'active bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <div className="relative">
                <IconComponent size={18} />
                {item.key === 'notifications' && unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {t(item.key)}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="space-y-1 border-t border-gray-200 pt-3 mt-3">
        <button
          onClick={() => setLocale(locale === 'en' ? 'th' : 'en')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
        >
          <Globe size={16} />
          {locale === 'en' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={16} />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
