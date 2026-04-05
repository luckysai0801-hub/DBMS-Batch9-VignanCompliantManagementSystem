// =============================================
// controllers/complaintController.js
// Handles all user complaint operations
// CRUD: Create, Read, Update, Delete
// =============================================

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper: Generate next complaint ID (CMP001, CMP002...)
async function generateComplaintId() {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM complaints');
    const count = rows[0].count + 1;
    return 'CMP' + String(count).padStart(3, '0');
}

// ---- USER DASHBOARD ----

// GET /dashboard
exports.dashboard = async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Get complaint statistics for this user
        const [stats] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
            FROM complaints WHERE user_id = ?
        `, [userId]);

        // Get recent 5 complaints
        const [recentComplaints] = await db.query(`
            SELECT * FROM complaints WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 5
        `, [userId]);

        res.render('user/dashboard', {
            title: 'My Dashboard',
            stats: stats[0],
            recentComplaints
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.render('user/dashboard', { title: 'My Dashboard', stats: {}, recentComplaints: [] });
    }
};

// ---- NEW COMPLAINT ----

// GET /complaints/new
exports.showNewComplaint = (req, res) => {
    res.render('user/new-complaint', { title: 'Submit Complaint' });
};

// POST /complaints
exports.createComplaint = async (req, res) => {
    try {
        const { title, category, department, priority, description } = req.body;
        const userId = req.session.user.id;

        // Validation
        if (!title || !category || !department || !priority || !description) {
            req.session.error = 'All fields are required.';
            return res.redirect('/complaints/new');
        }

        // Get image path if uploaded
        const imagePath = req.file ? '/uploads/' + req.file.filename : null;

        // Generate unique complaint ID
        const complaintId = await generateComplaintId();

        // Insert into database
        await db.query(`
            INSERT INTO complaints (complaint_id, user_id, title, category, department, priority, description, image_path, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, [complaintId, userId, title, category, department, priority, description, imagePath]);

        req.session.success = `Complaint submitted successfully! Your ID: ${complaintId}`;
        res.redirect('/complaints');

    } catch (error) {
        console.error('Create Complaint Error:', error);
        req.session.error = 'Failed to submit complaint. Please try again.';
        res.redirect('/complaints/new');
    }
};

// ---- MY COMPLAINTS ----

// GET /complaints
exports.myComplaints = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { search, status, category } = req.query;

        // Build dynamic query with filters
        let query = 'SELECT * FROM complaints WHERE user_id = ?';
        let params = [userId];

        if (search) {
            query += ' AND complaint_id LIKE ?';
            params.push('%' + search + '%');
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const [complaints] = await db.query(query, params);

        res.render('user/my-complaints', {
            title: 'My Complaints',
            complaints,
            filters: { search, status, category }
        });
    } catch (error) {
        console.error('My Complaints Error:', error);
        res.render('user/my-complaints', { title: 'My Complaints', complaints: [], filters: {} });
    }
};

// ---- COMPLAINT DETAIL ----

// GET /complaints/:id
exports.complaintDetail = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const complaintDbId = req.params.id;

        // Get complaint (ensure it belongs to current user)
        const [complaints] = await db.query(
            'SELECT * FROM complaints WHERE id = ? AND user_id = ?',
            [complaintDbId, userId]
        );

        if (complaints.length === 0) {
            req.session.error = 'Complaint not found.';
            return res.redirect('/complaints');
        }

        // Get status update history
        const [updates] = await db.query(`
            SELECT cu.*, u.full_name as updated_by_name
            FROM complaint_updates cu
            JOIN users u ON cu.updated_by = u.id
            WHERE cu.complaint_id = ?
            ORDER BY cu.updated_at DESC
        `, [complaintDbId]);

        res.render('user/complaint-detail', {
            title: 'Complaint Details',
            complaint: complaints[0],
            updates
        });
    } catch (error) {
        console.error('Complaint Detail Error:', error);
        req.session.error = 'Error loading complaint details.';
        res.redirect('/complaints');
    }
};

// ---- EDIT COMPLAINT ----

// GET /complaints/:id/edit
exports.showEditComplaint = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const [complaints] = await db.query(
            'SELECT * FROM complaints WHERE id = ? AND user_id = ?',
            [req.params.id, userId]
        );

        if (complaints.length === 0) {
            req.session.error = 'Complaint not found.';
            return res.redirect('/complaints');
        }

        const complaint = complaints[0];

        // Can only edit if status is Pending
        if (complaint.status !== 'Pending') {
            req.session.error = 'You can only edit complaints with Pending status.';
            return res.redirect('/complaints/' + req.params.id);
        }

        res.render('user/edit-complaint', { title: 'Edit Complaint', complaint });
    } catch (error) {
        console.error('Edit Complaint Error:', error);
        res.redirect('/complaints');
    }
};

// POST /complaints/:id/update
exports.updateComplaint = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const complaintId = req.params.id;
        const { title, category, department, priority, description } = req.body;

        // Verify ownership and status
        const [complaints] = await db.query(
            'SELECT * FROM complaints WHERE id = ? AND user_id = ?',
            [complaintId, userId]
        );

        if (complaints.length === 0) {
            req.session.error = 'Complaint not found.';
            return res.redirect('/complaints');
        }

        const complaint = complaints[0];

        if (complaint.status !== 'Pending') {
            req.session.error = 'Cannot edit complaint after it has been reviewed.';
            return res.redirect('/complaints/' + complaintId);
        }

        // Handle new image if uploaded
        let imagePath = complaint.image_path;
        if (req.file) {
            // Delete old image if exists
            if (complaint.image_path) {
                const oldPath = path.join(__dirname, '../public', complaint.image_path);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            imagePath = '/uploads/' + req.file.filename;
        }

        // Update complaint
        await db.query(`
            UPDATE complaints
            SET title = ?, category = ?, department = ?, priority = ?, description = ?, image_path = ?
            WHERE id = ? AND user_id = ?
        `, [title, category, department, priority, description, imagePath, complaintId, userId]);

        req.session.success = 'Complaint updated successfully!';
        res.redirect('/complaints/' + complaintId);

    } catch (error) {
        console.error('Update Complaint Error:', error);
        req.session.error = 'Failed to update complaint.';
        res.redirect('/complaints');
    }
};

// ---- DELETE COMPLAINT ----

// POST /complaints/:id/delete
exports.deleteComplaint = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const complaintId = req.params.id;

        const [complaints] = await db.query(
            'SELECT * FROM complaints WHERE id = ? AND user_id = ?',
            [complaintId, userId]
        );

        if (complaints.length === 0) {
            req.session.error = 'Complaint not found.';
            return res.redirect('/complaints');
        }

        const complaint = complaints[0];

        // Can only delete if Pending
        if (complaint.status !== 'Pending') {
            req.session.error = 'You can only delete complaints with Pending status.';
            return res.redirect('/complaints');
        }

        // Delete image if exists
        if (complaint.image_path) {
            const imgPath = path.join(__dirname, '../public', complaint.image_path);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }

        // Delete from database (complaint_updates deleted by CASCADE)
        await db.query('DELETE FROM complaints WHERE id = ? AND user_id = ?', [complaintId, userId]);

        req.session.success = 'Complaint deleted successfully.';
        res.redirect('/complaints');

    } catch (error) {
        console.error('Delete Complaint Error:', error);
        req.session.error = 'Failed to delete complaint.';
        res.redirect('/complaints');
    }
};

// ---- PROFILE ----

// GET /profile
exports.showProfile = async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
        res.render('user/profile', { title: 'My Profile', profileUser: users[0] });
    } catch (error) {
        console.error('Profile Error:', error);
        res.redirect('/dashboard');
    }
};

// POST /profile/update
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        const userId = req.session.user.id;

        if (!full_name) {
            req.session.error = 'Full name is required.';
            return res.redirect('/profile');
        }

        await db.query(
            'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
            [full_name, phone || null, userId]
        );

        // Update session name
        req.session.user.full_name = full_name;

        req.session.success = 'Profile updated successfully!';
        res.redirect('/profile');

    } catch (error) {
        console.error('Update Profile Error:', error);
        req.session.error = 'Failed to update profile.';
        res.redirect('/profile');
    }
};

// POST /profile/change-password
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password, confirm_password } = req.body;
        const userId = req.session.user.id;

        if (!current_password || !new_password || !confirm_password) {
            req.session.error = 'All password fields are required.';
            return res.redirect('/profile');
        }

        if (new_password !== confirm_password) {
            req.session.error = 'New passwords do not match.';
            return res.redirect('/profile');
        }

        if (new_password.length < 6) {
            req.session.error = 'New password must be at least 6 characters.';
            return res.redirect('/profile');
        }

        // Get current password from DB
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        const isMatch = await require('bcrypt').compare(current_password, users[0].password);

        if (!isMatch) {
            req.session.error = 'Current password is incorrect.';
            return res.redirect('/profile');
        }

        // Hash new password
        const hashedPassword = await require('bcrypt').hash(new_password, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        req.session.success = 'Password changed successfully!';
        res.redirect('/profile');

    } catch (error) {
        console.error('Change Password Error:', error);
        req.session.error = 'Failed to change password.';
        res.redirect('/profile');
    }
};
