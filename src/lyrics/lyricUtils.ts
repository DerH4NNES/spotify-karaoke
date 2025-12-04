import type { LrcLine } from './parseLrc';

/**
 * Berechnet den Index der aktuellen Zeile (Cursor) anhand der aktuellen Zeit.
 * @param lines Array der LrcLine-Objekte
 * @param currentTimeMs Aktuelle Zeit in Millisekunden
 * @returns Index der aktuellen Zeile
 */
export function getCurrentLyricCursor(lines: LrcLine[], currentTimeMs: number): number {
  if (!Array.isArray(lines) || lines.length === 0) return 0;
  let cursorIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineStartMs = Number(lines[i]?.tStart) || 0;
    const lineEndMs = Number(lines[i]?.tEnd) || lineStartMs;
    const isCurrentLine = currentTimeMs >= lineStartMs && currentTimeMs < lineEndMs;
    const isLastLine = i === lines.length - 1 && currentTimeMs >= lineEndMs;
    if (isCurrentLine) {
      cursorIndex = i;
      break;
    }
    if (isLastLine) {
      cursorIndex = i;
    }
  }
  return cursorIndex;
}
