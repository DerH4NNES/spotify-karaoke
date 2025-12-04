import { describe, expect, it } from 'vitest';
import { parseLrc } from './parseLrc';

describe('parseLrc', () => {
  it('parses simple timestamped lines', () => {
    const raw = '[00:00.00]Hello\n[00:05.00]World';
    const res = parseLrc(raw);
    expect(res.length).toBe(2);
    expect(res[0].tStart).toBe(0);
    expect(res[0].tEnd).toBe(5000);
    expect(res[0].text).toBe('Hello');
    expect(res[1].tStart).toBe(5000);
    expect(res[1].text).toBe('World');
  });

  it('returns fallback unsynced line if no timestamps present', () => {
    const raw = 'This is a lyric without timestamps\nSecond line';
    const res = parseLrc(raw);
    expect(res.length).toBe(1);
    expect(res[0].tStart).toBe(0);
    expect(res[0].tEnd).toBe(5000);
    expect(res[0].text).toContain('This is a lyric');
  });

  it('parses inline word timings in seconds relative to line start', () => {
    const raw = '[00:10.00]<0.00>One <0.50>Two <1.00>Three';
    const res = parseLrc(raw);
    expect(res.length).toBe(1);
    const line = res[0];
    expect(line.tStart).toBe(10000);
    expect(line.words).toBeDefined();
    const words = line.words || [];
    expect(words.length).toBe(3);
    // First word start = line.tStart + 0ms
    expect(words[0].start).toBe(10000);
    // Second word start = line.tStart + 500ms
    expect(words[1].start).toBe(10000 + 500);
    // Third word start = line.tStart + 1000ms
    expect(words[2].start).toBe(10000 + 1000);
    // End of last word should equal tEnd (since no following word), which parser sets to line.tEnd
    expect(words[2].end).toBe(line.tEnd);
  });
});
