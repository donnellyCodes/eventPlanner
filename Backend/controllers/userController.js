// backend/controllers/userController.js
const Event = require('../models/Event');

exports.getProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const userId = token.split('-')[3]; // Extract userId from mock JWT

        // Fetch user
        const user = await new Promise((resolve, reject) => {
            Event.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                if (err) reject(err);
                resolve(user);
            });
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.json({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error('Error in getProfile controller:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const userId = token.split('-')[3]; // Extract userId from mock JWT
        const { password } = req.body;

        // Validate input
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Validate user
        const user = await new Promise((resolve, reject) => {
            Event.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                if (err) reject(err);
                resolve(user);
            });
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password
        await new Promise((resolve, reject) => {
            Event.db.run(
                `UPDATE users SET password = ? WHERE id = ?`,
                [password, userId], // Note: In production, hash the password
                function (err) {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in updateProfile controller:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};