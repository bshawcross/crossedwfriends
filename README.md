# crossedwfriends

## Environment variables

Before running Prisma CLI commands, make sure the `DATABASE_URL` environment variable is set. A default value is provided in the project's `.env` file:

```
DATABASE_URL="file:./prisma/dev.db"
```

You can load it in your shell with `source .env` or by copying it to `.env.local`. This variable must be available whenever you run commands like `npx prisma migrate dev`.

