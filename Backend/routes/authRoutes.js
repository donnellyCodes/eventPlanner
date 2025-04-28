// backend/routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { body } = require('express-validator'); // For input validation
console.log(">>>> authRoutes.js file loaded <<<<");
const router = express.Router();

// Validation rules
const registerValidation = [
    body('fullName', 'Full name is required').not().isEmpty().trim().escape(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    body('role', 'Role is required (client, planner, or vendor)').isIn(['client', 'planner', 'vendor'])
];

const loginValidation = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists()
];

// Define routes
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);

module.exports = router;