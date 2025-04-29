// backend/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// Routes for events
router.get('/public', eventController.getPublicEvents); // GET /api/events/public
router.post('/', eventController.createEvent); // POST /api/events

module.exports = router;