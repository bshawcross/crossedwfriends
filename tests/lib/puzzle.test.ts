import { describe, it, expect, vi } from 'vitest';
import { generateDaily, coordsToIndex, loadDemoFromFile, WordEntry } from '../../lib/puzzle';
import { largeWordList } from '../helpers/wordList';

describe('generateDaily', () => {
  it('rejects answers whose length does not match a slot', () => {
    const wordList: WordEntry[] = [
      { answer: 'ABCDEFGHIJKLMNOP', clue: 'skip' },
      { answer: 'OK', clue: 'fit' },
      ...largeWordList(),
    ];
    const puzzle = generateDaily('test', wordList);
    const allClues = [...puzzle.across, ...puzzle.down].map((c) => c.text);
    expect(allClues).toContain('fit');
    expect(allClues).not.toContain('skip');
    expect(puzzle.across[0].enumeration).toBe('(2)');
  });

  it('uses fallback when no matching word is found', () => {
    const wordList = largeWordList().filter((w) => w.answer.length !== 3);
    const fallbackFn = vi.fn(
      (len: number, letters: string[]): WordEntry | undefined => {
        if (len === 3) {
          const answer = letters.map((ch) => ch || 'A').join('').padEnd(len, 'A');
          return { answer, clue: 'fb' };
        }
      },
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const puzzle = generateDaily('seed', wordList, [], fallbackFn);
    expect(fallbackFn).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    const clues = [...puzzle.across, ...puzzle.down].map((c) => c.text);
    expect(clues).toContain('fb');
    warnSpy.mockRestore();
  });
});

describe('coordsToIndex', () => {
  it('converts coordinates to linear index', () => {
    expect(coordsToIndex(0, 0)).toBe(0);
    expect(coordsToIndex(2, 5)).toBe(35);
    expect(coordsToIndex(3, 4, 10)).toBe(34);
  });
});

describe('loadDemoFromFile', () => {
  it('normalizes clue text and parses puzzle data', async () => {
    const grid = [
      '...###########.',
      '....##########.',
      '.....#########.',
      '###############',
      '###############',
      '###############',
      '###############',
      '###############',
      '###############',
      '###############',
      '###############',
      '###############',
      '###############',
      '###############',
      '###############',
    ];
    const cells = grid.flatMap((row, r) =>
      row.split('').map((ch, c) => ({
        row: r,
        col: c,
        isBlack: ch === '#',
        answer: '',
        clueNumber: null,
        userInput: '',
        isSelected: false,
      })),
    );
    const sample = {
      id: 'demo1',
      title: 'Sample Puzzle',
      theme: 'Demo',
      across: [
        { number: 1, text: ['1', 'First'], length: 3 },
        { number: 2, text: { clue: 'Second' }, length: 4 },
        { number: 3, text: "[3, 'Third']", length: 5 },
      ],
      down: [{ number: 1, text: 'Down Clue', length: 3 }],
      cells,
    };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => sample }));
    vi.stubGlobal('fetch', fetchMock);
    const puzzle = await loadDemoFromFile();
    expect(fetchMock).toHaveBeenCalled();
    expect(puzzle.id).toBe('demo1');
    expect(puzzle.title).toBe('Sample Puzzle');
    expect(puzzle.across[0].text).toBe('First');
    expect(puzzle.across[1].text).toBe('Second');
    expect(puzzle.across[2].text).toBe('Third');
    expect(puzzle.across[0].enumeration).toBe('(3)');
    vi.unstubAllGlobals();
  });
});
