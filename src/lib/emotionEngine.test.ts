import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyEmotionTraining,
  buildSystemPrompt,
  detectConversationIntensity,
  estimateLocalStimulus,
  getDominantEmotion,
  getKaomojiVariants,
  normalizeEmotions,
  sanitizeAnalyzedDraft,
  selectKaomoji,
  type EmotionState,
  type Persona,
} from './emotionEngine';
import { DEFAULT_APP_SETTINGS, sanitizeAppSettings } from './settings';

const samplePersona: Persona = {
  id: 'test-tsundere',
  name: 'Aiko',
  roleTitle: 'Arsitek Strategis',
  mbti: 'INTJ',
  archetype: 'Tsundere',
  basePersonality: 'Cerdas, defensif, tapi diam-diam peduli.',
  speakingStyle: 'Sedikit ketus namun teliti.',
  baselineEmotions: {
    senang: 20,
    marah: 28,
    takut: 8,
    bingung: 26,
    sedih: 8,
    jijik: 10,
  },
  training: {
    reactivity: 1.3,
    inertia: 0.35,
    intensityBias: {
      rendah: 0.6,
      sedang: 1.0,
      tinggi: 1.4,
      ekstrem: 1.85,
    },
    rules: [
      {
        id: 'r1',
        label: 'Salah Tingkah Saat Dipuji',
        triggerKeywords: ['hebat', 'pintar', 'terima kasih'],
        targetEmotion: 'senang',
        boostAmount: 35,
        enabled: true,
      },
    ],
  },
};

test('normalizeEmotions always produces 6 non-negative integers summing to exactly 100', () => {
  const result = normalizeEmotions({
    senang: 33.3,
    marah: 33.3,
    takut: 33.3,
    bingung: -5,
    sedih: 0,
    jijik: 0,
  });
  const total = Object.values(result).reduce((sum, n) => sum + n, 0);
  assert.equal(total, 100);
  assert.equal(result.bingung, 0);
  assert.ok(result.senang >= 33 && result.senang <= 34);
});

test('normalizeEmotions falls back cleanly when all inputs are zero', () => {
  const fallback: EmotionState = {
    senang: 40,
    marah: 10,
    takut: 10,
    bingung: 20,
    sedih: 10,
    jijik: 10,
  };
  const result = normalizeEmotions({ senang: 0, marah: 0 }, fallback);
  assert.deepEqual(result, fallback);
});

test('detectConversationIntensity distinguishes calm vs extreme messages', () => {
  const calm = detectConversationIntensity('Halo, apa kabar hari ini?');
  const extreme = detectConversationIntensity('KENAPA KAMU BOHONG BANGET?! PARAH SEKALI!!');

  assert.equal(calm.level, 'rendah');
  assert.equal(extreme.level, 'ekstrem');
  assert.ok(extreme.score > calm.score);
  assert.ok(extreme.signals.length >= 2);
});

test('applyEmotionTraining responds more strongly to higher reactivity and triggers matching rules', () => {
  const prev = samplePersona.baselineEmotions;
  const highReactivityResult = applyEmotionTraining(
    prev,
    { senang: 60, bingung: 25, marah: 15 },
    'Kamu hebat banget hari ini!! Terima kasih ya!',
    samplePersona
  );

  const calmPersona: Persona = {
    ...samplePersona,
    training: {
      ...samplePersona.training,
      reactivity: 0.4,
      inertia: 0.8,
    },
  };
  const lowReactivityResult = applyEmotionTraining(
    prev,
    { senang: 60, bingung: 25, marah: 15 },
    'Kamu hebat banget hari ini!! Terima kasih ya!',
    calmPersona
  );

  assert.equal(
    Object.values(highReactivityResult.next).reduce((a, b) => a + b, 0),
    100
  );
  assert.ok(highReactivityResult.triggeredRules.includes('Salah Tingkah Saat Dipuji'));
  assert.ok(highReactivityResult.next.senang > lowReactivityResult.next.senang);
  assert.ok(highReactivityResult.kaomoji.length >= 3);
});

test('selectKaomoji adapts to archetype and emotion', () => {
  const tsundereBlush = selectKaomoji('marah', 0.8, 'Tsundere', 'bingung');
  const yandereLove = selectKaomoji('senang', 0.85, 'Yandere');
  const kuudereNeutral = selectKaomoji('marah', 0.3, 'Kuudere');

  assert.equal(tsundereBlush, '(///>_<///)');
  assert.equal(yandereLove, '(´♡‿♡`)');
  assert.equal(kuudereNeutral, '(ー_ー)');
});

test('getDominantEmotion and estimateLocalStimulus return valid states', () => {
  const stim = estimateLocalStimulus('Aku benci banget sama situasi yang kotor dan bau ini!', samplePersona);
  const dominant = getDominantEmotion(stim);
  assert.ok(['marah', 'jijik'].includes(dominant.key));
  const prompt = buildSystemPrompt(samplePersona, stim, detectConversationIntensity('Tes!'));
  assert.ok(prompt.includes('Aiko'));
  assert.ok(prompt.includes('INTJ'));
  assert.ok(prompt.includes('Tsundere'));
});

test('getKaomojiVariants returns deduplicated mood-specific variants', () => {
  const variants = getKaomojiVariants('senang', 'Yandere');
  assert.ok(variants.length >= 4);
  assert.equal(new Set(variants).size, variants.length);
  assert.ok(variants.includes('(♡˙︶˙♡)'));
});

test('sanitizeAnalyzedDraft validates MBTI, archetype, emotion normalization, and suggested rules', () => {
  const draft = sanitizeAnalyzedDraft(
    {
      name: 'Nikola Tesla',
      roleTitle: 'Penemu & Insinyur Listrik',
      sourceCategory: 'Tokoh Sejarah',
      mbti: 'intj',
      archetype: 'stoik',
      basePersonality: 'Visioner, perfeksionis, dan terobsesi pada sains.',
      speakingStyle: 'Formal, penuh metafora energi dan presisi.',
      baselineEmotions: { senang: 30, bingung: 40, marah: 10, takut: 5, sedih: 10, jijik: 5 },
      reactivity: 3.5,
      inertia: 0.99,
      suggestedRules: [
        {
          label: 'Antusiasme Penemuan',
          triggerKeywords: ['Listrik', 'Energi', 'Inovasi'],
          targetEmotion: 'senang',
          boostAmount: 95,
        },
        {
          label: 'Aturan Kosong',
          triggerKeywords: [],
          targetEmotion: 'invalid',
        },
      ],
    },
    'Tesla'
  );

  assert.equal(draft.mbti, 'INTJ');
  assert.equal(draft.archetype, 'Stoik');
  assert.equal(draft.reactivity, 2.0);
  assert.equal(draft.inertia, 0.85);
  assert.equal(
    Object.values(draft.baselineEmotions).reduce((a, b) => a + b, 0),
    100
  );
  assert.equal(draft.suggestedRules.length, 1);
  assert.equal(draft.suggestedRules[0].boostAmount, 60);
  assert.deepEqual(draft.suggestedRules[0].triggerKeywords, ['listrik', 'energi', 'inovasi']);
});

test('buildSystemPrompt includes user name, relationship, and custom note when provided', () => {
  const prompt = buildSystemPrompt(
    samplePersona,
    samplePersona.baselineEmotions,
    detectConversationIntensity('Halo!'),
    {
      userName: 'Fahmi',
      relationship: 'Sahabat Dekat',
      customNote: 'Gunakan sapaan santai.',
    }
  );
  assert.ok(prompt.includes('Fahmi'));
  assert.ok(prompt.includes('Sahabat Dekat'));
  assert.ok(prompt.includes('Gunakan sapaan santai.'));
});

test('sanitizeAppSettings validates theme, font, fontSize, and falls back safely', () => {
  const valid = sanitizeAppSettings({
    theme: 'midnight',
    font: 'lora',
    fontSize: 'large',
    user: {
      userName: 'Fahmi',
      relationship: 'Partner Riset',
      customNote: 'Diskusi singkat',
    },
  });
  assert.equal(valid.theme, 'midnight');
  assert.equal(valid.font, 'lora');
  assert.equal(valid.fontSize, 'large');
  assert.equal(valid.user.userName, 'Fahmi');
  assert.equal(valid.user.relationship, 'Partner Riset');

  const fallback = sanitizeAppSettings({
    theme: 'invalid-theme',
    font: 'comic-sans',
    fontSize: 'giant',
    user: { userName: 123, relationship: '   ' },
  });
  assert.deepEqual(fallback, DEFAULT_APP_SETTINGS);
});
