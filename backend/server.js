const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (!err) console.log('Connected to SQLite Database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, date TEXT, time TEXT, location TEXT, category TEXT, capacity INTEGER)`);
    db.run(`CREATE TABLE IF NOT EXISTS registrations (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, event_id INTEGER)`);
    db.run("INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (1, 'Admin', 'admin@univ.edu', 'admin123', 'admin')");
});

// REST API Operations
app.get('/api/events', (req, res) => {
    db.all('SELECT * FROM events', [], (err, rows) => res.json(rows));
});

app.post('/api/events', (req, res) => {
    const { title, description, date, time, location, category, capacity } = req.body;
    db.run('INSERT INTO events (title, description, date, time, location, category, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, date, time, location, category, capacity], function() { res.status(201).json({ id: this.lastID, ...req.body }); });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (!row) return res.status(400).json({ message: 'Invalid credentials' });
        res.json({ user: row });
    });
});

app.post('/api/register', (req, res) => {
    const { user_id, event_id } = req.body;
    db.run('INSERT INTO registrations (user_id, event_id) VALUES (?, ?)', [user_id, event_id], () => res.json({ message: 'Successfully Registered!' }));
});

app.listen(5000, () => console.log(`Server running at http://localhost:5000`));
