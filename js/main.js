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
