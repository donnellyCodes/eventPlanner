// backend/controllers/eventController.js
const Event = require('../models/Event');

exports.getPublicEvents = async (req, res) => {
    try {
        console.log('Fetching public events via getPublicEvents...');
        const events = await Event.findPubliclyBookable();
        console.log('Public events fetched:', events);
        res.json(events);
    } catch (error) {
        console.error('Error in getPublicEvents controller:', error);
        res.status(500).json({ message: 'Server error fetching public events' });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const userId = token.split('-')[3];
        const user = await new Promise((resolve, reject) => {
            Event.db.get('SELECT * FROM users WHERE id = ? AND role = ?', [userId, 'planner'], (err, user) => {
                if (err) reject(err);
                resolve(user);
            });
        });
        if (!user) {
            return res.status(403).json({ message: 'Only planners can create events' });
        }
        const { eventName, description, eventDate, location, price, isPubliclyBookable } = req.body;
        const event = await new Promise((resolve, reject) => {
            Event.db.run(
                `INSERT INTO events (eventName, description, eventDate, location, price, isPubliclyBookable, plannerId, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    eventName,
                    description || null,
                    eventDate || null,
                    location || null,
                    price != null ? parseFloat(price) : null,
                    isPubliclyBookable ? 1 : 0,
                    userId,
                    new Date().toISOString()
                ],
                function (err) {
                    if (err) reject(err);
                    Event.db.get('SELECT * FROM events WHERE id = ?', [this.lastID], (err, event) => {
                        if (err) reject(err);
                        resolve(event);
                    });
                }
            );
        });
        res.status(201).json({
            id: event.id,
            eventName: event.eventName,
            description: event.description,
            eventDate: event.eventDate,
            location: event.location,
            price: event.price,
            isPubliclyBookable: !!event.isPubliclyBookable,
            plannerId: event.plannerId
        });
    } catch (error) {
        console.error('Error in createEvent controller:', error);
        res.status(500).json({ message: 'Server error creating event' });
    }
};