-- =============================================
-- database.sql
-- Complaint Management System - VEC
-- Run these commands in MySQL to set up the DB
-- =============================================

-- Step 1: Create and use database
CREATE DATABASE IF NOT EXISTS complaint_management;
USE complaint_management;

-- =============================================
-- TABLE 1: users
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100)  NOT NULL,
    email        VARCHAR(100)  UNIQUE NOT NULL,
    phone        VARCHAR(15),
    password     VARCHAR(255)  NOT NULL,
    role         ENUM('user','admin') DEFAULT 'user',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE 2: complaints
-- =============================================
CREATE TABLE IF NOT EXISTS complaints (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(20)   UNIQUE NOT NULL,
    user_id      INT           NOT NULL,
    title        VARCHAR(150)  NOT NULL,
    category     VARCHAR(100)  NOT NULL,
    department   VARCHAR(100)  NOT NULL,
    priority     ENUM('Low','Medium','High') DEFAULT 'Medium',
    description  TEXT          NOT NULL,
    image_path   VARCHAR(255),
    status       ENUM('Pending','In Progress','Resolved','Rejected') DEFAULT 'Pending',
    admin_remarks TEXT,
    assigned_to  VARCHAR(100),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TABLE 3: complaint_updates (Audit Log)
-- =============================================
CREATE TABLE IF NOT EXISTS complaint_updates (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT           NOT NULL,
    updated_by   INT           NOT NULL,
    old_status   VARCHAR(50),
    new_status   VARCHAR(50),
    remarks      TEXT,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by)   REFERENCES users(id)      ON DELETE CASCADE
);

-- =============================================
-- SAMPLE DATA: Admin User
-- Password: admin123 (bcrypt hashed)
-- You can also run "node create-admin.js" to create admin
-- =============================================
INSERT INTO users (full_name, email, phone, password, role)
VALUES (
    'Admin VEC',
    'admin@vignan.ac.in',
    '9876543210',
    '$2b$10$i1wQZ4Lt7jNBLzOLalqvR.axpZYdb6Ene9/NRAlnNsmfWh/9IS1E.',
    'admin'
);
-- NOTE: The above hash is for password "admin123"
-- To generate a new hash, run: node -e "const b=require('bcrypt');b.hash('yourpass',10).then(h=>console.log(h))"

-- =============================================
-- SAMPLE DATA: Test Students
-- All passwords: admin123
-- =============================================
INSERT INTO users (full_name, email, phone, password, role) VALUES
('Rahul Sharma',   'rahul@student.vignan.ac.in', '9100000001',
 '$2b$10$i1wQZ4Lt7jNBLzOLalqvR.axpZYdb6Ene9/NRAlnNsmfWh/9IS1E.', 'user'),
('Priya Singh',    'priya@student.vignan.ac.in', '9100000002',
 '$2b$10$i1wQZ4Lt7jNBLzOLalqvR.axpZYdb6Ene9/NRAlnNsmfWh/9IS1E.', 'user'),
('Arun Kumar',     'arun@student.vignan.ac.in',  '9100000003',
 '$2b$10$i1wQZ4Lt7jNBLzOLalqvR.axpZYdb6Ene9/NRAlnNsmfWh/9IS1E.', 'user');

-- =============================================
-- SAMPLE DATA: Test Complaints
-- =============================================
INSERT INTO complaints (complaint_id, user_id, title, category, department, priority, description, status) VALUES
('CMP001', 2, 'Projector Not Working in Lab Block Room 201',
 'Infrastructure', 'CSE', 'High',
 'The projector in Room 201 of the Lab Block has been non-functional for the past 3 days. Multiple classes are being affected. Please repair it as soon as possible.',
 'Pending'),

('CMP002', 2, 'Water Cooler Not Dispensing Cold Water',
 'Infrastructure', 'General', 'Medium',
 'The water cooler near the CSE Department corridor has stopped providing cold water. Students have to go to the canteen which is far away.',
 'In Progress'),

('CMP003', 3, 'WiFi Very Slow in Hostel Block A',
 'IT / Network', 'Hostel', 'High',
 'The internet speed in Hostel Block A is extremely slow, especially in the evenings. Cannot download study materials or attend online classes.',
 'Resolved'),

('CMP004', 3, 'Library Books Not Available - DBMS Section',
 'Library', 'General', 'Low',
 'The library does not have enough copies of the DBMS textbook by Ramez Elmasri. Only 2 copies are available for 80 students.',
 'Pending'),

('CMP005', 4, 'AC Not Working in Exam Hall',
 'Electrical', 'Admin Office', 'High',
 'The air conditioner in Exam Hall 1 is not working. During exams, the temperature is very high making it uncomfortable for students.',
 'Rejected');

-- =============================================
-- SAMPLE DATA: Complaint Update History
-- =============================================
INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, remarks) VALUES
(2, 1, 'Pending', 'In Progress', 'We have contacted the maintenance team. Issue will be resolved within 2 days.'),
(3, 1, 'Pending', 'In Progress', 'Checking the network equipment in Hostel Block A.'),
(3, 1, 'In Progress', 'Resolved', 'WiFi router replaced and network speed improved to 100Mbps. Issue resolved.'),
(5, 1, 'Pending', 'Rejected', 'The AC was serviced last month. Please check if it is switched on from the main control panel. Closing this complaint.');

-- =============================================
-- DEMO SQL QUERIES (for DBMS Viva)
-- =============================================

-- Show all tables
-- SHOW TABLES;

-- View all users
-- SELECT id, full_name, email, role, created_at FROM users;

-- View all complaints with user name (JOIN)
-- SELECT c.complaint_id, u.full_name, c.title, c.category, c.department, c.priority, c.status, c.created_at
-- FROM complaints c
-- JOIN users u ON c.user_id = u.id
-- ORDER BY c.created_at DESC;

-- View all status updates (Audit Log)
-- SELECT cu.id, c.complaint_id, u.full_name as updated_by, cu.old_status, cu.new_status, cu.remarks, cu.updated_at
-- FROM complaint_updates cu
-- JOIN complaints c ON cu.complaint_id = c.id
-- JOIN users u ON cu.updated_by = u.id;

-- Count complaints by status
-- SELECT status, COUNT(*) as count FROM complaints GROUP BY status;

-- Count complaints by category
-- SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC;

-- Complaints with High priority that are still Pending
-- SELECT complaint_id, title, department, created_at FROM complaints WHERE priority='High' AND status='Pending';

-- Find all complaints by a specific user
-- SELECT c.complaint_id, c.title, c.status FROM complaints c JOIN users u ON c.user_id=u.id WHERE u.email='rahul@student.vignan.ac.in';
