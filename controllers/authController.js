// =============================================
// controllers/authController.js
// Handles user registration, login, logout
// =============================================

const bcrypt = require('bcrypt');
const db = require('../config/db');

// ---- REGISTER ----

// GET /register - Show registration form
exports.showRegister = (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('auth/register', { title: 'Register - CMS' });
};

// POST /register - Handle registration form submission
exports.register = async (req, res) => {
    try {
        const { full_name, email, phone, password, confirm_password } = req.body;

        // --- Validation ---
        if (!full_name || !email || !password || !confirm_password) {
            req.session.error = 'All fields except phone are required.';
            return res.redirect('/register');
        }

        if (password !== confirm_password) {
            req.session.error = 'Passwords do not match.';
            return res.redirect('/register');
        }

        if (password.length < 6) {
            req.session.error = 'Password must be at least 6 characters.';
            return res.redirect('/register');
        }

        // Check if email already exists
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            req.session.error = 'Email already registered. Please login.';
            return res.redirect('/register');
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save to database
        await db.query(
            'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, phone || null, hashedPassword, 'user']
        );

        req.session.success = 'Registration successful! Please login.';
        res.redirect('/login');

    } catch (error) {
        console.error('Register Error:', error);
        req.session.error = 'Registration failed. Please try again.';
        res.redirect('/register');
    }
};

// ---- LOGIN ----

// GET /login - Show login form
exports.showLogin = (req, res) => {
    if (req.session.user && req.session.user.role === 'user') return res.redirect('/dashboard');
    if (req.session.user && req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    res.render('auth/login', { title: 'Login - CMS' });
};

// POST /login - Handle login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            req.session.error = 'Email and password are required.';
            return res.redirect('/login');
        }

        // Find user by email
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'user']);

        if (users.length === 0) {
            req.session.error = 'Invalid email or password.';
            return res.redirect('/login');
        }

        const user = users[0];

        // Compare password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.session.error = 'Invalid email or password.';
            return res.redirect('/login');
        }

        // Create session
        req.session.user = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };

        req.session.success = `Welcome back, ${user.full_name}!`;
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Login Error:', error);
        req.session.error = 'Login failed. Please try again.';
        res.redirect('/login');
    }
};

// ---- ADMIN LOGIN ----

// GET /admin/login - Show admin login form
exports.showAdminLogin = (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    res.render('auth/admin-login', { title: 'Admin Login - CMS' });
};

// POST /admin/login - Handle admin login
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            req.session.error = 'Email and password are required.';
            return res.redirect('/admin/login');
        }

        // Find admin user
        const [admins] = await db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'admin']);

        if (admins.length === 0) {
            req.session.error = 'Invalid admin credentials.';
            return res.redirect('/admin/login');
        }

        const admin = admins[0];

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            req.session.error = 'Invalid admin credentials.';
            return res.redirect('/admin/login');
        }

        // Create admin session
        req.session.user = {
            id: admin.id,
            full_name: admin.full_name,
            email: admin.email,
            role: admin.role
        };

        req.session.success = `Welcome, Admin ${admin.full_name}!`;
        res.redirect('/admin/dashboard');

    } catch (error) {
        console.error('Admin Login Error:', error);
        req.session.error = 'Login failed. Please try again.';
        res.redirect('/admin/login');
    }
};

// ---- LOGOUT ----

// GET /logout - Destroy session and redirect to home
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout Error:', err);
        res.redirect('/');
    });
};
