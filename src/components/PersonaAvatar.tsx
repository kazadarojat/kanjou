import { useEffect, useState } from 'react';

interface PersonaAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
};

export function PersonaAvatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}: PersonaAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const showImage = Boolean(avatarUrl && !imgError);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] flex items-center justify-center font-display font-semibold text-[var(--app-text)] select-none ${SIZE_CLASSES[size]} ${className}`}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={`Potret persona ${name}`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials || 'AI'}</span>
      )}
    </div>
  );
}
