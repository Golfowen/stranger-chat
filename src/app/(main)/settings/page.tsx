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
    <div className="space-y-4 animate-slide-up max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-gray-900">{t('settings')}</h1>

      {/* Language */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('language')}</h2>
        </div>
        <div className="p-1.5">
          <button
            onClick={() => setLocale('en')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${locale === 'en' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-600'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🇬🇧</span>
              <span className="text-sm">English</span>
            </div>
            {locale === 'en' && <div className="w-2 h-2 rounded-full bg-gray-900" />}
          </button>
          <button
            onClick={() => setLocale('th')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${locale === 'th' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-600'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🇹🇭</span>
              <span className="text-sm">ภาษาไทย</span>
            </div>
            {locale === 'th' && <div className="w-2 h-2 rounded-full bg-gray-900" />}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('notificationSettings')}</h2>
        </div>
        <button
          onClick={() => setNotifEnabled(!notifEnabled)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-gray-500" />
            <span className="text-sm text-gray-700">{t('enableNotifications')}</span>
          </div>
          <div className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${notifEnabled ? 'bg-gray-900' : 'bg-gray-300'}`}>
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${notifEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>

      {/* Blocked users */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('blockedUsers')}</h2>
        </div>
        {blockedUsers.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            <Shield size={20} className="mx-auto mb-2 text-gray-300" />
            {t('noBlockedUsers')}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {blockedUsers.map((userId) => (
              <div key={userId} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500 font-mono text-xs">{userId.slice(0, 12)}...</span>
                <button
                  onClick={() => handleUnblock(userId)}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {t('unblock')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</h2>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} className="text-gray-500" />
            <span className="text-sm text-gray-700">{t('logout')}</span>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-red-500" />
              <span className="text-sm text-red-500">{t('deleteAccount')}</span>
            </div>
            <ChevronRight size={16} className="text-red-300" />
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl animate-bounce-in border border-gray-200">
            <h3 className="text-lg font-semibold text-red-600">{t('deleteAccount')}</h3>
            <p className="text-sm text-gray-500">{t('deleteAccountConfirm')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  toast.error('Account deletion is not available in demo mode');
                  setShowDeleteConfirm(false);
                }}
                className="btn-danger flex-1"
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
