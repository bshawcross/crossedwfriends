import { promises as fs } from 'fs';
import path from 'path';
import { generateDaily, WordEntry } from '../lib/puzzle';
import { validatePuzzle } from '../lib/validatePuzzle';
import { getSeasonalWords, getFunFactWords, getCurrentEventWords } from '../lib/topics';
import { yyyyMmDd } from '../utils/date';
import { logInfo, logError, logWarn } from '../utils/logger';
import { getFallback } from '../utils/getFallback';

const defaultHeroTerms = ['CAPTAINMARVEL', 'BLACKWIDOW', 'SPIDERMAN', 'IRONMAN', 'THOR'];

function getPresentLengths(words: WordEntry[], allow2: boolean): Set<number> {
  const present = new Set<number>();
  for (const entry of words) {
    const len = entry.answer.length;
    if (len >= (allow2 ? 2 : 3) && len <= 15) {
      present.add(len);
    }
  }
  return present;
}

async function main() {
  const date = yyyyMmDd();
  const seed = `${date}:seasonal,funFacts,currentEvents`;
  const puzzleDate = new Date(`${date}T00:00:00Z`);

  const args = process.argv.slice(2);
  const allow2 = args.includes('--allow2');
  const heroTerms = args.filter((a) => !a.startsWith('--'));
  const [seasonal, funFacts, currentEvents] = await Promise.all([
    getSeasonalWords(puzzleDate),
    getFunFactWords(),
    getCurrentEventWords(puzzleDate)
  ]);
  let wordList: WordEntry[] = [...seasonal, ...funFacts, ...currentEvents];
  let present = getPresentLengths(wordList, allow2);
  let missingLengths: number[] = [];
  for (let len = 3; len <= 15; len++) {
    if (!present.has(len)) missingLengths.push(len);
  }

  if (missingLengths.length > 0) {
    for (const len of missingLengths) {
      const fallbackEntry = getFallback(len, Array(len).fill(''), { allow2 });
      if (fallbackEntry) {
        wordList.push(fallbackEntry);
        logInfo('fallback_word_used', { length: len, answer: fallbackEntry.answer });
      } else {
        logWarn('fallback_word_missing', { length: len });
      }
    }
  }

  const runtimeFallback = (len: number, letters: string[]): WordEntry | undefined => {
    const entry = getFallback(len, letters, { allow2 });
    if (entry) {
      logInfo('runtime_fallback_used', { length: len, answer: entry.answer });
      return entry;
    }
    logWarn('runtime_fallback_failed', { length: len, letters: letters.join('') });
    return undefined;
  };

  present = getPresentLengths(wordList, allow2);
  missingLengths = [];
  for (let len = 3; len <= 15; len++) {
    if (!present.has(len)) missingLengths.push(len);
  }
  if (missingLengths.length > 0) {
    missingLengths.forEach((len) => logError('missing_length', { length: len }));
    process.exit(1);
  }
  const puzzle = generateDaily(
    seed,
    wordList,
    heroTerms.length > 0 ? heroTerms : defaultHeroTerms,
    runtimeFallback,
    { allow2 },
  );
  const errors = validatePuzzle(puzzle, { checkSymmetry: true, allow2 });
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
