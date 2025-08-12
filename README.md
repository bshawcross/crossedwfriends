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

## Project tips

- Generate the daily puzzle data locally with:

  ```bash
  npm run generate:daily
  ```

- Run the test suite with:

  ```bash
  npm test
  ```

- Lint the codebase with:

  ```bash
  npm run lint
  ```

- WebAuthn authentication only accepts platform biometrics (e.g., Face ID).
  External security keys are not supported.

## Browser testing

- Confirmed in a clean incognito browser session with extensions disabled that no hydration errors related to `data-gr-*` attributes appear.
