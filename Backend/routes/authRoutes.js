// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await new Promise((resolve, reject) => {
            Event.db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
                if (err) reject(err);
                resolve(user);
            });
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate mock JWT
        const token = `mock-jwt-token-${user.id}`;
        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;