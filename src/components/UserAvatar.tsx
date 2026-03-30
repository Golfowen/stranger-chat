'use client';

interface UserAvatarProps {
  name?: string;
  photoURL?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  anonymous?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const anonymousEmojis = ['🎭', '👻', '🦊', '🐱', '🦄', '🌟', '🔮', '🎪', '🌙', '⭐'];

export default function UserAvatar({ name, photoURL, size = 'md', anonymous = false }: UserAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (anonymous) {
    const emoji = anonymousEmojis[Math.abs((name || '').charCodeAt(0) || 0) % anonymousEmojis.length];
    return (
      <div className={`${sizeClass} rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center`}>
        <span>{emoji}</span>
      </div>
    );
  }

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name || 'User'}
        className={`${sizeClass} rounded-full object-cover border-2 border-gray-200`}
      />
    );
  }

  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div className={`${sizeClass} rounded-full bg-gray-900 flex items-center justify-center text-white font-medium`}>
      {initial}
    </div>
  );
}
