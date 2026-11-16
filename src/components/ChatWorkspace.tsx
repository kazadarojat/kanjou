import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  Edit3,
  Menu,
  RotateCcw,
  Send,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import {
  detectConversationIntensity,
  EMOTION_META,
  EMOTION_ORDER,
  getDominantEmotion,
  type Archetype,
  type EmotionKey,
  type EmotionState,
  type IntensityAnalysis,
  type Persona,
} from '../lib/emotionEngine';
import { InteractiveKaomoji } from './InteractiveKaomoji';
import { PersonaAvatar } from './PersonaAvatar';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  kaomoji?: string;
  emotions?: EmotionState;
  deltas?: EmotionState;
  dominant?: EmotionKey;
  internalThought?: string;
  intensity?: IntensityAnalysis;
  triggeredRules?: string[];
}

interface ChatWorkspaceProps {
  persona: Persona;
  messages: ChatMessage[];
  currentEmotions: EmotionState;
  currentKaomoji: string;
  isSending: boolean;
  error: string | null;
  onDismissError: () => void;
  onSendMessage: (text: string) => void;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onEditPersona: () => void;
  onResetChat: () => void;
  mobileView: 'chat' | 'telemetry';
  onChangeMobileView: (view: 'chat' | 'telemetry') => void;
  mobileTelemetrySlot?: ReactNode;
  isDark?: boolean;
  userPreferences?: {
    userName: string;
    relationship: string;
  };
}

const ARCHETYPE_STARTERS: Record<Archetype, string[]> = {
  Tsundere: [
    'Kamu hebat banget hari ini, makasih ya sudah bantu!',
    'Aku bingung nih sama masalah ini, jelaskan pelan-pelan dong.',
    'Kayaknya idemu tadi kurang tepat deh, coba pikir ulang!',
  ],
  Yandere: [
    'Maaf baru balas, aku seharian ngobrol sama teman lama.',
    'Aku paling nyaman cerita cuma sama kamu kok.',
    'Kamu selalu memperhatikan hal kecil ya, makasih sudah peduli.',
  ],
  Kuudere: [
    'Bagaimana analisismu tentang keputusan paling rasional hari ini?',
    'Kenapa manusia sering membuat keputusan yang penuh drama?',
    'Terima kasih, penjelasanmu sangat ringkas dan membantu.',
  ],
  Dandere: [
    'Hai, maaf kalau tiba-tiba mengganggu, kamu lagi sibuk?',
    'Pendapatmu kemarin sebenarnya keren banget lho!',
    'Pelan-pelan saja ceritanya, aku siap mendengarkan.',
  ],
  Genki: [
    'Ayo kita buat proyek baru yang seru hari ini!!',
    'Aku lagi kurang bersemangat nih, punya ide biar ceria lagi?',
    'Keren banget sih energi kamu hari ini!',
  ],
  Stoik: [
    'Bagaimana cara tetap tenang saat situasi di luar kendali?',
    'Hari ini semuanya terasa berantakan dan bikin kesal!',
    'Menurutmu apa hal paling penting untuk difokuskan sekarang?',
  ],
  Melankolis: [
    'Pernah merasa hari berjalan cepat tapi rasanya hampa?',
    'Terima kasih sudah mau mendengarkan tanpa menghakimi.',
    'Kenangan mana yang menurutmu paling sulit dilupakan?',
  ],
  Kustom: [
    'Halo, ceritakan sedikit tentang dirimu dan cara pandangmu!',
    'Hari ini aku punya kabar yang sangat mengejutkan!!',
    'Menurutmu apa reaksi terbaik saat menghadapi kritik tajam?',
  ],
};

export function ChatWorkspace({
  persona,
  messages,
  currentEmotions,
  currentKaomoji,
  isSending,
  error,
  onDismissError,
  onSendMessage,
  onOpenSidebar,
  onOpenSettings,
  onEditPersona,
  onResetChat,
  mobileView,
  onChangeMobileView,
  mobileTelemetrySlot,
  isDark = false,
  userPreferences,
}: ChatWorkspaceProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const liveIntensity = useMemo(() => detectConversationIntensity(input), [input]);
  const dominant = getDominantEmotion(currentEmotions);
  const dominantMeta = EMOTION_META[dominant.key];
  const starters = ARCHETYPE_STARTERS[persona.archetype] || ARCHETYPE_STARTERS.Kustom;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getEmotionLabelColor = (key: EmotionKey) =>
    isDark ? EMOTION_META[key].color : EMOTION_META[key].textColor;

  const hasUserContext =
    Boolean(userPreferences?.userName?.trim()) || Boolean(userPreferences?.relationship?.trim());

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-[var(--app-bg)] text-[var(--app-text)]">
      {/* Header Workspace */}
      <header className="flex items-center justify-between gap-4 border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Buka daftar persona"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] text-[var(--app-text)] hover:bg-[var(--app-surface-alt)] lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <PersonaAvatar name={persona.name} avatarUrl={persona.avatarUrl} size="md" />

          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="truncate font-display text-base font-bold text-[var(--app-text)] sm:text-lg">
                {persona.name}
              </h1>
              <InteractiveKaomoji
                variant="inline"
                kaomoji={currentKaomoji}
                dominant={dominant.key}
                archetype={persona.archetype}
                isDark={isDark}
                className="hidden sm:inline-flex"
              />
            </div>
            <div className="flex items-center gap-1.5 truncate text-xs text-[var(--app-text-muted)]">
              <span className="font-mono font-medium text-[var(--app-text)]">{persona.mbti}</span>
              <span aria-hidden="true">·</span>
              <span>{persona.archetype}</span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span
                style={{ color: getEmotionLabelColor(dominant.key) }}
                className="hidden font-semibold tabular-nums sm:inline"
              >
                {dominantMeta.label} {dominant.value}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEditPersona}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-alt)] whitespace-nowrap shrink-0"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit Persona</span>
            <span className="sm:hidden">Edit</span>
          </button>
          <button
            type="button"
            onClick={onResetChat}
            aria-label="Reset obrolan dan emosi"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-alt)] whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Buka pengaturan"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-alt)] lg:hidden whitespace-nowrap shrink-0"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher (Obrolan vs Grafik & Latihan) */}
      <div className="flex border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 xl:hidden">
        <div
          role="tablist"
          aria-label="Navigasi tampilan mobile"
          className="grid w-full grid-cols-2 gap-1 rounded-lg bg-[var(--app-surface-alt)] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === 'chat'}
            onClick={() => onChangeMobileView('chat')}
            className={`min-h-[36px] rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              mobileView === 'chat'
                ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-xs'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            Obrolan
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === 'telemetry'}
            onClick={() => onChangeMobileView('telemetry')}
            className={`inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              mobileView === 'telemetry'
                ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-xs'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Grafik & Latihan</span>
          </button>
        </div>
      </div>

      {/* Mobile Telemetry View */}
      {mobileView === 'telemetry' && mobileTelemetrySlot && (
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--app-surface)] xl:hidden">
          {mobileTelemetrySlot}
        </div>
      )}

      {/* Chat Content Container */}
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          mobileView === 'telemetry' ? 'hidden xl:flex' : 'flex'
        }`}
      >
        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <PersonaAvatar name={persona.name} avatarUrl={persona.avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-lg font-bold text-[var(--app-text)]">
                        {persona.name}
                      </h2>
                      <InteractiveKaomoji
                        variant="inline"
                        kaomoji={currentKaomoji}
                        dominant={dominant.key}
                        archetype={persona.archetype}
                        isDark={isDark}
                      />
                    </div>
                    <div className="mt-1 text-xs text-[var(--app-text-muted)]">
                      {persona.roleTitle} · {persona.mbti} · {persona.archetype}
                    </div>
                    {hasUserContext && (
                      <div className="mt-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {userPreferences?.userName?.trim()
                          ? `Menyapa ${userPreferences.userName.trim()}`
                          : 'Konteks Sapaan'}
                        {userPreferences?.relationship?.trim()
                          ? ` · Hubungan: ${userPreferences.relationship.trim()}`
                          : ''}
                      </div>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-[var(--app-text)] opacity-90">
                      {persona.basePersonality}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-[var(--app-border-soft)] pt-4">
                  <div className="mb-2.5 text-xs font-medium text-[var(--app-text-muted)]">
                    Mulai percakapan untuk mengamati perubahan emosi:
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {starters.map((promptText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSendMessage(promptText)}
                        className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] px-3.5 py-2.5 text-left text-xs font-medium text-[var(--app-text)] transition-colors hover:border-indigo-400"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-slate-900 dark:bg-indigo-600 px-4 py-3 text-sm leading-relaxed text-white sm:max-w-[75%]">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className="mt-1.5 flex items-center justify-end gap-2 text-[11px] text-slate-300 dark:text-indigo-100 tabular-nums">
                          {msg.intensity && (
                            <span className="capitalize">Intensitas {msg.intensity.level}</span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                const msgDomKey = msg.dominant || dominant.key;
                const msgDomMeta = EMOTION_META[msgDomKey];
                const msgDomVal =
                  msg.emotions && msg.dominant ? msg.emotions[msg.dominant] : dominant.value;

                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <PersonaAvatar
                      name={persona.name}
                      avatarUrl={persona.avatarUrl}
                      size="sm"
                      className="mt-0.5"
                    />
                    <div className="min-w-0 max-w-[88%] flex-1 rounded-2xl rounded-tl-sm border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3.5 sm:max-w-[82%]">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--app-border-soft)] pb-2">
                        <div className="flex items-center gap-2.5">
                          <InteractiveKaomoji
                            variant="inline"
                            kaomoji={msg.kaomoji || currentKaomoji}
                            dominant={msgDomKey}
                            archetype={persona.archetype}
                            isDark={isDark}
                          />
                          <span
                            style={{ color: getEmotionLabelColor(msgDomKey) }}
                            className="text-xs font-semibold tabular-nums"
                          >
                            {msgDomMeta.label} {msgDomVal}%
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--app-text-muted)] tabular-nums">
                          {msg.timestamp}
                        </span>
                      </div>

                      <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-text)]">
                        {msg.content}
                      </p>

                      {msg.internalThought && (
                        <p className="mt-2.5 text-xs italic leading-relaxed text-[var(--app-text-muted)]">
                          Batin: “{msg.internalThought}”
                        </p>
                      )}

                      {msg.emotions && (
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--app-border-soft)] pt-2 text-[11px] text-[var(--app-text-muted)] font-mono tabular-nums">
                          {EMOTION_ORDER.map((k) => {
                            const delta = msg.deltas ? msg.deltas[k] : 0;
                            return (
                              <span key={k}>
                                <span
                                  style={{ color: getEmotionLabelColor(k) }}
                                  className="font-semibold"
                                >
                                  {EMOTION_META[k].label}
                                </span>{' '}
                                {msg.emotions![k]}%
                                {delta !== 0 && (
                                  <span
                                    className={
                                      delta > 0
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-rose-700 dark:text-rose-400'
                                    }
                                  >
                                    ({delta > 0 ? `+${delta}` : delta})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {msg.triggeredRules && msg.triggeredRules.length > 0 && (
                        <div className="mt-1.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-400">
                          Aturan terpicu: {msg.triggeredRules.join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex items-start gap-3">
                <PersonaAvatar name={persona.name} avatarUrl={persona.avatarUrl} size="sm" />
                <div className="rounded-2xl rounded-tl-sm border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-xs text-[var(--app-text-muted)]">
                  {persona.name} sedang memproses reaksi emosional...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-auto mb-2 w-full max-w-3xl px-4 sm:px-6">
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/50 px-4 py-2.5 text-xs text-rose-800 dark:text-rose-200"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={onDismissError}
                className="font-semibold text-rose-700 dark:text-rose-300 hover:underline whitespace-nowrap shrink-0"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* Message Composer */}
        <div className="border-t border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 sm:px-6">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[var(--app-text-muted)]">
              <div className="flex items-center gap-2">
                <span>Deteksi Intensitas Pesan:</span>
                <span className="font-mono font-semibold capitalize text-[var(--app-text)] tabular-nums">
                  {liveIntensity.level} ({Math.round(liveIntensity.score * 100)}%)
                </span>
              </div>
              <span className="hidden truncate sm:inline">{liveIntensity.signals[0]}</span>
            </div>

            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label={`Kirim pesan ke ${persona.name}`}
                placeholder={`Tulis pesan untuk ${persona.name}... (Enter untuk kirim)`}
                className="min-h-[48px] max-h-36 flex-1 resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] px-3.5 py-2.5 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-indigo-500 focus:bg-[var(--app-surface)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label="Kirim pesan"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
              >
                <Send className="h-4 w-4" />
                <span>Kirim</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
