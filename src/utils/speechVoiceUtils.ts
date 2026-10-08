/**
 * Speech Synthesis Voice utilities
 * Provides voice deduplication, language filtering, and unique key generation
 * to prevent React duplicate key errors and duplicate dropdown options.
 */

export interface SpeechVoiceLike {
  voiceURI: string;
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
}

/**
 * Deduplicates an array of SpeechSynthesisVoice items by voiceURI and name.
 * Browsers (especially Chromium / Windows / Android) frequently enumerate the
 * same voice multiple times (e.g. local vs remote or 32/64 bit SAPI).
 */
export function deduplicateVoices<T extends SpeechVoiceLike>(voices: T[]): T[] {
  if (!Array.isArray(voices)) return [];
  const seen = new Set<string>();
  return voices.filter((voice) => {
    // Unique signature based on voiceURI and name
    const signature = voice.voiceURI
      ? `uri:${voice.voiceURI}`
      : `name:${voice.name}|lang:${voice.lang}`;
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}

/**
 * Filters and deduplicates voices matching a target language code prefix.
 */
export function getLanguageVoices<T extends SpeechVoiceLike>(voices: T[], langCode: string): T[] {
  if (!Array.isArray(voices) || !langCode) return [];
  const prefix = langCode.slice(0, 2).toLowerCase();
  const matching = voices.filter((voice) =>
    (voice.lang || "").replace("_", "-").toLowerCase().startsWith(prefix),
  );
  return deduplicateVoices(matching);
}

/**
 * Produces a guaranteed unique React key for a voice option.
 */
export function getUniqueVoiceKey(voice: SpeechVoiceLike, index: number): string {
  const identifier = voice.voiceURI || voice.name || "voice";
  return `${identifier}__idx_${index}`;
}
