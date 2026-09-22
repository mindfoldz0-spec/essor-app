import { NextResponse } from "next/server";
import { VOICE_KEYS, VOICE_STRINGS, type VoiceCode } from "@/lib/voice-strings";

const CODES: VoiceCode[] = ["en-IN", "hi-IN", "mr-IN"];

/**
 * GET /api/voice/manifest — lists every pre-baked clip.
 * Used by scripts/download-voices.mjs to bake all audio into public/voices/.
 */
export async function GET() {
  const items = CODES.flatMap((lang) =>
    VOICE_KEYS.map((key) => ({
      key,
      lang,
      text: VOICE_STRINGS[key][lang],
      file: `voices/${lang}/${key}.wav`,
    }))
  );
  return NextResponse.json({ count: items.length, items });
}
