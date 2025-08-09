import { promises as fs } from 'fs';
import path from 'path';
import { generateDaily } from '../lib/puzzle';
import { topicSources } from '../topicSources';
import { yyyyMmDd } from '../utils/date';

async function main() {
  const date = yyyyMmDd();
  const seed = `${date}:${topicSources.join(',')}`;
  const puzzle = generateDaily(seed);

  const puzzlesDir = path.join(process.cwd(), 'puzzles');
  await fs.mkdir(puzzlesDir, { recursive: true });
  const filePath = path.join(puzzlesDir, `${date}.json`);
  await fs.writeFile(filePath, JSON.stringify(puzzle, null, 2));
  console.log(`Generated puzzle for ${date} at ${filePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
