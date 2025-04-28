// backend/routes/eventRoutes.js
const express = require('express');
const { getPublicEvents, createEvent } = require('../controllers/eventController'); // Add createEvent
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Import middlewares
const { body, validationResult } = require('express-validator'); // Import validator

const router = express.Router();

// Get publicly bookable events (for clients to browse)
router.get('/public', getPublicEvents);

// Create a new event (Planner only)
router.post(
    '/',
    protect,                  // Must be logged in
    restrictTo('planner'),    // Must be a planner
    [ // Optional Input Validation Rules
        body('eventName', 'Event name is required').not().isEmpty().trim().escape(),
        body('description').optional().trim().escape(),
        body('eventDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid date format'), // Allow empty/null but validate format if present
        body('location').optional().trim().escape(),
        body('price').optional({ checkFalsy: true }).isNumeric().withMessage('Price must be a number'),
        body('isPubliclyBookable').optional().isBoolean().withMessage('Publicly bookable must be true or false')
    ],
    createEvent               // Controller function
);

// Add routes for updating/deleting events later (PUT /:id, DELETE /:id)

module.exports = router;