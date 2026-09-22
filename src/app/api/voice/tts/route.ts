import { NextRequest, NextResponse } from "next/server";

/**
 * Text-to-speech via Sarvam bulbul:v3.
 * Body: { text, language ("en-IN"|"hi-IN"|"mr-IN"), speaker? }
 * Pre-baked clips in public/voices mean this is only hit for new/edited
 * wording — the device then caches the result in IndexedDB.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, language = "en-IN", speaker } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }
    const clean = text.slice(0, 500);

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "SARVAM_API_KEY missing" }, { status: 500 });

    const sarvamRes = await fetch(process.env.SARVAM_TTS_URL || "https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        inputs: [clean],
        target_language_code: language,
        speaker: speaker || process.env.SARVAM_SPEAKER || "rahul",
        pitch: 0,
        pace: 1,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v3",
      }),
    });

    if (!sarvamRes.ok) {
      const err = await sarvamRes.text();
      return NextResponse.json({ error: "Sarvam TTS failed", detail: err.slice(0, 500) }, { status: 502 });
    }

    const json = await sarvamRes.json();
    const b64: string | undefined = json?.audios?.[0];
    if (!b64) return NextResponse.json({ error: "No audio returned" }, { status: 502 });

    const buf = Buffer.from(b64, "base64");
    return new NextResponse(buf, {
      headers: { "Content-Type": "audio/wav", "X-Cache": "sarvam-fresh" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "tts error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
