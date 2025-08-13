import path from 'path';
import { tmpdir } from 'os';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { largeWordList } from '../helpers/wordList';

const seasonalMock = vi.fn();
const funFactMock = vi.fn();
const currentMock = vi.fn();

vi.mock('../../lib/topics', () => ({
  getSeasonalWords: seasonalMock,
  getFunFactWords: funFactMock,
  getCurrentEventWords: currentMock,
}));

vi.mock('../../lib/validatePuzzle', () => ({
  validatePuzzle: () => [],
}));

vi.mock('../../utils/date', () => ({
  yyyyMmDd: () => '2024-01-02',
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('generateDaily script', () => {
  test('writes puzzle file with expected metadata', async () => {
    vi.resetModules();
    seasonalMock.mockResolvedValue(largeWordList());
    funFactMock.mockResolvedValue(largeWordList());
    currentMock.mockResolvedValue(largeWordList());
    vi.doMock('../../lib/validatePuzzle', () => ({ validatePuzzle: () => [] }));

    const fsMod = await import('fs');
    const fs = fsMod.promises;
    const tmpDir = await fs.mkdtemp(path.join(tmpdir(), 'puzzle-'));
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    await import('../../scripts/genDaily');
    await new Promise((r) => setTimeout(r, 50));

    const filePath = path.join(tmpDir, 'puzzles', '2024-01-02.json');
    const puzzle = JSON.parse(await fs.readFile(filePath, 'utf8'));

    expect(puzzle.id).toBe('2024-01-02:seasonal,funFacts,currentEvents');
    expect(puzzle.title).toBe('Daily Placeholder');
    expect(puzzle.cells).toHaveLength(225);
    expect(seasonalMock).toHaveBeenCalledWith(new Date('2024-01-02T00:00:00Z'));
    expect(currentMock).toHaveBeenCalledWith(new Date('2024-01-02T00:00:00Z'));

    process.chdir(originalCwd);
  });

  test('exits when topic fetching fails', async () => {
    vi.resetModules();
    seasonalMock.mockRejectedValue(new Error('boom'));
    funFactMock.mockResolvedValue([]);
    currentMock.mockResolvedValue([]);
    vi.doMock('../../lib/validatePuzzle', () => ({ validatePuzzle: () => [] }));

    const fsMod = await import('fs');
    const fs = fsMod.promises;
    const tmpDir = await fs.mkdtemp(path.join(tmpdir(), 'puzzle-err-'));
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../scripts/genDaily');
    await new Promise((r) => setTimeout(r, 0));

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
    const files = await fs.readdir(tmpDir);
    expect(files).toHaveLength(0);

    process.chdir(originalCwd);
  });
});
