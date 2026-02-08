// User management functions

function simulateAddUser() {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    modalTitle.textContent = 'Add User';
    form.reset();
    modal.style.display = 'block';
}

function simulateViewUser(username) {
    const user = staticData.users.find(u => u.username === username);
    if (!user) return;
    
    if (!document.getElementById('userViewModal')) {
        createUserViewModal();
    }
    
    const content = document.getElementById('userViewContent');
    content.innerHTML = `
        <div class="detail-header">
            <div class="detail-badge">
                <i data-lucide="user"></i>
                <span>User Details</span>
            </div>
        </div>
        <div class="detail-section">
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Username</div>
                    <div class="detail-value"><strong>${user.username}</strong></div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Full Name</div>
                    <div class="detail-value">${user.fullName}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Role</div>
                    <div class="detail-value">
                        <span class="badge-role ${user.role}">${user.role === 'admin' ? 'Admin' : user.role === 'encoder' ? 'Encoder' : 'Outside User'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${user.email}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value"><span class="status-active">Active</span></div>
                </div>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-primary" onclick="simulateEditUser('${user.username}')">
                <i data-lucide="edit"></i> Edit User
            </button>
            <button class="btn-secondary" onclick="closeUserViewModal()">
                <i data-lucide="x"></i> Close
            </button>
        </div>
    `;
    
    document.getElementById('userViewModal').style.display = 'block';
    lucide.createIcons();
}

function createUserViewModal() {
    const modalHTML = `
        <div id="userViewModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeUserViewModal()">&times;</span>
                <div id="userViewContent"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeUserViewModal() {
    const modal = document.getElementById('userViewModal');
    if (modal) modal.style.display = 'none';
}

function simulateEditUser(username) {
    closeUserViewModal();
    
    const user = staticData.users.find(u => u.username === username);
    if (!user) return;
    
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    modalTitle.textContent = 'Edit User';
    
    // Populate form with user data
    form.elements[0].value = user.username;
    form.elements[0].readOnly = true;
    form.elements[1].value = user.fullName;
    form.elements[2].value = user.role;
    form.elements[3].value = user.email;
    form.elements[4].value = ''; // Password field empty
    
    modal.style.display = 'block';
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    modal.style.display = 'none';
    
    // Reset form
    const form = document.getElementById('userForm');
    if (form) {
        form.reset();
        if (form.elements[0]) form.elements[0].readOnly = false;
    }
}

function simulateDeleteUser(username) {
    if (confirm('Delete user "' + username + '"? This is a prototype – no data will be removed.')) {
        showSuccessMessage('User deleted (Simulated)');
    }
}

function toggleSelectAll(checkbox) {
    var rowCheckboxes = document.querySelectorAll('.row-checkbox');
    rowCheckboxes.forEach(function(cb) { cb.checked = checkbox.checked; });
}

function handleUserSubmit(event) {
    event.preventDefault();
    const modalTitle = document.getElementById('modalTitle').textContent;
    const action = modalTitle.includes('Edit') ? 'updated' : 'added';
    showSuccessMessage(`User ${action} successfully! (Simulated)`);
    closeUserModal();
    return false;
}

// Search functionality (simulated)
const userSearch = document.getElementById('userSearch');
if (userSearch) {
    userSearch.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#usersTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}
