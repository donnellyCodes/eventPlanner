// backend/models/User.js
const db = require('../config/database');
const bcrypt = require('bcrypt');

const User = {
    // Create a new user
    create: async (userData) => {
        const { fullName, email, password, role } = userData;
        const saltRounds = 10; // Cost factor for hashing

        try {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const sql = `INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)`;

            // Use a Promise to handle the async nature of db.run
            return new Promise((resolve, reject) => {
                db.run(sql, [fullName, email, hashedPassword, role], function(err) { // Use function() to access 'this'
                    if (err) {
                        console.error("Error creating user:", err.message);
                        // Handle specific errors like UNIQUE constraint violation
                        if (err.message.includes('UNIQUE constraint failed: users.email')) {
                            return reject(new Error('Email already exists.'));
                        }
                        return reject(err);
                    }
                    console.log(`User created with ID: ${this.lastID}`);
                    // Return the ID of the newly created user
                    resolve({ id: this.lastID, email, fullName, role });
                });
            });
        } catch (hashError) {
            console.error("Error hashing password:", hashError);
            throw hashError; // Re-throw hashing error
        }
    },

    // Find a user by email
    findByEmail: (email) => {
        const sql = `SELECT * FROM users WHERE email = ?`;
        return new Promise((resolve, reject) => {
            db.get(sql, [email], (err, user) => {
                if (err) {
                    console.error("Error finding user by email:", err.message);
                    return reject(err);
                }
                resolve(user); // Resolves with the user object or undefined if not found
            });
        });
    },

    // Find a user by ID
    findById: (id) => {
        const sql = `SELECT id, fullName, email, role, createdAt, updatedAt FROM users WHERE id = ?`; // Exclude password
         return new Promise((resolve, reject) => {
            db.get(sql, [id], (err, user) => {
                if (err) {
                    console.error("Error finding user by id:", err.message);
                    return reject(err);
                }
                resolve(user); // Resolves with the user object or undefined if not found
            });
        });
    },

    // Compare password for login
    comparePassword: async (candidatePassword, hashedPassword) => {
        try {
            return await bcrypt.compare(candidatePassword, hashedPassword);
        } catch (error) {
            console.error("Error comparing passwords:", error);
            throw error;
        }
    }

    // Add other user-related functions here later (update, delete, etc.)
};

module.exports = User;