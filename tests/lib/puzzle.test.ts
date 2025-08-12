import { describe, it, expect, vi } from 'vitest';
import { generateDaily, coordsToIndex, loadDemoFromFile, WordEntry } from '../../lib/puzzle';

describe('generateDaily', () => {
  it('produces deterministic puzzle layout and clues', () => {
    const wordList: WordEntry[] = [
      { answer: 'alpha', clue: 'clue1' },
      { answer: 'beta', clue: 'clue2' },
      { answer: 'gamma', clue: 'clue3' },
      { answer: 'delta', clue: 'clue4' },
      { answer: 'epsilon', clue: 'clue5' },
      { answer: 'zeta', clue: 'clue6' },
    ];
    const puzzle = generateDaily('test', wordList);
    const puzzle2 = generateDaily('test', wordList);
    expect(puzzle).toEqual(puzzle2);
    expect(puzzle.across[0]).toEqual({ number: 3, text: 'clue3', length: 2 });
    expect(puzzle.down[0]).toEqual({ number: 1, text: 'clue1', length: 2 });
    const cell = puzzle.cells[coordsToIndex(0, 1)];
    expect(cell).toMatchObject({ isBlack: false, clueNumber: 1, answer: 'A' });
  });

  it('handles empty word list', () => {
    const puzzle = generateDaily('empty', []);
    expect(puzzle.across[0].text).toBe(`Across ${puzzle.across[0].number}`);
    const firstCell = puzzle.cells.find((c) => !c.isBlack)!;
    expect(firstCell.answer).toBe(' ');
  });

  it('handles word list shorter than required', () => {
    const puzzle = generateDaily('test', [{ answer: 'alpha', clue: 'clue1' }]);
    expect(puzzle.down[0].text).toBe('clue1');
    expect(puzzle.down[1].text).toBe(`Down ${puzzle.down[1].number}`);
    expect(puzzle.across[0].text).toBe(`Across ${puzzle.across[0].number}`);
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
      cells: Array.from({ length: 225 }, () => ({
        row: 0,
        col: 0,
        isBlack: false,
        answer: '',
        clueNumber: null,
        userInput: '',
        isSelected: false,
      })),
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
    vi.unstubAllGlobals();
  });
});
