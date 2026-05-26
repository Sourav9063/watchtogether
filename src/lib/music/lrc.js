export function parseLrc(content) {
  if (typeof content !== "string") return [];
  const timestamp = /\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/;
  const lyrics = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const match = timestamp.exec(rawLine.trim());
    if (!match || !match[3].trim()) continue;
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) continue;
    lyrics.push({
      startTimeMs: Math.round((minutes * 60 + seconds) * 1000),
      text: match[3].trim(),
    });
  }

  return lyrics.sort((left, right) => left.startTimeMs - right.startTimeMs);
}
