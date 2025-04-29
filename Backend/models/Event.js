// backend/models/Event.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database setup
const dbPath = path.join(__dirname, '../eventPlanner.db');
console.log('Database path:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database in Event.js');
});

// Initialize users, events, and bookings tables, insert sample data
db.serialize(() => {
    // Create users table
    console.log('Creating users table...');
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
            return;
        }
        console.log('Users table created or already exists');

        // Insert sample users
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (err) {
                console.error('Error checking users table:', err);
                return;
            }
            if (row.count === 0) {
                console.log('Inserting sample users...');
                db.run(`
                    INSERT INTO users (fullName, email, password, role)
                    VALUES
                        ('Client User', 'client@example.com', 'password', 'client'),
                        ('Planner User', 'planner@example.com', 'password', 'planner'),
                        ('Vendor User', 'vendor@example.com', 'password', 'vendor')
                `, (err) => {
                    if (err) {
                        console.error('Error inserting sample users:', err);
                        return;
                    }
                    console.log('Inserted sample users');
                });
            } else {
                console.log('Users table already contains data, skipping sample insertion');
            }
        });
    });

    // Create events table
    console.log('Creating events table...');
    db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            eventName TEXT NOT NULL,
            description TEXT,
            eventDate TEXT,
            location TEXT,
            price REAL,
            isPubliclyBookable BOOLEAN NOT NULL,
            plannerId INTEGER NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (plannerId) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating events table:', err);
            return;
        }
        console.log('Events table created or already exists');

        // Verify schema
        db.all('PRAGMA table_info(events)', [], (err, rows) => {
            if (err) {
                console.error('Error checking events table schema:', err);
                return;
            }
            console.log('Events table schema:', rows);
            if (!Array.isArray(rows)) {
                console.error('ERROR: PRAGMA table_info did not return an array:', rows);
                return;
            }
            const hasEventDate = rows.some(row => row.name === 'eventDate');
            if (!hasEventDate) {
                console.error('ERROR: events table does not have eventDate column!');
            } else {
                console.log('Confirmed: events table has eventDate column');
            }
        });

        // Create bookings table
        console.log('Creating bookings table...');
        db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                eventId INTEGER NOT NULL,
                bookingDate TEXT NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id),
                FOREIGN KEY (eventId) REFERENCES events(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating bookings table:', err);
                return;
            }
            console.log('Bookings table created or already exists');
        });

        // Verify planner user exists
        db.get('SELECT id FROM users WHERE email = ? AND role = ?', ['planner@example.com', 'planner'], (err, user) => {
            if (err) {
                console.error('Error checking planner user:', err);
                return;
            }
            const plannerId = user ? user.id : 2; // Fallback to 2 if user not found
            if (!user) {
                console.warn('Warning: Planner user not found, using default plannerId = 2');
            } else {
                console.log(`Planner user found with id = ${plannerId}`);
            }

            // Insert sample events
            db.get('SELECT COUNT(*) as count FROM events', (err, row) => {
                if (err) {
                    console.error('Error checking events table:', err);
                    return;
                }
                if (row.count === 0) {
                    console.log('Inserting sample events...');
                    const events = [
                        {
                            eventName: 'Gala Dinner',
                            description: 'Annual charity gala with dinner and entertainment',
                            eventDate: '2025-12-15T18:00:00Z',
                            location: 'Grand Hotel',
                            price: 1000.00,
                            isPubliclyBookable: 1,
                            plannerId: plannerId,
                            createdAt: '2025-04-29T00:00:00Z'
                        },
                        {
                            eventName: 'Tech Conference',
                            description: 'Two-day tech conference with keynote speakers',
                            eventDate: '2025-11-05T09:00:00Z',
                            location: 'Convention Center',
                            price: 500.00,
                            isPubliclyBookable: 1,
                            plannerId: plannerId,
                            createdAt: '2025-04-29T00:00:00Z'
                        },
                        {
                            eventName: 'Wedding Package',
                            description: 'Full-service wedding planning',
                            eventDate: null,
                            location: null,
                            price: 3000.00,
                            isPubliclyBookable: 1,
                            plannerId: plannerId,
                            createdAt: '2025-04-29T00:00:00Z'
                        }
                    ];

                    let insertedCount = 0;
                    events.forEach((event, index) => {
                        db.run(
                            `INSERT INTO events (eventName, description, eventDate, location, price, isPubliclyBookable, plannerId, createdAt)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                event.eventName,
                                event.description,
                                event.eventDate,
                                event.location,
                                event.price,
                                event.isPubliclyBookable,
                                event.plannerId,
                                event.createdAt
                            ],
                            function (err) {
                                if (err) {
                                    console.error(`Error inserting event ${index + 1}:`, err);
                                    return;
                                }
                                insertedCount++;
                                console.log(`Inserted event ${index + 1}: ${event.eventName}`);
                                if (insertedCount === events.length) {
                                    console.log(`Inserted ${insertedCount} sample public events in Event.js`);
                                    // Verify inserted events
                                    db.all('SELECT id, eventName FROM events', [], (err, rows) => {
                                        if (err) {
                                            console.error('Error verifying events:', err);
                                            return;
                                        }
                                        console.log('Events in database:', rows);
                                    });
                                }
                            }
                        );
                    });
                } else {
                    console.log('Events table already contains data, skipping sample insertion');
                }
            });
        });
    });
});

const Event = {
    db, // Export database connection
    findPubliclyBookable: () => {
        return new Promise((resolve, reject) => {
            console.log('Executing findPubliclyBookable query...');
            db.all(`
                SELECT
                    e.id, e.eventName, e.description, e.eventDate, e.location, e.price,
                    u.fullName AS plannerName,
                    e.plannerId
                FROM events e
                JOIN users u ON e.plannerId = u.id
                WHERE e.isPubliclyBookable = 1 AND u.role = 'planner'
                ORDER BY e.eventDate ASC, e.createdAt DESC
            `, [], (err, events) => {
                if (err) {
                    console.error('Error finding publicly bookable events:', err);
                    return reject(err);
                }
                console.log('Found public events:', events);
                resolve(events.map(event => ({
                    id: event.id,
                    eventName: event.eventName,
                    description: event.description,
                    eventDate: event.eventDate,
                    location: event.location,
                    price: event.price,
                    isPubliclyBookable: !!event.isPubliclyBookable,
                    plannerId: event.plannerId,
                    plannerName: event.plannerName
                })));
            });
        });
    }
};

// Export the Event model
module.exports = Event;

// Close database on process exit
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing SQLite database:', err);
        }
        console.log('SQLite database closed in Event.js');
        process.exit(0);
    });
});