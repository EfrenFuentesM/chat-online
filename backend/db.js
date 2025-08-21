// db.js - SQLite sencillo, síncrono, cero drama
const Database = require('better-sqlite3');
const path = require('path');

// La BD vivirá un nivel arriba, para no borrarla al reinstalar backend
const dbPath = path.join(__dirname, '..', 'chat.db');
const db = new Database(dbPath);

// Creamos tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT NOT NULL,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    ts INTEGER NOT NULL
  );
`);

function saveMessage({ room, author, text, ts }) {
  const stmt = db.prepare(`
    INSERT INTO messages (room, author, text, ts)
    VALUES (@room, @author, @text, @ts)
  `);
  stmt.run({ room, author, text, ts });
}

function getLastMessages(room, limit = 50) {
  const stmt = db.prepare(`
    SELECT author, text, ts
    FROM messages
    WHERE room = ?
    ORDER BY ts ASC
    LIMIT ?
  `);
  return stmt.all(room, limit);
}

module.exports = { saveMessage, getLastMessages };
