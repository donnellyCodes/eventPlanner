// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const eventRoutes = require('./routes/eventRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 5000;

// Database setup
const dbPath = path.join(__dirname, 'eventPlanner.db');
const db = new sqlite3.Database(dbPath);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve frontend
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end(); // Respond to preflight requests
    }
    next();
});

// Routes
console.log('>>>> authRoutes.js file loaded <<<<');
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Close database on process exit
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing SQLite database:', err);
        }
        console.log('SQLite database closed');
        process.exit(0);
    });
});