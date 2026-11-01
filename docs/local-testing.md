# Local flow testing

Two fictional accounts are created by `npm run db:seed:test`:

| Role | Email | Password |
| --- | --- | --- |
| Student | student@stagelink.test | StageLinkTest2026! |
| Company owner | company@stagelink.test | StageLinkTest2026! |

These credentials are only for local development. The seed helper refuses non-local databases and preserves existing accounts and test progress on subsequent runs.

## Start after restarting the computer

1. Run `npm run db:local` in a terminal and keep it open.
2. On first setup, run `npm run db:push` and `npm run db:seed:test` in a second terminal. Run schema generation with the web server stopped to avoid Windows locking the Prisma engine DLL.
3. Run `npm run dev -- --hostname 127.0.0.1` and open http://127.0.0.1:3000/login.

The [embedded-postgres runtime](https://github.com/leinelissen/embedded-postgres) runs PostgreSQL 16 locally because Docker Desktop failed to start on this machine. It binds only to localhost and persists data in `.local/postgres`, which is ignored by Git. Do not run it alongside another database on port 5432. Stopping it does not delete data.

## Try both roles

Use separate browser profiles or a normal window and a private window to keep both accounts signed in at once. Tabs in the same browser profile share a session.

The student has a fictional profile and three matching skills. The company is `[DEMO] StageLink Test Company`, with simulated verification and one published listing, `[DEMO] Frontend Developer Intern` (ID `stagelink-test-internship`). No application is pre-submitted: apply as the student, then review the application and change its status as the company. Company verification is already simulated; these accounts do not include a platform administrator for testing moderation approval.

Verified during setup: both logins return HTTP 200, both authenticated workspace APIs succeed, database health is connected, and the demo listing is published. The AI provider remains `mock`.
