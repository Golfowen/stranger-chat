'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Lock, User, Eye, EyeOff, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, user, loading } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.replace('/home');
    }
  }, [user, loading, router]);

  if (user && !loading) return null;

  const handleGoogleLogin = async () => {
    try {
      setSubmitting(true);
      await loginWithGoogle();
      toast.success('Welcome! 🎉');
      router.push('/home');
    } catch (error: any) {
      toast.error(error?.message || t('errorLogin'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isResetPassword) {
        await resetPassword(email);
        toast.success(t('resetPasswordSent'));
        setIsResetPassword(false);
      } else if (isRegister) {
        if (password !== confirmPwd) {
          toast.error(t('errorPasswordMismatch'));
          return;
        }
        if (password.length < 6) {
          toast.error(t('errorWeakPassword'));
          return;
        }
        await registerWithEmail(email, password, name);
        toast.success('Welcome! 🎉');
        router.push('/home');
      } else {
        await loginWithEmail(email, password);
        toast.success('Welcome back! 👋');
        router.push('/home');
      }
    } catch (error: any) {
      const code = error?.code || '';
      if (code.includes('email-already-in-use')) {
        toast.error(t('errorEmailInUse'));
      } else if (code.includes('weak-password')) {
        toast.error(t('errorWeakPassword'));
      } else if (code.includes('invalid-email')) {
        toast.error(t('errorInvalidEmail'));
      } else {
        toast.error(isRegister ? t('errorRegister') : t('errorLogin'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      {/* Language toggle */}
      <button
        onClick={() => setLocale(locale === 'en' ? 'th' : 'en')}
        className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted hover:text-foreground hover:border-gray-400 transition-colors"
      >
        <Globe size={15} />
        {locale === 'en' ? '🇹🇭 TH' : '🇬🇧 EN'}
      </button>

      {/* Login Card */}
      <div className="w-full max-w-sm animate-bounce-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('appName')}
          </h1>
          <p className="text-muted text-sm mt-1">{t('appTagline')}</p>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="btn-google w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-50 mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('loginWithGoogle')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-muted">{t('orContinueWith')}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {isRegister && !isResetPassword && (
            <div className="animate-slide-up">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
                <User size={14} />
                {t('displayName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('displayName')}
                className="glass-input"
                required
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
              <Mail size={14} />
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="glass-input"
              required
            />
          </div>

          {!isResetPassword && (
            <>
              <div className="animate-slide-up">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
                  <Lock size={14} />
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="animate-slide-up">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
                    <Lock size={14} />
                    {t('confirmPassword')}
                  </label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input"
                    required
                    minLength={6}
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 text-center"
          >
            {submitting
              ? t('loading')
              : isResetPassword
              ? t('resetPassword')
              : isRegister
              ? t('signUp')
              : t('signIn')}
          </button>
        </form>

        {/* Links */}
        <div className="mt-5 space-y-2 text-center">
          {!isResetPassword && (
            <button
              onClick={() => { setIsRegister(!isRegister); setIsResetPassword(false); }}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {isRegister ? t('haveAccount') : t('noAccount')}
            </button>
          )}
          <br />
          <button
            onClick={() => { setIsResetPassword(!isResetPassword); setIsRegister(false); }}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            {isResetPassword ? t('back') : t('forgotPassword')}
          </button>
        </div>
      </div>
    </div>
  );
}
