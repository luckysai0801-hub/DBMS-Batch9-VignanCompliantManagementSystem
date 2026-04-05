// =============================================
// routes/authRoutes.js
// Handles Login, Register, Logout
// =============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET /register - Show registration form
router.get('/register', authController.showRegister);

// POST /register - Handle registration
router.post('/register', authController.register);

// GET /login - Show login form
router.get('/login', authController.showLogin);

// POST /login - Handle login
router.post('/login', authController.login);

// GET /admin/login - Show admin login form
router.get('/admin/login', authController.showAdminLogin);

// POST /admin/login - Handle admin login
router.post('/admin/login', authController.adminLogin);

// GET /logout - Logout user
router.get('/logout', authController.logout);

module.exports = router;
