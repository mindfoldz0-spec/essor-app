import { NextRequest, NextResponse } from "next/server";

/**
 * Voice-to-text via Sarvam STT.
 * Body: { audioBase64, mime, language }
 * Uses multipart/form-data as Sarvam expects a file upload.
 */
export async function POST(req: NextRequest) {
  try {
    const { audioBase64, mime = "audio/webm", language = "hi-IN" } = await req.json();
    if (!audioBase64) return NextResponse.json({ error: "audioBase64 required" }, { status: 400 });

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "SARVAM_API_KEY missing" }, { status: 500 });

    const bytes = Buffer.from(audioBase64, "base64");
    const ext = mime.includes("wav") ? "audio.wav" : mime.includes("mp3") ? "audio.mp3" : "audio.webm";
    const blob = new Blob([bytes], { type: mime });

    const form = new FormData();
    form.append("file", blob, ext);
    form.append("model", process.env.SARVAM_STT_MODEL || "saarika:v2.5");
    form.append("language_code", language);
    form.append("with_timestamps", "false");

    const sarvamRes = await fetch(process.env.SARVAM_STT_URL || "https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": apiKey },
      body: form,
    });

    if (!sarvamRes.ok) {
      const err = await sarvamRes.text();
      return NextResponse.json(
        { error: "Sarvam STT failed", detail: err.slice(0, 500) },
        { status: 502 }
      );
    }

    const json = await sarvamRes.json();
    const transcript: string = json?.transcript ?? json?.text ?? "";
    return NextResponse.json({ transcript, raw: json });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "stt error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
