'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Lock, User, Eye, EyeOff, Globe, Leaf, Zap } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';
import toast from 'react-hot-toast';

const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'] });

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
  const [mounted, setMounted] = useState(false);

  // Background Leaves configuration (Deterministic to avoid hydration mismatch)
  const leaves = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${(i * 7 + 3) % 100}%`,
    animationDuration: `${12 + (i % 5) * 3}s`,
    animationDelay: `${(i % 7)}s`,
    color: ['#8B6D3B', '#594A26', '#84796B', '#483C21'][i % 4]
  }));

  useEffect(() => {
    setMounted(true);
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
      console.error("Auth Error:", code, error);
      
      if (code.includes('email-already-in-use')) {
        toast.error(t('errorEmailInUse'));
      } else if (code.includes('weak-password')) {
        toast.error(t('errorWeakPassword'));
      } else if (code.includes('invalid-email')) {
        toast.error(t('errorInvalidEmail'));
      } else if (isResetPassword) {
        if (code.includes('user-not-found') || code.includes('invalid-credential')) {
           toast.error('ไม่พบบัญชีที่ใช้อีเมลนี้');
        } else {
           toast.error('เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัส');
        }
      } else {
        toast.error(isRegister ? t('errorRegister') : t('errorLogin'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mori-theme min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#11110B', color: '#F4EED9' }}>
      
      {/* Falling Leaves Background */}
      {mounted && leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="mori-leaf"
          style={{
            left: leaf.left,
            animationDuration: leaf.animationDuration,
            animationDelay: leaf.animationDelay,
            color: leaf.color
          }}
        >
          <svg viewBox="0 0 24 24" className="mori-leaf-bg-svg w-full h-full">
            <path d="M12 22s-8-4.5-8-11.8A6 6 0 0 1 10 4.2c2.5-1 5.3-.2 7 2 2 2.6 1.4 6 0 8.5C14.7 18 12 22 12 22z" fill="currentColor" opacity="0.8"/>
            <path d="M12 22v-9" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
          </svg>
        </div>
      ))}

      {/* Language toggle */}
      <button
        onClick={() => setLocale(locale === 'en' ? 'th' : 'en')}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-lg border border-[#3b3324] text-sm text-[#84796B] hover:text-[#F4EED9] hover:border-[#8B6D3B] transition-colors bg-[#1c1a16] shadow-md"
      >
        <Globe size={15} />
        {locale === 'en' ? '🇹🇭 TH' : '🇬🇧 EN'}
      </button>

      {/* Hero Branding */}
      <div className={`text-center mb-8 relative z-10 animate-bounce-in ${playfair.className}`}>
        <h1 className="text-5xl font-semibold mb-3 flex items-center justify-center gap-3 tracking-wide" style={{ color: '#F4EED9' }}>
          <Leaf className="text-[#8B6D3B]" size={36} fill="currentColor" strokeWidth={1} />
          Whisper
        </h1>
        <p className="text-[#84796B] font-sans text-xs tracking-[0.2em] font-medium uppercase mt-2">
          {t('appTagline')}
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm mori-card p-8 relative z-10 animate-slide-up">
        {/* Card Header */}
        <div className="mb-6 border-b border-[#3b3324] pb-4">
          <h2 className={`text-2xl font-semibold mb-2 ${playfair.className}`}>Welcome</h2>
          <p className="text-[#84796B] text-sm tracking-wide">
            {isResetPassword ? 'รีเซ็ตรหัสผ่านของคุณ' : (isRegister ? 'สร้างบัญชีเพื่อเริ่มต้นสนทนา' : 'เข้าสู่ระบบเพื่อเริ่มต้นสนทนา')}
          </p>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-[#383329] bg-[#26231d] text-[#F4EED9] font-medium text-sm hover:border-[#8B6D3B] transition-all disabled:opacity-50 mb-6 group"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-90 group-hover:opacity-100 transition-opacity">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('loginWithGoogle')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[#3b3324]" />
          <span className="text-xs text-[#84796B] uppercase tracking-wider">หรือ</span>
          <div className="flex-1 h-px bg-[#3b3324]" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {isRegister && !isResetPassword && (
            <div className="animate-slide-up">
              <label className="flex items-center gap-2 text-xs font-medium text-[#84796B] mb-2">
                <User size={14} className="text-[#8B6D3B]" />
                {t('displayName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Autumn, Sage, Mori..."
                className="w-full px-4 py-3 rounded-lg mori-input text-sm"
                required
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-[#84796B] mb-2">
              <Mail size={14} className="text-[#8B6D3B]" />
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-lg mori-input text-sm"
              required
            />
          </div>

          {!isResetPassword && (
            <>
              <div className="animate-slide-up">
                <label className="flex items-center gap-2 text-xs font-medium text-[#84796B] mb-2">
                  <Lock size={14} className="text-[#8B6D3B]" />
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {isRegister && (
                <div className="animate-slide-up mt-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#84796B] mb-2">
                    <Lock size={14} className="text-[#8B6D3B]" />
                    {t('confirmPassword')}
                  </label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg mori-input text-sm"
                    required
                    minLength={6}
                  />
                </div>
              )}
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3.5 rounded-lg text-sm font-medium tracking-wide ${isResetPassword ? 'mori-btn-outline' : 'mori-btn-primary'}`}
            >
              {submitting
                ? t('loading')
                : isResetPassword
                ? t('resetPassword')
                : isRegister
                ? t('signUp')
                : 'เริ่มต้น (Start)'}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setIsResetPassword(false); }}
              className={`w-full py-3.5 mt-3 rounded-lg text-sm font-medium tracking-wide mori-btn-outline ${isResetPassword ? 'hidden' : 'block'}`}
            >
              {isRegister ? t('haveAccount') : 'สุ่มชื่อให้ฉัน / สมัครใหม่'}
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-5 text-center">
          <button
            onClick={() => { setIsResetPassword(!isResetPassword); setIsRegister(false); }}
            className="text-xs text-[#84796B] hover:text-[#8B6D3B] transition-colors underline-offset-4 hover:underline"
          >
            {isResetPassword ? t('back') : t('forgotPassword')}
          </button>
        </div>
      </div>

      {/* Feature Icons Footer */}
      <div className="mt-12 flex items-center justify-center gap-10 relative z-10 opacity-80 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col items-center gap-2">
          <Leaf size={18} className="text-[#8B6D3B]" />
          <span className="text-[10px] text-[#84796B] tracking-wider uppercase">ไม่ระบุตัวตน</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Zap size={18} className="text-[#8B6D3B]" />
          <span className="text-[10px] text-[#84796B] tracking-wider uppercase">หาคู่คุยทันที</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Lock size={18} className="text-[#8B6D3B]" />
          <span className="text-[10px] text-[#84796B] tracking-wider uppercase">ปลอดภัย</span>
        </div>
      </div>

    </div>
  );
}
