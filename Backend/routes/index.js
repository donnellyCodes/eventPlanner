// backend/routes/index.js
const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const bookingRoutes = require('./bookingRoutes');
const eventRoutes = require('./eventRoutes');
// Import other route files as you create them
// const eventRoutes = require('./eventRoutes');
// const vendorRoutes = require('./vendorRoutes');

const router = express.Router();

// Mount the different route handlers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/events', eventRoutes);
// router.use('/events', eventRoutes);
// router.use('/vendors', vendorRoutes);

// Add a simple health check route for the API root
router.get('/', (req, res) => {
    res.json({ status: 'API is running', version: '1.0.0' });
});


module.exports = router;