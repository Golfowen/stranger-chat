'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import TagSelector from '@/components/TagSelector';
import MatchingAnimation from '@/components/MatchingAnimation';
import { joinWaitingQueue, leaveWaitingQueue, findMatch, listenToWaitingQueue, listenToOnlineCount } from '@/lib/firestore';
import { Eye, EyeOff, Users, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [mode, setMode] = useState<'anonymous' | 'revealed'>('anonymous');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [queueDocId, setQueueDocId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  // Listen to online count
  useEffect(() => {
    try {
      const unsub = listenToOnlineCount((count) => {
        setOnlineCount(count);
      });
      return () => unsub();
    } catch (error) {
      console.error('Online count listener error:', error);
    }
  }, []);

  // Listen for new matches
  useEffect(() => {
    if (!user || !isMatching) return;
    const unsub = listenToWaitingQueue(user.uid, (match) => {
      if (match) {
        setIsMatching(false);
        toast.success(t('matchFound'));
        router.push(`/chat/${match.chatId}`);
      }
    });
    return () => unsub();
  }, [user, isMatching, router, t]);

  const startMatching = useCallback(async () => {
    if (!user) return;
    if (selectedTags.length === 0) {
      toast.error(t('selectInterests'));
      return;
    }

    setIsMatching(true);

    const match = await findMatch(user.uid, mode, selectedTags);
    if (match) {
      setIsMatching(false);
      toast.success(t('matchFound'));
      router.push(`/chat/${match.chatId}`);
      return;
    }

    const docId = await joinWaitingQueue(user.uid, mode, selectedTags);
    setQueueDocId(docId);
  }, [user, mode, selectedTags, router, t]);

  const stopMatching = useCallback(async () => {
    setIsMatching(false);
    if (queueDocId) {
      await leaveWaitingQueue(queueDocId);
      setQueueDocId(null);
    }
  }, [queueDocId]);

  return (
    <div className="space-y-5 stagger-children max-w-2xl mx-auto">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-xl font-semibold text-gray-900">{t('chooseMode')}</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
          <span className="text-sm text-muted">
            {onlineCount} {t('onlineNow')}
          </span>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up">
        <button
          onClick={() => setMode('anonymous')}
          className={`mode-card glass-card p-5 text-left ${mode === 'anonymous' ? 'selected' : ''}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <EyeOff size={18} className="text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-900">{t('anonymousMode')}</h3>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">{t('anonymousModeDesc')}</p>
            </div>
          </div>
          {mode === 'anonymous' && (
            <div className="absolute top-3 right-3">
              <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center animate-scale-in">
                <Check size={12} className="text-white" />
              </div>
            </div>
          )}
        </button>

        <button
          onClick={() => setMode('revealed')}
          className={`mode-card glass-card p-5 text-left ${mode === 'revealed' ? 'selected' : ''}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Eye size={18} className="text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-900">{t('revealedMode')}</h3>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">{t('revealedModeDesc')}</p>
            </div>
          </div>
          {mode === 'revealed' && (
            <div className="absolute top-3 right-3">
              <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Interest Tags */}
      <div className="glass-card p-5 animate-slide-up">
        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          userAge={userProfile?.age}
        />
      </div>

      {/* Start Matching Button */}
      <button
        onClick={startMatching}
        disabled={selectedTags.length === 0 || isMatching}
        className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
      >
        <Users size={18} />
        {t('startMatching')}
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up">
        <div className="glass-card p-4 text-center">
          <p className="text-xl font-semibold text-gray-900">{userProfile?.totalChats || 0}</p>
          <p className="text-xs text-muted mt-0.5">{t('totalChats')}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xl font-semibold text-gray-900">{selectedTags.length}</p>
          <p className="text-xs text-muted mt-0.5">{t('interests')}</p>
        </div>
      </div>

      {isMatching && <MatchingAnimation onCancel={stopMatching} />}
    </div>
  );
}

