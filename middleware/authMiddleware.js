// =============================================
// middleware/authMiddleware.js
// Checks if user is logged in
// =============================================

// Protect routes - only for logged-in users
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next(); // User is logged in, proceed
    }
    // Not logged in - redirect to login page with message
    req.session.error = 'Please login to access this page.';
    res.redirect('/login');
};

// Check if user is a regular user (not admin)
const isUser = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'user') {
        return next();
    }
    req.session.error = 'Access denied. Users only.';
    res.redirect('/login');
};

module.exports = { isAuthenticated, isUser };
