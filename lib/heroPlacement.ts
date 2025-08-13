export type Placement = { term: string; row: number; col: number; dir: 'across' | 'down' };

export function planHeroPlacements(heroTerms: string[]): Placement[] {
  const size = 15;
  const center = Math.floor(size / 2); // 7 for size 15
  const terms = heroTerms.map((t) => t.toUpperCase()).sort((a, b) => b.length - a.length);
  const placements: Placement[] = [];
  const remaining = [...terms];

  const hasCenter = remaining.length % 2 === 1;
  if (hasCenter) {
    const term = remaining.shift()!;
    const col = Math.floor((size - term.length) / 2);
    placements.push({ term, row: center, col, dir: 'across' });
  }

  for (let i = 0; i < remaining.length; i += 2) {
    const topTerm = remaining[i];
    const bottomTerm = remaining[i + 1];
    const pairIndex = i / 2;
    let topRow: number;
    let bottomRow: number;
    if (hasCenter) {
      topRow = center - 2 * (pairIndex + 1);
      bottomRow = center + 2 * (pairIndex + 1);
    } else {
      topRow = center - (1 + 2 * pairIndex);
      bottomRow = center + (1 + 2 * pairIndex);
    }
    if (topTerm) {
      const colTop = Math.floor((size - topTerm.length) / 2);
      placements.push({ term: topTerm, row: topRow, col: colTop, dir: 'across' });
    }
    if (bottomTerm) {
      const colBottom = Math.floor((size - bottomTerm.length) / 2);
      placements.push({ term: bottomTerm, row: bottomRow, col: colBottom, dir: 'across' });
    }
  }

  return placements;
}
