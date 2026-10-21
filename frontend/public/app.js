const API_URL = 'http://localhost:5000/api';
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let authMode = 'login';
let allEvents = [];

function init() {
    updateNavbar();
    loadHomeEvents();
    
    document.getElementById('nav-home').addEventListener('click', () => switchView('home'));
    document.getElementById('nav-dashboard').addEventListener('click', () => { switchView('dashboard'); loadAdminDashboard(); });
    document.getElementById('auth-btn').addEventListener('click', handleAuthNav);
    
    document.getElementById('search-input').addEventListener('input', filterEvents);
    document.getElementById('category-filter').addEventListener('change', filterEvents);
    document.getElementById('toggle-auth-mode').addEventListener('click', toggleAuthMode);
    document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
    document.getElementById('open-create-modal').addEventListener('click', () => openModal());
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('event-form').addEventListener('submit', handleEventSubmit);
}

function updateNavbar() {
    const authBtn = document.getElementById('auth-btn');
    const navDashboard = document.getElementById('nav-dashboard');
    if (currentUser) {
        authBtn.textContent = `Logout (${currentUser.name})`;
        if (currentUser.role === 'admin') navDashboard.classList.remove('hidden');
        else navDashboard.classList.add('hidden');
    } else {
        authBtn.textContent = 'Login';
        navDashboard.classList.add('hidden');
    }
}

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`${viewName}-view`).classList.remove('hidden');
}

function handleAuthNav() {
    if (currentUser) {
        localStorage.removeItem('user');
        currentUser = null;
        updateNavbar();
        switchView('home');
        loadHomeEvents();
    } else {
        switchView('auth');
    }
}

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'signup' : 'login';
    document.getElementById('auth-title').textContent = authMode === 'login' ? 'Login' : 'Sign Up';
    document.getElementById('name-group').classList.toggle('hidden', authMode === 'login');
    document.getElementById('role-group').classList.toggle('hidden', authMode === 'login');
    document.getElementById('auth-submit-btn').textContent = authMode === 'login' ? 'Sign In' : 'Register';
    document.getElementById('toggle-auth-mode').textContent = authMode === 'login' ? 'Sign Up' : 'Login';
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value;
    const role = document.getElementById('auth-role').value;

    const endpoint = authMode === 'login' ? '/api/login' : '/api/signup';
    const payload = authMode === 'login' ? { email, password } : { name, email, password, role };

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Authentication failed');
        
        currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateNavbar();
        switchView(currentUser.role === 'admin' ? 'dashboard' : 'home');
        if(currentUser.role === 'admin') loadAdminDashboard(); else loadHomeEvents();
        document.getElementById('auth-form').reset();
    } catch (err) { alert(err.message); }
}

async function loadHomeEvents() {
    try {
        const res = await fetch(`${API_URL}/events`);
        allEvents = await res.json();
        renderHomeEvents(allEvents);
    } catch (err) { console.error('Failed to load events', err); }
}

function renderHomeEvents(events) {
    const container = document.getElementById('events-container');
    if(events.length === 0) { container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:gray;">No events found.</p>'; return; }
    container.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-body">
                <span class="event-category">${event.category}</span>
                <h3 class="event-title">${event.title}</h3>
                <p class="event-desc">${event.description}</p>
                <p class="event-meta">📅 <strong>Date:</strong> ${event.date} | ⏰ ${event.time}</p>
                <p class="event-meta">📍 <strong>Location:</strong> ${event.location}</p>
                <p class="event-meta">👥 <strong>Capacity:</strong> ${event.capacity} seats</p>
                <button class="btn btn-primary" style="margin-top:1rem" onclick="registerForEvent(${event.id})">Register Event</button>
            </div>
        </div>
    `).join('');
}

function filterEvents() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const cat = document.getElementById('category-filter').value;
    const filtered = allEvents.filter(e => e.title.toLowerCase().includes(query) && (cat === '' || e.category === cat));
    renderHomeEvents(filtered);
}

async function registerForEvent(eventId) {
    if (!currentUser) { alert('Please login to register for events.'); switchView('auth'); return; }
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, event_id: eventId })
        });
        const data = await res.json();
        alert(data.message);
    } catch (err) { alert('Registration failed.'); }
}

async function loadAdminDashboard() {
    try {
        const res = await fetch(`${API_URL}/events`);
        const events = await res.json();
        document.getElementById('admin-events-table').innerHTML = events.map(e => `
            <tr>
                <td><strong>${e.title}</strong></td>
                <td>${e.category}</td>
                <td>${e.date}</td>
                <td>${e.location}</td>
                <td>${e.capacity}</td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

function openModal() { document.getElementById('event-modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('event-modal').classList.add('hidden'); }

async function handleEventSubmit(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById('event-title').value,
        description: document.getElementById('event-description').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        location: document.getElementById('event-location').value,
        category: document.getElementById('event-category').value,
        capacity: parseInt(document.getElementById('event-capacity').value)
    };
    try {
        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to save event');
        closeModal();
        loadAdminDashboard();
    } catch (err) { alert(err.message); }
}

window.onload = init;
