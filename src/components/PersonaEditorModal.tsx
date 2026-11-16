import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Globe, ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import {
  ARCHETYPE_PRESETS,
  EMOTION_META,
  EMOTION_ORDER,
  MBTI_OPTIONS,
  normalizeEmotions,
  type AnalyzedPersonaDraft,
  type Archetype,
  type EmotionState,
  type MBTIType,
  type Persona,
  type TrainingRule,
  type WebSourceRef,
} from '../lib/emotionEngine';
import { PRESET_AVATARS } from '../lib/settings';
import { PersonaAvatar } from './PersonaAvatar';

interface PersonaEditorModalProps {
  open: boolean;
  initialPersona: Persona | null; // null = create new
  onClose: () => void;
  onSave: (persona: Persona) => void;
}

type ResearchCategory = 'otomatis' | 'sejarah' | 'publik_figur' | 'fiksi_film_game';

const ARCHETYPES = Object.keys(ARCHETYPE_PRESETS) as Archetype[];

const CATEGORY_OPTIONS: { id: ResearchCategory; label: string }[] = [
  { id: 'otomatis', label: 'Otomatis' },
  { id: 'sejarah', label: 'Tokoh Sejarah' },
  { id: 'publik_figur', label: 'Publik Figur' },
  { id: 'fiksi_film_game', label: 'Film & Game' },
];

const SAMPLE_CHARACTERS: { name: string; category: ResearchCategory }[] = [
  { name: 'B.J. Habibie', category: 'sejarah' },
  { name: 'Nikola Tesla', category: 'sejarah' },
  { name: 'Sherlock Holmes', category: 'fiksi_film_game' },
  { name: 'Geralt of Rivia', category: 'fiksi_film_game' },
];

export function PersonaEditorModal({
  open,
  initialPersona,
  onClose,
  onSave,
}: PersonaEditorModalProps) {
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [mbti, setMbti] = useState<MBTIType>('INTJ');
  const [archetype, setArchetype] = useState<Archetype>('Tsundere');
  const [basePersonality, setBasePersonality] = useState('');
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [rawBaseline, setRawBaseline] = useState<EmotionState>(ARCHETYPE_PRESETS.Tsundere.baseline);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web character research state
  const [queryName, setQueryName] = useState('');
  const [researchCategory, setResearchCategory] = useState<ResearchCategory>('otomatis');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [webSummary, setWebSummary] = useState('');
  const [sourceCategory, setSourceCategory] = useState<string | undefined>(undefined);
  const [webSources, setWebSources] = useState<WebSourceRef[]>([]);
  const [analyzedReactivity, setAnalyzedReactivity] = useState<number | null>(null);
  const [analyzedInertia, setAnalyzedInertia] = useState<number | null>(null);
  const [analyzedRules, setAnalyzedRules] = useState<TrainingRule[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setPhotoError('');
    setAnalyzeError('');
    setIsAnalyzing(false);
    if (initialPersona) {
      setName(initialPersona.name);
      setRoleTitle(initialPersona.roleTitle);
      setMbti(initialPersona.mbti);
      setArchetype(initialPersona.archetype);
      setBasePersonality(initialPersona.basePersonality);
      setSpeakingStyle(initialPersona.speakingStyle);
      setAvatarUrl(initialPersona.avatarUrl || '');
      setRawBaseline({ ...initialPersona.baselineEmotions });
      setQueryName(initialPersona.name);
      setSourceCategory(initialPersona.sourceCategory);
      setWebSources(initialPersona.webSources || []);
      setWebSummary('');
      setAnalyzedReactivity(null);
      setAnalyzedInertia(null);
      setAnalyzedRules(null);
    } else {
      const preset = ARCHETYPE_PRESETS.Tsundere;
      setName('');
      setRoleTitle('Rekan Diskusi Kognitif');
      setMbti('INTJ');
      setArchetype('Tsundere');
      setBasePersonality(preset.description);
      setSpeakingStyle(preset.speakingHint);
      setAvatarUrl('');
      setRawBaseline({ ...preset.baseline });
      setQueryName('');
      setResearchCategory('otomatis');
      setSourceCategory(undefined);
      setWebSources([]);
      setWebSummary('');
      setAnalyzedReactivity(null);
      setAnalyzedInertia(null);
      setAnalyzedRules(null);
    }
  }, [open, initialPersona]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const applyArchetypePreset = (selected: Archetype) => {
    setArchetype(selected);
    const preset = ARCHETYPE_PRESETS[selected];
    setRawBaseline({ ...preset.baseline });
    if (!initialPersona || !basePersonality.trim()) {
      setBasePersonality(preset.description);
      setSpeakingStyle(preset.speakingHint);
    }
  };

  const handleAnalyzeFromWeb = async (overrideName?: string, overrideCat?: ResearchCategory) => {
    const targetName = (overrideName ?? queryName).trim();
    const targetCat = overrideCat ?? researchCategory;
    if (targetName.length < 2) {
      setAnalyzeError('Ketik nama tokoh atau karakter minimal 2 huruf untuk dianalisa.');
      return;
    }

    setQueryName(targetName);
    setResearchCategory(targetCat);
    setAnalyzeError('');
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/persona/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: targetName,
          category: targetCat,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Gagal menganalisa tokoh (${res.status}).`);
      }

      const draft = data.draft as AnalyzedPersonaDraft;
      const sources = Array.isArray(data.sources) ? (data.sources as WebSourceRef[]) : [];

      setName(draft.name);
      setRoleTitle(draft.roleTitle);
      setMbti(draft.mbti);
      setArchetype(draft.archetype);
      setBasePersonality(draft.basePersonality);
      setSpeakingStyle(draft.speakingStyle);
      setRawBaseline(draft.baselineEmotions);
      setSourceCategory(draft.sourceCategory);
      setWebSummary(draft.webSummary);
      setWebSources(sources);
      setAnalyzedReactivity(draft.reactivity);
      setAnalyzedInertia(draft.inertia);
      setAnalyzedRules(draft.suggestedRules);
      setError('');
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : 'Gagal menghubungi layanan analisa web.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Pilih file gambar (JPG, PNG, atau WebP).');
      return;
    }
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawUrl) return;
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setAvatarUrl(rawUrl);
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => setPhotoError('File gambar tidak dapat dibaca.');
      img.src = rawUrl;
    };
    reader.onerror = () => setPhotoError('Gagal membaca file gambar.');
    reader.readAsDataURL(file);
  };

  const normalizedPreview = normalizeEmotions(rawBaseline);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama persona wajib diisi.');
      return;
    }
    if (!basePersonality.trim()) {
      setError('Deskripsi sifat dasar & kepribadian wajib diisi.');
      return;
    }

    const preset = ARCHETYPE_PRESETS[archetype];
    const cleanedAvatar = avatarUrl.trim();
    const personaToSave: Persona = {
      id: initialPersona ? initialPersona.id : `persona-${Date.now()}`,
      name: name.trim(),
      roleTitle: roleTitle.trim() || `${mbti} · ${archetype}`,
      mbti,
      archetype,
      basePersonality: basePersonality.trim(),
      speakingStyle: speakingStyle.trim() || preset.speakingHint,
      avatarUrl: cleanedAvatar || undefined,
      sourceCategory,
      webSources: webSources.length > 0 ? webSources : undefined,
      baselineEmotions: normalizedPreview,
      training: initialPersona
        ? {
            ...initialPersona.training,
            reactivity: analyzedReactivity ?? initialPersona.training.reactivity,
            inertia: analyzedInertia ?? initialPersona.training.inertia,
            rules:
              analyzedRules && analyzedRules.length > 0
                ? analyzedRules
                : initialPersona.training.rules,
          }
        : {
            reactivity: analyzedReactivity ?? preset.reactivity,
            inertia: analyzedInertia ?? preset.inertia,
            intensityBias: {
              rendah: 0.65,
              sedang: 1.0,
              tinggi: 1.45,
              ekstrem: 1.85,
            },
            rules: analyzedRules || [],
          },
    };

    onSave(personaToSave);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
          <h2 id="persona-modal-title" className="font-display text-lg font-bold">
            {initialPersona ? `Edit Persona: ${initialPersona.name}` : 'Buat Persona AI Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup editor persona"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-surface-alt)] hover:text-[var(--app-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Riset Karakter dari Web */}
            <section
              aria-label="Riset Tokoh dari Web"
              className="space-y-3 rounded-xl border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/30 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                  <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Analisa Tokoh Sejarah, Publik Figur, atau Karakter Fiksi dari Web</span>
                </div>
              </div>

              <div
                role="tablist"
                aria-label="Kategori tokoh untuk riset web"
                className="flex flex-wrap gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="tab"
                    aria-selected={researchCategory === opt.id}
                    onClick={() => setResearchCategory(opt.id)}
                    className={`flex-1 min-h-[32px] rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      researchCategory === opt.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAnalyzeFromWeb();
                    }
                  }}
                  aria-label="Nama tokoh untuk analisa web"
                  placeholder="Ketik nama tokoh (mis. Nikola Tesla, B.J. Habibie, Sherlock Holmes, Kratos)"
                  className="min-w-0 flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleAnalyzeFromWeb()}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menganalisa...</span>
                    </>
                  ) : (
                    <span>Analisa dari Web</span>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--app-text-muted)]">
                <span>Contoh cepat:</span>
                {SAMPLE_CHARACTERS.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => handleAnalyzeFromWeb(sample.name, sample.category)}
                    className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1 text-[11px] font-medium text-[var(--app-text)] hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-50"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>

              {analyzeError && (
                <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                  {analyzeError}
                </div>
              )}

              {(webSummary || webSources.length > 0) && (
                <div className="space-y-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-xs text-[var(--app-text)]">
                  {sourceCategory && (
                    <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                      Hasil Analisa Web · {sourceCategory}
                      {analyzedRules && analyzedRules.length > 0
                        ? ` · ${analyzedRules.length} aturan pemicu emosi siap diterapkan`
                        : ''}
                    </div>
                  )}
                  {webSummary && (
                    <p className="leading-relaxed text-[var(--app-text-muted)]">{webSummary}</p>
                  )}
                  {webSources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--app-border-soft)] pt-2 text-[11px]">
                      <span className="font-medium text-[var(--app-text-muted)]">Sumber web:</span>
                      {webSources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-indigo-700 dark:text-indigo-300 hover:underline max-w-[200px] truncate"
                        >
                          <span className="truncate">{src.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Foto Profil Persona */}
            <section
              aria-label="Foto profil persona"
              className="space-y-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold">Foto Profil Persona</span>
                <span className="text-[11px] text-[var(--app-text-muted)]">
                  Unggah gambar, pilih potret bawaan, atau tempel URL
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <PersonaAvatar name={name || 'AI'} avatarUrl={avatarUrl || undefined} size="lg" />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      aria-label="Unggah file foto profil persona"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-medium text-[var(--app-text)] hover:border-indigo-400 whitespace-nowrap"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span>Unggah Foto</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:border-rose-400 whitespace-nowrap"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      {PRESET_AVATARS.map((presetAv) => {
                        const selected = avatarUrl === presetAv.url;
                        return (
                          <button
                            key={presetAv.url}
                            type="button"
                            title={`Gunakan potret ${presetAv.label}`}
                            aria-label={`Pilih foto bawaan ${presetAv.label}`}
                            onClick={() => {
                              setPhotoError('');
                              setAvatarUrl(presetAv.url);
                            }}
                            className={`h-9 w-9 overflow-hidden rounded-lg border transition-all ${
                              selected
                                ? 'border-indigo-600 ring-2 ring-indigo-500/40'
                                : 'border-[var(--app-border)] opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={presetAv.url}
                              alt={presetAv.label}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <input
                    id="persona-avatar-url"
                    type="text"
                    value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                    onChange={(e) => {
                      setPhotoError('');
                      setAvatarUrl(e.target.value);
                    }}
                    aria-label="URL foto profil persona"
                    placeholder={
                      avatarUrl.startsWith('data:')
                        ? 'Foto lokal terunggah (atau tempel URL baru untuk mengganti)'
                        : 'Atau tempel URL gambar (https://...)'
                    }
                    className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-indigo-500 focus:outline-none"
                  />

                  {photoError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{photoError}</p>
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="persona-name" className="block text-xs font-semibold">
                  Nama Persona
                </label>
                <input
                  id="persona-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Akira Mizuno"
                  className="mt-1.5 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="persona-role" className="block text-xs font-semibold">
                  Identitas / Peran
                </label>
                <input
                  id="persona-role"
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Contoh: Pengarsip Memori · Analis"
                  className="mt-1.5 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="persona-mbti" className="block text-xs font-semibold">
                  Tipe MBTI
                </label>
                <select
                  id="persona-mbti"
                  value={mbti}
                  onChange={(e) => setMbti(e.target.value as MBTIType)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] focus:border-indigo-500 focus:outline-none"
                >
                  {MBTI_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.code} — {opt.summary}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="persona-archetype" className="block text-xs font-semibold">
                  Arketipe Watak
                </label>
                <select
                  id="persona-archetype"
                  value={archetype}
                  onChange={(e) => applyArchetypePreset(e.target.value as Archetype)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] focus:border-indigo-500 focus:outline-none"
                >
                  {ARCHETYPES.map((arch) => (
                    <option key={arch} value={arch}>
                      {arch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-[var(--app-surface-alt)] p-3 text-xs text-[var(--app-text-muted)]">
              <span className="font-semibold text-[var(--app-text)]">{archetype}:</span>{' '}
              {ARCHETYPE_PRESETS[archetype].description}
            </div>

            <div>
              <label htmlFor="persona-traits" className="block text-xs font-semibold">
                Sifat Dasar & Kepribadian
              </label>
              <textarea
                id="persona-traits"
                rows={3}
                value={basePersonality}
                onChange={(e) => setBasePersonality(e.target.value)}
                placeholder="Jelaskan watak inti, cara ia menilai situasi, dan kerentanan emosionalnya..."
                className="mt-1.5 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="persona-style" className="block text-xs font-semibold">
                Gaya Bicara & Kebiasaan Ekspresi
              </label>
              <textarea
                id="persona-style"
                rows={2}
                value={speakingStyle}
                onChange={(e) => setSpeakingStyle(e.target.value)}
                placeholder="Contoh: Kalimat singkat dan logis, atau sesekali gagap saat tersipu..."
                className="mt-1.5 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-3 border-t border-[var(--app-border)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">
                  Emosi Dasar (Otomatis dinormalisasi ke 100%)
                </span>
                <button
                  type="button"
                  onClick={() => setRawBaseline({ ...ARCHETYPE_PRESETS[archetype].baseline })}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Gunakan Default {archetype}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {EMOTION_ORDER.map((key) => {
                  const meta = EMOTION_META[key];
                  return (
                    <div key={key} className="rounded-lg bg-[var(--app-surface-alt)] p-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor={`base-${key}`} className="font-medium text-[var(--app-text)]">
                          {meta.label}
                        </label>
                        <span className="font-mono font-semibold tabular-nums">
                          {normalizedPreview[key]}%
                        </span>
                      </div>
                      <input
                        id={`base-${key}`}
                        type="range"
                        min={0}
                        max={100}
                        value={rawBaseline[key]}
                        onChange={(e) =>
                          setRawBaseline((prev) => ({
                            ...prev,
                            [key]: Number(e.target.value),
                          }))
                        }
                        className="mt-1.5 w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-text)] hover:bg-[var(--app-surface-alt)] whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[40px] rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 whitespace-nowrap"
            >
              {initialPersona ? 'Simpan Perubahan' : 'Terapkan Persona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
