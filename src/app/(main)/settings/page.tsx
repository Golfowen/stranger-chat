'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBlockedUsers, unblockUser } from '@/lib/firestore';
import { Globe, Bell, Shield, Trash2, LogOut, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const router = useRouter();

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    getBlockedUsers(user.uid).then(setBlockedUsers);
  }, [user]);

  const handleUnblock = async (blockedId: string) => {
    if (!user) return;
    try {
      await unblockUser(user.uid, blockedId);
      setBlockedUsers(blockedUsers.filter((id) => id !== blockedId));
      toast.success(t('unblock'));
    } catch {
      toast.error(t('errorGeneral'));
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="space-y-4 animate-slide-up max-w-lg mx-auto pb-10">
      <h1 className="text-xl font-semibold text-[#F4EED9]">{t('settings')}</h1>

      {/* Language */}
      <div className="mori-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#3b3324]">
          <h2 className="text-xs font-semibold text-[#84796B] uppercase tracking-wider">{t('language')}</h2>
        </div>
        <div className="p-1.5">
          <button
            onClick={() => setLocale('en')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${locale === 'en' ? 'bg-[#26231d] text-[#F4EED9]' : 'hover:bg-[#1E1C19] text-[#84796B]'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🇬🇧</span>
              <span className="text-sm">English</span>
            </div>
            {locale === 'en' && <div className="w-2 h-2 rounded-full bg-[#8B6D3B]" />}
          </button>
          <button
            onClick={() => setLocale('th')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${locale === 'th' ? 'bg-[#26231d] text-[#F4EED9]' : 'hover:bg-[#1E1C19] text-[#84796B]'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🇹🇭</span>
              <span className="text-sm">ภาษาไทย</span>
            </div>
            {locale === 'th' && <div className="w-2 h-2 rounded-full bg-[#8B6D3B]" />}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="mori-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#3b3324]">
          <h2 className="text-xs font-semibold text-[#84796B] uppercase tracking-wider">{t('notificationSettings')}</h2>
        </div>
        <button
          onClick={() => setNotifEnabled(!notifEnabled)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#26231d] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-[#84796B]" />
            <span className="text-sm text-[#F4EED9]">{t('enableNotifications')}</span>
          </div>
          <div className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${notifEnabled ? 'bg-[#8B6D3B]' : 'bg-[#3b3324]'}`}>
            <div className={`w-4.5 h-4.5 rounded-full bg-[#F4EED9] shadow transition-transform duration-200 ${notifEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>

      {/* Blocked users */}
      <div className="mori-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#3b3324]">
          <h2 className="text-xs font-semibold text-[#84796B] uppercase tracking-wider">{t('blockedUsers')}</h2>
        </div>
        {blockedUsers.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-[#84796B]">
            <Shield size={20} className="mx-auto mb-2 text-[#3b3324]" />
            {t('noBlockedUsers')}
          </div>
        ) : (
          <div className="divide-y divide-[#3b3324]">
            {blockedUsers.map((userId) => (
              <div key={userId} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#84796B] font-mono text-xs">{userId.slice(0, 12)}...</span>
                <button
                  onClick={() => handleUnblock(userId)}
                  className="text-xs text-[#8B6D3B] hover:text-[#F4EED9] transition-colors"
                >
                  {t('unblock')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account */}
      <div className="mori-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#3b3324]">
          <h2 className="text-xs font-semibold text-[#84796B] uppercase tracking-wider">Account</h2>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#26231d] transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} className="text-[#84796B]" />
            <span className="text-sm text-[#F4EED9]">{t('logout')}</span>
          </div>
          <ChevronRight size={16} className="text-[#84796B]" />
        </button>
        <div className="border-t border-[#3b3324]">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-950/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-red-400" />
              <span className="text-sm text-red-400">{t('deleteAccount')}</span>
            </div>
            <ChevronRight size={16} className="text-red-400/50" />
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="mori-card p-6 max-w-sm w-full space-y-4 shadow-xl animate-bounce-in">
            <h3 className="text-lg font-semibold text-red-400">{t('deleteAccount')}</h3>
            <p className="text-sm text-[#84796B]">{t('deleteAccountConfirm')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="mori-btn-outline rounded-lg flex-1 py-2.5 text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  toast.error('Account deletion is not available in demo mode');
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-2.5 text-sm rounded-lg bg-red-900/40 text-red-400 border border-red-800/50 hover:bg-red-900/60 transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
