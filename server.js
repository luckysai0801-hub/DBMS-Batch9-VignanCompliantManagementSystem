// =============================================
// server.js - Main Entry Point
// College Complaint Management System
// =============================================

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------------
// Ensure upload directory exists
// --------------------------------------------------------
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --------------------------------------------------------
// View Engine - EJS
// --------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --------------------------------------------------------
// Middleware
// --------------------------------------------------------

// Serve static files (CSS, JS, images, uploads)
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies
app.use(express.json());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,       // Set true if using HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24  // 1 day
    }
}));

// --------------------------------------------------------
// Global template variables (flash messages, user info)
// --------------------------------------------------------
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success = req.session.success || null;
    res.locals.error = req.session.error || null;

    // Clear flash messages after passing to template
    delete req.session.success;
    delete req.session.error;

    next();
});

// --------------------------------------------------------
// Routes
// --------------------------------------------------------

// Home - Landing Page
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

// Auth routes (login, register, logout)
app.use('/', authRoutes);

// User complaint routes (dashboard, complaints, profile)
app.use('/', complaintRoutes);

// Admin routes (prefixed with /admin)
app.use('/admin', adminRoutes);

// --------------------------------------------------------
// 404 Handler
// --------------------------------------------------------
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// --------------------------------------------------------
// Global Error Handler
// --------------------------------------------------------
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err.stack);
    res.status(500).render('404', {
        title: 'Server Error',
        message: err.message || 'Something went wrong!'
    });
});

// --------------------------------------------------------
// Start Server
// --------------------------------------------------------
app.listen(PORT, () => {
    fs.writeFileSync(path.join(__dirname, 'running.txt'), `Server started on port ${PORT}`);
    console.log('');
    console.log('🚀 ================================================');
    console.log(`   College Complaint Management System`);
    console.log(`   Server running at http://localhost:${PORT}`);
    console.log('   ================================================');
    console.log('');
    console.log('📌 Available URLs:');
    console.log(`   🏠  Home      : http://localhost:${PORT}/`);
    console.log('');
});
