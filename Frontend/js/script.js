const API_BASE_URL = 'http://localhost:5000/api';

// --- Helper Functions for Authentication (Global Scope) ---
const getAuthToken = () => localStorage.getItem('authToken');
const setAuthToken = (token) => localStorage.setItem('authToken', token);
const removeAuthToken = () => localStorage.removeItem('authToken');
const getUserInfo = () => {
    try {
        const userInfoJson = localStorage.getItem('userInfo');
        return userInfoJson ? JSON.parse(userInfoJson) : null;
    } catch (e) {
        console.error("Error parsing user info from localStorage", e);
        return null;
    }
};
const setUserInfo = (userInfo) => {
    try {
        if (userInfo && typeof userInfo === 'object') {
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
        } else {
            console.error("Attempted to save invalid user info to localStorage:", userInfo);
        }
    } catch (e) {
        console.error("Error stringifying user info for localStorage", e);
    }
};
const removeUserInfo = () => localStorage.removeItem('userInfo');
const logoutUser = () => {
    removeAuthToken();
    removeUserInfo();
    routeTo('login.html');
};

// =============================================
// === DUMMY DATA DEFINITIONS ==================
// =============================================
const DUMMY_PAYMENTS = [
    { id: 501, date: '2025-08-01T10:00:00Z', amount: 500.00, bookingId: 101, status: 'Completed', method: 'Credit Card' },
    { id: 502, date: '2024-03-01T11:00:00Z', amount: 1500.00, bookingId: 102, status: 'Completed', method: 'Bank Transfer' }
];
const DUMMY_MESSAGES = [
    { id: 601, subject: 'Question about Gala Dinner', sender: 'Planner Bob', date: '2025-08-05T14:30:00Z', read: false },
    { id: 602, subject: 'Workshop Feedback', sender: 'System', date: '2024-03-11T10:00:00Z', read: true }
];
const DUMMY_PLANNER_EVENTS = [
    { id: 301, eventName: 'Smith Wedding (Dummy)', clientName: 'John Smith', eventDate: '2025-10-10T15:00:00Z', status: 'Confirmed', assignedVendors: 3 },
    { id: 302, eventName: 'Tech Conference (Dummy)', clientName: 'Innovate Corp', eventDate: '2025-11-05T09:00:00Z', status: 'Planning', assignedVendors: 5 }
];
const DUMMY_PLANNER_CLIENTS = [
    { id: 1, name: 'John Smith', email: 'john@example.com', totalEvents: 1 },
    { id: 7, name: 'Innovate Corp Contact', email: 'contact@innovate.com', totalEvents: 1 }
];
const DUMMY_PLANNER_VENDORS = [
    { id: 3, name: 'Vendor Charlie', service: 'Catering', assignedEvents: 2 },
    { id: 8, name: 'Photo Phanatic', service: 'Photography', assignedEvents: 1 }
];
const DUMMY_VENDOR_TASKS = [
    { id: 401, taskName: 'Deliver Floral Arrangements', eventName: 'Smith Wedding', plannerName: 'Planner Bob', dueDate: '2025-10-09T12:00:00Z', status: 'Pending' },
    { id: 402, taskName: 'Setup Sound System', eventName: 'Tech Conference', plannerName: 'Planner Bob', dueDate: '2025-11-04T16:00:00Z', status: 'Pending' },
    { id: 403, taskName: 'Provide Catering (Dummy)', eventName: 'Old Gala Dinner', plannerName: 'Gourmet Planners', dueDate: '2024-01-15T18:00:00Z', status: 'Completed' }
];
const DUMMY_VENDOR_SERVICES = [
    { id: 701, name: 'Gold Catering Package', description: 'Full buffet for 100 guests', price: 3500.00, available: true },
    { id: 702, name: 'Basic Photography (4hr)', description: '4 hours event coverage', price: 800.00, available: true }
];
const DUMMY_VENDOR_RATINGS = [
    { id: 801, eventName: 'Old Gala Dinner', rating: 5, comment: 'Excellent food!', date: '2024-01-20T10:00:00Z' },
    { id: 802, eventName: 'Community Fair', rating: 4, comment: 'Good service, slightly late.', date: '2023-11-10T10:00:00Z' }
];

// =============================================
// === GLOBAL HELPER FUNCTIONS ===============
// =============================================

/**
 * API Fetch Helper Function
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    console.log(`[apiFetch] Requesting: ${options.method || 'GET'} ${url}`);
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) { headers['Authorization'] = `Bearer ${token}`; }

    let response;
    try {
        response = await fetch(url, { ...options, headers: headers });
        console.log(`[apiFetch] Response Status for ${endpoint} : ${response.status} ${response.statusText}`);
        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); }
            catch (e) { errorData = { message: `Server returned status ${response.status} (${response.statusText})` }; }
            const errorMessage = errorData?.message || errorData?.errors?.map(e => e.msg).join(', ') || `HTTP error ${response.status}`;
            const error = new Error(errorMessage);
            error.status = response.status; error.data = errorData; throw error;
        }
        if (response.status === 204) { return null; }
        const textData = await response.text();
        if (!textData) { return null; }
        try {
            const jsonData = JSON.parse(textData);
            console.log(`[apiFetch] Successfully parsed JSON for ${endpoint}:`, jsonData);
            return jsonData;
        } catch (e) {
            console.error(`[apiFetch] Failed to parse JSON response for ${endpoint}:`, e);
            throw new Error(`Invalid JSON response from server for ${endpoint}.`);
        }
    } catch (error) {
        console.error(`[apiFetch] CATCH block for ${endpoint}. Error:`, error);
        if (!error.message) { error.message = "Network error or fetch failed."; }
        throw error;
    }
}

// Routes to a specific page, validating user role for dashboards
function routeTo(page) {
    const userInfo = getUserInfo();
    const dashboardPages = {
        'client': 'client-dashboard.html',
        'planner': 'planner-dashboard.html',
        'vendor': 'vendor-dashboard.html'
    };

    if (page === 'login.html' || page === 'signup.html') {
        window.location.href = page;
        return;
    }

    if (!userInfo || !userInfo.role) {
        console.warn('No user info found, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    const role = userInfo.role;
    const targetPage = dashboardPages[page] || dashboardPages[role];

    if (!targetPage) {
        console.error(`Invalid route: ${page}`);
        window.location.href = dashboardPages[role] || 'login.html';
        return;
    }

    if (page !== role && dashboardPages[page]) {
        console.warn(`Unauthorized access attempt to ${page} dashboard by ${role}`);
        window.location.href = dashboardPages[role];
        return;
    }

    if (window.location.pathname !== `/${targetPage}`) {
        window.location.href = targetPage;
    }
}

// Determines the default section based on role
function getDefaultSection(userRole) {
    console.log('[getDefaultSection] Received role:', userRole);
    let defaultSection;
    switch (userRole) {
        case 'client': defaultSection = 'overview'; break;
        case 'planner': defaultSection = 'overview'; break;
        case 'vendor': defaultSection = 'overview'; break;
        default:
            console.warn(`[getDefaultSection] Unknown user role: ${userRole}. Defaulting to 'overview'.`);
            defaultSection = 'overview';
            break;
    }
    console.log('[getDefaultSection] Returning section:', defaultSection);
    return defaultSection;
}

// Populates the sidebar navigation based on user role
function populateDashboard(userRole, sidebarNav) {
    if (!sidebarNav) { console.error("Sidebar element missing!"); return; }
    sidebarNav.innerHTML = '';
    let navItems = [
        { section: 'overview', text: 'Dashboard Overview' },
        { section: 'profile', text: 'My Profile' },
        { section: 'messages', text: 'Messages' }
    ];
    if (userRole === 'client') {
        navItems.push(
            { section: 'my-bookings', text: 'My Bookings' },
            { section: 'payments', text: 'Payment History' },
            { section: 'browse-events', text: 'Browse Events' }
        );
    } else if (userRole === 'planner') {
        navItems.push(
            { section: 'manage-events', text: 'Manage Events' },
            { section: 'manage-clients', text: 'Manage Clients' },
            { section: 'manage-vendors', text: 'Manage Vendors' },
            { section: 'calendar', text: 'Calendar' },
            { section: 'analytics', text: 'Analytics' }
        );
    } else if (userRole === 'vendor') {
        navItems.push(
            { section: 'my-services', text: 'My Services' },
            { section: 'assigned-tasks', text: 'Assigned Tasks' },
            { section: 'availability', text: 'Set Availability' },
            { section: 'ratings', text: 'My Ratings' }
        );
    }
    // Add a link to switch dashboards or home (optional)
    navItems.unshift({ section: 'home', text: 'Home', href: 'index.html' });
    sidebarNav.innerHTML = navItems.map(item => `<li><a href="${item.href || '#'}" data-section="${item.section}">${item.text}</a></li>`).join('');
    const defaultSection = getDefaultSection(userRole);
    const activeLink = sidebarNav.querySelector(`a[data-section="${defaultSection}"]`);
    if (activeLink) { activeLink.classList.add('active-section'); }
    else { sidebarNav.querySelector('a[data-section="overview"]')?.classList.add('active-section'); }
    console.log(`Populated sidebar for user role: ${userRole}`);
}

// Loads content for the selected dashboard section (Uses Dummy Data Conditionally)
async function loadDashboardSection(section, mainContentArea, dashboardTitle) {
    console.log('[loadDashboardSection] Called with section:', section, 'Type:', typeof section);
    if (!mainContentArea || !dashboardTitle) { console.error("Dashboard elements missing!"); return; }
    if (typeof section === 'undefined' || section === null) { console.error("Section parameter invalid!"); return; }

    const userInfo = getUserInfo();
    if (!userInfo) { console.error("User info missing!"); routeTo('login.html'); return; }

    const validSections = {
        client: ['overview', 'profile', 'messages', 'my-bookings', 'payments', 'browse-events'],
        planner: ['overview', 'profile', 'messages', 'manage-events', 'manage-clients', 'manage-vendors', 'calendar', 'analytics'],
        vendor: ['overview', 'profile', 'messages', 'my-services', 'assigned-tasks', 'availability', 'ratings'],
        all: ['home']
    };
    const role = userInfo.role;
    if (!validSections[role].includes(section) && !validSections.all.includes(section)) {
        console.warn(`Invalid section ${section} for role ${role}`);
        mainContentArea.innerHTML = `<p class="error-message">Invalid section.</p>`;
        return;
    }

    if (section === 'home') {
        routeTo('index.html');
        return;
    }

    const linkElement = document.querySelector(`#sidebar-nav a[data-section="${section}"]`);
    const linkText = linkElement?.textContent || section.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    dashboardTitle.textContent = linkText;
    mainContentArea.innerHTML = '';

    let endpoint = null;
    let fetchOptions = { method: 'GET' };
    let useDummyData = false;
    let data = null;

    try {
        switch (section) {
            case 'profile': data = userInfo; break;
            case 'my-bookings': endpoint = `/bookings/my`; break;
            case 'browse-events': endpoint = `/events/public`; break;
            case 'overview': useDummyData = true; data = {}; break;
            case 'messages': useDummyData = true; data = DUMMY_MESSAGES; break;
            case 'payments': useDummyData = true; data = DUMMY_PAYMENTS; break;
            case 'manage-events': useDummyData = true; data = DUMMY_PLANNER_EVENTS; break;
            case 'manage-clients': useDummyData = true; data = DUMMY_PLANNER_CLIENTS; break;
            case 'manage-vendors': useDummyData = true; data = DUMMY_PLANNER_VENDORS; break;
            case 'calendar': useDummyData = true; data = []; break;
            case 'analytics': useDummyData = true; data = {}; break;
            case 'my-services': useDummyData = true; data = DUMMY_VENDOR_SERVICES; break;
            case 'assigned-tasks': useDummyData = true; data = DUMMY_VENDOR_TASKS; break;
            case 'availability': useDummyData = true; data = {}; break;
            case 'ratings': useDummyData = true; data = DUMMY_VENDOR_RATINGS; break;
            default: console.log(`No endpoint/dummy data for section: ${section}.`); break;
        }

        if (endpoint && !useDummyData) {
            console.log(`[loadDashboardSection] Fetching REAL data for endpoint: ${endpoint}`);
            data = await apiFetch(endpoint, fetchOptions);
            console.log(`[loadDashboardSection] REAL Data received for section ${section}:`, data);
        } else if (useDummyData) {
            console.log(`[loadDashboardSection] Using DUMMY data for section ${section}:`, data);
        } else if (section === 'profile') {
            console.log(`[loadDashboardSection] Using stored userInfo for profile section.`);
        } else {
            console.log(`[loadDashboardSection] No data source for section ${section}.`);
        }

        mainContentArea.innerHTML = renderSectionContent(section, data, userInfo);
        attachDynamicEventListeners(section, mainContentArea);
    } catch (error) {
        console.error(`Error loading section ${section}:`, error);
        mainContentArea.innerHTML = `<p class="error-message">Could not load content for ${linkText}. Error: ${error.message}</p>`;
        if (error.status === 401) {
            mainContentArea.innerHTML += `<p>Your session might have expired. Please <a href='login.html'>log in</a> again.</p>`;
            routeTo('login.html');
        }
    }
}

// Renders the HTML content for a given dashboard section (Uses Dummy Data)
function renderSectionContent(section, data, userInfo) {
    if (!userInfo || !userInfo.role) { return `<p class="error-message">Error: User info invalid.</p>`; }
    const userRole = userInfo.role;
    const linkText = document.querySelector(`#sidebar-nav a[data-section="${section}"]`)?.textContent || section.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    let content = `<h2>${linkText}</h2>`;
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString() : 'N/A';

    switch (section) {
        case 'overview':
            content += `<p>Welcome to your dashboard, ${userInfo.fullName}!</p>`;
            if (userRole === 'client') {
                content += `
                    <div class="dashboard-summary"><h3>Quick Look</h3><div class="summary-grid">
                        <div class="summary-card"><h4>Upcoming Bookings</h4><p>[...]</p><a href="#" data-section="my-bookings" class="link-as-button">View Bookings</a></div>
                        <div class="summary-card"><h4>Messages</h4><p>[...]</p><a href="#" data-section="messages" class="link-as-button">View Messages</a></div>
                        <div class="summary-card"><h4>Payments Due</h4><p>[...]</p><a href="#" data-section="payments" class="link-as-button">View Payments</a></div>
                    </div><hr><p><a href="#" data-section="browse-events" class="btn btn-primary">Browse & Book New Events</a></p></div>`;
            } else if (userRole === 'planner') {
                content += `
                    <div class="dashboard-summary"><h3>At a Glance</h3><div class="summary-grid">
                        <div class="summary-card"><h4>Active Events</h4><p>[...]</p><a href="#" data-section="manage-events" class="link-as-button">Manage Events</a></div>
                        <div class="summary-card"><h4>Pending Tasks</h4><p>[...]</p><a href="#" data-section="manage-events" class="link-as-button">View Tasks</a></div>
                        <div class="summary-card"><h4>Unread Messages</h4><p>[...]</p><a href="#" data-section="messages" class="link-as-button">View Messages</a></div>
                    </div><hr></div>`;
            } else if (userRole === 'vendor') {
                content += `
                    <div class="dashboard-summary"><h3>Your Status</h3><div class="summary-grid">
                        <div class="summary-card"><h4>Assigned Tasks</h4><p>[...]</p><a href="#" data-section="assigned-tasks" class="link-as-button">View Tasks</a></div>
                        <div class="summary-card"><h4>Upcoming Jobs</h4><p>[...]</p><a href="#" data-section="assigned-tasks" class="link-as-button">View Schedule</a></div>
                        <div class="summary-card"><h4>Recent Ratings</h4><p>[...]</p><a href="#" data-section="ratings" class="link-as-button">View Ratings</a></div>
                    </div><hr><p><a href="#" data-section="my-services" class="btn btn-primary">Manage My Services</a></p></div>`;
            }
            break;

        case 'profile':
            content += `<p>Manage your personal information.</p>`;
            content += `
                <form id="profile-form">
                    <div class="form-group"> <label for="profile-name">Full Name:</label> <input type="text" id="profile-name" value="${data?.fullName || ''}" required> </div>
                    <div class="form-group"> <label for="profile-email">Email:</label> <input type="email" id="profile-email" value="${data?.email || ''}" disabled> </div>
                    ${userRole === 'planner' || userRole === 'vendor' ? `
                        <div class="form-group"> <label for="profile-business-info">Business Info (Optional):</label> <input type="text" id="profile-business-info" value="${data?.businessInfo || ''}"> </div>
                    ` : ''}
                    <div class="form-group"> <label for="profile-new-password">New Password (optional):</label> <input type="password" id="profile-new-password"> </div>
                    <button type="submit" class="btn btn-primary">Update Profile</button>
                    <p id="profile-status" class="status-message"></p>
                </form>`;
            break;

        case 'messages':
            content += `<p>Your communication hub.</p>`;
            if (data && Array.isArray(data) && data.length > 0) {
                content += `<ul class="message-list">`;
                data.forEach(msg => { content += `<li class="${!msg.read ? 'unread' : ''}"><strong>${msg.subject}</strong> from ${msg.sender} (${formatDate(msg.date)})</li>`; });
                content += `</ul>`;
            } else { content += `<p>No messages found.</p>`; }
            break;

        case 'my-bookings':
            content += `<p>View your upcoming and past event bookings.</p>`;
            if (data && Array.isArray(data)) {
                if (data.length > 0) {
                    content += '<div class="booking-list">';
                    const upcoming = data.filter(b => b.status === 'Upcoming');
                    const past = data.filter(b => b.status !== 'Upcoming');
                    content += '<h3>Upcoming Bookings</h3>';
                    if (upcoming.length > 0) {
                        upcoming.forEach(b => {
                            content += `<div class="booking-card"><h4>${b.eventName}</h4><p>Date: ${formatDate(b.eventDate)}</p><p>Status: ${b.status}</p><p>Planner: ${b.plannerName || 'N/A'}</p><p>Payment: ${b.paymentStatus}</p><div class="booking-actions">...buttons...</div></div>`;
                        });
                    } else { content += '<p>No upcoming bookings.</p>'; }
                    content += '<h3 style="margin-top: 20px;">Past Bookings</h3>';
                    if (past.length > 0) {
                        past.forEach(b => {
                            content += `<div class="booking-card past-booking"><h4>${b.eventName}</h4><p>Date: ${formatDate(b.eventDate)}</p><p>Status: ${b.status}</p><div class="booking-actions">...buttons...</div></div>`;
                        });
                    } else { content += '<p>No past bookings.</p>'; }
                    content += '</div>';
                } else { content += `<p>You haven't booked any events yet. <a href="#" data-section="browse-events" class="link-as-button">Browse Events</a>?</p>`; }
            } else { content += `<p class="error-message">Could not display bookings.</p>`; }
            break;

        case 'payments':
            if (userRole === 'client') {
                content += `<p>Your transaction history.</p>`;
                if (data && Array.isArray(data) && data.length > 0) {
                    content += `<table class="data-table"><thead><tr><th>Date</th><th>Amount</th><th>Booking ID</th><th>Status</th></tr></thead><tbody>`;
                    data.forEach(p => { content += `<tr><td>${formatDate(p.date)}</td><td>$${p.amount.toFixed(2)}</td><td>${p.bookingId}</td><td>${p.status}</td></tr>`; });
                    content += `</tbody></table>`;
                } else { content += `<p>No payment history found.</p>`; }
            } else { content += `<p class="error-message">Access Denied.</p>`; }
            break;

        case 'browse-events':
            content += `<p>Find events and services offered by our planners.</p>`;
            if (data && Array.isArray(data)) {
                if (data.length > 0) {
                    content += '<div class="event-listing">';
                    data.forEach(event => {
                        content += `<div class="event-card"><h4>${event.eventName}</h4><p class="description">${event.description || ''}</p><p>Planner: ${event.plannerName}</p>${event.price != null ? `<p><strong>Price: $${parseFloat(event.price).toFixed(2)}</strong></p>` : ''}<div class="event-actions"><button class="btn btn-primary btn-sm book-now-btn" data-event-id="${event.id}">Book Now</button></div></div>`;
                    });
                    content += '</div>';
                } else { content += `<p>No events available.</p>`; }
            } else { content += `<p class="error-message">Could not display events.</p>`; }
            break;

        case 'manage-events':
            if (userRole === 'planner') {
                content += `<button id="create-event-btn" class="btn btn-primary">Create New Event/Service</button>`;
                content += `<div style="margin-top: 20px;">`;
                if (data && Array.isArray(data) && data.length > 0) {
                    content += `<h4>My Events/Services (Dummy)</h4>`;
                    data.forEach(evt => {
                        content += `<div class="event-card"><h4>${evt.eventName}</h4>... etc ...</div>`;
                    });
                } else if (data && Array.isArray(data)) {
                    content += `<p>You haven't created any events or services yet.</p>`;
                } else {
                    content += `<p>Loading events list or using placeholder...</p>`;
                }
                content += `</div>`;
            } else {
                content += `<p class="error-message">Access Denied.</p>`;
            }
            break;

        case 'manage-clients':
            if (userRole === 'planner') {
                content += `<h4>Client List</h4>`;
                if (data && Array.isArray(data) && data.length > 0) {
                    content += `<ul>`;
                    data.forEach(c => { content += `<li>${c.name} (${c.email}) - ${c.totalEvents} event(s)</li>`; });
                    content += `</ul>`;
                } else { content += `<p>No clients found.</p>`; }
            } else { content += `<p class="error-message">Access Denied.</p>`; }
            break;

        case 'manage-vendors':
            if (userRole === 'planner') {
                content += `<h4>Vendor Coordination</h4>`;
                if (data && Array.isArray(data) && data.length > 0) {
                    content += `<ul>`;
                    data.forEach(v => { content += `<li>${v.name} (${v.service}) - ${v.assignedEvents} event(s)</li>`; });
                    content += `</ul>`;
                } else { content += `<p>No vendors assigned.</p>`; }
            } else { content += `<p class="error-message">Access Denied.</p>`; }
            break;

        case 'calendar':
            if (userRole === 'planner') { content += `[Planner Event Calendar Placeholder]`; } else { content += `<p class="error-message">Access Denied.</p>`; }
            break;

        case 'analytics':
            if (userRole === 'planner') { content += `[Planner Analytics Placeholder]`; } else { content += `<p class="error-message">Access Denied.</p>`; }
            break;

        case 'my-services':
            if (userRole === 'vendor') {
                content += `<button id="add-service-btn" class="btn btn-primary">Add New Service</button>`;
                if (data && Array.isArray(data) && data.length > 0) {
                    content += `<div style="margin-top: 20px;" class="service-list"><h4>My Services</h4>`;
                    data.forEach(s => { content += `<div class="service-card"><h4>${s.name}</h4><p>${s.description}</p><p>Price: $${s.price.toFixed(2)}</p><p>Available: ${s.available ? 'Yes' : 'No'}</p></div>`; });
                    content += `</div>`;
                } else { content += `<p>No services defined.</p>`; }
            } else { content += `<p class="error-message">Access Denied.</p>`; }
            break;

        case 'assigned-tasks':
            if (userRole === 'vendor') {
                content += `<h4>Assigned Tasks</h4>`;
                if (data && Array.isArray(data) && data.length > 0) {
                    content += `<ul class="task-list">`;
                    data.forEach(task => { content += `<li>${task.taskName} for ${task.eventName} (Due: ${formatDate(task.dueDate)}) - ${task.status}</li>`; });
                    content += `</ul>`;
                } else { content += `<p>No tasks assigned.</p>`; }
            } else { content += `<p class="error-message">Access Denied.</p>`; }
            break;

        case 'availability':
            if (userRole === 'vendor') { content += `[Vendor Availability Placeholder]`; } else { content += `<p class="error-message">Access Denied.</p>`; }
            break;

        case 'ratings':
            if (userRole === 'vendor') {
                content += `<h4>My Ratings</h4>`;
                if (data && Array.isArray(data) && data.length > 0) {
                    content += `<ul class="rating-list">`;
                    data.forEach(r => { content += `<li><strong>${r.rating} Stars</strong> (${r.eventName}) - "${r.comment}" (${formatDate(r.date)})</li>`; });
                    content += `</ul>`;
                } else { content += `<p>No ratings received yet.</p>`; }
            } else { content += `<p class="error-message">Access Denied.</p>`; }
            break;

        default:
            content = `<h2>${linkText}</h2><p>Content for this section ('${section}') is not available.</p>`;
    }
    return content;
}

// Attaches event listeners to dynamically added elements
function attachDynamicEventListeners(section, mainContentArea) {
    // Profile Form Listener
    if (section === 'profile') {
        const profileForm = mainContentArea.querySelector('#profile-form');
        const profileStatus = mainContentArea.querySelector('#profile-status');
        if (profileForm && profileStatus) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                profileStatus.textContent = 'Updating...'; profileStatus.style.color = 'orange';
                const updatedData = { fullName: document.getElementById('profile-name').value, businessInfo: document.getElementById('profile-business-info')?.value || undefined };
                const newPassword = document.getElementById('profile-new-password').value;
                if (newPassword) { updatedData.password = newPassword; }
                try {
                    const result = await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(updatedData) });
                    profileStatus.textContent = 'Profile updated!'; profileStatus.style.color = 'green';
                    setUserInfo(result);
                    const userNameSpan = document.getElementById('user-name');
                    if (userNameSpan) userNameSpan.textContent = `Welcome, ${result.fullName}!`;
                    const passInput = document.getElementById('profile-new-password');
                    if (passInput) passInput.value = '';
                } catch (error) { profileStatus.textContent = `Update failed: ${error.message}`; profileStatus.style.color = 'red'; }
            });
        }
    }

    // Create/Add Button Listeners
    const createEventBtn = mainContentArea.querySelector('#create-event-btn');
    if (createEventBtn) { createEventBtn.addEventListener('click', () => alert("Implement Create Event")); }
    const addServiceBtn = mainContentArea.querySelector('#add-service-btn');
    if (addServiceBtn) { addServiceBtn.addEventListener('click', () => alert("Implement Add Service")); }

    // Book Now Button Listeners
    if (section === 'browse-events') {
        const bookButtons = mainContentArea.querySelectorAll('.book-now-btn');
        bookButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const eventId = e.target.dataset.eventId;
                if (!eventId) { alert('Error: No event ID.'); return; }
                if (!confirm(`Book event ID: ${eventId}?`)) { return; }
                e.target.textContent = 'Booking...'; e.target.disabled = true;
                try {
                    const newBooking = await apiFetch('/bookings', { method: 'POST', body: JSON.stringify({ eventId: eventId }) });
                    console.log('Booking successful:', newBooking);
                    alert(`Event booked successfully! Booking ID: ${newBooking.id}.`);
                    e.target.textContent = 'Booked!';
                } catch (error) {
                    console.error(`Booking failed:`, error); alert(`Booking failed: ${error.message}`);
                    e.target.textContent = 'Book Now'; e.target.disabled = false;
                }
            });
        });
    }

    // Manage Events Modal Listener
    if (section === 'manage-events') {
        const createEventBtn = mainContentArea.querySelector('#create-event-btn');
        const modal = document.getElementById('create-event-modal');
        const closeModalBtn = document.getElementById('close-event-modal');
        const cancelModalBtn = document.getElementById('cancel-event-modal');
        const eventForm = document.getElementById('create-event-form');
        const eventStatus = document.getElementById('create-event-status');

        if (!modal || !closeModalBtn || !cancelModalBtn || !eventForm || !eventStatus) {
            console.error("Create Event Modal elements not found!");
            if (createEventBtn) {
                createEventBtn.addEventListener('click', () => alert("Error: Modal elements missing."));
            }
            return;
        }

        const openModal = () => {
            eventStatus.textContent = '';
            eventStatus.className = 'status-message';
            eventForm.reset();
            modal.style.display = 'block';
        };

        const closeModal = () => {
            modal.style.display = 'none';
        };

        if (createEventBtn) {
            createEventBtn.addEventListener('click', openModal);
        }

        closeModalBtn.addEventListener('click', closeModal);
        cancelModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            eventStatus.textContent = 'Saving...';
            eventStatus.className = 'status-message info';

            const formData = new FormData(eventForm);
            const eventData = {
                eventName: formData.get('eventName'),
                description: formData.get('description'),
                eventDate: formData.get('eventDate') || null,
                location: formData.get('location') || null,
                price: formData.get('price') ? parseFloat(formData.get('price')) : null,
                isPubliclyBookable: formData.get('isPubliclyBookable') === 'true'
            };

            console.log("Submitting event data:", eventData);

            try {
                const newEvent = await apiFetch('/events', {
                    method: 'POST',
                    body: JSON.stringify(eventData)
                });

                console.log("Event created successfully:", newEvent);
                eventStatus.textContent = `Event "${newEvent.eventName}" created successfully!`;
                eventStatus.className = 'status-message success';

                setTimeout(() => {
                    closeModal();
                    const currentMainArea = document.getElementById('dashboard-content-area');
                    const currentTitle = document.getElementById('dashboard-title');
                    if (currentMainArea && currentTitle) {
                        loadDashboardSection('manage-events', currentMainArea, currentTitle);
                    }
                }, 1500);
            } catch (error) {
                console.error("Failed to create event:", error);
                eventStatus.textContent = `Error creating event: ${error.message}`;
                eventStatus.className = 'status-message error';
            }
        });
    }

    // Overview Card Links Listener
    const sectionLinks = mainContentArea.querySelectorAll('a[data-section]');
    sectionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.target.closest('a').getAttribute('data-section');
            const sidebarLink = document.querySelector(`#sidebar-nav a[data-section="${targetSection}"]`);
            if (sidebarLink) { sidebarLink.click(); }
            else { console.error(`Sidebar link not found for: ${targetSection}`); }
        });
    });
}

// Displays the form for creating a new event
function displayCreateEventForm(containerElement) {
    console.log("Displaying create event form");
    if (!containerElement) return;

    const formHtml = `
        <h2>Create New Event/Service</h2>
        <form id="create-event-form" class="dashboard-form">
            <div class="form-group">
                <label for="event-name">Event/Service Name:</label>
                <input type="text" id="event-name" name="eventName" required>
            </div>
            <div class="form-group">
                <label for="event-description">Description:</label>
                <textarea id="event-description" name="description" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="event-date">Date & Time (Optional):</label>
                <input type="datetime-local" id="event-date" name="eventDate">
                <small>Leave blank if this is a general service without a fixed date.</small>
            </div>
            <div class="form-group">
                <label for="event-location">Location (Optional):</label>
                <input type="text" id="event-location" name="location">
            </div>
            <div class="form-group">
                <label for="event-price">Price (Optional, e.g., 499.99):</label>
                <input type="number" id="event-price" name="price" step="0.01" min="0">
            </div>
            <div class="form-group form-check">
                <input type="checkbox" class="form-check-input" id="event-public" name="isPubliclyBookable" checked>
                <label class="form-check-label" for="event-public">Publicly Bookable by Clients?</label>
            </div>
            <button type="submit" class="btn btn-primary">Create Event</button>
            <button type="button" id="cancel-create-event" class="btn btn-secondary">Cancel</button>
            <p id="create-event-status" class="status-message"></p>
        </form>
    `;

    containerElement.innerHTML = formHtml;

    const eventForm = containerElement.querySelector('#create-event-form');
    const cancelBtn = containerElement.querySelector('#cancel-create-event');
    const statusMsg = containerElement.querySelector('#create-event-status');

    if (eventForm && statusMsg) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            statusMsg.textContent = "Creating event...";
            statusMsg.style.color = 'orange';
            const createButton = eventForm.querySelector('button[type="submit"]');
            if (createButton) createButton.disabled = true;

            const formData = {
                eventName: document.getElementById('event-name')?.value,
                description: document.getElementById('event-description')?.value,
                eventDate: document.getElementById('event-date')?.value || null,
                location: document.getElementById('event-location')?.value,
                price: document.getElementById('event-price')?.value || null,
                isPubliclyBookable: document.getElementById('event-public')?.checked
            };

            console.log("Submitting event data:", formData);

            try {
                const newEvent = await apiFetch('/events', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                console.log("Event created successfully:", newEvent);
                statusMsg.textContent = `Event "${newEvent.eventName}" created successfully! (ID: ${newEvent.id})`;
                statusMsg.style.color = 'green';
                eventForm.reset();
                setTimeout(() => {
                    const mainArea = document.getElementById('dashboard-content-area');
                    const titleEl = document.getElementById('dashboard-title');
                    if (mainArea && titleEl) {
                        loadDashboardSection('manage-events', mainArea, titleEl);
                    }
                }, 1500);
            } catch (error) {
                console.error("Event creation failed:", error);
                statusMsg.textContent = `Error creating event: ${error.message}`;
                statusMsg.style.color = 'red';
                if (createButton) createButton.disabled = false;
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log("Cancel create event clicked");
            const mainArea = document.getElementById('dashboard-content-area');
            const titleEl = document.getElementById('dashboard-title');
            if (mainArea && titleEl) {
                loadDashboardSection('manage-events', mainArea, titleEl);
            }
        });
    }
}

// Fetches user profile and initializes dashboard
async function fetchUserProfile() {
    const token = getAuthToken();
    if (!token) {
        console.warn('No auth token found, redirecting to login...');
        routeTo('login.html');
        return;
    }
    try {
        const fetchOptions = { method: 'GET' };
        const userData = await apiFetch('/users/me', fetchOptions);

        if (!userData) {
            throw new Error('Failed to fetch user data');
        }
        console.log('User Data Loaded:', userData);
        setUserInfo(userData);

        const currentPage = window.location.pathname.split('/').pop();
        const dashboardPages = {
            'client': 'client-dashboard.html',
            'planner': 'planner-dashboard.html',
            'vendor': 'vendor-dashboard.html'
        };
        const expectedPage = dashboardPages[userData.role];

        if (currentPage !== expectedPage) {
            console.warn(`User role ${userData.role} does not match page ${currentPage}, redirecting to ${expectedPage}`);
            routeTo(userData.role);
            return;
        }

        const mainContentArea = document.getElementById('dashboard-content-area');
        mainContentArea.innerHTML = '';

        const sidebarNav = document.getElementById('sidebar-nav');
        populateDashboard(userData.role, sidebarNav);

        sidebarNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.hasAttribute('data-section')) {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                const currentActive = sidebarNav.querySelector('a.active-section');
                if (currentActive && currentActive.getAttribute('data-section') === section) {
                    return;
                }
                if (currentActive) currentActive.classList.remove('active-section');
                e.target.classList.add('active-section');
                loadDashboardSection(section, mainContentArea, document.getElementById('dashboard-title'));
            }
        });

        loadDashboardSection('overview', mainContentArea, document.getElementById('dashboard-title'));
    } catch (error) {
        console.error('Error fetching user profile:', error);
        if (error.status === 401) {
            console.warn('Unauthorized: Token likely expired, logging out...');
            logoutUser();
        } else {
            alert(`Failed to load profile: ${error.message}`);
            const mainContentArea = document.getElementById('dashboard-content-area');
            mainContentArea.innerHTML = `<p class="error-message">Could not load dashboard. Error: ${error.message}</p>`;
        }
    }
}

// =================================================
// === DOMContentLoaded Listener (Initial Setup) ===
// =================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    if (mobileMenuButton) { mobileMenuButton.addEventListener('click', () => { /* toggle logic */ }); }
    const currentLocation = location.href;
    const publicNavLinks = document.querySelectorAll('.navbar .nav-links a:not(.btn)');
    publicNavLinks.forEach(link => { /* active link logic */ });
    const contactForm = document.getElementById('contact-form');
    if (contactForm) { contactForm.addEventListener('submit', (e) => { /* simulation */ }); }
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginStatus = document.getElementById('login-status');
            if (!loginStatus) return;
            loginStatus.textContent = 'Logging in...'; loginStatus.style.color = 'orange';
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            if (!email || !password) { loginStatus.textContent = 'Email and password required.'; loginStatus.style.color = 'red'; return; }
            try {
                const fetchOptions = { method: 'POST', body: JSON.stringify({ email, password }) };
                console.log('[Login Handler] Calling apiFetch with options:', fetchOptions);
                const data = await apiFetch('/auth/login', fetchOptions);
                console.log('Login successful response data:', data);
                if (data && data.token && data.id && data.fullName && data.email && data.role) {
                    setAuthToken(data.token);
                    setUserInfo({ id: data.id, fullName: data.fullName, email: data.email, role: data.role });
                    loginStatus.textContent = 'Login successful! Redirecting...'; loginStatus.style.color = 'green';
                    console.log('[Login Handler] >>> EXECUTING REDIRECT to dashboard <<<');
                    routeTo(data.role);
                } else {
                    console.error('Login response OK but essential data missing:', data);
                    loginStatus.textContent = 'Login failed: Invalid response from server.'; loginStatus.style.color = 'red';
                }
            } catch (error) {
                console.error('[Login Handler] CATCH block executed. Login failed:', error);
                loginStatus.textContent = `Login failed: ${error.message}`; loginStatus.style.color = 'red';
            }
        });
    }
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const signupStatus = document.getElementById('signup-status');
            if (!signupStatus) return;
            signupStatus.textContent = 'Registering...'; signupStatus.style.color = 'orange';
            const fullName = document.getElementById('full-name').value;
            const email = document.getElementById('email-signup').value;
            const passwordSignup = document.getElementById('password-signup').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const role = document.getElementById('user-type-signup').value;
            if (passwordSignup !== confirmPassword) { signupStatus.textContent = 'Passwords do not match.'; signupStatus.style.color = 'red'; return; }
            if (!fullName || !email || !passwordSignup || !role) { signupStatus.textContent = 'Please fill all required fields.'; signupStatus.style.color = 'red'; return; }
            try {
                const payload = { fullName, email, password: passwordSignup, role };
                const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
                console.log('Registration successful:', data);
                signupStatus.textContent = 'Registration successful! Redirecting...'; signupStatus.style.color = 'green';
                setTimeout(() => { routeTo('login.html'); }, 1500);
            } catch (error) {
                console.error('Registration failed:', error);
                signupStatus.textContent = `Registration failed: ${error.message}`; signupStatus.style.color = 'red';
            }
        });
        const userTypeSelectSignup = document.getElementById('user-type-signup');
        const roleSpecificFieldsDiv = document.getElementById('role-specific-fields');
        if (userTypeSelectSignup && roleSpecificFieldsDiv) { /* role fields logic */ }
    }

    if (document.body.classList.contains('dashboard-body')) {
        console.log("Dashboard page loaded");
        const sidebarNav = document.getElementById('sidebar-nav');
        const mainContentArea = document.getElementById('dashboard-content-area');
        const dashboardTitle = document.getElementById('dashboard-title');
        const userNameSpan = document.getElementById('user-name');
        const logoutButton = document.getElementById('logout-button');

        if (!sidebarNav || !mainContentArea || !dashboardTitle || !userNameSpan || !logoutButton) {
            console.error("CRITICAL: Dashboard elements missing!");
            mainContentArea.innerHTML = `<p class="error-message">Dashboard initialization failed: Required elements missing.</p>`;
            return;
        }

        logoutButton.addEventListener('click', logoutUser);

        const token = getAuthToken();
        if (!token) {
            console.warn("No auth token found, redirecting to login...");
            routeTo('login.html');
            return;
        }

        fetchUserProfile();
    }
});

console.log("script.js execution finished.");