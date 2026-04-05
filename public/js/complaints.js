// =============================================
// complaints.js - Complaint Form JavaScript
// Image upload preview, char counter, delete modal
// =============================================

document.addEventListener('DOMContentLoaded', function () {

    // ---- IMAGE UPLOAD PREVIEW ----
    const fileInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    const fileLabel = document.getElementById('fileLabel');
    const fileUploadArea = document.getElementById('fileUploadArea');

    if (fileInput && imagePreview) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                // Check file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    alert('File too large! Maximum size is 5MB.');
                    this.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                    if (fileLabel) fileLabel.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });

        // Drag and drop support
        if (fileUploadArea) {
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = '#2563eb';
                fileUploadArea.style.background = '#eff6ff';
            });
            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.style.borderColor = '';
                fileUploadArea.style.background = '';
            });
            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = '';
                fileUploadArea.style.background = '';
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    fileInput.dispatchEvent(new Event('change'));
                }
            });
        }
    }

    // ---- CHARACTER COUNTER ----
    function setupCharCounter(fieldId, counterId, max) {
        const field = document.getElementById(fieldId);
        const counter = document.getElementById(counterId);
        if (field && counter) {
            counter.textContent = `${field.value.length}/${max}`;
            field.addEventListener('input', function () {
                counter.textContent = `${this.value.length}/${max}`;
                if (this.value.length > max * 0.9) {
                    counter.style.color = '#ef4444';
                } else {
                    counter.style.color = '';
                }
            });
        }
    }
    setupCharCounter('title', 'titleCount', 150);
    setupCharCounter('description', 'descCount', 2000);

    // ---- DELETE MODAL ----
    let pendingDeleteForm = null;

    window.confirmDelete = function (btn) {
        pendingDeleteForm = btn.closest('form');
        document.getElementById('deleteModal').style.display = 'flex';
    };
    window.closeDeleteModal = function () {
        document.getElementById('deleteModal').style.display = 'none';
        pendingDeleteForm = null;
    };

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (pendingDeleteForm) pendingDeleteForm.submit();
        });
    }

    // Close modal on outside click
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    // ---- FORM SUBMIT LOADING ----
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', function () {
            const btn = document.getElementById('submitBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            }
        });
    }
});
