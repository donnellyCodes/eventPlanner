// backend/controllers/eventController.js
const Event = require('../models/Event');

// @desc    Get all publicly bookable events/services
// @route   GET /api/events/public
// @access  Public
exports.getPublicEvents = async (req, res) => {
    try {
        const events = await Event.findPubliclyBookable();
        res.json(events);
    } catch (error) {
        console.error("Error in getPublicEvents controller:", error);
        res.status(500).json({ message: 'Server error fetching public events', error: error.message });
    }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Planner Only)
exports.createEvent = async (req, res) => {
    // Optional: Input validation using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        eventName,
        description,
        eventDate, // Expecting a string parsable by new Date()
        location,
        price,
        isPubliclyBookable // Expecting boolean true/false or similar from form
    } = req.body;

    // Get planner ID from the authenticated user
    const plannerId = req.user.id;

    // Basic backend validation (can be more robust)
    if (!eventName) {
        return res.status(400).json({ message: 'Event name is required.' });
    }

    try {
        const eventData = {
            plannerId,
            eventName,
            description,
            eventDate,
            location,
            price,
            isPubliclyBookable
        };

        const newEvent = await Event.create(eventData);

        res.status(201).json(newEvent); // Respond with the created event object

    } catch (error) {
        console.error("Error in createEvent controller:", error);
        res.status(500).json({ message: 'Server error creating event', error: error.message });
    }
};

// Add other event controllers later (createEvent, getEventById, etc.)