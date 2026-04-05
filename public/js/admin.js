// =============================================
// admin.js - Admin Panel JavaScript
// Sidebar toggle, table search, status confirm
// =============================================

document.addEventListener('DOMContentLoaded', function () {

    // ---- SIDEBAR TOGGLE (shared in main.js too) ----
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // ---- CONFIRM STATUS CHANGE ----
    const statusForm = document.getElementById('statusForm');
    if (statusForm) {
        statusForm.addEventListener('submit', function (e) {
            const newStatus = this.querySelector('select[name="new_status"]').value;
            const confirmed = confirm(`Are you sure you want to update the status to "${newStatus}"?\nThis action will be logged in the complaint history.`);
            if (!confirmed) e.preventDefault();
        });
    }

    // ---- AUTO-DISMISS ALERTS ----
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    });

    // ---- CLIENT-SIDE TABLE SEARCH ----
    const tableSearchInput = document.getElementById('tableSearch');
    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('.data-table tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // ---- ANIMATE STAT NUMBERS (count up effect) ----
    const statNumbers = document.querySelectorAll('.stat-info h3');
    statNumbers.forEach(numEl => {
        const target = parseInt(numEl.textContent);
        if (isNaN(target) || target === 0) return;
        let current = 0;
        const increment = Math.ceil(target / 20);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            numEl.textContent = current;
        }, 40);
    });
});
