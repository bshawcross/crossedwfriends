# crossedwfriends

## Environment variables

Before running Prisma CLI commands, make sure the `DATABASE_URL` environment variable is set. A default value is provided in the project's `.env` file:

```
DATABASE_URL="file:./prisma/dev.db"
```

You can load it in your shell with `source .env` or by copying it to `.env.local`. This variable must be available whenever you run commands like `npx prisma migrate dev` or `npx prisma generate`.

## Prisma setup

1. Install the Prisma packages:

   ```bash
   npm install prisma @prisma/client
   ```

2. Run database migrations and generate the Prisma client (ensure `DATABASE_URL` is configured first):

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## Puzzle quality gate

Daily puzzles are produced with a deterministic generation pipeline.
Run a quick bank coverage check before generating:

```bash
npm run tsx scripts/checkBanks.ts
```

This prints counts of unique normalized entries by answer length.
Run the generator to build the puzzle for today. You can optionally supply
"hero" terms to pin in the grid:

```bash
pnpm gen:daily [hero terms...]

# example usage
pnpm gen:daily "captain marvel" "black widow"
```

If no hero terms are provided, a default set is used. Two-letter answers are
always disallowed.

The script assembles word lists, creates a puzzle seeded by the date, and then
runs `validatePuzzle` to enforce structural rules. Validators ensure every clue
is normalized by `cleanClue`, answers obey the policy from `isValidFill`, and the
grid passes symmetry and length checks.

The answer policy draws from a deny list:

- `data/denylist.json` – answers that should never appear.

To modify the list, edit the JSON array in uppercase. After any change,
regenerate and verify:

```bash
pnpm gen:daily
pnpm test
pnpm lint
```

## Hero term placement

`planHeroPlacements` arranges provided hero terms across the 15×15 grid.
Terms are uppercased and sorted by length. If an odd number of terms is
given, the longest sits on the middle row. The rest are placed in symmetric
pairs above and below the center, all oriented across. Column positions are
calculated to center each term, and rows and columns are zero-indexed.

```ts
import { planHeroPlacements } from './lib/heroPlacement';

const placements = planHeroPlacements([
  'odysseus',
  'hercules',
  'achilles',
  'theseus',
  'perseus',
]);
console.log(placements);
```

Sample output:

```text
[
  { term: 'ODYSSEUS', row: 7, col: 3, dir: 'across' },
  { term: 'HERCULES', row: 5, col: 3, dir: 'across' },
  { term: 'ACHILLES', row: 9, col: 3, dir: 'across' },
  { term: 'THESEUS', row: 3, col: 4, dir: 'across' },
  { term: 'PERSEUS', row: 11, col: 4, dir: 'across' },
]
```

## Project tips

- Generate the daily puzzle data locally (optionally providing hero terms and allowing two-letter fills):

```bash
pnpm gen:daily [hero terms...]
  ```

- Run the test suite with:

  ```bash
  pnpm test
  ```

- Lint the codebase with:

  ```bash
  pnpm lint
  ```

- WebAuthn authentication only accepts platform biometrics (e.g., Face ID).
  External security keys are not supported.

## Local verification

Inspect candidate pool sizes:

```bash
npm run tsx scripts/debugPool.ts
```

## Dev gotcha

Browser extensions like Grammarly modify the `<body>` element before React hydrates, which can trigger misleading hydration mismatch errors.

If you see these warnings, disable Grammarly or open the site in an incognito window without extensions. These mismatches are not bugs in the application.

## Browser testing

- Confirmed in a clean incognito browser session with extensions disabled that no hydration errors related to `data-gr-*` attributes appear.
