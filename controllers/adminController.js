// =============================================
// controllers/adminController.js
// Handles all Admin panel operations
// =============================================

const db = require('../config/db');

// ---- ADMIN DASHBOARD ----

// GET /admin/dashboard
exports.dashboard = async (req, res) => {
    try {
        // Get overall complaint statistics
        const [stats] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
            FROM complaints
        `);

        // Get total users count
        const [userCount] = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'user'");

        // Get recent 10 complaints
        const [recentComplaints] = await db.query(`
            SELECT c.*, u.full_name as user_name
            FROM complaints c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
            LIMIT 10
        `);

        // Get complaints by category (for reports)
        const [byCategory] = await db.query(`
            SELECT category, COUNT(*) as count
            FROM complaints
            GROUP BY category
            ORDER BY count DESC
        `);

        // Get complaints by department
        const [byDepartment] = await db.query(`
            SELECT department, COUNT(*) as count
            FROM complaints
            GROUP BY department
            ORDER BY count DESC
        `);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: { ...stats[0], totalUsers: userCount[0].total },
            recentComplaints,
            byCategory,
            byDepartment
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: {},
            recentComplaints: [],
            byCategory: [],
            byDepartment: []
        });
    }
};

// ---- MANAGE COMPLAINTS ----

// GET /admin/complaints
exports.listComplaints = async (req, res) => {
    try {
        const { search, status, category, department, priority } = req.query;

        let query = `
            SELECT c.*, u.full_name as user_name, u.email as user_email
            FROM complaints c
            JOIN users u ON c.user_id = u.id
            WHERE 1=1
        `;
        let params = [];

        if (search) {
            query += ' AND (c.complaint_id LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
            params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
        }
        if (status) {
            query += ' AND c.status = ?';
            params.push(status);
        }
        if (category) {
            query += ' AND c.category = ?';
            params.push(category);
        }
        if (department) {
            query += ' AND c.department = ?';
            params.push(department);
        }
        if (priority) {
            query += ' AND c.priority = ?';
            params.push(priority);
        }

        query += ' ORDER BY c.created_at DESC';

        const [complaints] = await db.query(query, params);

        res.render('admin/complaints', {
            title: 'Manage Complaints',
            complaints,
            filters: { search, status, category, department, priority }
        });
    } catch (error) {
        console.error('Admin Complaints Error:', error);
        res.render('admin/complaints', { title: 'Manage Complaints', complaints: [], filters: {} });
    }
};

// GET /admin/complaints/:id
exports.complaintDetail = async (req, res) => {
    try {
        const [complaints] = await db.query(`
            SELECT c.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone
            FROM complaints c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [req.params.id]);

        if (complaints.length === 0) {
            req.session.error = 'Complaint not found.';
            return res.redirect('/admin/complaints');
        }

        // Get update history
        const [updates] = await db.query(`
            SELECT cu.*, u.full_name as updated_by_name
            FROM complaint_updates cu
            JOIN users u ON cu.updated_by = u.id
            WHERE cu.complaint_id = ?
            ORDER BY cu.updated_at DESC
        `, [req.params.id]);

        res.render('admin/complaint-detail', {
            title: 'Complaint Details - Admin',
            complaint: complaints[0],
            updates
        });
    } catch (error) {
        console.error('Admin Complaint Detail Error:', error);
        req.session.error = 'Error loading complaint.';
        res.redirect('/admin/complaints');
    }
};

// POST /admin/complaints/:id/update-status
exports.updateStatus = async (req, res) => {
    try {
        const { new_status, remarks } = req.body;
        const complaintId = req.params.id;
        const adminId = req.session.user.id;

        // Get current status
        const [complaints] = await db.query('SELECT status FROM complaints WHERE id = ?', [complaintId]);

        if (complaints.length === 0) {
            req.session.error = 'Complaint not found.';
            return res.redirect('/admin/complaints');
        }

        const oldStatus = complaints[0].status;

        // Update complaint status
        await db.query(
            'UPDATE complaints SET status = ?, admin_remarks = ? WHERE id = ?',
            [new_status, remarks || null, complaintId]
        );

        // Log the status change in complaint_updates table
        await db.query(`
            INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, remarks)
            VALUES (?, ?, ?, ?, ?)
        `, [complaintId, adminId, oldStatus, new_status, remarks || null]);

        req.session.success = `Complaint status updated to "${new_status}" successfully!`;
        res.redirect('/admin/complaints/' + complaintId);

    } catch (error) {
        console.error('Update Status Error:', error);
        req.session.error = 'Failed to update status.';
        res.redirect('/admin/complaints/' + req.params.id);
    }
};

// POST /admin/complaints/:id/update-details
exports.updateDetails = async (req, res) => {
    try {
        const { assigned_to, admin_remarks } = req.body;
        const complaintId = req.params.id;

        await db.query(
            'UPDATE complaints SET assigned_to = ?, admin_remarks = ? WHERE id = ?',
            [assigned_to || null, admin_remarks || null, complaintId]
        );

        req.session.success = 'Complaint details updated successfully!';
        res.redirect('/admin/complaints/' + complaintId);

    } catch (error) {
        console.error('Update Details Error:', error);
        req.session.error = 'Failed to update details.';
        res.redirect('/admin/complaints/' + req.params.id);
    }
};

// ---- MANAGE USERS ----

// GET /admin/users
exports.listUsers = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.*,
                COUNT(c.id) as complaint_count
            FROM users u
            LEFT JOIN complaints c ON u.id = c.user_id
            WHERE u.role = 'user'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);

        res.render('admin/users', { title: 'Manage Users', users });
    } catch (error) {
        console.error('Admin Users Error:', error);
        res.render('admin/users', { title: 'Manage Users', users: [] });
    }
};

// ---- REPORTS ----

// GET /admin/reports
// GET /admin/export/csv
exports.exportCSV = async (req, res) => {
    try {
        const [complaints] = await db.query(`
            SELECT c.complaint_id, u.full_name as student_name, u.email as student_email,
                   c.title, c.category, c.department, c.priority, c.status,
                   c.admin_remarks, c.assigned_to,
                   DATE_FORMAT(c.created_at, '%d-%b-%Y') as submitted_date,
                   DATE_FORMAT(c.updated_at, '%d-%b-%Y') as last_updated
            FROM complaints c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        `);

        const headers = ['Complaint ID','Student Name','Email','Title','Category','Department','Priority','Status','Admin Remarks','Assigned To','Submitted Date','Last Updated'];
        const rows = complaints.map(c => [
            c.complaint_id,
            c.student_name,
            c.student_email,
            '"' + (c.title || '').replace(/"/g, '""') + '"',
            c.category,
            c.department,
            c.priority,
            c.status,
            '"' + (c.admin_remarks || '').replace(/"/g, '""') + '"',
            c.assigned_to || '',
            c.submitted_date,
            c.last_updated
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const filename = `complaints_report_${new Date().toISOString().slice(0,10)}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
    } catch (error) {
        console.error('CSV Export Error:', error);
        req.session.error = 'Failed to export CSV.';
        res.redirect('/admin/reports');
    }
};

// GET /admin/export/pdf
exports.exportPDF = async (req, res) => {
    try {
        const [complaints] = await db.query(`
            SELECT c.complaint_id, u.full_name as student_name, c.title, c.category,
                   c.department, c.priority, c.status,
                   DATE_FORMAT(c.created_at, '%d-%b-%Y') as submitted_date
            FROM complaints c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        `);

        const [stats] = await db.query(`
            SELECT COUNT(*) as total,
                SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status='In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status='Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status='Rejected' THEN 1 ELSE 0 END) as rejected
            FROM complaints
        `);

        res.render('admin/export-pdf', {
            title: 'Export PDF Report',
            complaints,
            stats: stats[0],
            generatedAt: new Date().toLocaleString('en-IN')
        });
    } catch (error) {
        console.error('PDF Export Error:', error);
        req.session.error = 'Failed to generate PDF.';
        res.redirect('/admin/reports');
    }
};

exports.reports = async (req, res) => {
    try {
        // Stats overview
        const [stats] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
            FROM complaints
        `);

        // By Category
        const [byCategory] = await db.query(`
            SELECT category, COUNT(*) as count,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
            FROM complaints GROUP BY category ORDER BY count DESC
        `);

        // By Department
        const [byDepartment] = await db.query(`
            SELECT department, COUNT(*) as count,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
            FROM complaints GROUP BY department ORDER BY count DESC
        `);

        // By Priority
        const [byPriority] = await db.query(`
            SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority
        `);

        // Monthly trend (last 6 months)
        const [monthlyTrend] = await db.query(`
            SELECT
                DATE_FORMAT(created_at, '%b %Y') as month,
                DATE_FORMAT(created_at, '%Y-%m') as month_key,
                COUNT(*) as count
            FROM complaints
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month_key, month
            ORDER BY month_key ASC
        `);

        // Recent resolved complaints
        const [recentResolved] = await db.query(`
            SELECT c.complaint_id, c.title, c.category, c.department,
                   u.full_name as user_name, c.updated_at
            FROM complaints c
            JOIN users u ON c.user_id = u.id
            WHERE c.status = 'Resolved'
            ORDER BY c.updated_at DESC
            LIMIT 10
        `);

        res.render('admin/reports', {
            title: 'Reports - Admin',
            stats: stats[0],
            byCategory,
            byDepartment,
            byPriority,
            monthlyTrend,
            recentResolved
        });
    } catch (error) {
        console.error('Reports Error:', error);
        res.render('admin/reports', {
            title: 'Reports',
            stats: {},
            byCategory: [],
            byDepartment: [],
            byPriority: [],
            monthlyTrend: [],
            recentResolved: []
        });
    }
};
