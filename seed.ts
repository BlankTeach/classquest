import { initializeClassroom } from "../server/classroom";
import { getDb } from "../server/db";

try {
  await initializeClassroom();
  console.log(
    "ClassQuest seed version 1 is complete (existing classroom data preserved)."
  );
} catch (error) {
  console.error(
    "ClassQuest initialization failed:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
} finally {
  const db = await getDb();
  if (db) {
    await new Promise<void>((resolve, reject) => {
      db.$client.end(error => (error ? reject(error) : resolve()));
    });
  }
}
