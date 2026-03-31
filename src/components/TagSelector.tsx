'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, X } from 'lucide-react';

const DEFAULT_TAGS = [
  { key: 'tagFriends', emoji: '👋', ageRestricted: false },
  { key: 'tagDating', emoji: '💕', ageRestricted: false },
  { key: 'tag18Plus', emoji: '🔞', ageRestricted: true },
  { key: 'tagGaming', emoji: '🎮', ageRestricted: false },
  { key: 'tagAnime', emoji: '🎌', ageRestricted: false },
  { key: 'tagMusic', emoji: '🎵', ageRestricted: false },
  { key: 'tagSports', emoji: '⚽', ageRestricted: false },
  { key: 'tagTech', emoji: '💻', ageRestricted: false },
  { key: 'tagMovies', emoji: '🎬', ageRestricted: false },
  { key: 'tagTravel', emoji: '✈️', ageRestricted: false },
  { key: 'tagFood', emoji: '🍕', ageRestricted: false },
  { key: 'tagStudy', emoji: '📚', ageRestricted: false },
] as const;

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  userAge?: number | null;
}

export default function TagSelector({ selectedTags, onTagsChange, userAge }: TagSelectorProps) {
  const { t } = useLanguage();
  const [customTagInput, setCustomTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [ageWarning, setAgeWarning] = useState('');

  const toggleTag = (tagValue: string, ageRestricted: boolean) => {
    if (ageRestricted && (!userAge || userAge < 18)) {
      setAgeWarning(t('errorAgeRequired'));
      setTimeout(() => setAgeWarning(''), 3000);
      return;
    }
    if (selectedTags.includes(tagValue)) {
      onTagsChange(selectedTags.filter((t) => t !== tagValue));
    } else {
      onTagsChange([...selectedTags, tagValue]);
    }
  };

  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !customTags.includes(tag)) {
      setCustomTags([...customTags, tag]);
      onTagsChange([...selectedTags, tag]);
      setCustomTagInput('');
    }
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag));
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted">{t('selectInterests')}</h3>

      {ageWarning && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 animate-slide-up">
          ⚠️ {ageWarning}
        </div>
      )}

      {/* Default tags */}
      <div className="flex flex-wrap gap-2">
        {DEFAULT_TAGS.map((tag) => {
          const tagValue = t(tag.key as any);
          const isSelected = selectedTags.includes(tagValue);
          return (
            <button
              key={tag.key}
              onClick={() => toggleTag(tagValue, tag.ageRestricted)}
              className={`tag ${tag.ageRestricted ? 'tag-danger' : 'tag-default'} ${isSelected ? 'tag-active' : ''}`}
            >
              <span>{tag.emoji}</span>
              <span>{tagValue}</span>
            </button>
          );
        })}
      </div>

      {/* Custom tags */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customTags.map((tag) => (
            <button
              key={tag}
              className={`tag tag-default ${selectedTags.includes(tag) ? 'tag-active' : ''} group`}
              onClick={() => toggleTag(tag, false)}
            >
              <span>#</span>
              <span>{tag}</span>
              <X
                size={12}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomTag(tag);
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Add custom tag input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customTagInput}
          onChange={(e) => setCustomTagInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
          placeholder={t('customTag')}
          className="mori-input rounded-lg px-4 py-2 flex-1 text-sm"
          maxLength={20}
        />
        <button
          onClick={addCustomTag}
          disabled={!customTagInput.trim()}
          className="mori-btn-outline rounded-lg px-4 py-2 text-sm flex items-center gap-1 disabled:opacity-30"
        >
          <Plus size={16} />
          {t('addTag')}
        </button>
      </div>
    </div>
  );
}
