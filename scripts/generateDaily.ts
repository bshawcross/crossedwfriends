import { promises as fs } from 'fs';
import path from 'path';
import { generateDaily } from '../lib/puzzle';
import { getSeasonalWords, getFunFactWords, getCurrentEventWords } from '../lib/topics';
import { yyyyMmDd } from '../utils/date';
import { logInfo, logError } from '../utils/logger';

async function main() {
  const date = yyyyMmDd();
  const seed = `${date}:seasonal,funFacts,currentEvents`;
  const puzzleDate = new Date(`${date}T00:00:00Z`);
  const [seasonal, funFacts, currentEvents] = await Promise.all([
    getSeasonalWords(puzzleDate),
    getFunFactWords(),
    getCurrentEventWords(puzzleDate)
  ]);
  const wordList = [...seasonal, ...funFacts, ...currentEvents];
  const puzzle = generateDaily(seed, wordList);

  const puzzlesDir = path.join(process.cwd(), 'puzzles');
  try {
    await fs.mkdir(puzzlesDir, { recursive: true });
  } catch (e) {
    logError('mkdir_failed', { dir: puzzlesDir, error: (e as Error).message });
    throw e;
  }

  const filePath = path.join(puzzlesDir, `${date}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(puzzle, null, 2));
    logInfo('puzzle_written', { date, filePath });
  } catch (e) {
    logError('write_failed', { filePath, error: (e as Error).message });
    throw e;
  }
}

main().catch((err) => {
  logError('generate_daily_failed', { error: (err as Error).message });
  process.exit(1);
});
