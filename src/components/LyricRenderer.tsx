import React, { useEffect, useState } from 'react';
import type { LrcLine } from '../lyrics/parseLrc';
import '../scss/components/lyric-renderer.scss';
import { ProgressBar } from 'react-bootstrap';
import { getCurrentLyricCursor } from '../lyrics/lyricUtils';

type Props = {
  lines: LrcLine[];
  currentPositionMs?: number;
  offsetMs: number;
  durationMs?: number;
  onSeek?: (ms: number) => void;
  initialProgressMs?: number;
};

export default function LyricRenderer({
  lines,
  currentPositionMs = 0,
  offsetMs,
  onSeek,
  initialProgressMs = 0,
}: Props) {
  const [cursor, setCursor] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const currentTimeMs =
      (typeof currentPositionMs === 'number' ? currentPositionMs : initialProgressMs) + offsetMs;
    if (!Array.isArray(lines) || lines.length === 0) {
      setCursor(0);
      setProgress(0);
      return;
    }
    const cursorIndex = getCurrentLyricCursor(lines, currentTimeMs);
    const currentLine = lines[cursorIndex];
    const lineStartMs = Number(currentLine?.tStart) || 0;
    const lineEndMs = Number(currentLine?.tEnd) || lineStartMs;
    const progressValue =
      lineEndMs > lineStartMs
        ? Math.max(0, Math.min(1, (currentTimeMs - lineStartMs) / (lineEndMs - lineStartMs)))
        : 0;
    setCursor(cursorIndex);
    setProgress(progressValue);
  }, [lines, currentPositionMs, offsetMs, initialProgressMs]);

  const renderWords = (ln: LrcLine, realIndex: number, t: number) => {
    try {
      if (!ln || !Array.isArray(ln.words) || ln.words.length === 0) {
        // Zeige "-leer-" wenn der Text leer ist
        return <>{ln?.text?.trim() ? ln.text : '<music>'}</>;
      }

      return (
        <>
          {ln.words.map((w, wi) => {
            const start = Number(w?.start) || 0;
            const end = Number(w?.end) || start;
            const done = t >= end;
            const isWordCurrent = t >= start && t < end;
            const wordCls = done ? 'done' : isWordCurrent ? 'highlight' : '';
            const handleWordClick = () => {
              if (typeof onSeek === 'function') onSeek(Math.max(0, start - offsetMs));
            };
            return (
              <div
                key={`${realIndex}-${wi}`}
                className={`lyric-word ${wordCls} me-2 ${onSeek ? 'clickable' : ''}`}
                onClick={handleWordClick}
                role={onSeek ? 'button' : undefined}
                aria-label={w?.word ?? ''}
                tabIndex={onSeek ? 0 : -1}
              >
                {String(w?.word ?? '')}
              </div>
            );
          })}
        </>
      );
    } catch (e) {
      console.error('LyricRenderer: failed to render words for line', e, ln);
      return <>{ln?.text ?? ''}</>;
    }
  };

  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <div className="lyric-renderer d-flex flex-column justify-content-center">
      {!Array.isArray(lines) || lines.length === 0 ? (
        <div className="lyric-empty text-center small">Keine synchronisierten Lyrics gefunden.</div>
      ) : (
        <div className="lyric-list mw-100 text-center">
          {lines.slice(Math.max(0, cursor - 3), cursor + 6).map((ln, i) => {
            const realIndex = Math.max(0, cursor - 3) + i;
            const isCurrent = realIndex === cursor;
            const isNext = realIndex === cursor + 1;
            return (
              <div
                key={realIndex}
                className={`lyric-line ${isCurrent ? 'current text-white fw-bolder' : isNext ? 'text-white' : 'text-white-50'} mb-3`}
              >
                <div
                  aria-live={isCurrent ? 'polite' : undefined}
                  aria-atomic={isCurrent ? true : undefined}
                  className={
                    isCurrent
                      ? 'fw-bold fs-1 text-center bg-white bg-opacity-10 shadow-sm py-2 px-4'
                      : isNext
                        ? 'fs-2 text-center text-white-50'
                        : 'fs-3 text-center text-white-75'
                  }
                >
                  {renderWords(
                    ln,
                    realIndex,
                    (typeof currentPositionMs === 'number'
                      ? currentPositionMs
                      : initialProgressMs) + offsetMs
                  )}
                </div>
                {isCurrent && (
                  <div className="mt-2">
                    <ProgressBar now={pct} min={0} max={100} variant="primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
