const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('jobs.db', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      date_applied TEXT,
      status TEXT,
      notes TEXT
    )
  `);
});

module.exports = db;
