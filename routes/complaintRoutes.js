// =============================================
// routes/complaintRoutes.js
// Handles User Complaint CRUD operations
// =============================================

const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { isAuthenticated, isUser } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// GET /dashboard - User Dashboard
router.get('/dashboard', isAuthenticated, complaintController.dashboard);

// GET /complaints/new - Show new complaint form
router.get('/complaints/new', isAuthenticated, complaintController.showNewComplaint);

// POST /complaints - Submit new complaint (with optional image)
router.post('/complaints', isAuthenticated, upload.single('image'), complaintController.createComplaint);

// GET /complaints - View all my complaints
router.get('/complaints', isAuthenticated, complaintController.myComplaints);

// GET /complaints/:id - View complaint details
router.get('/complaints/:id', isAuthenticated, complaintController.complaintDetail);

// GET /complaints/:id/edit - Edit complaint form
router.get('/complaints/:id/edit', isAuthenticated, complaintController.showEditComplaint);

// POST /complaints/:id/update - Update complaint
router.post('/complaints/:id/update', isAuthenticated, upload.single('image'), complaintController.updateComplaint);

// POST /complaints/:id/delete - Delete complaint
router.post('/complaints/:id/delete', isAuthenticated, complaintController.deleteComplaint);

// GET /profile - View profile
router.get('/profile', isAuthenticated, complaintController.showProfile);

// POST /profile/update - Update profile
router.post('/profile/update', isAuthenticated, complaintController.updateProfile);

// POST /profile/change-password - Change password
router.post('/profile/change-password', isAuthenticated, complaintController.changePassword);

module.exports = router;
