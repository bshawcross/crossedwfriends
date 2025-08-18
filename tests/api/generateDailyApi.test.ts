import { describe, it, expect, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { NextRequest } from 'next/server';
import { largeWordList } from '../helpers/wordList';

const mockTopics = {
  getSeasonalWords: vi.fn().mockResolvedValue(largeWordList()),
  getFunFactWords: vi.fn().mockResolvedValue(largeWordList()),
  getCurrentEventWords: vi.fn().mockResolvedValue(largeWordList())
};

async function readJson(file: string) {
  for (let i = 0; i < 10; i++) {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      await new Promise(r => setTimeout(r, 10));
    }
  }
  throw new Error(`Unable to read ${file}`);
}

describe('generateDaily and API integration', () => {
  it('writes puzzle and API returns same puzzle; rolls over at midnight', async () => {
    vi.useFakeTimers();
    const tmpDir = await fs.mkdtemp(path.join(tmpdir(), 'daily-'));
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    vi.mock('../../lib/topics', () => mockTopics);
    vi.mock('../../lib/validatePuzzle', () => ({ validatePuzzle: () => [] }));
    vi.mock('../../src/validate/puzzle', () => ({ validateSymmetry: () => true, validateMinSlotLength: () => [] }));

    vi.setSystemTime(new Date('2024-01-01T23:59:00-08:00'));
    process.argv.push('--allow2=true');
    await import('../../scripts/genDaily');
    process.argv.pop();
    vi.useRealTimers();
    await new Promise(r => setTimeout(r, 0));

    const filePath1 = path.join(tmpDir, 'puzzles', '2024-01-01.json');
    const puzzleFromFile = await readJson(filePath1);

    const { GET } = await import('../../app/api/puzzle/[date]/route');
    const req = new NextRequest('http://test/api/puzzle/2024-01-01');
    const res = await GET(req, { params: { date: '2024-01-01' } });
    const puzzleFromApi = await res.json();
    expect(puzzleFromApi).toEqual(puzzleFromFile);

    vi.useFakeTimers();
    vi.resetModules();
    vi.mock('../../lib/topics', () => mockTopics);
    vi.mock('../../lib/validatePuzzle', () => ({ validatePuzzle: () => [] }));
    vi.mock('../../src/validate/puzzle', () => ({ validateSymmetry: () => true, validateMinSlotLength: () => [] }));
    vi.setSystemTime(new Date('2024-01-02T00:01:00-08:00'));
    process.argv.push('--allow2=true');
    await import('../../scripts/genDaily');
    process.argv.pop();
    vi.useRealTimers();
    await new Promise(r => setTimeout(r, 0));

    const filePath2 = path.join(tmpDir, 'puzzles', '2024-01-02.json');
    const puzzleNextDay = await readJson(filePath2);
    expect(puzzleNextDay.id).toBe('2024-01-02:seasonal,funFacts,currentEvents');
    expect(puzzleNextDay.id).not.toBe(puzzleFromFile.id);

    process.chdir(originalCwd);
    vi.useRealTimers();
  });
});
