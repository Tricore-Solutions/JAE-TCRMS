// Main JavaScript functions

// Show notifications modal
function showNotifications() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeNotifications() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Count of expired + expiring within 10 days (for badges)
function getExpiredAndExpiringCount() {
    const data = (typeof staticData !== 'undefined' && staticData.trainingRecords) ? staticData.trainingRecords : (window.staticData && window.staticData.trainingRecords) ? window.staticData.trainingRecords : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in10Days = new Date(today);
    in10Days.setDate(in10Days.getDate() + 10);
    let count = 0;
    data.forEach(function (r) {
        if (!r.expirationDate) return;
        const exp = new Date(r.expirationDate);
        exp.setHours(0, 0, 0, 0);
        if (exp < today || (exp >= today && exp <= in10Days)) count++;
    });
    return count;
}

// Expired certifications modal: all expired + expiring within 10 days
function showExpiredCertificationsModal() {
    const modal = document.getElementById('expiredCertificationsModal');
    const listEl = document.getElementById('expiredCertificationsList');
    if (!modal || !listEl) return;
    const data = (typeof staticData !== 'undefined' && staticData.trainingRecords) ? staticData.trainingRecords : (window.staticData && window.staticData.trainingRecords) ? window.staticData.trainingRecords : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in10Days = new Date(today);
    in10Days.setDate(in10Days.getDate() + 10);
    const expired = data.filter(function (r) {
        if (!r.expirationDate) return false;
        const exp = new Date(r.expirationDate);
        exp.setHours(0, 0, 0, 0);
        return exp < today;
    });
    const expiringIn10Days = data.filter(function (r) {
        if (!r.expirationDate) return false;
        const exp = new Date(r.expirationDate);
        exp.setHours(0, 0, 0, 0);
        return exp >= today && exp <= in10Days;
    });
    function row(r, status, statusClass) {
        return '<tr><td>' + (r.employeeName || '—') + '</td><td>' + (r.trainingTitle || '—') + '</td><td>' + (r.expirationDate || '—') + '</td><td>' + (r.processClassification || '—') + '</td><td><span class="cert-status cert-status-' + statusClass + '">' + status + '</span></td></tr>';
    }
    var html = '';
    if (expired.length > 0) {
        html += '<h3 class="expired-section-title">Expired (' + expired.length + ')</h3><table class="data-table"><thead><tr><th>Employee</th><th>Training</th><th>Expiration date</th><th>Process</th><th>Status</th></tr></thead><tbody>' +
            expired.map(function (r) { return row(r, 'Expired', 'expired'); }).join('') + '</tbody></table>';
    }
    if (expiringIn10Days.length > 0) {
        html += '<h3 class="expired-section-title">Expiring in 10 days (' + expiringIn10Days.length + ')</h3><table class="data-table"><thead><tr><th>Employee</th><th>Training</th><th>Expiration date</th><th>Process</th><th>Status</th></tr></thead><tbody>' +
            expiringIn10Days.map(function (r) { return row(r, 'Expiring soon', 'expiring-soon'); }).join('') + '</tbody></table>';
    }
    if (!html) {
        html = '<p class="no-expired-msg">No expired certifications and none expiring in the next 10 days.</p>';
    }
    listEl.innerHTML = html;
    modal.style.display = 'block';
}

function closeExpiredCertificationsModal() {
    const modal = document.getElementById('expiredCertificationsModal');
    if (modal) modal.style.display = 'none';
}

// Today's entries modal (training records with trainingDate = today, or recent if none)
function showTodaysEntriesModal() {
    const modal = document.getElementById('todaysEntriesModal');
    const listEl = document.getElementById('todaysEntriesList');
    if (!modal || !listEl) return;
    const data = (typeof staticData !== 'undefined' && staticData.trainingRecords) ? staticData.trainingRecords : (window.staticData && window.staticData.trainingRecords) ? window.staticData.trainingRecords : [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const todays = data.filter(function (r) { return r.trainingDate === todayStr; });
    const recent = data.slice().sort(function (a, b) { return (b.trainingDate || '').localeCompare(a.trainingDate || ''); }).slice(0, 10);
    function row(r) {
        return '<tr><td>' + (r.employeeName || '—') + '</td><td>' + (r.trainingTitle || '—') + '</td><td>' + (r.trainingDate || '—') + '</td><td>' + (r.processClassification || '—') + '</td></tr>';
    }
    var html = '';
    if (todays.length > 0) {
        html += '<h3 class="expired-section-title">Today\'s entries (' + todays.length + ')</h3><table class="data-table"><thead><tr><th>Employee</th><th>Training</th><th>Date</th><th>Process</th></tr></thead><tbody>' +
            todays.map(row).join('') + '</tbody></table>';
    } else {
        html += '<p class="no-expired-msg">No entries for today.</p>';
    }
    if (recent.length > 0) {
        html += '<h3 class="expired-section-title">Recent entries</h3><table class="data-table"><thead><tr><th>Employee</th><th>Training</th><th>Date</th><th>Process</th></tr></thead><tbody>' +
            recent.map(row).join('') + '</tbody></table>';
    }
    listEl.innerHTML = html;
    modal.style.display = 'block';
}

function closeTodaysEntriesModal() {
    const modal = document.getElementById('todaysEntriesModal');
    if (modal) modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Simulate actions with alerts
function simulateAction(action) {
    alert(`[PROTOTYPE] ${action}\n\nThis is a static prototype. No data will be saved.\nThis action would normally ${action.toLowerCase()} in the production system.`);
}

function simulateExport() {
    simulateAction('Export data to CSV/Excel');
}

function simulatePrint(id) {
    simulateAction(`Print record for ${id}`);
}

function simulateEdit(id) {
    simulateAction(`Edit record ${id}`);
}

// Show success message
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 50px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
