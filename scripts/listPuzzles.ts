import { Firestore, FieldPath } from '@google-cloud/firestore';

async function main() {
  const projectId = process.env.FIRESTORE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIRESTORE_PROJECT_ID env var missing');
  }
  const firestore = new Firestore({ projectId });
  const collection = firestore.collection('puzzles');

  const countSnap = await collection.count().get();
  const total = countSnap.data().count;

  const firstSnap = await collection
    .orderBy(FieldPath.documentId())
    .limit(10)
    .get();
  const lastSnap = await collection
    .orderBy(FieldPath.documentId(), 'desc')
    .limit(10)
    .get();

  const firstIds = firstSnap.docs.map((doc) => doc.id);
  const lastIds = lastSnap.docs.map((doc) => doc.id).reverse();

  console.log('Total puzzles:', total);
  console.log('First 10 IDs:', firstIds.join(', '));
  console.log('Last 10 IDs:', lastIds.join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
