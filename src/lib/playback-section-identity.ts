export interface PlaybackSectionTiming {
  start: number;
  end: number;
}

export function getPlaybackSectionId(section?: PlaybackSectionTiming | null): string {
  if (!section || typeof section.start !== "number" || typeof section.end !== "number") {
    return "";
  }
  return `${section.start}:${section.end}`;
}
