// backend/controllers/userController.js
const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private (Requires Authentication)
exports.getUserProfile = async (req, res) => {
    // We get req.user from the 'protect' middleware
    try {
        // Fetch user data again or use req.user directly (depends on needs)
        // req.user already contains { id, fullName, email, role, createdAt, updatedAt } from User.findById in middleware
        if (req.user) {
            res.json({
                id: req.user.id,
                fullName: req.user.fullName,
                email: req.user.email,
                role: req.user.role,
                createdAt: req.user.createdAt,
                updatedAt: req.user.updatedAt
            });
        } else {
            // This case should technically be handled by 'protect' middleware already
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
         console.error("Get User Profile Error:", error);
         res.status(500).json({ message: 'Server error fetching profile', error: error.message });
    }
};

// Add other user-related controllers here later
// e.g., updateUserProfile, deleteUser, etc.