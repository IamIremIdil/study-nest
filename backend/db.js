// ← Database setup and query helpers.
// db.js — Database layer using sql.js (pure JS SQLite)
// This persists data to a file so it survives restarts.

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'studynest.db.json');

let db = null;
let SQL = null;

// Serialize db to disk
function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH + '.bin', buffer);
}

// Load db from disk
async function initDB() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH + '.bin')) {
    const fileBuffer = fs.readFileSync(DB_PATH + '.bin');
    db = new SQL.Database(fileBuffer);
    console.log('📦 Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('🌱 Created new database');
  }

  createTables();
  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS love_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      emoji TEXT DEFAULT '🌸',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL,
      subject TEXT,
      completed INTEGER DEFAULT 0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mood INTEGER NOT NULL CHECK(mood >= 1 AND mood <= 5),
      energy INTEGER NOT NULL CHECK(energy >= 1 AND energy <= 5),
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_date TEXT,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    `);
  db.run(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      request_status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

  saveDB();
  console.log('✅ All tables ready');
}

// Helper: run a query and save (for INSERT/UPDATE/DELETE)
function run(sql, params = []) {
  db.run(sql, params);
  // Get last insert row ID before saving
  const result = db.exec('SELECT last_insert_rowid()');
  const lastId = result[0]?.values[0][0];
  saveDB();
  return lastId;
}

// Helper: get all rows from a query
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: get single row
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

module.exports = { initDB, run, all, get, saveDB };