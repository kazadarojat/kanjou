<div align="center">

# Kanjou Harness

### Persona AI Chat & Dynamic Emotion Simulation

**A configurable AI character playground with six-dimensional emotion telemetry, personality presets, character research, and interactive training.**

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-4-303030?logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini_API-4285F4?logo=google&logoColor=white)](https://ai.google.dev/gemini-api/docs)

**[Live Demo](https://kazadarojat.github.io/kanjou/)** · **[Open in Google AI Studio](https://ai.studio/apps/83b293ba-0bae-4e7f-880b-eb2e4181b5b1)** · **[Source Code](https://github.com/kazadarojat/kanjou)**

</div>

---

## About / Tentang Proyek

**Kanjou Harness** adalah aplikasi web untuk membuat, mengonfigurasi, dan berinteraksi dengan persona AI yang memiliki **state emosi tersimulasi**. Setiap karakter memiliki identitas, tipe MBTI, arketipe, karakter dasar, gaya bicara, distribusi enam emosi, serta aturan respons emosi yang dapat diatur pengguna.

Aplikasi memanfaatkan Google Gemini API untuk membangkitkan dialog dan stimulus emosi. Emotion engine deterministik kemudian memperbarui state emosi berdasarkan stimulus, intensitas pesan, sensitivitas (*reactivity*), inersia (*inertia*), dan aturan kata kunci yang ditentukan pengguna.

> **Scope:** Nilai emosi adalah indikator internal simulasi karakter, **bukan** hasil pengukuran kondisi psikologis manusia, probabilitas diagnostik, maupun asesmen klinis. MBTI dan arketipe digunakan sebagai perangkat desain persona, bukan diagnosis atau klasifikasi psikologis tervalidasi.

## Features / Fitur

| Area | Fitur yang tersedia |
| --- | --- |
| **AI chat** | Percakapan dengan persona berbasis Gemini, riwayat terbatas yang dikirim ke model, respons terstruktur, dan monolog batin singkat karakter |
| **Persona management** | Persona bawaan, membuat/mengedit/menghapus persona, avatar preset atau unggahan foto, identitas, MBTI, arketipe, kepribadian, dan gaya bicara |
| **Character research** | Analisis tokoh sejarah, figur publik, dan karakter fiksi melalui Google Search grounding; fallback ke Wikipedia pada kondisi tertentu; referensi web |
| **Emotion engine** | Enam emosi: senang, marah, takut, bingung, sedih, dan jijik; normalisasi persentase; perubahan state dan delta per giliran |
| **Emotion training** | Reaktivitas, inersia, bias intensitas, aturan pemicu kata kunci, simulasi/kalibrasi lokal, dan reset emosi |
| **Visualization** | Grafik batang, radar, tren/riwayat, emosi dominan, perubahan persen, kaomoji interaktif dan animasi |
| **Personalization** | Preferensi nama pengguna, hubungan dengan persona, catatan interaksi, pilihan font, ukuran font, serta beberapa tema terang/gelap |
| **Local persistence** | Persona, chat, grafik/riwayat emosi, dan pengaturan disimpan dalam LocalStorage browser |

### Supported archetypes / Arketipe

- Tsundere
- Yandere
- Kuudere
- Dandere
- Genki
- Stoik
- Melankolis
- Kustom

Semua 16 tipe MBTI tersedia sebagai opsi desain persona.

## How It Works / Cara Kerja

\`\`\`mermaid
flowchart TD
    A[User message] --> B[Express API /api/chat]
    B --> C[Build persona system prompt]
    C --> D[Gemini generates structured response]
    D --> E[Emotion stimulus]
    E --> F[Emotion engine: rules + reactivity + inertia]
    F --> G[Normalized emotion state]
    D --> H[Persona reply + internal thought]
    G --> I[React UI: charts + kaomoji]
    H --> I
    I --> J[LocalStorage session state]
\`\`\`

Pada setiap giliran, enam skor emosi dipertahankan sebagai bilangan bulat non-negatif dengan total **100%**. Pembaruan dilakukan dengan *weighted blending* antara kondisi sebelumnya dan stimulus baru, lalu dinormalisasi kembali:

\`\`\`text
nextEmotion ≈ (1 - alpha) * previousEmotion + alpha * targetEmotion

alpha = clamp(
  (1 - inertia) * reactivity
  * (0.55 + intensityScore * 0.5)
  * intensityBias,
  0.08,
  0.94
)
\`\`\`

\`alpha\` adalah koefisien transisi, **bukan** confidence score. Intensitas pesan saat ini diperkirakan lewat heuristik teks seperti penekanan tanda baca, huruf kapital, kata penguat, dan panjang pesan. Angka persentase pada grafik bersifat **relatif terhadap enam emosi**, bukan tingkat kepastian ilmiah.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS 4, custom CSS, Lucide React |
| Animation | Motion |
| Backend | Node.js, Express 4, tsx |
| AI provider | Google GenAI SDK (\`@google/genai\`) |
| Model configured in source | \`gemini-4-hydrogen\` |
| Web research | Gemini Google Search grounding, Wikipedia MediaWiki API fallback |
| Persistence | Browser LocalStorage |
| Package lockfile | \`bun.lock\` |

## Getting Started / Instalasi Lokal

### Requirements

- Node.js versi yang kompatibel dengan Vite 8 (disarankan **Node.js 22.12+**).
- npm (termasuk dalam Node.js) atau package manager kompatibel lainnya.
- Gemini API key dengan akses dan kuota untuk model yang dikonfigurasi.
- Koneksi internet untuk respons Gemini dan pencarian karakter.

### 1. Clone & install

\`\`\`bash
git clone https://github.com/kazadarojat/kanjou.git
cd kanjou
npm install
\`\`\`

> Repository saat ini bersifat **private**. Clone memerlukan izin akses GitHub.

### 2. Set environment variables

Salin contoh konfigurasi dan isi dengan nilai Anda sendiri:

\`\`\`bash
cp .env.example .env
\`\`\`

Di Windows PowerShell:

\`\`\`powershell
Copy-Item .env.example .env
\`\`\`

Edit file \`.env\`:

\`\`\`dotenv
GEMINI_API_KEY=your_real_gemini_api_key
PORT=3000
\`\`\`

\`GEMINI_API_KEY\` diperlukan oleh server. \`PORT\` bersifat opsional (default: \`3000\`). \`APP_URL\` tersedia di template untuk lingkungan AI Studio, tetapi tidak dikonsumsi langsung oleh backend saat ini.

**Penting:** Implementasi server memanggil \`dotenv.config()\`, yang secara default membaca **\`.env\`**, bukan \`.env.local\`. Jika ingin memakai \`.env.local\` untuk server, perlu konfigurasi loading environment tambahan. Jangan memasukkan API key ke kode frontend, Git, screenshot, atau issue publik.

### 3. Start development server

\`\`\`bash
npm run dev
\`\`\`

Buka **http://localhost:3000** (atau port yang ditetapkan dalam \`PORT\`). Express menjalankan middleware Vite pada mode development, sehingga **satu perintah** sudah menjalankan frontend dan endpoint API.

### 4. Build

\`\`\`bash
npm run build
\`\`\`

Build frontend tersimpan di direktori \`dist/\`. Ini **bukan standalone backend**: endpoint \`/api/*\` tetap membutuhkan runtime server Express.

### 5. Type-check

\`\`\`bash
npm run lint
\`\`\`

Script \`lint\` saat ini menjalankan \`tsc --noEmit\`, **bukan** ESLint.

### 6. Unit tests (current setup)

Source test tersedia di \`src/lib/emotionEngine.test.ts\` menggunakan \`node:test\`, tetapi belum tersedia script \`npm test\` di \`package.json\`. Pada lingkungan dengan \`tsx\` terpasang, jalankan:

\`\`\`bash
npx tsx --test src/lib/emotionEngine.test.ts
\`\`\`

Belum ada klaim bahwa keseluruhan test suite atau build telah lolos CI.

## Production Deployment

Kanjou merupakan aplikasi **frontend + Node.js backend**. Frontend statis dipublikasikan melalui [GitHub Pages](https://kazadarojat.github.io/kanjou/), sedangkan endpoint Express harus dijalankan secara terpisah pada platform yang mendukung Node.js (misalnya VM/container atau hosting Node.js). GitHub Pages tidak menjalankan `server.ts` maupun endpoint `/api/*`.

### Build and start (Node.js runtime)

\`\`\`bash
npm install
npm run build
NODE_ENV=production npx tsx server.ts
\`\`\`

Pada Windows PowerShell:

\`\`\`powershell
$env:NODE_ENV = "production"
npx tsx server.ts
\`\`\`

Server menggunakan \`express.static('dist')\` pada production dan melayani endpoint \`/api/health\`, \`/api/chat\`, serta \`/api/persona/analyze\`.

> **Known limitation:** Script \`npm start\` pada \`package.json\` saat ini berisi \`node server.ts\`. Kompatibilitasnya bergantung pada versi Node.js dan dukungan TypeScript native. Untuk deployment yang konsisten, gunakan runtime/transpilasi TS yang didukung, atau build backend JS sebagai langkah terpisah. Perintah di atas memakai \`tsx\` yang tercantum dalam devDependencies, sehingga instalasi harus menyertakan devDependencies.

Untuk menghubungkan frontend GitHub Pages ke backend, set GitHub repository variable `VITE_API_BASE_URL` ke origin backend (contoh `https://api.example.com`, tanpa akhiran `/api`), lalu jalankan ulang workflow. Backend juga harus mengizinkan CORS dari `https://kazadarojat.github.io`. Variabel `VITE_*` masuk ke bundle browser dan tidak boleh berisi API key.

**Sebelum deployment publik:** tambahkan autentikasi/otorisasi, rate limiting per pengguna/IP, validasi request yang ketat, pembatasan biaya dan token, kebijakan privasi, observabilitas, serta penanganan timeout dan error. Endpoint Gemini saat ini menerima request tanpa kontrol akses aplikasi dan menggunakan API key di sisi server. **Jangan mengeksposnya ke publik tanpa proteksi.**

### API overview

| Method | Route | Purpose |
| --- | --- | --- |
| \`GET\` | \`/api/health\` | Status dasar dan informasi apakah API key dikonfigurasi |
| \`POST\` | \`/api/chat\` | Membuat balasan persona serta menghitung state emosi baru |
| \`POST\` | \`/api/persona/analyze\` | Meriset tokoh dan menyusun draft persona dari referensi web |

Contoh payload \`/api/chat\`:

\`\`\`json
{
  "message": "Halo, apa kabarmu?",
  "history": [],
  "persona": {
    "id": "example",
    "name": "Aiko",
    "roleTitle": "Rekan Diskusi",
    "mbti": "INTJ",
    "archetype": "Tsundere",
    "basePersonality": "Analitis dan agak defensif.",
    "speakingStyle": "Ringkas dan teliti.",
    "baselineEmotions": {
      "senang": 20, "marah": 28, "takut": 8,
      "bingung": 26, "sedih": 8, "jijik": 10
    },
    "training": {
      "reactivity": 1.3,
      "inertia": 0.35,
      "intensityBias": {
        "rendah": 0.65, "sedang": 1,
        "tinggi": 1.45, "ekstrem": 1.85
      },
      "rules": []
    }
  }
}
\`\`\`

Payload \`persona\` lengkap diperlukan oleh logika server. API saat ini belum memiliki skema publik versi stabil; format ini adalah ilustrasi sesuai implementasi kode saat ini.

## Project Structure

\`\`\`text
kanjou/
├── .aistudio/                 # AI Studio artifacts (development metadata/assets)
├── .env.example              # Environment configuration example
├── index.html                # Frontend HTML entry
├── metadata.json             # AI Studio app metadata
├── package.json              # Dependencies and scripts
├── bun.lock                  # Bun lockfile
├── server.ts                 # Express server, Gemini, research endpoints
├── vite.config.ts            # Vite and asset copy configuration
├── tsconfig.json             # TypeScript configuration
└── src/
    ├── main.tsx              # React entry point
    ├── App.tsx               # Persona/session state and orchestration
    ├── index.css             # Global styles and themes
    ├── assets/images/        # Bundled persona avatars
    ├── data/
    │   └── defaultPersonas.ts
    ├── lib/
    │   ├── emotionEngine.ts  # Emotion simulation and prompt logic
    │   ├── emotionEngine.test.ts
    │   └── settings.ts       # Theme/font/user preferences
    └── components/
        ├── ChatWorkspace.tsx
        ├── EmotionCharts.tsx
        ├── EmotionTrainerPanel.tsx
        ├── InteractiveKaomoji.tsx
        ├── PersonaAvatar.tsx
        ├── PersonaEditorModal.tsx
        ├── PersonaSidebar.tsx
        └── SettingsModal.tsx
\`\`\`

## Data Storage & Privacy

- Persona dan riwayat percakapan disimpan di **LocalStorage browser** yang digunakan. Tidak ada database akun atau sinkronisasi lintas perangkat pada implementasi saat ini.
- Pesan, sebagian riwayat percakapan (hingga 12 giliran sebelumnya), konfigurasi persona, preferensi pengguna, dan state emosi yang diperlukan dikirim ke backend untuk memproses balasan.
- Backend mengirim materi yang relevan ke **Google Gemini API** untuk menghasilkan respons AI.
- Analisis karakter dapat mengakses Google Search grounding dan Wikipedia.
- Menghapus data browser/LocalStorage dapat menghilangkan persona dan riwayat. Saat ini belum ada mekanisme backup/sinkronisasi otomatis.
- Jangan mengirim rahasia, data pribadi sensitif, atau dokumen rahasia tanpa mengevaluasi kebijakan pemrosesan data provider yang digunakan.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| \`503\`: Gemini API key unavailable | Pastikan \`GEMINI_API_KEY\` benar-benar terbaca oleh proses backend dari environment atau \`.env\` |
| \`400\` / \`403\` from Gemini | Periksa API key, izin, akses model, dan konfigurasi project |
| \`429\` quota exceeded | Periksa kuota/rate limit provider; kurangi frekuensi request |
| Blank UI or frontend failure | Baca browser console, output \`npm run dev\`, dan hasil \`npm run build\` |
| \`/api/chat\` returns 404 on static hosting | Jalankan backend Express; \`dist/\` saja tidak mencakup API |
| Character analysis lacks sources | Periksa koneksi web, ketersediaan Google Search grounding, dan fallback Wikipedia |
| Old persona/settings reappear or data disappears | Periksa LocalStorage, private browsing, storage quota, dan perangkat/browser yang digunakan |
| Production start fails on \`server.ts\` | Jalankan dengan \`tsx\` atau build backend menjadi JS kompatibel |

## Current Limitations & Roadmap

**Implemented:** persona chat, editor, web-assisted persona research, six-emotion simulation, user-defined rules, kaomoji, charts, customization, and local persistence.

**Recommended improvements (not implemented or not verified as production-ready):**

- [ ] API authentication, rate limiting, and strict schema validation
- [ ] Request cancellation, timeouts, and safer concurrent session handling
- [ ] Automated test script, frontend/API integration tests, and CI
- [ ] Reliable production backend build/start workflow
- [ ] Optional streaming chat and token/cost telemetry
- [ ] Better long-session persistence, export/import, and backup
- [ ] Grounding quality checks and character-consistency evaluation
- [ ] Emotion-model calibration against evaluation datasets
- [ ] Privacy controls and explicit data deletion/export UX

## Development & Contributions

Repository ini masih berada pada tahap pengembangan. Sebelum berkontribusi, pelajari \`src/lib/emotionEngine.ts\` untuk logika simulasi dan \`server.ts\` untuk kontrak AI API. Usahakan menambahkan tes untuk perubahan fungsi emosi, mempertahankan total distribusi **100%**, dan tidak melakukan commit secret ataupun data percakapan pribadi.

Tidak ada lisensi open-source yang dinyatakan di repository saat dokumentasi ini ditulis. **All rights reserved** berlaku secara default; keberadaan kode di GitHub tidak otomatis memberikan izin penggunaan ulang atau redistribusi.

## Acknowledgements

Built with [React](https://react.dev/), [Vite](https://vite.dev/), [Express](https://expressjs.com/), and the [Google Gemini API](https://ai.google.dev/gemini-api/docs).

Originally developed as a [Google AI Studio](https://ai.studio/) app.

---

<div align="center"><sub>Kanjou Harness · Persona behavior simulation, not psychological measurement.</sub></div>
