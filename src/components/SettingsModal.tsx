import { useEffect, useState } from 'react';
import { Palette, RotateCcw, User, X } from 'lucide-react';
import {
  DEFAULT_APP_SETTINGS,
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  RELATIONSHIP_PRESETS,
  THEME_OPTIONS,
  type AppSettings,
} from '../lib/settings';

interface SettingsModalProps {
  open: boolean;
  settings: AppSettings;
  onChange: (next: AppSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ open, settings, onChange, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'user' | 'appearance'>('user');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const updateUser = (patch: Partial<AppSettings['user']>) => {
    onChange({
      ...settings,
      user: {
        ...settings.user,
        ...patch,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
          <h2 id="settings-modal-title" className="font-display text-lg font-bold">
            Pengaturan Aplikasi & Preferensi
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-surface-alt)] hover:text-[var(--app-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-[var(--app-border)] px-6 py-3">
          <div
            role="tablist"
            aria-label="Kategori pengaturan"
            className="grid grid-cols-2 gap-1 rounded-lg bg-[var(--app-surface-alt)] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'user'}
              onClick={() => setActiveTab('user')}
              className={`inline-flex min-h-[38px] items-center justify-center gap-2 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'user'
                  ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-xs'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
              }`}
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>Preferensi User</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'appearance'}
              onClick={() => setActiveTab('appearance')}
              className={`inline-flex min-h-[38px] items-center justify-center gap-2 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'appearance'
                  ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-xs'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
              }`}
            >
              <Palette className="h-3.5 w-3.5 shrink-0" />
              <span>Tampilan & Huruf</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {activeTab === 'user' ? (
            <div className="space-y-5">
              <p className="text-xs leading-relaxed text-[var(--app-text-muted)]">
                Informasi ini disertakan dalam konteks percakapan sehingga setiap persona mengenali nama panggilan Anda dan menyesuaikan sikap sesuai hubungan yang dipilih.
              </p>

              <div>
                <label htmlFor="settings-user-name" className="block text-xs font-semibold">
                  Nama Anda
                </label>
                <input
                  id="settings-user-name"
                  type="text"
                  value={settings.user.userName}
                  onChange={(e) => updateUser({ userName: e.target.value })}
                  placeholder="Contoh: Fahmi (kosongkan jika tidak ingin disebut)"
                  className="mt-1.5 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2.5">
                <label htmlFor="settings-relationship" className="block text-xs font-semibold">
                  Hubungan dengan Persona
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {RELATIONSHIP_PRESETS.map((rel) => {
                    const active = settings.user.relationship === rel;
                    return (
                      <button
                        key={rel}
                        type="button"
                        onClick={() => updateUser({ relationship: rel })}
                        className={`min-h-[34px] rounded-lg border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                          active
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] hover:border-indigo-400'
                        }`}
                      >
                        {rel}
                      </button>
                    );
                  })}
                </div>
                <input
                  id="settings-relationship"
                  type="text"
                  value={settings.user.relationship}
                  onChange={(e) => updateUser({ relationship: e.target.value })}
                  placeholder="Atau ketik hubungan khusus (mis. Kakak Kelas, Asisten Pribadi)"
                  className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="settings-custom-note" className="block text-xs font-semibold">
                  Catatan Konteks Tambahan (Opsional)
                </label>
                <textarea
                  id="settings-custom-note"
                  rows={3}
                  value={settings.user.customNote}
                  onChange={(e) => updateUser({ customNote: e.target.value })}
                  placeholder="Contoh: Gunakan sapaan santai aku/kamu, atau suka berdiskusi tentang riset teknologi."
                  className="mt-1.5 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tema Tampilan */}
              <section aria-label="Pilih tema tampilan" className="space-y-2.5">
                <div className="text-xs font-semibold">Tema Tampilan Aplikasi</div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {THEME_OPTIONS.map((t) => {
                    const selected = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onChange({ ...settings, theme: t.id })}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                          selected
                            ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-500/10'
                            : 'border-[var(--app-border)] bg-[var(--app-surface)] hover:border-indigo-400'
                        }`}
                      >
                        <div
                          aria-hidden="true"
                          style={{ backgroundColor: t.swatchBg, borderColor: t.swatchAccent }}
                          className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border"
                        >
                          <div
                            style={{ backgroundColor: t.swatchSurface }}
                            className="flex h-6 w-8 items-center justify-center rounded-sm"
                          >
                            <span
                              style={{ backgroundColor: t.swatchAccent }}
                              className="h-2 w-4 rounded-xs"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">{t.label}</div>
                          <div className="truncate text-xs text-[var(--app-text-muted)]">
                            {t.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Jenis Font */}
              <section aria-label="Pilih jenis font" className="space-y-2.5">
                <div className="text-xs font-semibold">Jenis Huruf (Font)</div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {FONT_OPTIONS.map((f) => {
                    const selected = settings.font === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onChange({ ...settings, font: f.id })}
                        style={{ fontFamily: f.cssFamily }}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          selected
                            ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-500/10'
                            : 'border-[var(--app-border)] bg-[var(--app-surface)] hover:border-indigo-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{f.label}</span>
                          <span className="text-[11px] text-[var(--app-text-muted)]">
                            {f.category}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
                          {f.sampleText}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Ukuran Huruf */}
              <section aria-label="Pilih ukuran huruf" className="space-y-2.5">
                <div className="text-xs font-semibold">Ukuran Huruf</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {FONT_SIZE_OPTIONS.map((sz) => {
                    const selected = settings.fontSize === sz.id;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onChange({ ...settings, fontSize: sz.id })}
                        className={`min-h-[42px] rounded-xl border px-3 py-2 text-center transition-colors ${
                          selected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] hover:border-indigo-400'
                        }`}
                      >
                        <div className="text-xs font-semibold whitespace-nowrap">{sz.label}</div>
                        <div
                          className={`font-mono text-[11px] tabular-nums ${
                            selected ? 'text-indigo-100' : 'text-[var(--app-text-muted)]'
                          }`}
                        >
                          {sz.px}px
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Pratinjau Langsung */}
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] p-4">
                <div className="text-[11px] font-medium text-[var(--app-text-muted)]">
                  Pratinjau Teks Obrolan
                </div>
                <p className="mt-1.5 text-sm leading-relaxed">
                  {settings.user.userName.trim()
                    ? `“Halo ${settings.user.userName.trim()}, sebagai ${settings.user.relationship || 'Rekan Diskusi'}, aku siap membahas topik apa pun hari ini.”`
                    : `“Halo, sebagai ${settings.user.relationship || 'Rekan Diskusi'}, aku siap membahas topik apa pun hari ini.”`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-4">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_APP_SETTINGS)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2 text-xs font-medium text-[var(--app-text-muted)] hover:bg-[var(--app-surface-alt)] hover:text-[var(--app-text)] whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Default</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 whitespace-nowrap"
          >
            Simpan & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
