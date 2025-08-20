export type PoolsByLength = {
  heroesByLen: Record<number, number>;
  dictByLen: Record<number, number>;
};

export function assertCoverage(requiredLens: number[], pools: PoolsByLength): void {
  const requiredCount: Record<number, number> = {};
  for (const len of requiredLens) {
    requiredCount[len] = (requiredCount[len] || 0) + 1;
  }

  for (const [lenStr, needed] of Object.entries(requiredCount)) {
    const len = Number(lenStr);
    const heroes = pools.heroesByLen[len] || 0;
    const dict = pools.dictByLen[len] || 0;
    const available = heroes + dict;
    if (available >= needed) continue;
    throw {
      message: 'puzzle_invalid',
      error: 'slot_coverage',
      detail: {
        length: len,
        required: needed,
        available: { heroes, dict },
      },
    };
  }
}
