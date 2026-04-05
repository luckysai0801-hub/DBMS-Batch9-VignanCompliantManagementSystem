// =============================================
// middleware/roleMiddleware.js
// Checks if user has admin role
// =============================================

// Protect routes - only for admin users
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next(); // Admin is logged in, proceed
    }
    // Not admin - redirect to admin login
    req.session.error = 'Access denied. Admin privileges required.';
    res.redirect('/admin/login');
};

module.exports = { isAdmin };
