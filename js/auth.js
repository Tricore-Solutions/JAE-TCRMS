// Authentication functions
function handleLogin(event) {
    if (event && event.preventDefault) event.preventDefault();
    var usernameEl = document.getElementById('username');
    var passwordEl = document.getElementById('password');
    if (!usernameEl || !passwordEl) {
        alert('Login form not found.');
        return false;
    }
    var username = usernameEl.value.trim();
    var password = passwordEl.value;
    if (!window.staticData || !window.staticData.users) {
        alert('Data not loaded. Please refresh the page.');
        return false;
    }
    var user = window.staticData.users.find(function(u) {
        return u.username === username && u.password === password;
    });
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        if (user.role === 'admin') {
            window.location.replace('admin-dashboard.html');
        } else if (user.role === 'encoder') {
            window.location.replace('encoder-dashboard.html');
        } else {
            alert('Invalid user role. Use Admin or Encoder account.');
        }
        return false;
    }
    alert('Invalid username or password.\n\nUse:\n- Admin: admin / admin123\n- Encoder: encoder / encoder123');
    return false;
}
window.handleLogin = handleLogin;

function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(user);
}

window.logout = function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
};

function isPublicPage() {
    var path = (window.location.pathname || '') + (window.location.hash || '');
    var href = window.location.href || '';
    return href.indexOf('viewer-dashboard') !== -1 ||
           href.indexOf('login.html') !== -1 ||
           path === '' || path === '/' ||
           path.endsWith('index.html') || path.endsWith('/');
}

// Role-based access: admin pages = admin only; encoder pages = encoder or admin
if (!isPublicPage()) {
    const user = checkAuth();
    if (!user) return;
    var href = window.location.href || '';
    var isAdminPage = href.indexOf('admin-') !== -1;
    var isEncoderPage = href.indexOf('encoder-') !== -1;
    if (isAdminPage && user.role !== 'admin') {
        if (user.role === 'encoder') {
            window.location.href = 'encoder-dashboard.html';
        } else {
            window.location.href = 'login.html';
        }
        return;
    }
    if (isEncoderPage && user.role !== 'encoder' && user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    var userRoleElement = document.getElementById('userRole');
    if (userRoleElement) {
        userRoleElement.textContent = user.role.toUpperCase();
    }
}
