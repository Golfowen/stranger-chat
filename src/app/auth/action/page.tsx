'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
    // Check if we have the necessary parameters
    if (!mode || !oobCode) {
      setStatus('error');
      setErrorMessage('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือหมดอายุแล้ว');
      return;
    }

    if (mode === 'resetPassword') {
      // Verify the code and get the user's email to display
      verifyPasswordResetCode(auth, oobCode)
        .then((userEmail) => {
          setEmail(userEmail);
          setStatus('ready');
        })
        .catch((error) => {
          console.error("Verification error", error);
          setStatus('error');
          setErrorMessage('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือถูกใช้งานไปแล้ว');
        });
    } else {
      // Handle other modes if needed (like verifyEmail)
      setStatus('error');
      setErrorMessage('ไม่รองรับคำสั่งนี้');
    }
  }, [mode, oobCode]);

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
      toast.success('รีเซ็ตรหัสผ่านสำเร็จ!');
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error("Reset error", error);
      toast.error('ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-sm animate-bounce-in">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('appName')}
          </h1>
          <p className="text-muted text-sm mt-1">รีเซ็ตรหัสผ่านของคุณ</p>
        </div>

        {/* Dynamic Content based on Status */}
        <div className="glass-card p-6 animate-slide-up">
          
          {status === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 size={32} className="animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">กำลังตรวจสอบลิงก์...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">{errorMessage}</p>
              <button 
                onClick={() => router.push('/login')}
                className="btn-primary w-full py-2.5 mt-4 text-sm"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-6 space-y-4 animate-scale-in">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">สำเร็จ!</h3>
              <p className="text-sm text-gray-500">รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว<br/>กำลังพากลับไปหน้าเข้าสู่ระบบ...</p>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4 pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-1">กำลังตั้งรหัสผ่านใหม่ให้กับ</p>
                <p className="text-sm font-medium text-gray-900">{email}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
                  <Lock size={14} />
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <button
                type="submit"
                disabled={submitting || newPassword.length < 6}
                className="btn-primary w-full py-2.5 mt-2 text-center"
              >
                {submitting ? t('loading') : 'บันทึกรหัสผ่านใหม่'}
              </button>
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    }>
      <AuthActionContent />
    </Suspense>
  );
}
