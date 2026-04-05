// =============================================
// routes/adminRoutes.js
// Handles Admin panel routes
// =============================================

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/roleMiddleware');

// GET /admin/dashboard - Admin Dashboard with stats
router.get('/dashboard', isAdmin, adminController.dashboard);

// GET /admin/complaints - List all complaints
router.get('/complaints', isAdmin, adminController.listComplaints);

// GET /admin/complaints/:id - View complaint details
router.get('/complaints/:id', isAdmin, adminController.complaintDetail);

// POST /admin/complaints/:id/update-status - Update complaint status
router.post('/complaints/:id/update-status', isAdmin, adminController.updateStatus);

// POST /admin/complaints/:id/update-details - Update complaint details (assign, remarks)
router.post('/complaints/:id/update-details', isAdmin, adminController.updateDetails);

// GET /admin/users - Manage users
router.get('/users', isAdmin, adminController.listUsers);

// GET /admin/export/csv - Download CSV
router.get('/export/csv', isAdmin, adminController.exportCSV);

// GET /admin/export/pdf - Print-ready PDF page
router.get('/export/pdf', isAdmin, adminController.exportPDF);

// GET /admin/reports - Reports page
router.get('/reports', isAdmin, adminController.reports);

module.exports = router;
