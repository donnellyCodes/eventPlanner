// backend/routes/userRoutes.js
const express = require('express');
const { getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

const router = express.Router();

// Apply the 'protect' middleware to this route
// Any request to GET /api/users/me must have a valid JWT token
router.get('/me', protect, getUserProfile);

// Add other user routes here later (e.g., PUT /me for updates)
// router.put('/me', protect, updateUserProfile);

module.exports = router;