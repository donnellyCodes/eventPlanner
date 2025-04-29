// backend/controllers/bookingController.js
const Event = require('../models/Event');

exports.createBooking = async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const userId = token.split('-')[3]; // Extract userId from mock JWT
        const { eventId } = req.body;

        // Validate user
        const user = await new Promise((resolve, reject) => {
            Event.db.get('SELECT * FROM users WHERE id = ? AND role = ?', [userId, 'client'], (err, user) => {
                if (err) reject(err);
                resolve(user);
            });
        });
        if (!user) {
            return res.status(403).json({ message: 'Only clients can book events' });
        }

        // Validate event
        const event = await new Promise((resolve, reject) => {
            Event.db.get('SELECT * FROM events WHERE id = ? AND isPubliclyBookable = 1', [eventId], (err, event) => {
                if (err) reject(err);
                resolve(event);
            });
        });
        if (!event) {
            return res.status(404).json({ message: 'Event not found or not bookable' });
        }

        // Create booking
        const booking = await new Promise((resolve, reject) => {
            Event.db.run(
                `INSERT INTO bookings (userId, eventId, bookingDate)
                 VALUES (?, ?, ?)`,
                [userId, eventId, new Date().toISOString()],
                function (err) {
                    if (err) reject(err);
                    Event.db.get('SELECT * FROM bookings WHERE id = ?', [this.lastID], (err, booking) => {
                        if (err) reject(err);
                        resolve(booking);
                    });
                }
            );
        });

        res.status(201).json({
            id: booking.id,
            userId: booking.userId,
            eventId: booking.eventId,
            bookingDate: booking.bookingDate
        });
    } catch (error) {
        console.error('Error in createBooking controller:', error);
        res.status(500).json({ message: 'Server error creating booking' });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const userId = token.split('-')[3]; // Extract userId from mock JWT

        // Validate user
        const user = await new Promise((resolve, reject) => {
            Event.db.get('SELECT * FROM users WHERE id = ? AND role = ?', [userId, 'client'], (err, user) => {
                if (err) reject(err);
                resolve(user);
            });
        });
        if (!user) {
            return res.status(403).json({ message: 'Only clients can view bookings' });
        }

        // Fetch bookings with event details
        const bookings = await new Promise((resolve, reject) => {
            Event.db.all(`
                SELECT
                    b.id AS bookingId,
                    b.userId,
                    b.eventId,
                    b.bookingDate,
                    e.eventName,
                    e.description,
                    e.eventDate,
                    e.location,
                    e.price,
                    e.isPubliclyBookable,
                    e.plannerId,
                    u.fullName AS plannerName
                FROM bookings b
                JOIN events e ON b.eventId = e.id
                JOIN users u ON e.plannerId = u.id
                WHERE b.userId = ?
                ORDER BY b.bookingDate DESC
            `, [userId], (err, bookings) => {
                if (err) reject(err);
                resolve(bookings);
            });
        });

        res.json(bookings.map(booking => ({
            bookingId: booking.bookingId,
            userId: booking.userId,
            eventId: booking.eventId,
            bookingDate: booking.bookingDate,
            event: {
                id: booking.eventId,
                eventName: booking.eventName,
                description: booking.description,
                eventDate: booking.eventDate,
                location: booking.location,
                price: booking.price,
                isPubliclyBookable: !!booking.isPubliclyBookable,
                plannerId: booking.plannerId,
                plannerName: booking.plannerName
            }
        })));
    } catch (error) {
        console.error('Error in getMyBookings controller:', error);
        res.status(500).json({ message: 'Server error fetching bookings' });
    }
};