/** Stable cache key shared by the TTS route and the download script. */
export function voiceTextKey(language: string, text: string): string {
  const clean = text.slice(0, 500);
  return `${language}:k${shortHash(clean)}_${clean.length}`;
}

/**
 * Short content hash. Appended as ?v= to voice file URLs and device
 * cache keys, so edited prompt wording automatically busts every cache.
 */
export function shortHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}
