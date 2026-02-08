// Viewer (External User) functions

function filterViewerTable() {
    const searchEl = document.getElementById('viewerSearch');
    const teamEl = document.getElementById('viewerFilterTeam');
    const statusEl = document.getElementById('viewerFilterStatus');
    const searchTerm = (searchEl && searchEl.value) ? searchEl.value.toLowerCase() : '';
    const teamValue = (teamEl && teamEl.value) ? teamEl.value.toLowerCase() : '';
    const statusValue = (statusEl && statusEl.value) ? statusEl.value.toLowerCase() : '';

    const tbody = document.querySelector('#viewerTable tbody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesTeam = !teamValue || text.includes(teamValue);
        const matchesStatus = !statusValue || text.includes(statusValue);
        if (matchesSearch && matchesTeam && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

const viewerSearch = document.getElementById('viewerSearch');
if (viewerSearch) {
    viewerSearch.addEventListener('input', filterViewerTable);
}
const viewerFilterTeam = document.getElementById('viewerFilterTeam');
if (viewerFilterTeam) viewerFilterTeam.addEventListener('change', filterViewerTable);
const viewerFilterStatus = document.getElementById('viewerFilterStatus');
if (viewerFilterStatus) viewerFilterStatus.addEventListener('change', filterViewerTable);

// Note: External viewers have read-only access. No add, edit, or delete.
