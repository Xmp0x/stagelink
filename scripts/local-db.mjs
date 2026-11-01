import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const url = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/stagelink") {
  throw new Error("This helper only starts a local stagelink test database.");
}
const databaseDir = path.resolve(".local/postgres");
const pg = new EmbeddedPostgres({
  databaseDir,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port: Number(url.port || 5432),
  persistent: true,
  authMethod: "scram-sha-256",
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: ["-c", "listen_addresses=localhost"],
});

if (!existsSync(path.join(databaseDir, "PG_VERSION"))) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
try {
  await client.connect();
  const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", ["stagelink"]);
  if (!result.rowCount) await pg.createDatabase("stagelink");
} finally {
  await client.end();
}
console.log("Local StageLink PostgreSQL is ready. Keep this process running; data persists in .local/postgres.");
const keepAlive = setInterval(() => {}, 60_000);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  clearInterval(keepAlive);
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
