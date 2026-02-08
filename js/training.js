// Training and certification functions

function simulateAddRecord() {
    const modal = document.getElementById('trainingFormModal');
    if (!modal) {
        createTrainingFormModal();
    }
    document.getElementById('trainingFormModal').style.display = 'block';
}

function createTrainingFormModal() {
    const modalHTML = `
        <div id="trainingFormModal" class="modal">
            <div class="modal-content modal-large">
                <span class="close" onclick="closeTrainingFormModal()">&times;</span>
                <h2>Add Training Record</h2>
                <form id="trainingForm" onsubmit="handleTrainingSubmit(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Employee Name *</label>
                            <select required>
                                <option value="">Select Employee</option>
                                <option>Maria Santos</option>
                                <option>John Reyes</option>
                                <option>Ana Cruz</option>
                                <option>Pedro Garcia</option>
                                <option>Carlos Mendoza</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ID No.</label>
                            <input type="text" value="EMP-2024-001" readonly>
                        </div>
                        <div class="form-group">
                            <label>Training Title *</label>
                            <input type="text" placeholder="Enter training title" required>
                        </div>
                        <div class="form-group">
                            <label>Training Category *</label>
                            <select required>
                                <option value="">Select Category</option>
                                <option>Hands-on</option>
                                <option>Assessment</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Training Date *</label>
                            <input type="date" required>
                        </div>
                        <div class="form-group">
                            <label>Trainer *</label>
                            <input type="text" placeholder="Enter trainer name" required>
                        </div>
                        <div class="form-group">
                            <label>Validity Period *</label>
                            <select required onchange="updateExpirationDate(this)">
                                <option value="">Select Validity</option>
                                <option value="15">2 weeks (15 days)</option>
                                <option value="30">1 month</option>
                                <option value="45">1.5 months</option>
                                <option value="60">2 months</option>
                                <option value="90">3 months</option>
                                <option value="180">6 months</option>
                                <option value="365">1 year</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Expiration Date</label>
                            <input type="date" readonly id="expirationDate">
                        </div>
                        <div class="form-group">
                            <label>Process Classification *</label>
                            <select required>
                                <option value="">Select Classification</option>
                                <option>Easy</option>
                                <option>Difficult</option>
                                <option>Critical / Special</option>
                                <option>Sensing</option>
                                <option>Non sensing</option>
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
                        <button type="button" class="btn-secondary" onclick="closeTrainingFormModal()">
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

function closeTrainingFormModal() {
    const modal = document.getElementById('trainingFormModal');
    if (modal) modal.style.display = 'none';
}

function handleTrainingSubmit(event) {
    event.preventDefault();
    showSuccessMessage('Training record saved successfully! (Simulated)');
    closeTrainingFormModal();
    return false;
}

function updateExpirationDate(select) {
    const trainingDate = document.querySelector('#trainingForm input[type="date"]').value;
    if (trainingDate && select.value) {
        const date = new Date(trainingDate);
        date.setDate(date.getDate() + parseInt(select.value));
        document.getElementById('expirationDate').value = date.toISOString().split('T')[0];
    }
}

function viewTrainingDetails(employeeId) {
    const record = staticData.trainingRecords.find(r => r.employeeId === employeeId);
    const employee = staticData.employees.find(e => e.id === employeeId);
    
    if (record && employee) {
        const modal = document.getElementById('trainingDetailModal');
        const content = document.getElementById('trainingDetailContent');
        
        content.innerHTML = `
            <div class="detail-header">
                <div class="detail-badge">
                    <i data-lucide="book-open"></i>
                    <span>Training Record Details</span>
                </div>
            </div>
            <div class="detail-section">
                <h4><i data-lucide="user"></i> Employee Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">ID No.</div>
                        <div class="detail-value">${employee.id}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Full Name</div>
                        <div class="detail-value">${employee.fullName}</div>
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
            <div class="detail-section">
                <h4><i data-lucide="award"></i> Training Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Training Title</div>
                        <div class="detail-value"><strong>${record.trainingTitle}</strong></div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Training Category</div>
                        <div class="detail-value">${record.trainingCategory}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Training Date</div>
                        <div class="detail-value">${record.trainingDate}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Trainer</div>
                        <div class="detail-value">${record.trainer}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Validity Period</div>
                        <div class="detail-value">${record.validityPeriod}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Expiration Date</div>
                        <div class="detail-value"><strong>${record.expirationDate}</strong></div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Process Classification</div>
                        <div class="detail-value">${record.processClassification}</div>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-primary" onclick="simulateEdit('${employeeId}')">
                    <i data-lucide="edit"></i> Edit Record
                </button>
                <button class="btn-secondary" onclick="simulatePrint('${employeeId}')">
                    <i data-lucide="printer"></i> Print
                </button>
                <button class="btn-secondary" onclick="closeTrainingDetail()">
                    <i data-lucide="x"></i> Close
                </button>
            </div>
        `;
        
        modal.style.display = 'block';
        lucide.createIcons();
    }
}

function closeTrainingDetail() {
    const modal = document.getElementById('trainingDetailModal');
    modal.style.display = 'none';
}

function simulateEdit(id) {
    const record = staticData.trainingRecords.find(r => r.employeeId === id);
    if (!record) return;
    
    closeTrainingDetail();
    
    if (!document.getElementById('trainingEditModal')) {
        createTrainingEditModal(record);
    }
    document.getElementById('trainingEditModal').style.display = 'block';
}

function createTrainingEditModal(record) {
    const modalHTML = `
        <div id="trainingEditModal" class="modal">
            <div class="modal-content modal-large">
                <span class="close" onclick="closeTrainingEditModal()">&times;</span>
                <h2><i data-lucide="edit"></i> Edit Training Record</h2>
                <form id="trainingEditForm" onsubmit="handleTrainingEditSubmit(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Employee Name</label>
                            <input type="text" value="${record.employeeName}" readonly>
                        </div>
                        <div class="form-group">
                            <label>ID No.</label>
                            <input type="text" value="${record.employeeId}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Training Title *</label>
                            <input type="text" value="${record.trainingTitle}" required>
                        </div>
                        <div class="form-group">
                            <label>Training Category *</label>
                            <select required>
                                <option ${record.trainingCategory === 'Hands-on' ? 'selected' : ''}>Hands-on</option>
                                <option ${record.trainingCategory === 'Assessment' ? 'selected' : ''}>Assessment</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Training Date *</label>
                            <input type="date" value="${record.trainingDate}" required>
                        </div>
                        <div class="form-group">
                            <label>Trainer *</label>
                            <input type="text" value="${record.trainer}" required>
                        </div>
                        <div class="form-group">
                            <label>Validity Period *</label>
                            <select required>
                                <option ${record.validityPeriod === '2 weeks' ? 'selected' : ''}>2 weeks (15 days)</option>
                                <option ${record.validityPeriod === '1 month' ? 'selected' : ''}>1 month</option>
                                <option ${record.validityPeriod === '1.5 months' ? 'selected' : ''}>1.5 months</option>
                                <option ${record.validityPeriod === '2 months' ? 'selected' : ''}>2 months</option>
                                <option ${record.validityPeriod === '3 months' ? 'selected' : ''}>3 months</option>
                                <option ${record.validityPeriod === '6 months' ? 'selected' : ''}>6 months</option>
                                <option ${record.validityPeriod === '1 year' ? 'selected' : ''}>1 year</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Expiration Date</label>
                            <input type="date" value="${record.expirationDate}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Process Classification *</label>
                            <select required>
                                <option ${record.processClassification === 'Easy' ? 'selected' : ''}>Easy</option>
                                <option ${record.processClassification === 'Difficult' ? 'selected' : ''}>Difficult</option>
                                <option ${record.processClassification === 'Critical / Special' ? 'selected' : ''}>Critical / Special</option>
                                <option ${record.processClassification === 'Sensing' ? 'selected' : ''}>Sensing</option>
                                <option ${record.processClassification === 'Non sensing' ? 'selected' : ''}>Non sensing</option>
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
                        <button type="button" class="btn-secondary" onclick="closeTrainingEditModal()">
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

function closeTrainingEditModal() {
    const modal = document.getElementById('trainingEditModal');
    if (modal) modal.style.display = 'none';
}

function handleTrainingEditSubmit(event) {
    event.preventDefault();
    showSuccessMessage('Training record updated successfully! (Simulated)');
    closeTrainingEditModal();
    return false;
}

function simulatePrint(id) {
    alert(`[PROTOTYPE] Print Training Record\n\nPrinting record for ${id}\n\nIn the production system, this would generate a PDF or send to printer.`);
}

function simulateExport() {
    alert(`[PROTOTYPE] Export Data\n\nThis would export all training records to:\n• CSV format\n• Excel format\n\nChoose your preferred format in the production system.`);
}

// Filter functionality
const filterFactory = document.getElementById('filterFactory');
const filterLine = document.getElementById('filterLine');
const filterCategory = document.getElementById('filterCategory');
const filterClassification = document.getElementById('filterClassification');
const recordSearch = document.getElementById('recordSearch');

function filterTable() {
    const factoryValue = filterFactory ? filterFactory.value.toLowerCase() : '';
    const lineValue = filterLine ? filterLine.value.toLowerCase() : '';
    const categoryValue = filterCategory ? filterCategory.value.toLowerCase() : '';
    const classificationValue = filterClassification ? filterClassification.value.toLowerCase() : '';
    const searchValue = recordSearch ? recordSearch.value.toLowerCase() : '';
    
    const rows = document.querySelectorAll('#trainingTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const cells = row.getElementsByTagName('td');
        const factory = cells[4] ? cells[4].textContent.toLowerCase() : '';
        const line = cells[5] ? cells[5].textContent.toLowerCase() : '';
        const category = cells[8] ? cells[8].textContent.toLowerCase() : '';
        const classification = cells[13] ? cells[13].textContent.toLowerCase() : '';
        
        const matchesFactory = !factoryValue || factory.includes(factoryValue);
        const matchesLine = !lineValue || line.includes(lineValue);
        const matchesCategory = !categoryValue || category.includes(categoryValue);
        const matchesClassification = !classificationValue || classification.includes(classificationValue);
        const matchesSearch = !searchValue || text.includes(searchValue);
        
        if (matchesFactory && matchesLine && matchesCategory && matchesClassification && matchesSearch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    const total = rows.length;
    const countEl = document.getElementById('trainingRecordCount');
    if (countEl) {
        const visibleCount = Array.from(rows).filter(r => r.style.display !== 'none').length;
        countEl.textContent = `Showing ${visibleCount} of ${total} training records.`;
    }
}

if (filterFactory) filterFactory.addEventListener('change', filterTable);
if (filterLine) filterLine.addEventListener('change', filterTable);
if (filterCategory) filterCategory.addEventListener('change', filterTable);
if (filterClassification) filterClassification.addEventListener('change', filterTable);
if (recordSearch) recordSearch.addEventListener('input', filterTable);
