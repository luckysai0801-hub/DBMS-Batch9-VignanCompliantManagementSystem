# Complaint Management System
## Vignan Institute of Technology and Science — DBMS Web Technologies Project

A full-stack web application for managing student complaints, built with Node.js, Express.js, MySQL, and vanilla HTML/CSS/JS.

---

## 📁 Tech Stack
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | MySQL |
| Auth | express-session + bcrypt |
| Uploads | Multer |
| Templates | EJS |

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v14 or above)
- [MySQL](https://dev.mysql.com/downloads/) (running locally)
- [VS Code](https://code.visualstudio.com/)

### 2. Install Dependencies
```bash
cd complaint-management-system
npm install
```

### 3. Configure Environment
Edit the `.env` file with your MySQL credentials:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=complaint_management
SESSION_SECRET=vignan_cms_secret_key_2024
```

### 4. Setup MySQL Database
Open MySQL command line or MySQL Workbench, then run:
```sql
source path/to/database.sql
```
Or copy-paste the commands from `database.sql` into MySQL.

### 5. Run the Application
```bash
npm start
```
Or with auto-restart:
```bash
npm run dev
```

Open browser: **http://localhost:3000**

---

## 👤 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@vignan.ac.in | admin123 |
| **Student** | rahul@student.vignan.ac.in | admin123 |
| **Student** | priya@student.vignan.ac.in | admin123 |

---

## 🗄️ MySQL Command Line Steps (for Viva Demo)

### Open MySQL CLI
```bash
mysql -u root -p
```

### Run All Setup Commands
```sql
-- Create and use database
CREATE DATABASE IF NOT EXISTS complaint_management;
USE complaint_management;

-- Run the SQL file
SOURCE C:/path/to/database.sql;

-- Verify tables created
SHOW TABLES;
```

### Demo Queries for Viva

```sql
-- 1. View all users
SELECT id, full_name, email, role FROM users;

-- 2. View all complaints (with student name using JOIN)
SELECT c.complaint_id, u.full_name, c.title, c.category, c.status
FROM complaints c
JOIN users u ON c.user_id = u.id;

-- 3. Count complaints by status
SELECT status, COUNT(*) as total FROM complaints GROUP BY status;

-- 4. View audit log (who changed what status)
SELECT cu.id, c.complaint_id, u.full_name as changed_by,
       cu.old_status, cu.new_status, cu.updated_at
FROM complaint_updates cu
JOIN complaints c ON cu.complaint_id = c.id
JOIN users u ON cu.updated_by = u.id;

-- 5. High priority pending complaints
SELECT complaint_id, title, department FROM complaints
WHERE priority = 'High' AND status = 'Pending';

-- 6. Complaints by category
SELECT category, COUNT(*) as count
FROM complaints GROUP BY category ORDER BY count DESC;
```

---

## 📁 Project Structure

```
complaint-management-system/
├── public/
│   ├── css/          (style.css, auth.css, dashboard.css, admin.css, complaints.css)
│   ├── js/           (main.js, auth.js, complaints.js, admin.js)
│   └── uploads/      (complaint images saved here)
├── routes/           (authRoutes, complaintRoutes, adminRoutes)
├── controllers/      (authController, complaintController, adminController)
├── middleware/       (authMiddleware, roleMiddleware, uploadMiddleware)
├── config/           (db.js - MySQL pool connection)
├── views/            (EJS templates)
│   ├── auth/         (login.ejs, register.ejs, admin-login.ejs)
│   ├── user/         (dashboard, complaints, profile)
│   ├── admin/        (dashboard, complaints, users, reports)
│   └── partials/     (navbar, footer, sidebar, admin-sidebar)
├── .env              (environment variables)
├── server.js         (main entry point)
├── database.sql      (MySQL schema + sample data)
└── README.md
```

---

## ✨ Features Summary

- **Public**: Home page, register, login, admin login
- **User**: Dashboard with stats, submit complaint (with image), my complaints list, search/filter, complaint detail with history timeline, edit/delete (Pending only), profile, change password
- **Admin**: Dashboard with 6 stat cards, manage all complaints with filters, update status (logged in complaint_updates table), assign to staff, add remarks, manage users, reports by category/department/priority

---

## 🗃️ Database Tables

| Table | Purpose |
|---|---|
| `users` | Students and admins |
| `complaints` | All complaint records |
| `complaint_updates` | Audit log — every status change |

> **Relationships**: `complaints.user_id → users.id` | `complaint_updates.complaint_id → complaints.id`

---

## 🎓 DBMS Concepts Used (for Viva)
- DDL: `CREATE TABLE`, `ALTER`
- DML: `INSERT`, `SELECT`, `UPDATE`, `DELETE`
- Joins: `INNER JOIN` between users, complaints, complaint_updates
- Constraints: `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, `DEFAULT`
- Aggregate: `COUNT()`, `SUM()`, `GROUP BY`
- Enums: status, priority, role fields
- Cascading: `ON DELETE CASCADE`
- Timestamps: `CURRENT_TIMESTAMP`, `ON UPDATE CURRENT_TIMESTAMP`
"# DBMS-Batch9-VignanCompliantManagementSystem" 
