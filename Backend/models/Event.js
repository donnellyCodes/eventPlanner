// backend/models/Event.js
const db = require('../config/database');

const Event = {
    // Find publicly bookable events/services
    findPubliclyBookable: () => {
        const sql = `
            SELECT
                e.id, e.eventName, e.description, e.eventDate, e.location, e.price,
                u.fullName AS plannerName, -- Get the planner's name
                e.plannerId
            FROM events e
            JOIN users u ON e.plannerId = u.id
            WHERE e.isPubliclyBookable = 1 AND u.role = 'planner' -- Ensure it's bookable and offered by a planner
            ORDER BY e.eventDate ASC, e.createdAt DESC; -- Show upcoming dates first
        `;
        return new Promise((resolve, reject) => {
            db.all(sql, [], (err, events) => {
                if (err) {
                    console.error("Error finding publicly bookable events:", err.message);
                    return reject(err);
                }
                resolve(events);
            });
        });
    },
    
    // Find a single event by ID (needed for booking creation)
    findById: (id) => {
        const sql = `SELECT * FROM events WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.get(sql, [id], (err, event) => {
                if (err) {
                    console.error("Error finding event by id:", err.message);
                    return reject(err);
                }
                resolve(event); // Resolves with event object or undefined
            });
        });
    },

    // Create a new event
    create: (eventData) => {
        const {
            plannerId,
            eventName,
            description,
            eventDate, // Should be in a format SQLite understands (e.g., ISO 8601 string: YYYY-MM-DD HH:MM:SS)
            location,
            price,
            isPubliclyBookable // Expecting 1 (true) or 0 (false)
        } = eventData;

        // Basic validation or default setting for isPubliclyBookable
        const bookableFlag = (isPubliclyBookable === 1 || isPubliclyBookable === true) ? 1 : 0;
        // Handle potentially null price
        const eventPrice = (price === null || price === undefined || price === '') ? null : parseFloat(price);
        // Handle potentially null date
        const formattedDate = eventDate ? new Date(eventDate).toISOString().replace('T', ' ').substring(0, 19) : null;


        const sql = `
            INSERT INTO events
                (plannerId, eventName, description, eventDate, location, price, isPubliclyBookable)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        return new Promise((resolve, reject) => {
            db.run(sql, [
                plannerId,
                eventName,
                description || null, // Allow null description
                formattedDate,        // Use formatted date or null
                location || null,   // Allow null location
                eventPrice,         // Use potentially null price
                bookableFlag        // Use 0 or 1
            ], function (err) {
                if (err) {
                    console.error("Error creating event in DB:", err.message);
                    return reject(err);
                }
                // Retrieve and return the newly created event
                db.get('SELECT * FROM events WHERE id = ?', [this.lastID], (getErr, newEvent) => {
                    if (getErr) {
                        console.error("Error retrieving created event:", getErr.message);
                        // Still resolve with the ID if retrieval fails but insert worked
                        return resolve({ id: this.lastID, message: "Event created, but failed to retrieve details." });
                    }
                    console.log(`Event created with ID: ${this.lastID}`);
                    resolve(newEvent); // Resolve with the full event object
                });
            });
        });
    }
};

module.exports = Event;