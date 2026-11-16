import { useEffect, useMemo, useState } from 'react';
import { ChatWorkspace, type ChatMessage } from './components/ChatWorkspace';
import { EmotionCharts, type EmotionSnapshot } from './components/EmotionCharts';
import { EmotionTrainerPanel } from './components/EmotionTrainerPanel';
import { PersonaEditorModal } from './components/PersonaEditorModal';
import { PersonaSidebar } from './components/PersonaSidebar';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_PERSONAS } from './data/defaultPersonas';
import {
  applyEmotionTraining,
  ARCHETYPE_PRESETS,
  detectConversationIntensity,
  EMOTION_META,
  estimateLocalStimulus,
  getDominantEmotion,
  MBTI_OPTIONS,
  normalizeEmotions,
  selectKaomoji,
  type EmotionState,
  type Persona,
} from './lib/emotionEngine';
import {
  DEFAULT_APP_SETTINGS,
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  sanitizeAppSettings,
  THEME_OPTIONS,
  type AppSettings,
} from './lib/settings';

interface PersonaSessionState {
  messages: ChatMessage[];
  emotions: EmotionState;
  deltas: EmotionState | null;
  kaomoji: string;
  internalThought?: string;
  history: EmotionSnapshot[];
}

const STORAGE_PERSONAS = 'kanjou_personas_v1';
const STORAGE_ACTIVE_ID = 'kanjou_active_persona_v1';
const STORAGE_SESSIONS = 'kanjou_sessions_v1';
const STORAGE_SETTINGS = 'kanjou_settings_v1';

function createInitialSession(persona: Persona): PersonaSessionState {
  const normalized = normalizeEmotions(persona.baselineEmotions);
  const dominant = getDominantEmotion(normalized);
  const kaomoji = selectKaomoji(dominant.key, 0.45, persona.archetype, dominant.secondaryKey);
  return {
    messages: [],
    emotions: normalized,
    deltas: null,
    kaomoji,
    internalThought: `${persona.name} siap berinteraksi (${persona.mbti} · ${persona.archetype}).`,
    history: [
      {
        turn: 0,
        emotions: normalized,
        kaomoji,
        dominant: dominant.key,
      },
    ],
  };
}

function formatClock(): string {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function App() {
  const [personas, setPersonas] = useState<Persona[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PERSONAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PERSONAS;
  });

  const [activePersonaId, setActivePersonaId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_ID);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return DEFAULT_PERSONAS[0].id;
  });

  const [sessions, setSessions] = useState<Record<string, PersonaSessionState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS);
      if (saved) {
        return sanitizeAppSettings(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return DEFAULT_APP_SETTINGS;
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'chat' | 'telemetry'>('chat');
  const [inspectorTab, setInspectorTab] = useState<'training' | 'profile'>('training');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibrationNotice, setCalibrationNotice] = useState<string | null>(null);

  const isDark = useMemo(
    () => THEME_OPTIONS.find((t) => t.id === appSettings.theme)?.isDark ?? false,
    [appSettings.theme]
  );

  const activePersona = useMemo(
    () => personas.find((p) => p.id === activePersonaId) || personas[0],
    [personas, activePersonaId]
  );

  const activeSession = useMemo(() => {
    return sessions[activePersona.id] || createInitialSession(activePersona);
  }, [sessions, activePersona]);

  const emotionMap = useMemo(() => {
    const map: Record<string, EmotionState> = {};
    for (const p of personas) {
      map[p.id] = sessions[p.id]?.emotions || p.baselineEmotions;
    }
    return map;
  }, [personas, sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PERSONAS, JSON.stringify(personas));
    } catch {
      // ignore
    }
  }, [personas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_ID, activePersona.id);
    } catch {
      // ignore
    }
  }, [activePersona.id]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(appSettings));
    } catch {
      // ignore
    }

    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.setAttribute('data-theme', appSettings.theme);
    root.setAttribute('data-font', appSettings.font);

    const fontInfo = FONT_OPTIONS.find((f) => f.id === appSettings.font) || FONT_OPTIONS[0];
    const sizeInfo =
      FONT_SIZE_OPTIONS.find((s) => s.id === appSettings.fontSize) || FONT_SIZE_OPTIONS[1];

    root.style.setProperty('--font-body', fontInfo.cssFamily);
    root.style.setProperty('--app-font-size', `${sizeInfo.px}px`);
  }, [appSettings, isDark]);

  const updateSession = (personaId: string, updater: (prev: PersonaSessionState) => PersonaSessionState) => {
    const targetPersona = personas.find((p) => p.id === personaId) || activePersona;
    setSessions((prev) => {
      const current = prev[personaId] || createInitialSession(targetPersona);
      return {
        ...prev,
        [personaId]: updater(current),
      };
    });
  };

  const handleSendMessage = async (text: string) => {
    const persona = activePersona;
    const session = activeSession;
    const intensity = detectConversationIntensity(text);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: formatClock(),
      intensity,
    };

    const historyPayload = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    updateSession(persona.id, (prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
    }));

    setIsSending(true);
    setError(null);
    setCalibrationNotice(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          persona,
          currentEmotions: session.emotions,
          userPreferences: appSettings.user,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Gagal menghubungi server (${response.status}).`);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: formatClock(),
        kaomoji: data.kaomoji,
        emotions: data.emotions,
        deltas: data.deltas,
        dominant: data.dominant,
        internalThought: data.internalThought,
        triggeredRules: data.triggeredRules,
      };

      updateSession(persona.id, (prev) => ({
        ...prev,
        messages: [...prev.messages, aiMsg],
        emotions: data.emotions,
        deltas: data.deltas,
        kaomoji: data.kaomoji,
        internalThought: data.internalThought,
        history: [
          ...prev.history,
          {
            turn: prev.history.length,
            emotions: data.emotions,
            kaomoji: data.kaomoji,
            dominant: data.dominant,
          },
        ],
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.';
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateTraining = (training: Persona['training']) => {
    setPersonas((prev) =>
      prev.map((p) => (p.id === activePersona.id ? { ...p, training } : p))
    );
  };

  const handleRunCalibration = (sampleText: string) => {
    const stimulus = estimateLocalStimulus(sampleText, activePersona);
    const result = applyEmotionTraining(
      activeSession.emotions,
      stimulus,
      sampleText,
      activePersona
    );
    const domMeta = EMOTION_META[result.dominant];

    updateSession(activePersona.id, (prev) => ({
      ...prev,
      emotions: result.next,
      deltas: result.deltas,
      kaomoji: result.kaomoji,
      internalThought: `Kalibrasi intensitas ${result.intensity.level}: dominan ${domMeta.label} (${result.next[result.dominant]}%).`,
      history: [
        ...prev.history,
        {
          turn: prev.history.length,
          emotions: result.next,
          kaomoji: result.kaomoji,
          dominant: result.dominant,
        },
      ],
    }));

    setCalibrationNotice(
      `Simulasi intensitas ${result.intensity.level} (${Math.round(result.intensity.score * 100)}%) → ${domMeta.label} ${result.next[result.dominant]}% ${result.kaomoji}`
    );
  };

  const handleResetEmotionsAndChat = () => {
    setError(null);
    setCalibrationNotice(null);
    setSessions((prev) => ({
      ...prev,
      [activePersona.id]: createInitialSession(activePersona),
    }));
  };

  const handleResetEmotionsOnly = () => {
    const baseline = normalizeEmotions(activePersona.baselineEmotions);
    const dom = getDominantEmotion(baseline);
    const kaomoji = selectKaomoji(dom.key, 0.45, activePersona.archetype, dom.secondaryKey);
    updateSession(activePersona.id, (prev) => ({
      ...prev,
      emotions: baseline,
      deltas: null,
      kaomoji,
      internalThought: `Emosi dikembalikan ke komposisi dasar ${activePersona.archetype}.`,
      history: [
        ...prev.history,
        {
          turn: prev.history.length,
          emotions: baseline,
          kaomoji,
          dominant: dom.key,
        },
      ],
    }));
    setCalibrationNotice('Emosi direset ke kondisi dasar persona.');
  };

  const handleSavePersona = (saved: Persona) => {
    const exists = personas.some((p) => p.id === saved.id);
    if (exists) {
      setPersonas((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      updateSession(saved.id, (prev) => {
        const dom = getDominantEmotion(prev.emotions);
        return {
          ...prev,
          kaomoji: selectKaomoji(dom.key, 0.5, saved.archetype, dom.secondaryKey),
        };
      });
    } else {
      setPersonas((prev) => [...prev, saved]);
      setActivePersonaId(saved.id);
      setSessions((prev) => ({
        ...prev,
        [saved.id]: createInitialSession(saved),
      }));
    }
    setEditorOpen(false);
    setEditingPersona(null);
  };

  const handleDeletePersona = (id: string) => {
    if (personas.length <= 1) return;
    const remaining = personas.filter((p) => p.id !== id);
    setPersonas(remaining);
    if (activePersona.id === id) {
      setActivePersonaId(remaining[0].id);
    }
  };

  const mbtiInfo = MBTI_OPTIONS.find((m) => m.code === activePersona.mbti);

  const telemetryContent = (
    <div className="space-y-5 p-5">
      <EmotionCharts
        emotions={activeSession.emotions}
        deltas={activeSession.deltas}
        kaomoji={activeSession.kaomoji}
        archetype={activePersona.archetype}
        internalThought={activeSession.internalThought}
        history={activeSession.history}
        isDark={isDark}
      />

      {calibrationNotice && (
        <div
          role="status"
          className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/50 px-3.5 py-2.5 text-xs font-medium text-indigo-900 dark:text-indigo-200"
        >
          {calibrationNotice}
        </div>
      )}

      {/* Switcher: Latihan Emosi vs Profil Watak */}
      <div className="border-t border-[var(--app-border)] pt-4">
        <div
          role="tablist"
          aria-label="Panel konfigurasi emosi dan watak"
          className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-[var(--app-surface-alt)] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inspectorTab === 'training'}
            onClick={() => setInspectorTab('training')}
            className={`min-h-[36px] rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              inspectorTab === 'training'
                ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-xs'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            Latihan Emosi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inspectorTab === 'profile'}
            onClick={() => setInspectorTab('profile')}
            className={`min-h-[36px] rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              inspectorTab === 'profile'
                ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-xs'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            Identitas & Watak
          </button>
        </div>

        {inspectorTab === 'training' ? (
          <EmotionTrainerPanel
            persona={activePersona}
            onUpdateTraining={handleUpdateTraining}
            onRunCalibration={handleRunCalibration}
            onResetEmotions={handleResetEmotionsOnly}
          />
        ) : (
          <div className="space-y-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
            <div>
              <div className="text-xs font-medium text-[var(--app-text-muted)]">Identitas & Peran</div>
              <div className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                {activePersona.name} · {activePersona.roleTitle}
              </div>
              {activePersona.sourceCategory && (
                <div className="mt-1 text-xs font-medium text-indigo-700 dark:text-indigo-400">
                  Kategori: {activePersona.sourceCategory}
                </div>
              )}
            </div>

            <div className="border-t border-[var(--app-border-soft)] pt-3">
              <div className="text-xs font-medium text-[var(--app-text-muted)]">Tipe MBTI</div>
              <div className="mt-1 text-xs text-[var(--app-text)]">
                <span className="font-mono font-semibold text-[var(--app-text)]">
                  {activePersona.mbti}
                </span>{' '}
                — {mbtiInfo?.summary}
              </div>
            </div>

            <div className="border-t border-[var(--app-border-soft)] pt-3">
              <div className="text-xs font-medium text-[var(--app-text-muted)]">Arketipe Watak</div>
              <div className="mt-1 text-xs leading-relaxed text-[var(--app-text)]">
                <span className="font-semibold text-[var(--app-text)]">{activePersona.archetype}:</span>{' '}
                {ARCHETYPE_PRESETS[activePersona.archetype].description}
              </div>
            </div>

            <div className="border-t border-[var(--app-border-soft)] pt-3">
              <div className="text-xs font-medium text-[var(--app-text-muted)]">Kepribadian Dasar</div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--app-text)] opacity-90">
                {activePersona.basePersonality}
              </p>
            </div>

            <div className="border-t border-[var(--app-border-soft)] pt-3">
              <div className="text-xs font-medium text-[var(--app-text-muted)]">Gaya Bicara</div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--app-text)] opacity-90">
                {activePersona.speakingStyle}
              </p>
            </div>

            {activePersona.webSources && activePersona.webSources.length > 0 && (
              <div className="border-t border-[var(--app-border-soft)] pt-3">
                <div className="text-xs font-medium text-[var(--app-text-muted)]">
                  Sumber Referensi Web
                </div>
                <ul className="mt-1.5 space-y-1">
                  {activePersona.webSources.map((src, idx) => (
                    <li key={idx}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-xs font-medium text-indigo-700 dark:text-indigo-400 hover:underline"
                      >
                        {src.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingPersona(activePersona);
                setEditorOpen(true);
              }}
              className="w-full min-h-[40px] rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-alt)] px-4 py-2 text-xs font-medium text-[var(--app-text)] hover:border-indigo-400 whitespace-nowrap"
            >
              Ubah Identitas, Foto & Watak
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
      {/* Left Sidebar: Persona Roster */}
      <PersonaSidebar
        personas={personas}
        activePersonaId={activePersona.id}
        emotionMap={emotionMap}
        onSelectPersona={(id) => {
          setActivePersonaId(id);
          setError(null);
          setCalibrationNotice(null);
        }}
        onCreatePersona={() => {
          setEditingPersona(null);
          setEditorOpen(true);
        }}
        onDeletePersona={handleDeletePersona}
        onOpenSettings={() => setSettingsOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isDark={isDark}
      />

      {/* Center: Chat Harness */}
      <ChatWorkspace
        persona={activePersona}
        messages={activeSession.messages}
        currentEmotions={activeSession.emotions}
        currentKaomoji={activeSession.kaomoji}
        isSending={isSending}
        error={error}
        onDismissError={() => setError(null)}
        onSendMessage={handleSendMessage}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onEditPersona={() => {
          setEditingPersona(activePersona);
          setEditorOpen(true);
        }}
        onResetChat={handleResetEmotionsAndChat}
        mobileView={mobileView}
        onChangeMobileView={setMobileView}
        mobileTelemetrySlot={telemetryContent}
        isDark={isDark}
        userPreferences={{
          userName: appSettings.user.userName,
          relationship: appSettings.user.relationship,
        }}
      />

      {/* Desktop Right Inspector: Emotion Telemetry + Training Lab */}
      <aside
        aria-label="Monitor Emosi dan Pelatihan Intensitas"
        className="hidden h-full w-[400px] shrink-0 flex-col overflow-y-auto border-l border-[var(--app-border)] bg-[var(--app-surface)] xl:flex"
      >
        {telemetryContent}
      </aside>

      {/* Modal Editor Persona */}
      <PersonaEditorModal
        open={editorOpen}
        initialPersona={editingPersona}
        onClose={() => {
          setEditorOpen(false);
          setEditingPersona(null);
        }}
        onSave={handleSavePersona}
      />

      {/* Modal Pengaturan Aplikasi & Preferensi User */}
      <SettingsModal
        open={settingsOpen}
        settings={appSettings}
        onChange={setAppSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
