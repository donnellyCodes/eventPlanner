// backend/config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load .env variables

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_PATH || 'database/events.db');
const dbDir = path.dirname(dbPath);

// Ensure the database directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
}

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log(`Connected to the SQLite database at ${dbPath}`);
        initializeDatabase();
    }
});

// Function to initialize database tables if they don't exist
function initializeDatabase() {
    const createUserTableSql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('client', 'planner', 'vendor')), -- Enforce valid roles
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // Trigger to update updatedAt timestamp (SQLite specific)
    const updateUserTimestampTrigger = `
        CREATE TRIGGER IF NOT EXISTS update_users_updatedAt
        AFTER UPDATE ON users
        FOR EACH ROW
        BEGIN
            UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
    `;

    // Bookings table
    const createBookingsTableSql = `
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId INTEGER NOT NULL,
            plannerId INTEGER,
            eventId INTEGER,
            eventName TEXT NOT NULL,
            eventDate DATETIME NOT NULL,
            location TEXT,
            status TEXT NOT NULL DEFAULT 'Upcoming' CHECK(status IN ('Upcoming', 'Completed', 'Cancelled')),
            paymentStatus TEXT DEFAULT 'Pending' CHECK(paymentStatus IN ('Pending', 'Paid', 'Partially Paid', 'Refunded')),
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (plannerId) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE SET NULL
        );
    `;

    const updateBookingTimestampTrigger = `
        CREATE TRIGGER IF NOT EXISTS update_bookings_updateAt
        AFTER UPDATE ON bookings FOR EACH ROW 
        BEGIN UPDATE bookings SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id; END;
    `;
    const createEventsTableSql = `
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plannerId INTEGER NOT NULL,
            eventName TEXT NOT NULL,
            description TEXT
            eventDate DATETIME,
            location TEXT,
            price REAL,
            isPublicBookable INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (plannerId) REFERENCES users(id) ON DELETE CASCADE
        )

    `;

     const updateEventTimestampTrigger = `
        CREATE TRIGGER IF NOT EXISTS update_events_updatedAt
        AFTER UPDATE ON events FOR EACH ROW
        BEGIN UPDATE events SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id; END;
    `;

    db.serialize(() => {
        db.run(createUserTableSql, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log("Users table checked/created successfully.");
                 db.run(updateUserTimestampTrigger, (err) => {
                    if (err) console.error('Error creating update user trigger:', err.message);
                    else console.log("User timestamp trigger checked/created.");
                });
            }
        });

        // Bookings table and trigger
        db.run(createBookingsTableSql, (err) =>{
            if (err) console.error('Error creating bookings table:', err.message);
            else {
                console.log("Bookings table checked/created successfully.");
                db.run(updateBookingTimestampTrigger, (errTrig) => {
                    if (errTrig) console.error('Error creating update booking trigger:', errTrig.message);
                    else console.log("Booking timestamp trigger checked/created.");    
                });
            }
        });
        db.run(createEventsTableSql, (err) => {
            if (err) console.error('Error creating events table:', err.message);
            else {
                console.log("Events table checked/created successfully.");
                 db.run(updateEventTimestampTrigger, (errTrig) => {
                    if (errTrig) console.error('Error creating update event trigger:', errTrig.message);
                    else console.log("Event timestamp trigger checked/created.");
                });
            }
        });
    });
}

// Export the database connection instance
module.exports = db;