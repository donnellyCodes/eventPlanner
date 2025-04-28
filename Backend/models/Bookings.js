// backend/models/Booking.js
const db = require('../config/database');

const Booking = {
    // Find all bookings for a specific client
    findByClientId: (clientId) => {
        // Select specific fields, maybe join with planner later if needed
        const sql = `
            SELECT
                b.id,
                b.eventName,
                b.eventDate,
                b.location,
                b.status,
                b.paymentStatus,
                b.createdAt,
                p.fullName AS plannerName -- Get planner's name (if assigned)
            FROM bookings b
            LEFT JOIN users p ON b.plannerId = p.id -- Join to get planner name
            WHERE b.clientId = ?
            ORDER BY b.eventDate DESC; -- Show most recent first, or upcoming first? Adjust as needed
        `;
        return new Promise((resolve, reject) => {
            db.all(sql, [clientId], (err, bookings) => {
                if (err) {
                    console.error("Error finding bookings by client ID:", err.message);
                    return reject(err);
                }
                resolve(bookings); // Returns an array of booking objects or empty array
            });
        });
    },
    create: (bookingData) => {
        const { clientId, plannerId, eventName, eventDate, location, status = 'Upcoming', paymentStatus = 'Pending' } = bookingData;
        const sql = `
            INSERT INTO bookings (clientId, plannerId, eventName, eventDate, location, status, paymentStatus)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        return new Promise((resolve, reject) => {
            db.run(sql, [clientId, plannerId, eventName, eventDate, location, status, paymentStatus], function(err) {
                if (err) {
                    console.error("Error creating booking:", err.message);
                    return reject(err);
                }
                // Retrieve the newly created booking to return it
                db.get('SELECT * FROM bookings WHERE id = ?', [this.lastID], (getErr, newBooking) => {
                     if (getErr) {
                         console.error("Error retrieving newly created booking:", getErr.message);
                         return reject(getErr); // Reject if retrieval fails
                     }
                      console.log(`Booking created with ID: ${this.lastID}`);
                      resolve(newBooking); // Resolve with the full booking object
                });
            });
        });
    },
};

module.exports = Booking;