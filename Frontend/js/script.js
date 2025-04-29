// Existing imports and code...
const BASE_URL = 'http://localhost:5000/api';
let currentUser = null; // Cache user data
let isLoading = false; // Debounce flag for section loading

// Fetch API wrapper with error handling and token validation
async function apiFetch(endpoint, fetchOptions = {}) {
    try {
        // Add Authorization header if token exists
        const token = localStorage.getItem('token');
        if (token && !fetchOptions.headers?.Authorization) {
            fetchOptions.headers = {
                ...fetchOptions.headers,
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
        console.log(`[apiFetch] Response Status for ${endpoint} : ${response.status} ${response.statusText}`);

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                currentUser = null;
                window.location.href = 'login.html';
            }
            throw new Error(`Server returned status ${response.status} (${response.statusText})`);
        }

        // Return JSON if response has content
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return {};
    } catch (error) {
        console.error(`[apiFetch] CATCH block for ${endpoint}. Error:`, error);
        throw error;
    }
}

// Fetch and cache user profile
async function fetchUserProfile() {
    if (currentUser) {
        return currentUser; // Use cached user
    }
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        throw new Error('No token');
    }
    try {
        const user = await apiFetch('/users/me');
        currentUser = user; // Cache user
        return user;
    } catch (error) {
        currentUser = null;
        throw error;
    }
}

// Load dashboard section based on section ID
async function loadDashboardSection(section) {
    console.log(`[loadDashboardSection] Called with section: ${section} Type: ${typeof section}`);
    try {
        const user = await fetchUserProfile();
        if (!user || !user.role) {
            throw new Error('User data not available');
        }

        // Role-based access control
        if (section === 'my-bookings' && !user.role.includes('client')) {
            throw new Error('Access denied: Only clients can view bookings');
        }

        const contentDiv = document.querySelector('.content');
        if (!contentDiv) {
            throw new Error('Content container not found');
        }
        contentDiv.innerHTML = ''; // Clear content

        if (section === 'browse-events') {
            const events = await apiFetch('/events/public');
            contentDiv.innerHTML = `
                <h2>Browse Events</h2>
                <div class="events-list">
                    ${events.map(event => `
                        <div class="event-card">
                            <h3>${event.eventName}</h3>
                            <p>${event.description || 'No description'}</p>
                            <p>Date: ${event.eventDate || 'TBD'}</p>
                            <p>Location: ${event.location || 'TBD'}</p>
                            <p>Price: $${event.price.toFixed(2)}</p>
                            <p>Planner: ${event.plannerName}</p>
                            <button class="book-event" data-event-id="${event.id}">Book</button>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (section === 'my-bookings') {
            const bookings = await apiFetch('/bookings/my');
            contentDiv.innerHTML = `
                <h2>My Bookings</h2>
                <div class="bookings-list">
                    ${bookings.length ? bookings.map(booking => `
                        <div class="booking-card">
                            <h3>${booking.event.eventName}</h3>
                            <p>Date: ${booking.event.eventDate || 'TBD'}</p>
                            <p>Location: ${booking.event.location || 'TBD'}</p>
                            <p>Booked on: ${new Date(booking.bookingDate).toLocaleString()}</p>
                        </div>
                    `).join('') : '<p>No bookings found.</p>'}
                </div>
            `;
        } else if (section === 'profile') {
            contentDiv.innerHTML = `
                <h2>Profile</h2>
                <form id="profile-form">
                    <label for="password">New Password:</label>
                    <input type="password" id="password" name="password" required minlength="6">
                    <button type="submit">Update Password</button>
                </form>
            `;
        }
    } catch (error) {
        console.error(`Error loading section ${section}:`, error);
        if (error.message === 'User data not available' || error.message.includes('Invalid token')) {
            window.location.href = 'login.html';
        } else {
            const contentDiv = document.querySelector('.content');
            if (contentDiv) {
                contentDiv.innerHTML = `<p>Error loading ${section}: ${error.message}</p>`;
            }
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    window.location.href = 'login.html';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar navigation
    const sidebar = document.querySelector('.sidebar ul');
    if (sidebar) {
        sidebar.addEventListener('click', async (event) => {
            if (isLoading) return; // Debounce
            isLoading = true;
            try {
                const section = event.target.getAttribute('data-section');
                if (section) {
                    await loadDashboardSection(section);
                }
            } catch (error) {
                console.error('Sidebar click error:', error);
            } finally {
                isLoading = false;
            }
        });
    }

    // Logout button
    const logoutButton = document.querySelector('#logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // Profile form submission
    const contentDiv = document.querySelector('.content');
    contentDiv.addEventListener('submit', async (event) => {
        if (event.target.id === 'profile-form') {
            event.preventDefault();
            try {
                const formData = new FormData(event.target);
                const password = formData.get('password');
                await apiFetch('/users/me', {
                    method: 'PUT',
                    body: JSON.stringify({ password })
                });
                alert('Password updated successfully');
                event.target.reset();
            } catch (error) {
                console.error('Profile update failed:', error);
                alert(`Error updating password: ${error.message}`);
            }
        }
    });

    // Book event button
    contentDiv.addEventListener('click', async (event) => {
        if (event.target.classList.contains('book-event')) {
            const eventId = event.target.getAttribute('data-event-id');
            try {
                await apiFetch('/bookings', {
                    method: 'POST',
                    body: JSON.stringify({ eventId: parseInt(eventId) })
                });
                alert('Event booked successfully');
            } catch (error) {
                console.error('Booking failed:', error);
                alert(`Error booking event: ${error.message}`);
            }
        }
    });

    // Load default section
    loadDashboardSection('browse-events').catch(error => {
        console.error('Initial load failed:', error);
    });
});