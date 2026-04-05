// =============================================
// auth.js - Authentication Pages JavaScript
// Password toggle, strength indicator, validation
// =============================================

// ---- TOGGLE PASSWORD VISIBILITY ----
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(fieldId + '-icon');
    if (!field || !icon) return;
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

document.addEventListener('DOMContentLoaded', function () {

    // ---- PASSWORD STRENGTH INDICATOR ----
    const passwordField = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrength');
    if (passwordField && strengthBar) {
        passwordField.addEventListener('input', function () {
            const val = this.value;
            strengthBar.innerHTML = ''; // clear
            if (!val) return;

            let strength = 0;
            if (val.length >= 6) strength++;
            if (val.length >= 10) strength++;
            if (/[A-Z]/.test(val)) strength++;
            if (/[0-9]/.test(val)) strength++;
            if (/[^A-Za-z0-9]/.test(val)) strength++;

            const bar = document.createElement('div');
            bar.classList.add('strength-bar');
            if (strength <= 2) {
                bar.classList.add('strength-weak');
                bar.title = 'Weak password';
            } else if (strength <= 3) {
                bar.classList.add('strength-medium');
                bar.title = 'Medium password';
            } else {
                bar.classList.add('strength-strong');
                bar.title = 'Strong password';
            }
            strengthBar.appendChild(bar);
        });
    }

    // ---- PASSWORD MATCH INDICATOR ----
    const confirmField = document.getElementById('confirm_password');
    const matchDiv = document.getElementById('passwordMatch');
    if (confirmField && matchDiv && passwordField) {
        confirmField.addEventListener('input', function () {
            if (this.value === '') {
                matchDiv.textContent = '';
                return;
            }
            if (this.value === passwordField.value) {
                matchDiv.textContent = '✓ Passwords match';
                matchDiv.className = 'password-match match-ok';
            } else {
                matchDiv.textContent = '✗ Passwords do not match';
                matchDiv.className = 'password-match match-fail';
            }
        });
    }

    // ---- FORM SUBMIT LOADING STATE ----
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function () {
            const btn = document.getElementById('loginBtn');
            const loader = document.getElementById('loginLoader');
            if (btn && loader) {
                btn.disabled = true;
                loader.style.display = 'inline';
                btn.querySelector('i').style.display = 'none';
            }
        });
    }

    // ---- REGISTER FORM SUBMIT VALIDATION ----
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            const pwd = document.getElementById('password').value;
            const cpwd = document.getElementById('confirm_password').value;
            if (pwd !== cpwd) {
                e.preventDefault();
                alert('Passwords do not match!');
            }
        });
    }
});
