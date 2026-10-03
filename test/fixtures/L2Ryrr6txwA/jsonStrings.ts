import { CaptionCue } from "../../../src/types";
import { parseRawCaptionData } from "../../../src/utils/captionParser";

import arJson from "./ar.json";
import enJson from "./en.json";
import esJson from "./es.json";
import heJson from "./he.json";
import itJson from "./it.json";
import ruJson from "./ru.json";

const arJsonRaw = typeof arJson === "string" ? arJson : JSON.stringify(arJson);
const enJsonRaw = typeof enJson === "string" ? enJson : JSON.stringify(enJson);
const esJsonRaw = typeof esJson === "string" ? esJson : JSON.stringify(esJson);
const heJsonRaw = typeof heJson === "string" ? heJson : JSON.stringify(heJson);
const itJsonRaw = typeof itJson === "string" ? itJson : JSON.stringify(itJson);
const ruJsonRaw = typeof ruJson === "string" ? ruJson : JSON.stringify(ruJson);

export const JSON3_RAW_MAP: Record<string, string> = {
  ar: arJsonRaw,
  en: enJsonRaw,
  es: esJsonRaw,
  he: heJsonRaw,
  iw: heJsonRaw,
  il: heJsonRaw,
  it: itJsonRaw,
  ru: ruJsonRaw,
};

// Parse JSON3 timed-text subtitle fixtures for video L2Ryrr6txwA
const parsedAr = parseRawCaptionData(arJsonRaw || "").cues;
const parsedEn = parseRawCaptionData(enJsonRaw || "").cues;
const parsedEs = parseRawCaptionData(esJsonRaw || "").cues;
const parsedHe = parseRawCaptionData(heJsonRaw || "").cues;
const parsedIt = parseRawCaptionData(itJsonRaw || "").cues;
const parsedRu = parseRawCaptionData(ruJsonRaw || "").cues;

export const L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS: Record<string, CaptionCue[]> = {
  ar: parsedAr,
  en: parsedEn,
  es: parsedEs,
  he: parsedHe,
  iw: parsedHe,
  il: parsedHe,
  it: parsedIt,
  ru: parsedRu,
};

export function getRawJson3ForLanguage(langCode: string): string | null {
  const clean = (langCode || "").toLowerCase().trim().split(/[-_]/)[0];
  if (clean === "il" || clean === "iw") return JSON3_RAW_MAP["he"] || null;
  return JSON3_RAW_MAP[clean] || JSON3_RAW_MAP[langCode] || null;
}
