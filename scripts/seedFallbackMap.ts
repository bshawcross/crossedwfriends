import { Firestore } from '@google-cloud/firestore';
import { log } from '../utils/logger';

async function main() {
  const firestore = new Firestore({
    projectId: process.env.FIRESTORE_PROJECT_ID,
  });

  const snapshot = await firestore.collection('puzzles').get();
  const ids = snapshot.docs.map((d) => d.id).sort();

  if (ids.length === 0) {
    log.warn('no_puzzles_found');
    return;
  }

  const map: Record<string, string> = {};
  const dayCount = 366;
  for (let i = 0; i < dayCount; i++) {
    map[`d${i + 1}`] = ids[i % ids.length];
  }

  await firestore.collection('config').doc('fallbackMap').set(map);

  const preview: Record<string, string> = {};
  const previewDays = Math.min(30, dayCount);
  for (let i = 1; i <= previewDays; i++) {
    preview[`d${i}`] = map[`d${i}`];
  }

  log.info('fallback_map_seeded', {
    days: dayCount,
    uniquePuzzles: ids.length,
    preview,
  });
}

main().catch((err) => {
  log.error('seed_failed', { error: err.message });
  process.exit(1);
});

