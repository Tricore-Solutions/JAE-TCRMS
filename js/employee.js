// Employee management functions

function simulateAddEmployee() {
    if (!document.getElementById('employeeFormModal')) {
        createEmployeeFormModal();
    }
    document.getElementById('employeeFormModal').style.display = 'block';
}

function createEmployeeFormModal() {
    const modalHTML = `
        <div id="employeeFormModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeEmployeeFormModal()">&times;</span>
                <h2><i data-lucide="user-plus"></i> Add New Employee</h2>
                <form id="employeeForm" onsubmit="handleEmployeeSubmit(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" placeholder="Enter full name" required>
                        </div>
                        <div class="form-group">
                            <label>ID No. *</label>
                            <input type="text" placeholder="EMP-YYYY-XXX" required>
                        </div>
                        <div class="form-group">
                            <label>Employment Status *</label>
                            <select required>
                                <option value="">Select Status</option>
                                <option>Active</option>
                                <option>Separated</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Date Hired *</label>
                            <input type="date" required>
                        </div>
                        <div class="form-group">
                            <label>Factory *</label>
                            <select required>
                                <option value="">Select Factory</option>
                                <option>1ST</option>
                                <option>2ND</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Line *</label>
                            <select required>
                                <option value="">Select Line</option>
                                <option>MX68</option>
                                <option>MX48</option>
                                <option>MX79AC</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Team *</label>
                            <select required>
                                <option value="">Select Team</option>
                                <option>Team A</option>
                                <option>Team B</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-note">
                        <i data-lucide="info"></i>
                        <p><strong>Note:</strong> This is a prototype. Data will not be saved.</p>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">
                            <i data-lucide="save"></i> Save (Simulated)
                        </button>
                        <button type="button" class="btn-secondary" onclick="closeEmployeeFormModal()">
                            <i data-lucide="x"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    lucide.createIcons();
}

function closeEmployeeFormModal() {
    const modal = document.getElementById('employeeFormModal');
    if (modal) modal.style.display = 'none';
}

function handleEmployeeSubmit(event) {
    event.preventDefault();
    showSuccessMessage('Employee added successfully! (Simulated)');
    closeEmployeeFormModal();
    return false;
}

function viewEmployeeDetails(employeeId) {
    const employee = staticData.employees.find(e => e.id === employeeId);
    const trainings = staticData.trainingRecords.filter(r => r.employeeId === employeeId);
    
    if (employee) {
        if (!document.getElementById('employeeDetailModal')) {
            createEmployeeDetailModal();
        }
        
        const content = document.getElementById('employeeDetailContent');
        
        let trainingsHTML = '';
        if (trainings.length > 0) {
            trainingsHTML = `
                <div class="detail-section">
                    <h4><i data-lucide="book-open"></i> Training History</h4>
                    <table class="mini-table">
                        <thead>
                            <tr>
                                <th>Training Title</th>
                                <th>Date</th>
                                <th>Expiration</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trainings.map(t => `
                                <tr>
                                    <td>${t.trainingTitle}</td>
                                    <td>${t.trainingDate}</td>
                                    <td>${t.expirationDate}</td>
                                    <td><span class="status-active">Active</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="detail-header">
                <div class="detail-badge">
                    <i data-lucide="user"></i>
                    <span>Employee Details</span>
                </div>
            </div>
            <div class="detail-section">
                <h4><i data-lucide="briefcase"></i> Basic Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">ID No.</div>
                        <div class="detail-value"><strong>${employee.id}</strong></div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Full Name</div>
                        <div class="detail-value"><strong>${employee.fullName}</strong></div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Employment Status</div>
                        <div class="detail-value"><span class="status-active">${employee.employmentStatus}</span></div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Date Hired</div>
                        <div class="detail-value">${employee.dateHired}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Factory</div>
                        <div class="detail-value">${employee.factory}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Line</div>
                        <div class="detail-value">${employee.line}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Team</div>
                        <div class="detail-value">${employee.team}</div>
                    </div>
                </div>
            </div>
            ${trainingsHTML}
            <div class="modal-actions">
                <button class="btn-primary" onclick="simulateEditEmployee('${employee.id}')">
                    <i data-lucide="edit"></i> Edit Employee
                </button>
                <button class="btn-secondary" onclick="closeEmployeeDetail()">
                    <i data-lucide="x"></i> Close
                </button>
            </div>
        `;
        
        document.getElementById('employeeDetailModal').style.display = 'block';
        lucide.createIcons();
    }
}

function createEmployeeDetailModal() {
    const modalHTML = `
        <div id="employeeDetailModal" class="modal">
            <div class="modal-content modal-large">
                <span class="close" onclick="closeEmployeeDetail()">&times;</span>
                <div id="employeeDetailContent"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeEmployeeDetail() {
    const modal = document.getElementById('employeeDetailModal');
    if (modal) modal.style.display = 'none';
}

function simulateEdit(id) {
    const employee = staticData.employees.find(e => e.id === id);
    if (!employee) return;
    
    if (!document.getElementById('employeeEditModal')) {
        createEmployeeEditModal(employee);
    } else {
        updateEmployeeEditModal(employee);
    }
    document.getElementById('employeeEditModal').style.display = 'block';
}

function simulateEditEmployee(id) {
    closeEmployeeDetail();
    simulateEdit(id);
}

function createEmployeeEditModal(employee) {
    const modalHTML = `
        <div id="employeeEditModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeEmployeeEditModal()">&times;</span>
                <h2><i data-lucide="edit"></i> Edit Employee</h2>
                <form id="employeeEditForm" onsubmit="handleEmployeeEditSubmit(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" value="${employee.fullName}" required>
                        </div>
                        <div class="form-group">
                            <label>ID No.</label>
                            <input type="text" value="${employee.id}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Employment Status *</label>
                            <select required>
                                <option ${employee.employmentStatus === 'Active' ? 'selected' : ''}>Active</option>
                                <option ${employee.employmentStatus === 'Separated' ? 'selected' : ''}>Separated</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Date Hired *</label>
                            <input type="date" value="${employee.dateHired}" required>
                        </div>
                        <div class="form-group">
                            <label>Factory *</label>
                            <select required>
                                <option ${employee.factory === '1ST' ? 'selected' : ''}>1ST</option>
                                <option ${employee.factory === '2ND' ? 'selected' : ''}>2ND</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Line *</label>
                            <select required>
                                <option ${employee.line === 'MX68' ? 'selected' : ''}>MX68</option>
                                <option ${employee.line === 'MX48' ? 'selected' : ''}>MX48</option>
                                <option ${employee.line === 'MX79AC' ? 'selected' : ''}>MX79AC</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Team *</label>
                            <select required>
                                <option ${employee.team === 'Team A' ? 'selected' : ''}>Team A</option>
                                <option ${employee.team === 'Team B' ? 'selected' : ''}>Team B</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-note">
                        <i data-lucide="info"></i>
                        <p><strong>Note:</strong> This is a prototype. Changes will not be saved.</p>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">
                            <i data-lucide="save"></i> Update (Simulated)
                        </button>
                        <button type="button" class="btn-secondary" onclick="closeEmployeeEditModal()">
                            <i data-lucide="x"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    lucide.createIcons();
}

function closeEmployeeEditModal() {
    const modal = document.getElementById('employeeEditModal');
    if (modal) modal.style.display = 'none';
}

function handleEmployeeEditSubmit(event) {
    event.preventDefault();
    showSuccessMessage('Employee updated successfully! (Simulated)');
    closeEmployeeEditModal();
    return false;
}

// Search functionality
const employeeSearch = document.getElementById('employeeSearch');
if (employeeSearch) {
    employeeSearch.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');
        
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
