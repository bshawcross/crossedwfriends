import { promises as fs } from 'fs';
import path from 'path';
import { generateDaily, WordEntry } from '../lib/puzzle';
import fallbackWords from '../data/fallbackWords.json';
import { validatePuzzle } from '../lib/validatePuzzle';
import { getSeasonalWords, getFunFactWords, getCurrentEventWords } from '../lib/topics';
import { yyyyMmDd } from '../utils/date';
import { logInfo, logError, logWarn } from '../utils/logger';

const defaultHeroTerms = ['CAPTAINMARVEL', 'BLACKWIDOW', 'SPIDERMAN', 'IRONMAN', 'THOR'];

function getPresentLengths(words: WordEntry[]): Set<number> {
  const present = new Set<number>();
  for (const entry of words) {
    const len = entry.answer.length;
    if (len >= 2 && len <= 15) {
      present.add(len);
    }
  }
  return present;
}

async function main() {
  const date = yyyyMmDd();
  const seed = `${date}:seasonal,funFacts,currentEvents`;
  const puzzleDate = new Date(`${date}T00:00:00Z`);
  const [seasonal, funFacts, currentEvents] = await Promise.all([
    getSeasonalWords(puzzleDate),
    getFunFactWords(),
    getCurrentEventWords(puzzleDate)
  ]);
  let wordList: WordEntry[] = [...seasonal, ...funFacts, ...currentEvents];
  let present = getPresentLengths(wordList);
  let missingLengths: number[] = [];
  for (let len = 2; len <= 15; len++) {
    if (!present.has(len)) missingLengths.push(len);
  }

  const fallbackList = fallbackWords as WordEntry[];
  if (missingLengths.length > 0) {
    for (const len of missingLengths) {
      const fallbackEntry = fallbackList.find((entry) => entry.answer.length === len);
      if (fallbackEntry) {
        wordList.push(fallbackEntry);
        logInfo('fallback_word_used', { length: len, answer: fallbackEntry.answer });
      } else {
        logWarn('fallback_word_missing', { length: len });
      }
    }
  }

  fallbackList.forEach((entry) => {
    if (!wordList.some((w) => w.answer === entry.answer)) {
      wordList.push(entry);
    }
  });

  present = getPresentLengths(wordList);
  missingLengths = [];
  for (let len = 2; len <= 15; len++) {
    if (!present.has(len)) missingLengths.push(len);
  }
  if (missingLengths.length > 0) {
    missingLengths.forEach((len) => logError('missing_length', { length: len }));
    process.exit(1);
  }
  const heroTerms = process.argv.slice(2);
  const puzzle = generateDaily(seed, wordList, heroTerms.length > 0 ? heroTerms : defaultHeroTerms);
  const errors = validatePuzzle(puzzle, { checkSymmetry: true });
  if (errors.length > 0) {
    errors.forEach((err) => logError('puzzle_invalid', { error: err }));
    process.exit(1);
  }

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
