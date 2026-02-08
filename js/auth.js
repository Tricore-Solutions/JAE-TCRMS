// Authentication functions
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Find user in static data
    const user = staticData.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Store user session (simulated)
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirect based on role
        switch(user.role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'encoder':
                window.location.href = 'encoder-dashboard.html';
                break;
            case 'viewer':
                window.location.href = 'viewer-dashboard.html';
                break;
            default:
                alert('Invalid user role');
        }
    } else {
        alert('Invalid username or password!\n\nPlease use one of the test accounts:\n- admin / admin123\n- encoder / encoder123\n- viewer / viewer123');
    }
    
    return false;
}

function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(user);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Check authentication on protected pages
if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('index.html')) {
    const user = checkAuth();
    if (user) {
        // Update user role display if element exists
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = user.role.toUpperCase();
        }
    }
}
