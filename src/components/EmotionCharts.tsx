import { useState } from 'react';
import {
  EMOTION_META,
  EMOTION_ORDER,
  getDominantEmotion,
  type Archetype,
  type EmotionKey,
  type EmotionState,
} from '../lib/emotionEngine';
import { InteractiveKaomoji } from './InteractiveKaomoji';

export interface EmotionSnapshot {
  turn: number;
  emotions: EmotionState;
  kaomoji: string;
  dominant: EmotionKey;
}

interface EmotionChartsProps {
  emotions: EmotionState;
  deltas: EmotionState | null;
  kaomoji: string;
  archetype: Archetype;
  internalThought?: string;
  history: EmotionSnapshot[];
  isDark?: boolean;
}

export function EmotionCharts({
  emotions,
  deltas,
  kaomoji,
  archetype,
  internalThought,
  history,
  isDark = false,
}: EmotionChartsProps) {
  const [chartView, setChartView] = useState<'bars' | 'radar' | 'trend'>('bars');
  const dominant = getDominantEmotion(emotions);

  return (
    <section aria-label="Grafik Persentase Emosi dan Kaomoji" className="space-y-4">
      <InteractiveKaomoji
        variant="stage"
        kaomoji={kaomoji}
        dominant={dominant.key}
        dominantValue={dominant.value}
        archetype={archetype}
        internalThought={internalThought}
        isDark={isDark}
      />

      {/* Mode Grafik Segmented Switch */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--app-text)]">Distribusi Enam Emosi</h3>
        <div
          role="tablist"
          aria-label="Mode tampilan grafik emosi"
          className="inline-flex items-center rounded-lg bg-[var(--app-surface-alt)] p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={chartView === 'bars'}
            onClick={() => setChartView('bars')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              chartView === 'bars'
                ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-xs'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            Batang
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={chartView === 'radar'}
            onClick={() => setChartView('radar')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              chartView === 'radar'
                ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-xs'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            Radar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={chartView === 'trend'}
            onClick={() => setChartView('trend')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              chartView === 'trend'
                ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-xs'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            Riwayat
          </button>
        </div>
      </div>

      {chartView === 'bars' && (
        <div className="space-y-2.5" data-testid="emotion-bars">
          {EMOTION_ORDER.map((key) => {
            const meta = EMOTION_META[key];
            const value = emotions[key];
            const delta = deltas ? deltas[key] : 0;

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-xs shrink-0"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-[var(--app-text)]">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    {delta !== 0 && (
                      <span
                        className={
                          delta > 0
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-rose-700 dark:text-rose-400 font-medium'
                        }
                      >
                        {delta > 0 ? `+${delta}%` : `${delta}%`}
                      </span>
                    )}
                    <span className="w-9 text-right font-semibold text-[var(--app-text)]">
                      {value}%
                    </span>
                  </div>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-[var(--app-surface-alt)]"
                  role="progressbar"
                  aria-label={`Persentase ${meta.label}`}
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.max(2, value)}%`,
                      backgroundColor: meta.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {chartView === 'radar' && <EmotionRadarSVG emotions={emotions} isDark={isDark} />}

      {chartView === 'trend' && <EmotionTrendSVG history={history} isDark={isDark} />}
    </section>
  );
}

function EmotionRadarSVG({ emotions, isDark }: { emotions: EmotionState; isDark: boolean }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 82;
  const levels = [25, 50, 75, 100];
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const strokeColor = isDark ? '#818CF8' : '#4F46E5';
  const fillColor = isDark ? 'rgba(129, 140, 248, 0.22)' : 'rgba(79, 70, 229, 0.16)';

  const getPoint = (index: number, pct: number) => {
    const angle = (Math.PI * 2 * index) / EMOTION_ORDER.length - Math.PI / 2;
    const r = (Math.min(100, Math.max(8, pct)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = EMOTION_ORDER.map((key, idx) => {
    const pt = getPoint(idx, Math.max(10, emotions[key] * 1.4));
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] p-3">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[220px] w-[220px]"
        role="img"
        aria-label="Grafik radar enam emosi"
      >
        {levels.map((lvl) => {
          const pts = EMOTION_ORDER.map((_, idx) => {
            const pt = getPoint(idx, lvl);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          }).join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke={gridColor}
              strokeWidth="1"
            />
          );
        })}

        {EMOTION_ORDER.map((key, idx) => {
          const edge = getPoint(idx, 100);
          const labelPt = getPoint(idx, 124);
          return (
            <g key={key}>
              <line
                x1={cx}
                y1={cy}
                x2={edge.x}
                y2={edge.y}
                stroke={gridColor}
                strokeWidth="1"
              />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--app-text)"
                className="text-[10px] font-medium"
              >
                {EMOTION_META[key].label}
              </text>
            </g>
          );
        })}

        <polygon
          points={polygonPoints}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
        />

        {EMOTION_ORDER.map((key, idx) => {
          const pt = getPoint(idx, Math.max(10, emotions[key] * 1.4));
          return (
            <circle
              key={key}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill={EMOTION_META[key].color}
              stroke={isDark ? '#0F172A' : '#FFFFFF'}
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    </div>
  );
}

function EmotionTrendSVG({ history, isDark }: { history: EmotionSnapshot[]; isDark: boolean }) {
  if (history.length <= 1) {
    return (
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] p-4 text-center text-xs text-[var(--app-text-muted)]">
        Kirim minimal satu pesan atau jalankan uji kalibrasi untuk melihat grafik perubahan emosi per giliran.
      </div>
    );
  }

  const width = 320;
  const height = 150;
  const padX = 16;
  const padY = 14;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  const recent = history.slice(-10);

  return (
    <div className="space-y-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[150px] w-full"
        role="img"
        aria-label="Grafik garis riwayat persentase emosi"
      >
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = padY + plotH - (tick / 100) * plotH;
          return (
            <line
              key={tick}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke={gridColor}
              strokeDasharray="2 3"
              strokeWidth="1"
            />
          );
        })}

        {EMOTION_ORDER.map((key) => {
          const points = recent
            .map((snap, idx) => {
              const x =
                recent.length === 1
                  ? padX + plotW / 2
                  : padX + (idx / (recent.length - 1)) * plotW;
              const y = padY + plotH - (snap.emotions[key] / 100) * plotH;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <polyline
              key={key}
              fill="none"
              stroke={EMOTION_META[key].color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[var(--app-text-muted)]">
        <span>{recent.length} titik giliran terakhir</span>
        <span className="font-mono tabular-nums">Skala 0% – 100%</span>
      </div>
    </div>
  );
}
