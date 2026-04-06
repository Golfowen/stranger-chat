'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, Leaf, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'] });

function AuthActionContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'loading' | 'verifying' | 'ready' | 'success' | 'error'>('verifying');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus('error');
      setErrorMessage(t('invalidResetLink'));
      return;
    }

    if (mode === 'resetPassword') {
      verifyPasswordResetCode(auth, oobCode)
        .then((userEmail) => {
          setEmail(userEmail);
          setStatus('ready');
        })
        .catch((error) => {
          console.error("Verification error", error);
          setStatus('error');
          setErrorMessage(t('usedResetLink'));
        });
    } else {
      setStatus('error');
      setErrorMessage(t('unsupportedAction'));
    }
  }, [mode, oobCode, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || newPassword.length < 6) {
      toast.error(t('errorWeakPassword'));
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
      toast.success(t('passwordResetSuccess'));
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error("Reset error", error);
      toast.error(t('passwordResetError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mori-theme min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden text-[#F4EED9]" style={{ backgroundColor: '#11110B' }}>
      <div className="w-full max-w-sm animate-bounce-in relative z-10">
        
        {/* Header */}
        <div className={`text-center mb-8 ${playfair.className}`}>
          <h1 className="text-4xl font-semibold mb-3 flex items-center justify-center gap-3 tracking-wide" style={{ color: '#F4EED9' }}>
            <Leaf className="text-[#8B6D3B]" size={32} fill="currentColor" strokeWidth={1} />
            StrangerChat
          </h1>
          <p className="text-[#84796B] font-sans text-xs tracking-[0.2em] font-medium uppercase mt-2">
            {t('resetPageTitle')}
          </p>
        </div>

        {/* Dynamic Content based on Status */}
        <div className="mori-card p-8 animate-slide-up">
          
          {status === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 size={32} className="animate-spin text-[#8B6D3B]" />
              <p className="text-sm text-[#84796B]">{t('verifyingLink')}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-red-900/30 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} />
              </div>
              <p className="text-sm font-medium text-[#F4EED9]">{errorMessage}</p>
              <button 
                onClick={() => router.push('/login')}
                className="mori-btn-primary w-full py-3.5 rounded-lg mt-4 text-sm font-medium tracking-wide"
              >
                {t('backToLogin')}
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-6 space-y-4 animate-scale-in">
              <div className="w-16 h-16 bg-[#8B6D3B]/20 text-[#8B6D3B] rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-medium text-[#F4EED9]">{t('success')}</h3>
              <p className="text-sm text-[#84796B]">{t('passwordChanged')}<br/>{t('redirectingToLogin')}</p>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-6 pb-4 border-b border-[#3b3324]">
                <p className="text-xs text-[#84796B] mb-2 uppercase tracking-wide">{t('settingPasswordFor')}</p>
                <p className="text-sm font-medium text-[#F4EED9]">{email}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-[#84796B] mb-2">
                  <Lock size={14} className="text-[#8B6D3B]" />
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg mori-input text-sm pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#84796B] hover:text-[#F4EED9] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || newPassword.length < 6}
                  className="mori-btn-primary w-full py-3.5 rounded-lg mt-2 text-sm font-medium tracking-wide"
                >
                  {submitting ? t('loading') : t('saveNewPassword')}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="mori-theme min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#11110B' }}>
        <Loader2 size={32} className="animate-spin text-[#8B6D3B]" />
      </div>
    }>
      <AuthActionContent />
    </Suspense>
  );
}
