
# Event Planner

Event Planner is a web application designed to streamline event management. It allows clients to browse, book, and manage events, while planners and vendors can organize events. The application features a client dashboard with user authentication, event browsing, booking management, and profile updates, powered by a Node.js/Express backend with SQLite and a JavaScript-based frontend.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **User Authentication**: Secure login for clients, planners, and vendors using email and password, with logout and password update capabilities.
- **Event Browsing**: Clients can view publicly bookable events with details like name, description, date, location, price, and planner.
- **Event Booking**: Clients can book events, with bookings stored in the database.
- **My Bookings**: Displays a client’s booked events with event details and booking dates.
- **Profile Management**: Users can update their password through the profile section.
- **Responsive Dashboard**: Client dashboard with sidebar navigation for seamless access to features.
- **Session Management**: Persistent sessions using mock JWT tokens stored in localStorage.
- **Error Handling**: Robust handling of invalid tokens, unauthorized access, and API errors with user-friendly alerts.

---

## Project Structure

```
eventPlanner/
├── Backend/
│   ├── controllers/
│   │   ├── bookingController.js
│   │   ├── eventController.js
│   │   ├── userController.js
│   ├── models/
│   │   ├── Event.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── userRoutes.js
│   ├── eventPlanner.db
│   ├── server.js
├── client-dashboard.html
├── login.html
├── script.js
├── styles.css
├── README.md
```

- **Backend**: Node.js/Express server with SQLite database for data persistence.
- **Frontend**: HTML, CSS, and JavaScript for the client dashboard and login pages.
- **Database**: SQLite (`eventPlanner.db`) manages users, events, and bookings.

---

## Prerequisites

- **Node.js**: Version 14 or higher (tested with v22.14.0). Download from [nodejs.org](https://nodejs.org).
- **npm**: Included with Node.js for package management.
- **SQLite**: No separate installation required; the `sqlite3` module handles database operations.
- **Web Browser**: Chrome, Firefox, or any modern browser.
- **Command Line Interface**: Bash, PowerShell, or similar for running commands.

---

## Installation

1. **Clone the Repository** (or copy project files to a local directory):
   ```bash
   git clone <repository-url>
   cd eventPlanner
   ```
   If not using Git, place files in `C:\Users\user\My project\eventPlanner`.

2. **Install Backend Dependencies**:
   Navigate to the `Backend` directory and install required packages:
   ```bash
   cd Backend
   npm install express body-parser sqlite3
   ```

3. **Install Frontend Server (Optional)**:
   To serve the frontend locally, install `serve` globally:
   ```bash
   npm install -g serve
   ```

4. **Initialize Database**:
   The database (`eventPlanner.db`) is created automatically on startup. For a clean state, delete any existing database:
   ```bash
   del eventPlanner.db
   ```

---

## Running the Application

1. **Start the Backend**:
   From the `Backend` directory, run the Express server:
   ```bash
   cd "C:\Users\user\My project\eventPlanner\Backend"
   node server.js
   ```
   Expected output:
   ```
   Database path: C:\Users\user\My project\eventPlanner\Backend\eventPlanner.db
   Connected to SQLite database in Event.js
   Creating users table...
   Inserted sample users
   Creating events table...
   Inserted sample public events in Event.js
   Server running at http://localhost:5000
   ```

2. **Serve the Frontend**:
   From the project root, serve the frontend:
   ```bash
   cd "C:\Users\user\My project\eventPlanner"
   http-server -c-1
   ```
   Access at:
   - [http://localhost:8080/login.html](http://localhost:8080/login.html)
   - [http://192.168.100.81:8080/login.html](http://192.168.100.81:8080/login.html) (for networked devices).

   **Alternative**: If `server.js` is configured to serve static files, access the frontend directly at [http://localhost:5000/login.html](http://localhost:5000/login.html) without running `serve`.

---

## Usage

1. **Login**:
   - Go to [http://localhost:8080/login.html](http://localhost:8080/login.html).
   - Use sample credentials:
     - **Client**: `client@example.com`, `password`
     - **Planner**: `planner@example.com`, `password`
     - **Vendor**: `vendor@example.com`, `password`
   - Successful login redirects to `client-dashboard.html`.

2. **Client Dashboard**:
   - **Browse Events**: View and book public events (e.g., Gala Dinner, Tech Conference).
   - **My Bookings**: See your booked events with details.
   - **Profile**: Update your password (minimum 6 characters).
   - **Logout**: End the session and return to the login page.

3. **Sample Data**:
   - **Users**: Three users (client, planner, vendor) are inserted on startup.
   - **Events**: Three events (Gala Dinner, Tech Conference, Wedding Package) are available.

4. **Testing API**:
   Use `curl` or Postman. Example:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"client@example.com","password":"password"}'
   ```

---

## API Endpoints

### Authentication

- **POST /api/auth/login**
  - Authenticates a user.
  - **Payload**: `{ "email": "client@example.com", "password": "password" }`
  - **Response**:
    ```json
    { "token": "mock-jwt-token-1", "user": { "id": 1, "fullName": "Client User", "email": "client@example.com", "role": "client" } }
    ```

### User Management

- **GET /api/users/me**
  - Fetches the authenticated user’s profile.
  - **Headers**: `Authorization: Bearer mock-jwt-token-1`
  - **Response**:
    ```json
    { "id": 1, "fullName": "Client User", "email": "client@example.com", "role": "client" }
    ```

- **PUT /api/users/me**
  - Updates the user’s password.
  - **Headers**: `Authorization: Bearer mock-jwt-token-1`
  - **Payload**: `{ "password": "newPassword123" }`
  - **Response**:
    ```json
    { "message": "Password updated successfully" }
    ```

### Events

- **GET /api/events/public**
  - Fetches publicly bookable events.
  - **Response**:
    ```json
    [{ "id": 1, "eventName": "Gala Dinner", ... }, ...]
    ```

### Bookings

- **POST /api/bookings**
  - Books an event.
  - **Headers**: `Authorization: Bearer mock-jwt-token-1`
  - **Payload**: `{ "eventId": 1 }`
  - **Response**:
    ```json
    { "id": 1, "userId": 1, "eventId": 1, "bookingDate": "2025-04-29T..." }
    ```

- **GET /api/bookings/my**
  - Fetches the user’s bookings.
  - **Headers**: `Authorization: Bearer mock-jwt-token-1`
  - **Response**:
    ```json
    [{ "bookingId": 1, "userId": 1, "eventId": 1, "bookingDate": "...", "event": { ... } }, ...]
    ```

---

## Database Schema

The SQLite database (`eventPlanner.db`) includes three tables:

#### `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
);
```

#### `events`
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventName TEXT NOT NULL,
    description TEXT,
    eventDate TEXT,
    location TEXT,
    price REAL,
    isPubliclyBookable BOOLEAN NOT NULL,
    plannerId INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (plannerId) REFERENCES users(id)
);
```

#### `bookings`
```sql
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    eventId INTEGER NOT NULL,
    bookingDate TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (eventId) REFERENCES events(id)
);
```

Inspect the database:
```bash
sqlite3 "C:\Users\user\My project\eventPlanner\Backend\eventPlanner.db"
.schema
SELECT * FROM users;
SELECT * FROM events;
SELECT * FROM bookings;
```

---

## Troubleshooting

### Backend Issues

- **Server Fails to Start**:
  - Check logs for database or module errors.
  - Reinstall `sqlite3`: `npm install sqlite3`.
  - Delete and recreate database: `del eventPlanner.db && node server.js`.

### Login Issues

- **“User cannot be recognized”**:
  - Verify `users` table:
    ```sql
    SELECT * FROM users WHERE email = 'client@example.com';
    ```
  - Test login:
    ```bash
    curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"client@example.com","password":"password"}'
    ```

### Frontend Issues

- **TypeError or Section Loading Errors**:
  - Open Chrome DevTools (F12 → Console, Network).
  - Check `GET /api/users/me` response.
  - Clear `localStorage`: `localStorage.clear()` in DevTools.
  - Ensure `script.js` matches the provided version.

### CORS Issues

- Verify CORS headers:
  ```bash
  curl -X OPTIONS http://localhost:5000/api/users/me -i
  ```
  Expected: `Access-Control-Allow-Origin: *`.

### Rendering Issues

- Ensure `.content` and `.sidebar ul` exist in `client-dashboard.html`.
- Check `styles.css` for styling conflicts.
- Share `client-dashboard.html` and `styles.css` for debugging.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit changes: `git commit -m "Add feature"`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```
 
