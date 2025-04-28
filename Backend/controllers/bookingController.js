// backend/controllers/bookingController.js
const Booking = require('../models/Bookings');
const Event = require('../models/Event');

// @desc    Get bookings for the currently logged-in user
// @route   GET /api/bookings/my
// @access  Private (Requires Authentication via 'protect' middleware)
exports.getMyBookings = async (req, res) => {
    // req.user is attached by the 'protect' middleware
    if (!req.user || !req.user.id) {
        // This should technically not happen if 'protect' works, but good practice
        return res.status(401).json({ message: 'Not authorized, user ID not found' });
    }

    try {
        const bookings = await Booking.findByClientId(req.user.id);

        // Check if bookings is an array (it should be, even if empty)
        if (!Array.isArray(bookings)) {
            console.error("Model did not return an array for bookings:", bookings);
            return res.status(500).json({ message: "Server error retrieving bookings data format."});
        }

        res.json(bookings); // Send the array of bookings (can be empty)

    } catch (error) {
        console.error("Error in getMyBookings controller:", error);
        res.status(500).json({ message: 'Server error fetching bookings', error: error.message });
    }
};

exports.createBooking = async (req, res) => {
    const { eventId } = req.body;
    const clientId = req.user.id; // From protect middleware

    if (!eventId) {
        return res.status(400).json({ message: 'Event ID is required to create a booking.' });
    }

    try {
        // 1. Find the event being booked to get its details
        const eventToBook = await Event.findById(eventId);
        if (!eventToBook) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        if (!eventToBook.isPubliclyBookable) {
             return res.status(400).json({ message: 'This event is not currently available for booking.' });
        }

        // 2. Prepare booking data
        const bookingData = {
            clientId: clientId,
            plannerId: eventToBook.plannerId, // Get planner from the event
            eventName: eventToBook.eventName,
            eventDate: eventToBook.eventDate, // Use date from the event
            location: eventToBook.location,
            status: 'Upcoming', // Initial status
            paymentStatus: 'Pending' // Initial payment status
            // Add price from event if needed in bookings table later
        };

        // 3. Create the booking using the model
        const newBooking = await Booking.create(bookingData);

        // 4. Respond with the newly created booking
        res.status(201).json(newBooking);

    } catch (error) {
        console.error("Error in createBooking controller:", error);
        // Could add checks for specific DB errors if needed
        res.status(500).json({ message: 'Server error creating booking', error: error.message });
    }
};