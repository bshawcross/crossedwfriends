import path from 'path';
import { tmpdir } from 'os';
import { describe, test, expect, vi } from 'vitest';
import { promises as fs } from 'fs';
import { largeWordList } from '../helpers/wordList';
import { missingLengthMask } from './missingLengthMask';

// vitest test

describe('genDaily with deterministic mask', () => {
  test('runs for over 10s and produces valid puzzle', async () => {
    vi.resetModules();

    // mock topic word providers
    vi.mock('../../lib/topics', () => {
      const wordList = largeWordList();
      return {
        getSeasonalWords: vi.fn().mockResolvedValue(wordList),
        getFunFactWords: vi.fn().mockResolvedValue(wordList),
        getCurrentEventWords: vi.fn().mockResolvedValue(wordList),
      };
    });

    // mock puzzle validators
    vi.mock('../../lib/validatePuzzle', () => ({
      validatePuzzle: () => [],
    }));

    vi.mock('../../src/validate/puzzle', () => ({
      validateSymmetry: () => true,
      validateMinSlotLength: () => null,
    }));

    // mock mask builder
    vi.mock('../../grid/mask', () => ({
      buildMask: () => missingLengthMask,
    }));

    // mock puzzle generator to simulate long run and backtracking
    vi.mock('../../lib/puzzle', () => {
      const sleep = (ms: number) => {
        const arr = new Int32Array(new SharedArrayBuffer(4));
        Atomics.wait(arr, 0, 0, ms);
      };
      return {
        generateDaily: (
          seed: string,
          _words: unknown[],
          _heroes: string[],
          _opts: unknown,
          mask: boolean[][],
        ) => {
          console.log(JSON.stringify({ level: 'info', message: 'backtrack', mock: true }));
          sleep(10000);
          const cells = [] as any[];
          const size = mask.length;
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              cells.push({
                row: r,
                col: c,
                isBlack: mask[r][c],
                answer: '',
                clueNumber: null,
                userInput: '',
                isSelected: false,
              });
            }
          }
          return {
            id: seed,
            title: 'Mock Puzzle',
            theme: '',
            across: [],
            down: [],
            cells,
          };
        },
      };
    });

    // fixed date for deterministic output
    vi.mock('../../utils/date', () => ({
      yyyyMmDd: () => '2024-01-03',
    }));

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg: string) => {
      logs.push(msg);
    });
    vi.spyOn(console, 'error').mockImplementation((msg: string) => {
      logs.push(msg);
    });

    const tmpDir = await fs.mkdtemp(path.join(tmpdir(), 'puzzle-mask-'));
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    const start = Date.now();
    await import('../../scripts/genDaily');
    await new Promise((r) => setTimeout(r, 10500));
    const total = Date.now() - start;

    const filePath = path.join(tmpDir, 'puzzles', '2024-01-03.json');
    const puzzle = JSON.parse(await fs.readFile(filePath, 'utf8'));
    expect(puzzle.cells).toHaveLength(225);

    const messages = logs
      .filter((l) => l.trim().startsWith('{'))
      .map((l) => JSON.parse(l).message);
    expect(messages).toContain('backtrack');
    expect(messages).not.toContain('missing_length');
    expect(messages).not.toContain('final_failure');

    expect(total).toBeGreaterThan(10000);

    process.chdir(originalCwd);
  }, 30000);
});
