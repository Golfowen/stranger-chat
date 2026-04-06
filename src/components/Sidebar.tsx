'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Home, User, Bell, Clock, Settings, LogOut, Globe, Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Playfair_Display } from 'next/font/google';
import { listenToNotifications } from '@/lib/firestore';

const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal'] });

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
    <aside className="hidden md:flex flex-col w-56 h-screen fixed left-0 top-0 mori-card rounded-none border-y-0 border-l-0 p-3 z-50">
      {/* Logo */}
      <div className="px-3 py-4 mb-2">
        <h1 className={`text-2xl font-semibold flex items-center gap-2 text-[#F4EED9] ${playfair.className}`}>
          <Leaf size={24} className="text-[#8B6D3B]" />
          StrangerChat
        </h1>
      </div>

      {/* User info */}
      {userProfile && (
        <div className="px-3 py-3 mb-4 rounded-lg bg-[#26231d] border border-[#383329]">
          <p className="font-medium text-sm text-[#F4EED9] truncate">{userProfile.displayName}</p>
          <p className="text-xs text-[#84796B] truncate">{userProfile.email}</p>
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
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-[#26231d] text-[#8B6D3B]'
                  : 'text-[#84796B] hover:text-[#F4EED9] hover:bg-[#1E1C19]'
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
      <div className="space-y-1 border-t border-[#383329] pt-3 mt-3">
        <button
          onClick={() => setLocale(locale === 'en' ? 'th' : 'en')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-[#84796B] hover:text-[#F4EED9] hover:bg-[#26231d] transition-all"
        >
          <Globe size={16} />
          {locale === 'en' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-400 hover:bg-red-950/30 transition-all"
        >
          <LogOut size={16} />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
