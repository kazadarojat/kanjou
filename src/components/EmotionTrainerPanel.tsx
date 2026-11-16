import { useState } from 'react';
import { Plus, RotateCcw, Sliders, Trash2, Zap } from 'lucide-react';
import {
  EMOTION_META,
  EMOTION_ORDER,
  type EmotionKey,
  type IntensityLevel,
  type Persona,
  type TrainingRule,
} from '../lib/emotionEngine';

interface EmotionTrainerPanelProps {
  persona: Persona;
  onUpdateTraining: (training: Persona['training']) => void;
  onRunCalibration: (sampleText: string) => void;
  onResetEmotions: () => void;
}

const INTENSITY_SAMPLES: { level: IntensityLevel; label: string; sample: string }[] = [
  {
    level: 'rendah',
    label: 'Rendah',
    sample: 'Halo, hari ini cuacanya lumayan tenang ya.',
  },
  {
    level: 'sedang',
    label: 'Sedang',
    sample: 'Terima kasih banyak sudah membantu, kamu keren juga!',
  },
  {
    level: 'tinggi',
    label: 'Tinggi',
    sample: 'Kenapa kamu terus menyangkal?! Aku serius butuh penjelasan!',
  },
  {
    level: 'ekstrem',
    label: 'Ekstrem',
    sample: 'JANGAN PERGI!! AKU BENCI KALAU KAMU TINGGALKAN AKU SENDIRI!!',
  },
];

export function EmotionTrainerPanel({
  persona,
  onUpdateTraining,
  onRunCalibration,
  onResetEmotions,
}: EmotionTrainerPanelProps) {
  const [newRuleLabel, setNewRuleLabel] = useState('');
  const [newRuleKeywords, setNewRuleKeywords] = useState('');
  const [newRuleEmotion, setNewRuleEmotion] = useState<EmotionKey>('senang');
  const [newRuleBoost, setNewRuleBoost] = useState(30);
  const [ruleError, setRuleError] = useState('');
  const [customTestText, setCustomTestText] = useState(
    'Kamu hebat banget sih, makasih ya sudah peduli!'
  );

  const { training } = persona;

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newRuleLabel.trim();
    const keywords = newRuleKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (!label || keywords.length === 0) {
      setRuleError('Isi nama aturan dan minimal satu kata kunci pemicu.');
      return;
    }

    const rule: TrainingRule = {
      id: `rule-${Date.now()}`,
      label,
      triggerKeywords: keywords,
      targetEmotion: newRuleEmotion,
      boostAmount: Math.max(5, Math.min(80, newRuleBoost)),
      enabled: true,
    };

    onUpdateTraining({
      ...training,
      rules: [...training.rules, rule],
    });
    setNewRuleLabel('');
    setNewRuleKeywords('');
    setRuleError('');
  };

  const toggleRule = (id: string) => {
    onUpdateTraining({
      ...training,
      rules: training.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    });
  };

  const removeRule = (id: string) => {
    onUpdateTraining({
      ...training,
      rules: training.rules.filter((r) => r.id !== id),
    });
  };

  return (
    <div className="space-y-5">
      {/* Parameter Sensitivitas & Inersia */}
      <div className="space-y-3.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text)]">
            <Sliders className="h-4 w-4 text-[var(--app-text-muted)]" />
            <span>Parameter Perubahan Emosi</span>
          </div>
          <button
            type="button"
            onClick={onResetEmotions}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--app-text-muted)] hover:bg-[var(--app-surface-alt)] hover:text-[var(--app-text)] whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Dasar</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="reactivity-slider" className="font-medium text-[var(--app-text)]">
              Reaktivitas Emosi
            </label>
            <span className="font-mono font-semibold text-[var(--app-text)] tabular-nums">
              {training.reactivity.toFixed(2)}x
            </span>
          </div>
          <input
            id="reactivity-slider"
            type="range"
            min={0.3}
            max={2.0}
            step={0.05}
            value={training.reactivity}
            onChange={(e) =>
              onUpdateTraining({
                ...training,
                reactivity: parseFloat(e.target.value),
              })
            }
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-[var(--app-text-muted)]">
            <span>Tenang (0.3x)</span>
            <span>Sangat Ekspresif (2.0x)</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="inertia-slider" className="font-medium text-[var(--app-text)]">
              Inersia / Memori Emosi
            </label>
            <span className="font-mono font-semibold text-[var(--app-text)] tabular-nums">
              {Math.round(training.inertia * 100)}%
            </span>
          </div>
          <input
            id="inertia-slider"
            type="range"
            min={0.05}
            max={0.85}
            step={0.05}
            value={training.inertia}
            onChange={(e) =>
              onUpdateTraining({
                ...training,
                inertia: parseFloat(e.target.value),
              })
            }
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-[var(--app-text-muted)]">
            <span>Berubah Cepat</span>
            <span>Menahan Emosi Lama</span>
          </div>
        </div>

        {/* Kurva Pengali Intensitas Percakapan */}
        <div className="border-t border-[var(--app-border-soft)] pt-3">
          <div className="mb-2 text-xs font-medium text-[var(--app-text)]">
            Pengali Berdasarkan Intensitas Percakapan
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['rendah', 'sedang', 'tinggi', 'ekstrem'] as IntensityLevel[]).map((lvl) => (
              <div key={lvl} className="rounded-lg bg-[var(--app-surface-alt)] px-2.5 py-2">
                <div className="flex items-center justify-between text-[11px]">
                  <label htmlFor={`bias-${lvl}`} className="capitalize font-medium text-[var(--app-text)]">
                    {lvl}
                  </label>
                  <span className="font-mono font-semibold text-[var(--app-text)] tabular-nums">
                    {training.intensityBias[lvl].toFixed(2)}x
                  </span>
                </div>
                <input
                  id={`bias-${lvl}`}
                  type="range"
                  min={0.3}
                  max={2.2}
                  step={0.05}
                  value={training.intensityBias[lvl]}
                  onChange={(e) =>
                    onUpdateTraining({
                      ...training,
                      intensityBias: {
                        ...training.intensityBias,
                        [lvl]: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulasi Latihan Intensitas */}
      <div className="space-y-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text)]">
          <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Simulasi Latihan Intensitas</span>
        </div>
        <p className="text-xs leading-relaxed text-[var(--app-text-muted)]">
          Uji langsung bagaimana parameter di atas mengubah grafik emosi dan kaomoji pada empat level intensitas percakapan.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {INTENSITY_SAMPLES.map((item) => (
            <button
              key={item.level}
              type="button"
              onClick={() => {
                setCustomTestText(item.sample);
                onRunCalibration(item.sample);
              }}
              className="min-h-[38px] rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--app-text)] transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 whitespace-nowrap"
            >
              Uji: {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customTestText}
            onChange={(e) => setCustomTestText(e.target.value)}
            aria-label="Teks simulasi latihan emosi"
            placeholder="Ketik kalimat uji intensitas..."
            className="min-w-0 flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (customTestText.trim()) onRunCalibration(customTestText);
            }}
            className="min-h-[38px] rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 whitespace-nowrap shrink-0"
          >
            Latih
          </button>
        </div>
      </div>

      {/* Aturan Pemicu Emosi */}
      <div className="space-y-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <div className="text-sm font-semibold text-[var(--app-text)]">
          Aturan Pemicu Emosi ({training.rules.length})
        </div>

        {training.rules.length > 0 ? (
          <ul className="space-y-2">
            {training.rules.map((rule) => {
              const meta = EMOTION_META[rule.targetEmotion];
              return (
                <li
                  key={rule.id}
                  className="flex items-start justify-between gap-2 rounded-lg bg-[var(--app-surface-alt)] p-2.5"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--app-border)] text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-[var(--app-text)]">
                        {rule.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--app-text-muted)]">
                        Kata kunci: {rule.triggerKeywords.join(', ')}
                      </div>
                      <div
                        style={{ color: meta.color }}
                        className="mt-0.5 font-mono text-[11px] font-semibold tabular-nums"
                      >
                        {meta.label} +{rule.boostAmount}%
                      </div>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    aria-label={`Hapus aturan ${rule.label}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--app-text-muted)] hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-[var(--app-text-muted)]">
            Belum ada aturan pemicu. Tambahkan di bawah untuk melatih reaksi terhadap kata tertentu.
          </p>
        )}

        <form onSubmit={handleAddRule} className="space-y-2.5 border-t border-[var(--app-border-soft)] pt-3">
          <div className="text-xs font-medium text-[var(--app-text)]">Tambah Aturan Baru</div>
          <input
            type="text"
            value={newRuleLabel}
            onChange={(e) => setNewRuleLabel(e.target.value)}
            placeholder="Nama aturan (mis. Tersipu saat dipuji)"
            aria-label="Nama aturan pelatihan"
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            value={newRuleKeywords}
            onChange={(e) => setNewRuleKeywords(e.target.value)}
            placeholder="Kata kunci pisah koma (mis. hebat, keren)"
            aria-label="Kata kunci pemicu"
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:border-indigo-500 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newRuleEmotion}
              onChange={(e) => setNewRuleEmotion(e.target.value as EmotionKey)}
              aria-label="Emosi target"
              className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-2 text-xs text-[var(--app-text)] focus:border-indigo-500 focus:outline-none"
            >
              {EMOTION_ORDER.map((k) => (
                <option key={k} value={k}>
                  Target: {EMOTION_META[k].label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1.5">
              <label htmlFor="rule-boost-input" className="text-[11px] text-[var(--app-text-muted)]">
                Dorong
              </label>
              <input
                id="rule-boost-input"
                type="number"
                min={5}
                max={80}
                value={newRuleBoost}
                onChange={(e) => setNewRuleBoost(Number(e.target.value) || 15)}
                className="w-full bg-transparent text-right font-mono text-xs font-semibold text-[var(--app-text)] focus:outline-none tabular-nums"
              />
              <span className="font-mono text-xs text-[var(--app-text-muted)]">%</span>
            </div>
          </div>

          {ruleError && <p className="text-xs text-rose-600 dark:text-rose-400">{ruleError}</p>}

          <button
            type="submit"
            className="flex w-full min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-alt)] px-3 py-2 text-xs font-medium text-[var(--app-text)] transition-colors hover:border-indigo-400 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Aturan Pemicu</span>
          </button>
        </form>
      </div>
    </div>
  );
}
