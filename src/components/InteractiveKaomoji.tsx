import { useEffect, useMemo, useState } from 'react';
import {
  EMOTION_META,
  getKaomojiVariants,
  type Archetype,
  type EmotionKey,
} from '../lib/emotionEngine';

interface MoodTheme {
  border: string;
  surface: string;
  text: string;
  darkBorder: string;
  darkSurface: string;
  darkText: string;
  moodCue: string;
  animationClass: string;
}

const MOOD_THEMES: Record<EmotionKey, MoodTheme> = {
  senang: {
    border: '#A7F3D0',
    surface: '#ECFDF5',
    text: '#047857',
    darkBorder: 'rgba(52, 211, 153, 0.35)',
    darkSurface: 'rgba(16, 185, 129, 0.12)',
    darkText: '#34D399',
    moodCue: 'Ceria & Hangat',
    animationClass: 'animate-mood-senang',
  },
  marah: {
    border: '#FECDD3',
    surface: '#FFF1F2',
    text: '#BE123C',
    darkBorder: 'rgba(251, 113, 133, 0.35)',
    darkSurface: 'rgba(225, 29, 72, 0.14)',
    darkText: '#FB7185',
    moodCue: 'Tegas & Tegang',
    animationClass: 'animate-mood-marah',
  },
  takut: {
    border: '#DDD6FE',
    surface: '#F5F3FF',
    text: '#6D28D9',
    darkBorder: 'rgba(167, 139, 250, 0.35)',
    darkSurface: 'rgba(124, 58, 237, 0.14)',
    darkText: '#C4B5FD',
    moodCue: 'Gentar & Waspada',
    animationClass: 'animate-mood-takut',
  },
  bingung: {
    border: '#FDE68A',
    surface: '#FFFBEB',
    text: '#B45309',
    darkBorder: 'rgba(251, 191, 36, 0.35)',
    darkSurface: 'rgba(217, 119, 6, 0.14)',
    darkText: '#FCD34D',
    moodCue: 'Ragu & Salah Tingkah',
    animationClass: 'animate-mood-bingung',
  },
  sedih: {
    border: '#BFDBFE',
    surface: '#EFF6FF',
    text: '#1D4ED8',
    darkBorder: 'rgba(96, 165, 250, 0.35)',
    darkSurface: 'rgba(37, 99, 235, 0.14)',
    darkText: '#93C5FD',
    moodCue: 'Murung & Reflektif',
    animationClass: 'animate-mood-sedih',
  },
  jijik: {
    border: '#D9F99D',
    surface: '#F7FEE7',
    text: '#4D7C0F',
    darkBorder: 'rgba(163, 230, 53, 0.32)',
    darkSurface: 'rgba(101, 163, 13, 0.14)',
    darkText: '#BEF264',
    moodCue: 'Sinis & Menghindar',
    animationClass: 'animate-mood-jijik',
  },
};

interface InteractiveKaomojiProps {
  kaomoji: string;
  dominant: EmotionKey;
  dominantValue?: number;
  archetype?: Archetype;
  internalThought?: string;
  variant?: 'stage' | 'inline';
  isDark?: boolean;
  className?: string;
}

export function InteractiveKaomoji({
  kaomoji,
  dominant,
  dominantValue,
  archetype = 'Kustom',
  internalThought,
  variant = 'stage',
  isDark = false,
  className = '',
}: InteractiveKaomojiProps) {
  const [cycleOffset, setCycleOffset] = useState(0);
  const [pokeCount, setPokeCount] = useState(0);

  // Reset manual cycle offset whenever AI emits a new kaomoji or mood
  useEffect(() => {
    setCycleOffset(0);
  }, [kaomoji, dominant]);

  const variantsList = useMemo(() => {
    const base = getKaomojiVariants(dominant, archetype);
    if (!base.includes(kaomoji)) {
      return [kaomoji, ...base];
    }
    const idx = base.indexOf(kaomoji);
    return [...base.slice(idx), ...base.slice(0, idx)];
  }, [kaomoji, dominant, archetype]);

  const activeKaomoji = variantsList[cycleOffset % variantsList.length] || kaomoji;
  const theme = MOOD_THEMES[dominant];
  const meta = EMOTION_META[dominant];

  const surfaceColor = isDark ? theme.darkSurface : theme.surface;
  const borderColor = isDark ? theme.darkBorder : theme.border;
  const textColor = isDark ? theme.darkText : theme.text;

  const handleCycle = () => {
    setCycleOffset((prev) => (prev + 1) % variantsList.length);
    setPokeCount((c) => c + 1);
  };

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleCycle}
        title={`Mood ${meta.label} (${theme.moodCue}) — Klik untuk variasi kaomoji`}
        aria-label={`Kaomoji ${activeKaomoji}, mood ${meta.label}. Klik untuk ganti ekspresi`}
        style={{
          color: textColor,
          backgroundColor: surfaceColor,
          borderColor,
        }}
        className={`inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none whitespace-nowrap ${className}`}
      >
        <span
          key={`${activeKaomoji}-${dominant}-${pokeCount}`}
          className="inline-block animate-kaomoji-pop"
        >
          {activeKaomoji}
        </span>
      </button>
    );
  }

  return (
    <div
      data-testid="kaomoji-mood-stage"
      data-mood={dominant}
      style={{
        backgroundColor: surfaceColor,
        borderColor,
      }}
      className={`rounded-xl border p-4 transition-colors duration-300 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--app-text-muted)]">
            <span>Ekspresi Kaomoji</span>
            <span aria-hidden="true">·</span>
            <span style={{ color: textColor }} className="font-semibold transition-colors duration-300">
              {theme.moodCue}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCycle}
            data-testid="active-kaomoji"
            aria-label={`Ekspresi kaomoji saat ini ${activeKaomoji}, suasana hati ${meta.label}. Klik untuk reaksi kaomoji`}
            className="group mt-2 inline-flex flex-col items-start rounded-lg px-1.5 py-1 text-left transition-transform duration-150 hover:scale-[1.04] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
          >
            <span
              key={`${activeKaomoji}-${dominant}-${pokeCount}`}
              className="inline-block animate-kaomoji-pop"
            >
              <span
                style={{ color: textColor }}
                className={`inline-block font-mono text-3xl font-bold tracking-tight transition-colors duration-300 select-none ${theme.animationClass}`}
              >
                {activeKaomoji}
              </span>
            </span>

            <span className="mt-1 text-[11px] font-medium text-[var(--app-text-muted)] transition-colors group-hover:text-[var(--app-text)]">
              Klik untuk ganti pose ({(cycleOffset % variantsList.length) + 1}/{variantsList.length})
            </span>
          </button>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs font-medium text-[var(--app-text-muted)]">Emosi Dominan</div>
          <div
            data-testid="dominant-emotion"
            style={{ color: textColor }}
            className="mt-1.5 text-sm font-bold tabular-nums transition-colors duration-300"
          >
            {meta.label}
            {typeof dominantValue === 'number' ? ` · ${dominantValue}%` : ''}
          </div>
        </div>
      </div>

      {internalThought && (
        <p
          style={{ borderColor }}
          className="mt-3 border-t pt-2.5 text-xs leading-relaxed text-[var(--app-text)] opacity-90"
        >
          “{internalThought}”
        </p>
      )}
    </div>
  );
}
