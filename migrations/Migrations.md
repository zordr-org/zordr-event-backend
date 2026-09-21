# Database migrations — Prisma 8 (contract-based CLI)

This project uses Prisma 8.0.0-rc, whose CLI is structured differently from
classic Prisma (no `prisma migrate dev`). Reference this file instead of
searching for `migrate dev` — it does not exist in this version.

## IMPORTANT — run every Prisma command through Docker, not the host

On this project, `npx prisma <command>` run directly on the Windows host
fails with `[DRIVER.CONNECTION_FAILED] password authentication failed`,
even with correct credentials confirmed working via `psql` directly. This
is a Prisma 8 RC driver issue specific to the Windows/host environment —
not a credentials or database problem.

The fix: run every Prisma command inside the `api` container instead,
where it works correctly:

    docker compose run --rm api npx prisma <command>

`--rm` cleans up the one-off container after the command finishes. This
requires the image to be built and postgres/redis to be running:

    docker compose build api
    docker compose up -d postgres redis

Do not spend time debugging `npx prisma` failures on the host again —
just use the Docker form above.

## First-time setup (already done for this project)

    docker compose run --rm api npx prisma db init

Bootstraps the database to match `src/prisma/contract.prisma` and "signs"
it, so Prisma can later verify the live schema still matches what it
applied.

## Making a schema change (the repeatable workflow)

Every time you edit `src/prisma/contract.prisma` going forward:

1. Edit the models in `src/prisma/contract.prisma`.

2. Regenerate the TypeScript types from the new contract:

       docker compose run --rm api npx prisma contract emit

3. Plan the migration — diffs your contract against the live database and
   writes a migration file to disk (does not touch the database yet):

       docker compose run --rm api npx prisma migration plan

4. Review the generated migration file before applying it:

       docker compose run --rm api npx prisma migration show <target>

5. Apply the planned migration to the database:

       docker compose run --rm api npx prisma db migrate

6. Confirm the database now matches the contract:

       docker compose run --rm api npx prisma db verify

## Checking current state

    docker compose run --rm api npx prisma db schema
    docker compose run --rm api npx prisma migration status
    docker compose run --rm api npx prisma migration log
    docker compose run --rm api npx prisma migration list

## Checking tables directly (bypasses Prisma entirely — always works)

    docker compose exec postgres psql -U zordr -d zordr -c "\dt"
    docker compose exec postgres psql -U zordr -d zordr -c "\d <table_name>"

## Mapping from classic Prisma commands, for reference

| Classic Prisma               | This project's equivalent                              |
|-------------------------------|-----------------------------------------------------------|
| `prisma init`                  | `docker compose run --rm api npx prisma orm init`          |
| `prisma generate`               | `docker compose run --rm api npx prisma contract emit`     |
| `prisma migrate dev`            | `... prisma migration plan` then `... prisma db migrate`   |
| `prisma migrate deploy`         | `... prisma db migrate` (in CI/prod)                        |
| `prisma db push`                | not yet confirmed for this RC — verify before relying on it|

## Known unknowns — verify before relying on these in production

- Whether `db migrate` behaves like `migrate deploy` (non-interactive,
  safe for CI) or still requires interactive confirmation.
- Whether the host-side driver bug is Windows-specific or would also
  affect a Linux CI runner — test this before wiring migrations into a
  CI/CD pipeline; don't assume the Docker workaround is even needed there.
- Re-check command names if upgrading past rc.10 — `npx prisma --version`
  then `npx prisma --help` to see the current command list.