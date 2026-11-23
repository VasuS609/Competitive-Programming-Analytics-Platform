const { DatabaseSync } = require("node:sqlite");

const dbPath = process.argv[2];
if (!dbPath) {
  console.log("Usage: node server/db/lowercase-handles.js <path to tracker.db>");
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
const count = (sql) => db.prepare(sql).get().n;

const before = count("SELECT COUNT(*) AS n FROM solved_problems");
const wrong = count(
  "SELECT COUNT(*) AS n FROM solved_problems WHERE handle != lower(trim(handle))"
);
console.log("Rows before:", before, "| rows with wrong casing:", wrong);

db.exec("BEGIN");
try {

  db.exec(
    "UPDATE OR IGNORE solved_problems SET handle = lower(trim(handle)) WHERE handle != lower(trim(handle))"
  );

  const removed = db
    .prepare("DELETE FROM solved_problems WHERE handle != lower(trim(handle))")
    .run();
  db.exec("COMMIT");
  console.log("Duplicates removed:", removed.changes);
} catch (err) {
  db.exec("ROLLBACK");
  console.error("Failed, nothing was changed:", err.message);
  process.exit(1);
}

console.log("Rows after:", count("SELECT COUNT(*) AS n FROM solved_problems"));