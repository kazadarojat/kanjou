import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  applyEmotionTraining,
  buildSystemPrompt,
  detectConversationIntensity,
  normalizeEmotions,
  sanitizeAnalyzedDraft,
  type EmotionState,
  type Persona,
  type UserPromptContext,
  type WebSourceRef,
} from './src/lib/emotionEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  message?: string;
  history?: ChatTurn[];
  persona?: Persona;
  currentEmotions?: EmotionState;
  userPreferences?: UserPromptContext;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractErrorStatus(err: unknown): number {
  const directStatus = (err as { status?: number })?.status;
  if (typeof directStatus === 'number' && directStatus > 0) return directStatus;
  const msg = err instanceof Error ? err.message : String(err || '');
  try {
    const parsed = JSON.parse(msg);
    const code = parsed?.error?.code;
    if (typeof code === 'number') return code;
  } catch {
    // not JSON
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('"code":429')) return 429;
  if (msg.includes('PERMISSION_DENIED') || msg.includes('"code":403')) return 403;
  if (msg.includes('API_KEY_INVALID') || msg.includes('"code":400')) return 400;
  return 500;
}

function formatGeminiError(err: unknown, fallback: string): { status: number; message: string } {
  const status = extractErrorStatus(err);
  if (status === 429) {
    return {
      status: 429,
      message:
        'Kuota Gemini API sedang penuh atau mencapai batas sementara (429). Tunggu beberapa saat lalu coba lagi, atau periksa kuota API key di Settings > Secrets.',
    };
  }
  if (status === 403 || status === 400) {
    return {
      status,
      message: `Permintaan Gemini API ditolak (${status}). Periksa GEMINI_API_KEY di panel Settings > Secrets.`,
    };
  }
  const rawMsg = err instanceof Error ? err.message : fallback;
  try {
    const parsed = JSON.parse(rawMsg);
    if (typeof parsed?.error?.message === 'string') {
      return { status, message: parsed.error.message };
    }
  } catch {
    // plain text
  }
  return { status, message: rawMsg || fallback };
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = extractErrorStatus(err);
      const retryable = status === 503 || status === 500;
      if (!retryable || attempt === maxAttempts - 1) {
        throw err;
      }
      const delayMs = 400 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

async function fetchWikipediaResearch(
  characterName: string,
  categoryHint: string
): Promise<{ notes: string; sources: WebSourceRef[] }> {
  const headers = {
    'User-Agent': 'KanjouHarness/1.0 (https://localhost:3000; contact@kanjou.local)',
    Accept: 'application/json',
  };

  const queryWiki = async (lang: 'id' | 'en', query: string) => {
    const searchUrl =
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}` +
      `&srlimit=3&utf8=1&format=json`;
    const searchRes = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(7000) });
    if (!searchRes.ok) return { extracts: [] as string[], sources: [] as WebSourceRef[] };
    const searchData = (await searchRes.json()) as {
      query?: { search?: Array<{ title?: string }> };
    };
    const titles = (searchData.query?.search || [])
      .map((item) => item.title)
      .filter((t): t is string => Boolean(t))
      .slice(0, 2);

    if (titles.length === 0) {
      return { extracts: [] as string[], sources: [] as WebSourceRef[] };
    }

    const extractUrl =
      `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro=1&explaintext=1` +
      `&inprop=url&redirects=1&titles=${encodeURIComponent(titles.join('|'))}&format=json`;
    const extractRes = await fetch(extractUrl, { headers, signal: AbortSignal.timeout(7000) });
    if (!extractRes.ok) return { extracts: [] as string[], sources: [] as WebSourceRef[] };
    const extractData = (await extractRes.json()) as {
      query?: {
        pages?: Record<
          string,
          { title?: string; extract?: string; fullurl?: string }
        >;
      };
    };

    const pages = Object.values(extractData.query?.pages || {});
    const extracts: string[] = [];
    const sources: WebSourceRef[] = [];

    for (const page of pages) {
      if (page.title && page.extract) {
        extracts.push(`[${lang.toUpperCase()} Wikipedia — ${page.title}]\n${page.extract.slice(0, 1400)}`);
      }
      if (page.fullurl) {
        sources.push({
          title: `${page.title || characterName} (${lang.toUpperCase()} Wikipedia)`,
          url: page.fullurl,
        });
      }
    }

    return { extracts, sources };
  };

  const [idWiki, enWiki] = await Promise.allSettled([
    queryWiki('id', characterName),
    queryWiki('en', `${characterName}`),
  ]);

  const extracts: string[] = [];
  const sources: WebSourceRef[] = [];
  const seenUrls = new Set<string>();

  for (const result of [idWiki, enWiki]) {
    if (result.status === 'fulfilled') {
      extracts.push(...result.value.extracts);
      for (const src of result.value.sources) {
        if (!seenUrls.has(src.url) && sources.length < 5) {
          seenUrls.add(src.url);
          sources.push(src);
        }
      }
    }
  }

  const notes =
    extracts.length > 0
      ? extracts.join('\n\n')
      : `Tokoh/karakter yang diminta: ${characterName} (kategori: ${categoryHint}).`;

  return { notes, sources };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(getGeminiClient()) });
});

app.post('/api/chat', async (req, res) => {
  const body = (req.body || {}) as ChatRequestBody;
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const persona = body.persona;

  if (!message) {
    res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    return;
  }

  if (!persona || !persona.name || !persona.mbti || !persona.archetype) {
    res.status(400).json({ error: 'Konfigurasi persona tidak valid.' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error:
        'GEMINI_API_KEY belum tersedia di Settings > Secrets. Silakan atur API key terlebih dahulu, atau gunakan Simulasi Latihan Emosi di panel kanan.',
    });
    return;
  }

  const currentEmotions = normalizeEmotions(
    body.currentEmotions || persona.baselineEmotions,
    persona.baselineEmotions
  );
  const intensity = detectConversationIntensity(message);
  const systemInstruction = buildSystemPrompt(
    persona,
    currentEmotions,
    intensity,
    body.userPreferences
  );

  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  const contents = [
    ...history.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description:
                  'Balasan dialog penuh dalam karakter persona, natural, tanpa format JSON atau penjelasan meta.',
              },
              internalThought: {
                type: Type.STRING,
                description:
                  'Monolog batin singkat (1 kalimat) mengapa karakter merasakan perubahan emosi ini.',
              },
              emotionStimulus: {
                type: Type.OBJECT,
                properties: {
                  senang: { type: Type.NUMBER },
                  marah: { type: Type.NUMBER },
                  takut: { type: Type.NUMBER },
                  bingung: { type: Type.NUMBER },
                  sedih: { type: Type.NUMBER },
                  jijik: { type: Type.NUMBER },
                },
                required: ['senang', 'marah', 'takut', 'bingung', 'sedih', 'jijik'],
              },
            },
            required: ['reply', 'internalThought', 'emotionStimulus'],
          },
        },
      })
    );

    const rawText = (response.text ?? '{}').trim();
    let parsed: {
      reply?: string;
      internalThought?: string;
      emotionStimulus?: Partial<EmotionState>;
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        reply: rawText || '...',
        internalThought: 'Mencerna ucapan lawan bicara.',
        emotionStimulus: currentEmotions,
      };
    }

    const trained = applyEmotionTraining(
      currentEmotions,
      parsed.emotionStimulus || currentEmotions,
      message,
      persona
    );

    res.json({
      reply: parsed.reply || '...',
      internalThought: parsed.internalThought || '',
      emotions: trained.next,
      deltas: trained.deltas,
      dominant: trained.dominant,
      kaomoji: trained.kaomoji,
      intensity: trained.intensity,
      triggeredRules: trained.triggeredRules,
    });
  } catch (err: unknown) {
    const formatted = formatGeminiError(err, 'Gagal menghubungi Gemini API.');
    res.status(formatted.status).json({ error: formatted.message });
  }
});

interface AnalyzePersonaBody {
  characterName?: string;
  category?: 'otomatis' | 'sejarah' | 'publik_figur' | 'fiksi_film_game';
}

const CATEGORY_HINT: Record<NonNullable<AnalyzePersonaBody['category']>, string> = {
  otomatis: 'tokoh sejarah, publik figur, atau karakter fiksi (film/game/anime/novel)',
  sejarah: 'tokoh sejarah dunia/nusantara',
  publik_figur: 'publik figur, ilmuwan, seniman, atau tokoh masyarakat modern',
  fiksi_film_game: 'karakter fiksi dari film, serial, anime, atau video game',
};

app.post('/api/persona/analyze', async (req, res) => {
  const body = (req.body || {}) as AnalyzePersonaBody;
  const characterName = typeof body.characterName === 'string' ? body.characterName.trim() : '';
  const category = body.category || 'otomatis';

  if (!characterName || characterName.length < 2) {
    res.status(400).json({ error: 'Masukkan nama tokoh atau karakter minimal 2 karakter.' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: 'GEMINI_API_KEY belum tersedia di Settings > Secrets untuk menganalisa tokoh dari web.',
    });
    return;
  }

  try {
    const categoryLabel = CATEGORY_HINT[category] || CATEGORY_HINT.otomatis;
    let researchNotes = '';
    const seenUrls = new Set<string>();
    const sources: WebSourceRef[] = [];

    // Step 1: Web-grounded research via Gemini Google Search (falls back to Wikipedia Web API if grounding quota is 429)
    try {
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          `Telusuri informasi faktual dari web mengenai "${characterName}" (${categoryLabel}).`,
          `Rangkum dalam Bahasa Indonesia:`,
          `1. Identitas resmi, era/karya asal (sejarah, publik figur, film, atau game), dan perannya.`,
          `2. Watak, kepribadian dasar, nilai moral, serta kelemahan atau sisi emosionalnya.`,
          `3. Gaya bicara, diksi khas, dan cara merespons tekanan, pujian, atau konflik.`,
          `4. Estimasi tipe MBTI yang paling mendekati beserta alasannya.`,
          `5. Pemicu emosi utama (hal yang membuatnya senang, marah, takut, bingung, sedih, atau jijik).`,
        ].join('\n'),
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      researchNotes = (searchResponse.text ?? '').trim();
      const rawChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      for (const chunk of rawChunks) {
        const uri = chunk?.web?.uri;
        if (uri && !seenUrls.has(uri)) {
          seenUrls.add(uri);
          sources.push({
            title: chunk.web?.title || uri,
            url: uri,
          });
        }
        if (sources.length >= 5) break;
      }
    } catch (searchErr: unknown) {
      const searchStatus = extractErrorStatus(searchErr);
      if (searchStatus === 403 || searchStatus === 400) {
        throw searchErr;
      }
      // Google Search grounding rate-limited/unavailable: query live Wikipedia web search & extracts
      const wiki = await fetchWikipediaResearch(characterName, categoryLabel);
      researchNotes = wiki.notes;
      for (const src of wiki.sources) {
        if (!seenUrls.has(src.url) && sources.length < 5) {
          seenUrls.add(src.url);
          sources.push(src);
        }
      }
    }

    if (!researchNotes || sources.length === 0) {
      const wiki = await fetchWikipediaResearch(characterName, categoryLabel);
      if (!researchNotes) {
        researchNotes = wiki.notes;
      }
      for (const src of wiki.sources) {
        if (!seenUrls.has(src.url) && sources.length < 5) {
          seenUrls.add(src.url);
          sources.push(src);
        }
      }
    }

    // Step 2: Synthesize structured Persona profile from web research
    const synthesisResponse = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          `Berdasarkan hasil riset web berikut tentang "${characterName}", susun profil Persona AI dalam format JSON terstruktur.`,
          `Catatan Riset Web:\n${researchNotes || `Karakter: ${characterName} (${categoryLabel})`}`,
          ``,
          `Panduan pengisian:`,
          `- sourceCategory: pilih salah satu yang paling akurat: "Tokoh Sejarah", "Publik Figur", atau "Karakter Fiksi (Film/Game)".`,
          `- mbti: salah satu dari 16 kode MBTI standar (INTJ, INTP, ENTJ, ENTP, INFJ, INFP, ENFJ, ENFP, ISTJ, ISFJ, ESTJ, ESFJ, ISTP, ISFP, ESTP, ESFP).`,
          `- archetype: pilih yang paling mendekati dari: Tsundere, Yandere, Kuudere, Dandere, Genki, Stoik, Melankolis, atau Kustom.`,
          `- baselineEmotions: nilai 6 emosi (senang, marah, takut, bingung, sedih, jijik) dengan total 100.`,
          `- reactivity: angka 0.3 hingga 2.0 (seberapa cepat emosi berubah).`,
          `- inertia: angka 0.05 hingga 0.85 (seberapa kuat emosi bertahan).`,
          `- suggestedRules: 2 atau 3 aturan pemicu emosi spesifik tokoh ini (kata kunci Bahasa Indonesia yang relevan saat diajak bicara).`,
          `- webSummary: ringkasan singkat 1-2 kalimat hasil analisa web dalam Bahasa Indonesia.`,
        ].join('\n'),
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              roleTitle: { type: Type.STRING },
              sourceCategory: { type: Type.STRING },
              mbti: { type: Type.STRING },
              archetype: { type: Type.STRING },
              basePersonality: { type: Type.STRING },
              speakingStyle: { type: Type.STRING },
              webSummary: { type: Type.STRING },
              reactivity: { type: Type.NUMBER },
              inertia: { type: Type.NUMBER },
              baselineEmotions: {
                type: Type.OBJECT,
                properties: {
                  senang: { type: Type.NUMBER },
                  marah: { type: Type.NUMBER },
                  takut: { type: Type.NUMBER },
                  bingung: { type: Type.NUMBER },
                  sedih: { type: Type.NUMBER },
                  jijik: { type: Type.NUMBER },
                },
                required: ['senang', 'marah', 'takut', 'bingung', 'sedih', 'jijik'],
              },
              suggestedRules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    triggerKeywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    targetEmotion: { type: Type.STRING },
                    boostAmount: { type: Type.NUMBER },
                  },
                  required: ['label', 'triggerKeywords', 'targetEmotion', 'boostAmount'],
                },
              },
            },
            required: [
              'name',
              'roleTitle',
              'sourceCategory',
              'mbti',
              'archetype',
              'basePersonality',
              'speakingStyle',
              'webSummary',
              'reactivity',
              'inertia',
              'baselineEmotions',
              'suggestedRules',
            ],
          },
        },
      })
    );

    const rawJson = (synthesisResponse.text ?? '{}').trim();
    let parsedRaw: Record<string, unknown> = {};
    try {
      parsedRaw = JSON.parse(rawJson);
    } catch {
      parsedRaw = {};
    }

    const draft = sanitizeAnalyzedDraft(parsedRaw, characterName);

    res.json({
      draft,
      sources,
    });
  } catch (err: unknown) {
    const formatted = formatGeminiError(err, 'Gagal menganalisa karakter dari web.');
    res.status(formatted.status).json({ error: formatted.message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Kanjou Harness server running on http://localhost:${port}`);
  });
}

startServer();
