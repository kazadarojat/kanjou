import { Plus, Settings, Trash2, X } from 'lucide-react';
import { getDominantEmotion, EMOTION_META, type EmotionState, type Persona } from '../lib/emotionEngine';
import { PersonaAvatar } from './PersonaAvatar';

interface PersonaSidebarProps {
  personas: Persona[];
  activePersonaId: string;
  emotionMap: Record<string, EmotionState>;
  onSelectPersona: (id: string) => void;
  onCreatePersona: () => void;
  onDeletePersona: (id: string) => void;
  onOpenSettings: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isDark?: boolean;
}

export function PersonaSidebar({
  personas,
  activePersonaId,
  emotionMap,
  onSelectPersona,
  onCreatePersona,
  onDeletePersona,
  onOpenSettings,
  mobileOpen,
  onCloseMobile,
  isDark = false,
}: PersonaSidebarProps) {
  const content = (
    <aside
      aria-label="Daftar Persona AI"
      className="flex h-full w-[268px] flex-col border-r border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border)] px-4 py-4">
        <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
          Kanjou Harness
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup daftar persona"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-surface-alt)] hover:text-[var(--app-text)] lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-[var(--app-border-soft)] p-4">
        <button
          type="button"
          onClick={() => {
            onCreatePersona();
            onCloseMobile();
          }}
          className="flex w-full min-h-[42px] items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 whitespace-nowrap"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Persona Baru</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="px-2 pb-2 text-xs font-medium text-[var(--app-text-muted)]">
          Daftar Identitas ({personas.length})
        </div>
        <ul className="space-y-1.5">
          {personas.map((persona) => {
            const isActive = persona.id === activePersonaId;
            const currentState = emotionMap[persona.id] || persona.baselineEmotions;
            const dominant = getDominantEmotion(currentState);
            const meta = EMOTION_META[dominant.key];

            return (
              <li key={persona.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPersona(persona.id);
                    onCloseMobile();
                  }}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    isActive
                      ? 'bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)]'
                      : 'border border-transparent text-[var(--app-text)] hover:bg-[var(--app-surface-alt)]/60'
                  }`}
                >
                  <PersonaAvatar name={persona.name} avatarUrl={persona.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="truncate text-sm font-semibold">{persona.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--app-text-muted)]">
                      <span className="font-mono font-medium text-[var(--app-text)]">
                        {persona.mbti}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{persona.archetype}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums">
                      <span
                        style={{ color: isDark ? meta.color : meta.textColor }}
                        className="font-semibold"
                      >
                        {meta.label} {dominant.value}%
                      </span>
                    </div>
                  </div>
                </button>

                {personas.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePersona(persona.id);
                    }}
                    aria-label={`Hapus persona ${persona.name}`}
                    className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--app-text-muted)] opacity-0 transition-opacity hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3 border-t border-[var(--app-border)] p-3.5">
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className="flex w-full min-h-[40px] items-center justify-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-alt)] px-3.5 py-2 text-xs font-semibold text-[var(--app-text)] transition-colors hover:border-indigo-400 whitespace-nowrap"
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          <span>Pengaturan</span>
        </button>
        <p className="px-1 text-[11px] leading-relaxed text-[var(--app-text-muted)]">
          Setiap respons menghitung ulang persentase enam emosi berdasarkan watak & intensitas percakapan.
        </p>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block h-full shrink-0">{content}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            aria-label="Tutup latar belakang menu"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1px]"
          />
          <div className="relative z-50 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
