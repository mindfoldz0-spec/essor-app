# Essor

Voice-first, mobile-first platform for rural entrepreneurs in Maharashtra — sellers (farmers, tailors, kirana, transporters…) and buyers in one minimal red/white/black app.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4** + **styled-components v6** (SSR via `src/lib/registry.tsx`)
- **Neon Postgres** — anonymous device-ID profiles via `pg` Pool, no auth required

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Neon DATABASE_URL
npm run dev                  # http://localhost:3000
```

Database setup: run `scripts/schema.sql` with psql against your Neon `DATABASE_URL` — it creates the `user_profiles` table with indexes and an `updated_at` trigger.

## Voice (onboarding guidance + mic input)

Wired exactly like the previous Essor:

- **Where the voices live:** `public/voices/<lang>/<key>.wav` — committed in the repo, served statically. 45 clips = 15 prompts × 3 languages (`en-IN`, `hi-IN`, `mr-IN`). They ship with every deployment, play instantly, zero API cost.
- **One speaker per page, no mute:** each onboarding step auto-speaks its page prompt; the single speaker icon replays it. Step 1 (language) always speaks Hindi until a language is picked, then confirms in the chosen language ("आपने हिंदी भाषा चुनी है…").
- **Inputs speak their own hints:** name / shop-name / phone fields each have a dedicated relevant clip (e.g. Aadhaar-name hint), never the page text. While a clip plays, taps are ignored so it always finishes — no restarts, no overlaps.
- **Playback chain:** pre-baked file → IndexedDB device cache → live Sarvam TTS (`/api/voice/tts`, bulbul:v3) → browser `speechSynthesis` fallback.
- **Mic input:** `VoiceField` records → Sarvam STT (`/api/voice/stt`, saarika:v2.5) → fills name / shop name / phone.
- **Onboarding:** every step auto-speaks (toggle 🔊/🔇 in the step header, preference persists); replay button replays the step prompt.
- **Regenerate clips** (after editing `src/lib/voice-strings.ts`):
  ```bash
  npm run dev               # in one terminal
  npm run voice:download    # in another — skips files that already exist
  ```
  Key knobs: `SARVAM_SPEAKER` (default `rahul`), `SARVAM_STT_MODEL` (default `saarika:v2.5`).

## Scripts

| Command           | Purpose                  |
| ----------------- | ------------------------ |
| `npm run dev`     | Dev server               |
| `npm run build`   | Production build         |
| `npm run start`   | Serve the production build |
| `npm run lint`    | ESLint (flat config)     |

## Structure

```text
src/app/            Routes: / (home), /onboarding, /profile, /search, /orders, /api/health, /api/profile, /api/voice/*
src/components/     BottomNav, Loader, OnboardingGuard, VoiceButton, VoiceField, onboarding/ProgressHeader
src/lib/            i18n (translations.ts, languageContext.tsx), shared profile store (userProfile.ts), Neon db (db.ts), voice (voice.ts, voice-strings.ts, voice-key.ts)
public/voices/      Pre-baked Sarvam clips: <lang>/<key>.wav (11 prompts × en-IN/hi-IN/mr-IN)
scripts/schema.sql  Neon Postgres schema
```

## Notes

- Profiles are keyed by an anonymous `device_id` kept in `localStorage`; onboarding drafts persist there too (debounced) for crash recovery.
- Languages: English / हिंदी / मराठी — the choice is stored in `localStorage` and synced across tabs and components.
- `GET /api/health` reports whether `DATABASE_URL` is set and whether Neon is reachable.
- `GET/POST /api/profile` reads/writes `user_profiles` in Neon (server-side only, no DB creds in browser).
