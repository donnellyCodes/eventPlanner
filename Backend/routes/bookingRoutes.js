// backend/routes/bookingRoutes.js
const express = require('express');
const { getMyBookings, createBooking } = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Import protect middleware
// Optional: Import role restriction middleware if needed for other routes later
// const { restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Client Routes ---
// Get bookings for the logged-in user (client)
router.get('/my', protect, getMyBookings); // Apply protect middleware

// create a new booking (Client Only)
router.post('/', protect, restrictTo('client'), createBooking); // Protect and restrict to client

module.exports = router;