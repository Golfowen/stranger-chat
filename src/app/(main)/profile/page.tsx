'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateUserProfile } from '@/lib/firestore';
import UserAvatar from '@/components/UserAvatar';
import TagSelector from '@/components/TagSelector';
import { Save, Camera, MessageCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { userProfile, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (userProfile && !initializedRef.current) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setAge(userProfile.age?.toString() || '');
      setGender(userProfile.gender || '');
      setInterests(userProfile.interests || []);
      initializedRef.current = true;
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) return;
    setSaving(true);
    try {
      await updateUserProfile(userProfile.uid, {
        displayName,
        bio,
        age: age ? parseInt(age) : null,
        gender,
        interests,
      });
      initializedRef.current = false;
      await refreshProfile();
      toast.success(t('profileSaved'));
    } catch (error) {
      toast.error(t('errorGeneral'));
    } finally {
      setSaving(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="space-y-5 animate-slide-up max-w-lg mx-auto pb-10">
      <h1 className="text-xl font-semibold text-[#F4EED9]">{t('editProfile')}</h1>

      {/* Avatar section */}
      <div className="mori-card p-6 flex flex-col items-center gap-3">
        <div className="relative">
          <UserAvatar
            name={userProfile.displayName}
            photoURL={userProfile.photoURL}
            size="xl"
          />
          <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#8B6D3B] flex items-center justify-center text-[#11110B] hover:bg-[#6A582D] transition-colors shadow-md">
            <Camera size={13} />
          </button>
        </div>
        <p className="text-sm text-[#84796B]">{userProfile.email}</p>
      </div>

      {/* Form */}
      <div className="mori-card p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#84796B] mb-1.5">{t('displayName')}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mori-input rounded-lg px-4 py-3 w-full"
            maxLength={30}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#84796B] mb-1.5">{t('bio')}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('bioPlaceholder')}
            className="mori-input rounded-lg px-4 py-3 w-full min-h-[80px] resize-none"
            maxLength={200}
          />
          <p className="text-xs text-[#84796B] mt-1 text-right">{bio.length}/200</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#84796B] mb-1.5">{t('age')}</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mori-input rounded-lg px-4 py-3 w-28"
            min={13}
            max={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#84796B] mb-1.5">{t('gender')}</label>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'male', label: t('male'), emoji: '👨' },
              { val: 'female', label: t('female'), emoji: '👩' },
              { val: 'other', label: t('other'), emoji: '🧑' },
              { val: '', label: t('preferNotToSay'), emoji: '🤷' },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setGender(opt.val)}
                className={`tag ${gender === opt.val ? 'tag-active' : 'tag-default'}`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <TagSelector
          selectedTags={interests}
          onTagsChange={setInterests}
          userAge={age ? parseInt(age) : null}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="mori-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#26231d] flex items-center justify-center">
            <MessageCircle size={16} className="text-[#84796B]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[#F4EED9]">{userProfile.totalChats || 0}</p>
            <p className="text-xs text-[#84796B]">{t('totalChats')}</p>
          </div>
        </div>
        <div className="mori-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#26231d] flex items-center justify-center">
            <Clock size={16} className="text-[#84796B]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[#F4EED9]">—</p>
            <p className="text-xs text-[#84796B]">{t('totalTime')}</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="mori-btn-primary rounded-lg w-full py-3.5 flex items-center justify-center gap-2 text-sm tracking-wide font-medium"
      >
        <Save size={16} />
        {saving ? t('loading') : t('save')}
      </button>
    </div>
  );
}
