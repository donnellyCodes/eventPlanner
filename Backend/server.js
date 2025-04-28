// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // Needed for serving static files if frontend is bundled

// Load environment variables
dotenv.config();

// Import database connection (this also initializes the DB)
const db = require('./config/database');

// Import main router
const mainRouter = require('./routes/index');

// Initialize Express app
const app = express();

// --- Middleware ---
// Enable CORS - Configure allowed origins in production
app.use(cors()); // Allow all origins for now (development)
// Example for production:
// const corsOptions = {
//   origin: 'https://your-frontend-domain.com' // Replace with your frontend URL
// };
// app.use(cors(corsOptions));


// Body Parsers
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- API Routes ---
// Mount the main router at /api path
app.use('/api', mainRouter);


// --- Basic Error Handling Middleware ---
// Not Found handler (404) - Put this after all your routes
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass error to the next middleware
});

// General error handler - Must have 4 arguments (err, req, res, next)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Use existing status code if set, otherwise 500
    console.error("Global Error Handler:", err); // Log the error stack
    res.status(statusCode);
    res.json({
        message: err.message,
        // Include stack trace only in development mode
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});


// --- Server Activation ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown on signal interruption
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing SQLite database connection.');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});