import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.resolve("scraper.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err);
    process.exit(1);
  }

  console.log(`Connected to SQLite database at: ${dbPath}`);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_url TEXT,
      canonical_url TEXT,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER,
      rel TEXT,
      href TEXT,
      FOREIGN KEY (request_id) REFERENCES requests (id)
    )
  `);
});

export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export default db;
