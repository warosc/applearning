/** Basic utility unit tests */

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function calcPct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 1000) / 10;
}

describe('formatTime', () => {
  test('returns dash for null', () => {
    expect(formatTime(null)).toBe('—');
  });

  test('formats zero seconds', () => {
    expect(formatTime(0)).toBe('0m 00s');
  });

  test('formats 90 seconds', () => {
    expect(formatTime(90)).toBe('1m 30s');
  });

  test('formats 3661 seconds', () => {
    expect(formatTime(3661)).toBe('61m 01s');
  });

  test('pads single-digit seconds', () => {
    expect(formatTime(65)).toBe('1m 05s');
  });
});

describe('calcPct', () => {
  test('returns 0 for zero total', () => {
    expect(calcPct(5, 0)).toBe(0);
  });

  test('returns 100 for perfect score', () => {
    expect(calcPct(10, 10)).toBe(100);
  });

  test('rounds to one decimal', () => {
    expect(calcPct(1, 3)).toBe(33.3);
  });

  test('returns 0 for 0 correct', () => {
    expect(calcPct(0, 20)).toBe(0);
  });
});
