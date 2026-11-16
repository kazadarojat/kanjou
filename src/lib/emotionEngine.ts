export type EmotionKey = 'senang' | 'marah' | 'takut' | 'bingung' | 'sedih' | 'jijik';

export type EmotionState = Record<EmotionKey, number>;

export type MBTIType =
  | 'INTJ'
  | 'INTP'
  | 'ENTJ'
  | 'ENTP'
  | 'INFJ'
  | 'INFP'
  | 'ENFJ'
  | 'ENFP'
  | 'ISTJ'
  | 'ISFJ'
  | 'ESTJ'
  | 'ESFJ'
  | 'ISTP'
  | 'ISFP'
  | 'ESTP'
  | 'ESFP';

export type Archetype =
  | 'Tsundere'
  | 'Yandere'
  | 'Kuudere'
  | 'Dandere'
  | 'Genki'
  | 'Stoik'
  | 'Melankolis'
  | 'Kustom';

export type IntensityLevel = 'rendah' | 'sedang' | 'tinggi' | 'ekstrem';

export interface TrainingRule {
  id: string;
  label: string;
  triggerKeywords: string[];
  targetEmotion: EmotionKey;
  boostAmount: number;
  enabled: boolean;
}

export interface EmotionTrainingConfig {
  reactivity: number; // 0.3 (tenang) .. 2.0 (sangat ekspresif)
  inertia: number; // 0.0 (instan berubah) .. 0.85 (sangat stabil/memori kuat)
  intensityBias: Record<IntensityLevel, number>;
  rules: TrainingRule[];
}

export interface WebSourceRef {
  title: string;
  url: string;
}

export interface Persona {
  id: string;
  name: string;
  roleTitle: string;
  mbti: MBTIType;
  archetype: Archetype;
  basePersonality: string;
  speakingStyle: string;
  avatarUrl?: string;
  sourceCategory?: string;
  webSources?: WebSourceRef[];
  baselineEmotions: EmotionState;
  training: EmotionTrainingConfig;
}

export interface EmotionMetaItem {
  key: EmotionKey;
  label: string;
  color: string;
  trackColor: string;
  textColor: string;
  description: string;
}

export const EMOTION_ORDER: EmotionKey[] = [
  'senang',
  'marah',
  'takut',
  'bingung',
  'sedih',
  'jijik',
];

export const EMOTION_META: Record<EmotionKey, EmotionMetaItem> = {
  senang: {
    key: 'senang',
    label: 'Senang',
    color: '#10B981',
    trackColor: '#ECFDF5',
    textColor: '#047857',
    description: 'Antusiasme, apresiasi, kehangatan, dan rasa puas.',
  },
  marah: {
    key: 'marah',
    label: 'Marah',
    color: '#E11D48',
    trackColor: '#FFF1F2',
    textColor: '#BE123C',
    description: 'Frustrasi, defensif, tersinggung, atau agresivitas.',
  },
  takut: {
    key: 'takut',
    label: 'Takut',
    color: '#7C3AED',
    trackColor: '#F5F3FF',
    textColor: '#6D28D9',
    description: 'Cemas, waspada, gentar, atau khawatir kehilangan.',
  },
  bingung: {
    key: 'bingung',
    label: 'Bingung',
    color: '#D97706',
    trackColor: '#FFFBEB',
    textColor: '#B45309',
    description: 'Ragu, salah tingkah, terkejut, atau tidak paham.',
  },
  sedih: {
    key: 'sedih',
    label: 'Sedih',
    color: '#2563EB',
    trackColor: '#EFF6FF',
    textColor: '#1D4ED8',
    description: 'Kecewa, melankolis, terasing, atau empati mendalam.',
  },
  jijik: {
    key: 'jijik',
    label: 'Jijik',
    color: '#65A30D',
    trackColor: '#F7FEE7',
    textColor: '#4D7C0F',
    description: 'Muak, ilfil, penolakan keras, atau sinisme tajam.',
  },
};

export const MBTI_OPTIONS: { code: MBTIType; summary: string }[] = [
  { code: 'INTJ', summary: 'Strategis, mandiri, analitis, standar tinggi' },
  { code: 'INTP', summary: 'Logis, penasaran, konseptual, objektif' },
  { code: 'ENTJ', summary: 'Tegas, visioner, terstruktur, dominan' },
  { code: 'ENTP', summary: 'Cerdik, suka berdebat, spontan, jenaka' },
  { code: 'INFJ', summary: 'Reflektif, empatik, idealis, mendalam' },
  { code: 'INFP', summary: 'Puitis, sensitif, setia pada nilai pribadi' },
  { code: 'ENFJ', summary: 'Karismatik, protektif, peka emosi sosial' },
  { code: 'ENFP', summary: 'Ekspresif, antusias, penuh imajinasi' },
  { code: 'ISTJ', summary: 'Disiplin, faktual, konsisten, realistis' },
  { code: 'ISFJ', summary: 'Hangat, teliti, suportif, penuh perhatian' },
  { code: 'ESTJ', summary: 'Terorganisir, langsung pada inti, tegas' },
  { code: 'ESFJ', summary: 'Ramah, menjaga harmoni, ekspresif' },
  { code: 'ISTP', summary: 'Tenang, pragmatis, observatif, hemat kata' },
  { code: 'ISFP', summary: 'Lembut, artistik, spontan, peka suasana' },
  { code: 'ESTP', summary: 'Berani, taktis, penuh energi, lugas' },
  { code: 'ESFP', summary: 'Ceria, ekspresif, suka interaksi langsung' },
];

export const ARCHETYPE_PRESETS: Record<
  Archetype,
  {
    label: string;
    description: string;
    speakingHint: string;
    baseline: EmotionState;
    reactivity: number;
    inertia: number;
  }
> = {
  Tsundere: {
    label: 'Tsundere',
    description: 'Tampak ketus dan defensif di luar, namun diam-diam peduli dan mudah salah tingkah saat dipuji.',
    speakingHint: 'Gunakan nada sedikit ketus, sangkalan halus ("b-bukan berarti aku peduli..."), namun tetap menjawab tuntas.',
    baseline: { senang: 20, marah: 28, takut: 8, bingung: 26, sedih: 8, jijik: 10 },
    reactivity: 1.3,
    inertia: 0.35,
  },
  Yandere: {
    label: 'Yandere',
    description: 'Sangat manis dan penuh perhatian di permukaan, tetapi menyimpan obsesi posesif yang intens saat diabaikan.',
    speakingHint: 'Nada sangat lembut, penuh perhatian intens, sesekali menyelipkan rasa posesif atau kecemasan berlebih.',
    baseline: { senang: 45, marah: 10, takut: 22, bingung: 10, sedih: 8, jijik: 5 },
    reactivity: 1.55,
    inertia: 0.25,
  },
  Kuudere: {
    label: 'Kuudere',
    description: 'Dingin, rasional, tenang, dan jarang menunjukkan gejolak ekspresi, meski punya empati tersembunyi.',
    speakingHint: 'Kalimat ringkas, logis, terukur, hampir tanpa tanda seru, namun akurat dan dapat diandalkan.',
    baseline: { senang: 18, marah: 8, takut: 6, bingung: 22, sedih: 16, jijik: 30 },
    reactivity: 0.65,
    inertia: 0.68,
  },
  Dandere: {
    label: 'Dandere',
    description: 'Pemalu, pendiam, mudah gugup, tetapi hangat dan tulus begitu merasa aman dengan lawan bicara.',
    speakingHint: 'Gunakan jeda ragu ("em...", "anu..."), sopan, lembut, dan menghargai setiap respons baik.',
    baseline: { senang: 22, marah: 5, takut: 34, bingung: 24, sedih: 12, jijik: 3 },
    reactivity: 1.15,
    inertia: 0.42,
  },
  Genki: {
    label: 'Genki',
    description: 'Penuh semangat, optimistis, cepat merespons, dan mudah antusias terhadap hal baru.',
    speakingHint: 'Enerjik, ramah, ekspresif, ritme kalimat dinamis dan menyemangati.',
    baseline: { senang: 58, marah: 4, takut: 6, bingung: 22, sedih: 5, jijik: 5 },
    reactivity: 1.4,
    inertia: 0.22,
  },
  Stoik: {
    label: 'Stoik',
    description: 'Bijaksana, stabil secara emosional, tidak mudah terpancing provokasi, fokus pada kendali diri.',
    speakingHint: 'Tenang, bernas, reflektif, menggunakan sudut pandang jernih tanpa drama berlebihan.',
    baseline: { senang: 30, marah: 8, takut: 8, bingung: 24, sedih: 18, jijik: 12 },
    reactivity: 0.55,
    inertia: 0.72,
  },
  Melankolis: {
    label: 'Melankolis',
    description: 'Puitis, peka terhadap nuansa perasaan, cenderung reflektif dan mudah tersentuh oleh kata-kata.',
    speakingHint: 'Puitis, lembut, sedikit murung namun hangat dan empatik.',
    baseline: { senang: 16, marah: 6, takut: 18, bingung: 20, sedih: 34, jijik: 6 },
    reactivity: 1.25,
    inertia: 0.48,
  },
  Kustom: {
    label: 'Kustom',
    description: 'Watak bebas sesuai deskripsi kepribadian dan aturan pelatihan yang Anda rancang sendiri.',
    speakingHint: 'Sesuaikan gaya bicara sepenuhnya dengan profil kepribadian kustom.',
    baseline: { senang: 30, marah: 10, takut: 10, bingung: 25, sedih: 15, jijik: 10 },
    reactivity: 1.0,
    inertia: 0.4,
  },
};

const KAOMOJI_BANK: Record<
  EmotionKey,
  {
    low: string[];
    medium: string[];
    high: string[];
    archetypeOverrides?: Partial<Record<Archetype, string[]>>;
  }
> = {
  senang: {
    low: ['(・‿・)', '(´ー`)', '(＾▽＾)'],
    medium: ['(◕‿◕✿)', '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(◠‿◠)'],
    high: ['ヽ(>∀<☆)ノ', '(*≧ω≦*)', '٩(◕‿◕｡)۶'],
    archetypeOverrides: {
      Tsundere: ['(￣▽￣*)ゞ', '(*/ω＼*)', '(¬‿¬ )'],
      Kuudere: ['(・_・)b', '(´ー｀)', '(￣ー￣)'],
      Yandere: ['(♡˙︶˙♡)', '(✿◠‿◠)', '(´♡‿♡`)'],
      Genki: ['ヽ(・∀・)ﾉ', '٩(｡•́‿•̀｡)۶', '(ﾉ≧∀≦)ﾉ'],
    },
  },
  marah: {
    low: ['(¬_¬)', '(￣ヘ￣)', '(・`ω´・)'],
    medium: ['(｀ε´)', '(╬ Ò﹏Ó)', '(ಠ_ಠ)'],
    high: ['(ノಠ益ಠ)ノ彡┻━┻', '(╬`益´)', 'щ(゜ロ゜щ)'],
    archetypeOverrides: {
      Tsundere: ['(｀^´)>', '(╬`д´)', '(*｀へ´*)'],
      Kuudere: ['(ー_ー)', '(ಠ_ಠ)', '(-_-メ)'],
      Yandere: ['(◉_◉)', '(눈_눈)', '(╬◠‿◠)'],
    },
  },
  takut: {
    low: ['(・_・;)', '(・・;)', '(´･_･`)'],
    medium: ['(°ロ°)!', '(；・∀・)', '(;° ロ°)'],
    high: ['(ﾟДﾟ;≡;ﾟдﾟ)', '(((;°Д°)))', 'ヽ(ﾟДﾟ)ﾉ'],
    archetypeOverrides: {
      Dandere: ['(｡•́︿•̀｡)', '(;ŏ﹏ŏ)', '(つ﹏<。)'],
      Yandere: ['(◎_◎;)', '(ﾟｰﾟ;)', '(;´・`)>'],
    },
  },
  bingung: {
    low: ['(・_・?)', '(´・ω・`)?', '(・へ・)'],
    medium: ['(・・?)', '┐(￣ヘ￣)┌', '(?_?)'],
    high: ['(◎_◎;)?', 'Σ(°△°|||)︴', '＼(°o°)／'],
    archetypeOverrides: {
      Tsundere: ['(///▽///)?', '(・_・;)?', '(＞﹏＜)?'],
      Kuudere: ['(・_・?)', '(・・ )', '(¬_¬)?'],
    },
  },
  sedih: {
    low: ['(´・ω・`)', '(・_・`)', '(._.)'],
    medium: ['(T_T)', '(；ω；)', '(｡•́︿•̀｡)'],
    high: ['(つД`)ノ', '(ノД`)・゜・。', '(╥﹏╥)'],
    archetypeOverrides: {
      Kuudere: ['(._.)', '(´-ω-`)', '(ー_ー;)'],
      Melankolis: ['(｡•́︿•̀｡)', '(´；ω；`)', '(u_u)'],
    },
  },
  jijik: {
    low: ['(¬_¬")', '(￣_￣)', '(・_・")'],
    medium: ['(￣Д￣)ﾉ', '(；一_一)', '(´-﹏-`；)'],
    high: ['(╬☉д⊙)', '(;¬_¬)', '(-_-;)・・・'],
    archetypeOverrides: {
      Kuudere: ['(￣_￣)', '(-_-)', '(；一_一)'],
      Tsundere: ['(¬_¬")', '(￣^￣)', '(；一_一)'],
    },
  },
};

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Normalizes any partial emotion record into 6 non-negative integers summing to 100
 * using the largest-remainder (Hamilton) method so totals are strictly 100%.
 */
export function normalizeEmotions(
  raw: Partial<EmotionState>,
  fallback: EmotionState = ARCHETYPE_PRESETS.Kustom.baseline
): EmotionState {
  const sanitized = EMOTION_ORDER.map((key) => {
    const val = raw[key];
    return typeof val === 'number' && Number.isFinite(val) && val > 0 ? val : 0;
  });

  const sum = sanitized.reduce((acc, v) => acc + v, 0);
  if (sum <= 0) {
    return normalizeEmotions(fallback, {
      senang: 30,
      marah: 10,
      takut: 10,
      bingung: 25,
      sedih: 15,
      jijik: 10,
    });
  }

  const exact = sanitized.map((v) => (v / sum) * 100);
  const floored = exact.map((v) => Math.floor(v));
  let remainder = 100 - floored.reduce((acc, v) => acc + v, 0);

  const fractions = exact
    .map((v, idx) => ({ idx, frac: v - floored[idx] }))
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder; i++) {
    floored[fractions[i % fractions.length].idx] += 1;
  }

  return {
    senang: floored[0],
    marah: floored[1],
    takut: floored[2],
    bingung: floored[3],
    sedih: floored[4],
    jijik: floored[5],
  };
}

export function getDominantEmotion(state: EmotionState): {
  key: EmotionKey;
  value: number;
  secondaryKey: EmotionKey;
} {
  const sorted = [...EMOTION_ORDER].sort((a, b) => state[b] - state[a]);
  return {
    key: sorted[0],
    value: state[sorted[0]],
    secondaryKey: sorted[1],
  };
}

export interface IntensityAnalysis {
  level: IntensityLevel;
  score: number; // 0.2 .. 1.0
  signals: string[];
}

const INTENSIFIER_KEYWORDS = [
  'sangat',
  'banget',
  'sekali',
  'parah',
  'benci',
  'marah',
  'bodoh',
  'tolong',
  'takut',
  'sayang',
  'cinta',
  'hebat',
  'luar biasa',
  'jijik',
  'muak',
  'sedih',
  'kecewa',
  'kenapa',
  'serius',
  'gila',
  'astaga',
  'maaf',
  'jangan',
  'pergi',
  'please',
  'hate',
  'love',
  'amazing',
  'terrible',
];

export function detectConversationIntensity(text: string): IntensityAnalysis {
  const trimmed = text.trim();
  if (!trimmed) {
    return { level: 'rendah', score: 0.25, signals: ['Pesan kosong'] };
  }

  let score = 0.3;
  const signals: string[] = [];

  const exclamations = (trimmed.match(/!/g) || []).length;
  const questions = (trimmed.match(/\?/g) || []).length;
  if (exclamations >= 2 || (exclamations >= 1 && questions >= 1)) {
    score += 0.22;
    signals.push('Tanda seru/tanya bertingkat');
  } else if (exclamations === 1 || questions >= 2) {
    score += 0.1;
    signals.push('Penekanan tanda baca');
  }

  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  const upper = trimmed.replace(/[^A-Z]/g, '');
  if (letters.length >= 6 && upper.length / letters.length >= 0.45) {
    score += 0.24;
    signals.push('Dominasi huruf kapital');
  }

  const lower = trimmed.toLowerCase();
  const matchedKeywords = INTENSIFIER_KEYWORDS.filter((kw) => lower.includes(kw));
  if (matchedKeywords.length >= 2) {
    score += 0.24;
    signals.push(`Kata emosional kuat (${matchedKeywords.slice(0, 2).join(', ')})`);
  } else if (matchedKeywords.length === 1) {
    score += 0.14;
    signals.push(`Kata penguat (${matchedKeywords[0]})`);
  }

  if (trimmed.length >= 160) {
    score += 0.12;
    signals.push('Pesan panjang & mendetail');
  } else if (trimmed.length <= 14 && exclamations === 0) {
    score -= 0.08;
  }

  const finalScore = clamp(Number(score.toFixed(2)), 0.2, 1.0);

  let level: IntensityLevel = 'rendah';
  if (finalScore >= 0.8) level = 'ekstrem';
  else if (finalScore >= 0.6) level = 'tinggi';
  else if (finalScore >= 0.4) level = 'sedang';

  if (signals.length === 0) {
    signals.push('Nada percakapan netral');
  }

  return { level, score: finalScore, signals };
}

export function selectKaomoji(
  dominant: EmotionKey,
  intensityScore: number,
  archetype: Archetype,
  secondary?: EmotionKey
): string {
  const entry = KAOMOJI_BANK[dominant];
  const overrides = entry.archetypeOverrides?.[archetype];

  // Tsundere flustered special case when Marah + Senang/Bingung collide
  if (
    archetype === 'Tsundere' &&
    ((dominant === 'marah' && (secondary === 'bingung' || secondary === 'senang')) ||
      (dominant === 'bingung' && secondary === 'senang'))
  ) {
    return intensityScore >= 0.6 ? '(///>_<///)' : '(￣▽￣*)ゞ';
  }

  if (overrides && overrides.length > 0) {
    if (intensityScore >= 0.72) return overrides[overrides.length - 1];
    if (intensityScore >= 0.45) return overrides[Math.min(1, overrides.length - 1)];
    return overrides[0];
  }

  const tier =
    intensityScore >= 0.72 ? entry.high : intensityScore >= 0.45 ? entry.medium : entry.low;
  const idx = Math.min(tier.length - 1, Math.floor(intensityScore * tier.length));
  return tier[idx] || tier[0];
}

export function getKaomojiVariants(
  dominant: EmotionKey,
  archetype: Archetype
): string[] {
  const entry = KAOMOJI_BANK[dominant];
  const overrides = entry.archetypeOverrides?.[archetype] || [];
  const combined = [...overrides, ...entry.medium, ...entry.high, ...entry.low];
  return Array.from(new Set(combined));
}

export interface EmotionUpdateResult {
  next: EmotionState;
  deltas: EmotionState;
  dominant: EmotionKey;
  kaomoji: string;
  intensity: IntensityAnalysis;
  triggeredRules: string[];
}

export function applyEmotionTraining(
  prev: EmotionState,
  stimulus: Partial<EmotionState>,
  userText: string,
  persona: Persona
): EmotionUpdateResult {
  const intensity = detectConversationIntensity(userText);
  const lower = userText.toLowerCase();
  const { reactivity, inertia, intensityBias, rules } = persona.training;
  const biasMultiplier = intensityBias[intensity.level] ?? 1.0;

  // 1. Start from normalized raw stimulus
  const targetRaw: Record<EmotionKey, number> = {
    senang: Math.max(0, stimulus.senang ?? persona.baselineEmotions.senang),
    marah: Math.max(0, stimulus.marah ?? persona.baselineEmotions.marah),
    takut: Math.max(0, stimulus.takut ?? persona.baselineEmotions.takut),
    bingung: Math.max(0, stimulus.bingung ?? persona.baselineEmotions.bingung),
    sedih: Math.max(0, stimulus.sedih ?? persona.baselineEmotions.sedih),
    jijik: Math.max(0, stimulus.jijik ?? persona.baselineEmotions.jijik),
  };

  // 2. Apply user-trained custom rules based on trigger keywords & intensity
  const triggeredRules: string[] = [];
  for (const rule of rules) {
    if (!rule.enabled || rule.triggerKeywords.length === 0) continue;
    const hit = rule.triggerKeywords.some((kw) => {
      const cleaned = kw.trim().toLowerCase();
      return cleaned.length > 0 && lower.includes(cleaned);
    });
    if (hit) {
      triggeredRules.push(rule.label);
      const scaledBoost = rule.boostAmount * (0.65 + intensity.score * 0.7) * biasMultiplier;
      targetRaw[rule.targetEmotion] += Math.max(0, scaledBoost);
    }
  }

  const normalizedTarget = normalizeEmotions(targetRaw, persona.baselineEmotions);

  // 3. Blend previous state with target using trained inertia, reactivity, and intensity multiplier
  const alpha = clamp((1 - inertia) * reactivity * (0.55 + intensity.score * 0.5) * biasMultiplier, 0.08, 0.94);

  const blendedRaw: Partial<EmotionState> = {};
  for (const key of EMOTION_ORDER) {
    blendedRaw[key] = prev[key] * (1 - alpha) + normalizedTarget[key] * alpha;
  }

  const next = normalizeEmotions(blendedRaw, prev);
  const deltas: EmotionState = {
    senang: next.senang - prev.senang,
    marah: next.marah - prev.marah,
    takut: next.takut - prev.takut,
    bingung: next.bingung - prev.bingung,
    sedih: next.sedih - prev.sedih,
    jijik: next.jijik - prev.jijik,
  };

  const { key: dominant, secondaryKey } = getDominantEmotion(next);
  const kaomoji = selectKaomoji(dominant, intensity.score, persona.archetype, secondaryKey);

  return {
    next,
    deltas,
    dominant,
    kaomoji,
    intensity,
    triggeredRules,
  };
}

/**
 * Deterministic stimulus estimator for instant offline/simulator calibration
 * when previewing emotion training parameters without calling the LLM.
 */
export function estimateLocalStimulus(userText: string, persona: Persona): EmotionState {
  const lower = userText.toLowerCase();
  const base: Record<EmotionKey, number> = { ...persona.baselineEmotions };

  if (/(bagus|hebat|keren|suka|sayang|terima kasih|makasih|pintar|lucu|cantik|ganteng)/.test(lower)) {
    base.senang += 42;
    if (persona.archetype === 'Tsundere') {
      base.bingung += 22;
      base.marah += 14;
    }
  }
  if (/(bodoh|benci|jelek|payah|gagal|diam|nyebelin|kesal|marah|salah)/.test(lower)) {
    base.marah += 40;
    base.jijik += 15;
    if (persona.archetype === 'Dandere' || persona.archetype === 'Melankolis') {
      base.sedih += 25;
      base.takut += 20;
    }
  }
  if (/(pergi|tinggal|hapus|lupa|sendiri|bosan|orang lain)/.test(lower)) {
    base.sedih += 35;
    base.takut += 24;
    if (persona.archetype === 'Yandere') {
      base.marah += 32;
      base.takut += 25;
    }
  }
  if (/(kenapa|apa maksud|gimana|bingung|aneh|misteri|\?)/.test(lower)) {
    base.bingung += 36;
  }
  if (/(kotor|jijik|bau|muak|cringe|palsu|bohong)/.test(lower)) {
    base.jijik += 45;
    base.marah += 14;
  }
  if (/(awas|bahaya|gelap|takut|seram|ancam|hilang)/.test(lower)) {
    base.takut += 44;
  }

  return normalizeEmotions(base, persona.baselineEmotions);
}

export interface UserPromptContext {
  userName?: string;
  relationship?: string;
  customNote?: string;
}

export function buildSystemPrompt(
  persona: Persona,
  currentEmotions: EmotionState,
  intensity: IntensityAnalysis,
  userPrefs?: UserPromptContext
): string {
  const { key: dominant } = getDominantEmotion(currentEmotions);
  const activeRulesText = persona.training.rules
    .filter((r) => r.enabled)
    .map(
      (r) =>
        `- Aturan "${r.label}": jika pesan menyebut [${r.triggerKeywords.join(', ')}], dorong emosi ${EMOTION_META[r.targetEmotion].label} (+${r.boostAmount}).`
    )
    .join('\n');

  const userName = userPrefs?.userName?.trim();
  const relationship = userPrefs?.relationship?.trim();
  const customNote = userPrefs?.customNote?.trim();
  const userContextLines = [
    userName ? `- Nama Lawan Bicara (User): ${userName}` : '',
    relationship ? `- Hubungan dengan Persona: ${relationship}` : '',
    customNote ? `- Catatan Preferensi Interaksi: ${customNote}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return [
    `Anda memerankan Persona AI bernama "${persona.name}" (${persona.roleTitle}).`,
    `Tipe MBTI: ${persona.mbti}. Arketipe Watak: ${persona.archetype}.`,
    `Kepribadian Dasar: ${persona.basePersonality}`,
    `Gaya Bicara: ${persona.speakingStyle}`,
    userContextLines ? `\nKonteks Lawan Bicara:\n${userContextLines}` : '',
    ``,
    `Kondisi Emosi Saat Ini (Total 100%):`,
    `- Senang: ${currentEmotions.senang}%, Marah: ${currentEmotions.marah}%, Takut: ${currentEmotions.takut}%, Bingung: ${currentEmotions.bingung}%, Sedih: ${currentEmotions.sedih}%, Jijik: ${currentEmotions.jijik}% (Dominan: ${EMOTION_META[dominant].label}).`,
    `Intensitas Pesan User Saat Ini: ${intensity.level.toUpperCase()} (skor ${intensity.score}).`,
    `Sensitivitas Emosi Persona: reaktivitas ${persona.training.reactivity.toFixed(2)}x, inersia ${persona.training.inertia.toFixed(2)}.`,
    activeRulesText ? `Aturan Pelatihan Aktif:\n${activeRulesText}` : '',
    ``,
    `Tugas Anda:`,
    `1. Balas pesan user sepenuhnya DALAM KARAKTER "${persona.name}" menggunakan bahasa yang sama dengan user (umumnya Bahasa Indonesia yang natural dan ekspresif sesuai watak ${persona.archetype} & MBTI ${persona.mbti}${relationship ? `, serta selaras dengan hubungan "${relationship}"` : ''}${userName ? ` saat menyapa ${userName}` : ''}).`,
    `2. JANGAN menuliskan JSON mentah di dalam field "reply", dan JANGAN keluar dari karakter sebagai asisten AI generik.`,
    `3. Berikan evaluasi stimulus 6 emosi (senang, marah, takut, bingung, sedih, jijik) sebagai angka 0-100 yang mencerminkan reaksi emosional persona terhadap pesan user ini.`,
    `4. Tuliskan "internalThought" singkat (1 kalimat) dalam sudut pandang batin karakter yang menjelaskan alasan perubahan emosinya.`,
  ]
    .filter(Boolean)
    .join('\n');
}

export interface AnalyzedPersonaDraft {
  name: string;
  roleTitle: string;
  sourceCategory: string;
  mbti: MBTIType;
  archetype: Archetype;
  basePersonality: string;
  speakingStyle: string;
  webSummary: string;
  baselineEmotions: EmotionState;
  reactivity: number;
  inertia: number;
  suggestedRules: TrainingRule[];
}

const VALID_MBTI_SET = new Set<string>(MBTI_OPTIONS.map((m) => m.code));
const VALID_ARCHETYPE_SET = new Set<string>(Object.keys(ARCHETYPE_PRESETS));
const VALID_EMOTION_SET = new Set<string>(EMOTION_ORDER);

export function sanitizeAnalyzedDraft(
  raw: Record<string, unknown>,
  fallbackName: string
): AnalyzedPersonaDraft {
  const mbtiRaw = typeof raw.mbti === 'string' ? raw.mbti.trim().toUpperCase() : '';
  const mbti: MBTIType = VALID_MBTI_SET.has(mbtiRaw) ? (mbtiRaw as MBTIType) : 'INTJ';

  const archRaw = typeof raw.archetype === 'string' ? raw.archetype.trim() : '';
  const matchedArch = (Object.keys(ARCHETYPE_PRESETS) as Archetype[]).find(
    (a) => a.toLowerCase() === archRaw.toLowerCase()
  );
  const archetype: Archetype =
    matchedArch && VALID_ARCHETYPE_SET.has(matchedArch) ? matchedArch : 'Kustom';

  const preset = ARCHETYPE_PRESETS[archetype];
  const name =
    typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : fallbackName.trim();
  const roleTitle =
    typeof raw.roleTitle === 'string' && raw.roleTitle.trim()
      ? raw.roleTitle.trim()
      : `${mbti} · ${archetype}`;
  const sourceCategory =
    typeof raw.sourceCategory === 'string' && raw.sourceCategory.trim()
      ? raw.sourceCategory.trim()
      : 'Tokoh Referensi';
  const basePersonality =
    typeof raw.basePersonality === 'string' && raw.basePersonality.trim()
      ? raw.basePersonality.trim()
      : preset.description;
  const speakingStyle =
    typeof raw.speakingStyle === 'string' && raw.speakingStyle.trim()
      ? raw.speakingStyle.trim()
      : preset.speakingHint;
  const webSummary =
    typeof raw.webSummary === 'string' && raw.webSummary.trim()
      ? raw.webSummary.trim()
      : basePersonality;

  const rawEmotions =
    raw.baselineEmotions && typeof raw.baselineEmotions === 'object'
      ? (raw.baselineEmotions as Partial<EmotionState>)
      : preset.baseline;
  const baselineEmotions = normalizeEmotions(rawEmotions, preset.baseline);

  const reactivity =
    typeof raw.reactivity === 'number' && Number.isFinite(raw.reactivity)
      ? clamp(Number(raw.reactivity.toFixed(2)), 0.3, 2.0)
      : preset.reactivity;

  const inertia =
    typeof raw.inertia === 'number' && Number.isFinite(raw.inertia)
      ? clamp(Number(raw.inertia.toFixed(2)), 0.05, 0.85)
      : preset.inertia;

  const rawRules = Array.isArray(raw.suggestedRules) ? raw.suggestedRules : [];
  const suggestedRules: TrainingRule[] = rawRules
    .slice(0, 4)
    .map((item, idx) => {
      const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      const label =
        typeof obj.label === 'string' && obj.label.trim()
          ? obj.label.trim()
          : `Pemicu Karakter ${idx + 1}`;
      const keywords = Array.isArray(obj.triggerKeywords)
        ? obj.triggerKeywords
            .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
            .map((k) => k.trim().toLowerCase())
            .slice(0, 6)
        : [];
      const emoRaw =
        typeof obj.targetEmotion === 'string' ? obj.targetEmotion.trim().toLowerCase() : '';
      const targetEmotion: EmotionKey = VALID_EMOTION_SET.has(emoRaw)
        ? (emoRaw as EmotionKey)
        : 'senang';
      const boostAmount =
        typeof obj.boostAmount === 'number' && Number.isFinite(obj.boostAmount)
          ? Math.round(clamp(obj.boostAmount, 10, 60))
          : 28;

      return {
        id: `web-rule-${Date.now()}-${idx}`,
        label,
        triggerKeywords: keywords,
        targetEmotion,
        boostAmount,
        enabled: true,
      };
    })
    .filter((r) => r.triggerKeywords.length > 0);

  return {
    name,
    roleTitle,
    sourceCategory,
    mbti,
    archetype,
    basePersonality,
    speakingStyle,
    webSummary,
    baselineEmotions,
    reactivity,
    inertia,
    suggestedRules,
  };
}
