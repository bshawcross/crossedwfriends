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
Run the generator to build the puzzle for today:

```bash
pnpm gen:daily
```

The script assembles word lists, creates a puzzle seeded by the date,
and then runs `validatePuzzle` to enforce structural rules. Validators
ensure every clue is normalized by `cleanClue`, answers obey the policy
from `isAnswerAllowed`, and the grid passes symmetry and length checks.

The answer policy draws from two word lists:

- `data/allowlist.json` – two-letter answers explicitly permitted.
- `data/denylist.json` – answers that should never appear.

To modify these lists, edit the JSON arrays and add the new entry in
uppercase. After any change, regenerate and verify:

```bash
pnpm gen:daily
pnpm test
pnpm lint
```

## Project tips

- Generate the daily puzzle data locally with:

  ```bash
  pnpm gen:daily
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

## Dev gotcha

Browser extensions like Grammarly modify the `<body>` element before React hydrates, which can trigger misleading hydration mismatch errors.

If you see these warnings, disable Grammarly or open the site in an incognito window without extensions. These mismatches are not bugs in the application.

## Browser testing

- Confirmed in a clean incognito browser session with extensions disabled that no hydration errors related to `data-gr-*` attributes appear.
