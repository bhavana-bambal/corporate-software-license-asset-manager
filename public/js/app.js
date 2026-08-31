// Core Application Router, State Management, and Shared Utilities

let currentView = 'view-dashboard';

function navigateTo(viewId) {
  // Hide all views
  document.querySelectorAll('.page-view').forEach(el => {
    el.classList.remove('active');
  });

  // Show target view
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    currentView = viewId;
  }

  // Update sidebar active states
  document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-view') === viewId);
  });

  // Close mobile sidebar if open
  document.getElementById('sidebar')?.classList.remove('show');

  // Trigger data loader for view
  if (viewId === 'view-dashboard') refreshDashboard();
  else if (viewId === 'view-software') loadSoftware();
  else if (viewId === 'view-licenses') loadLicenses();
  else if (viewId === 'view-allocations') loadAllocations();
  else if (viewId === 'view-employees') loadEmployees();
  else if (viewId === 'view-vendors') loadVendors();
  else if (viewId === 'view-renewals') loadRenewals();
  else if (viewId === 'view-notifications') loadNotifications();
  else if (viewId === 'view-reports') loadReports(currentReportType);
  else if (viewId === 'view-audit') loadAuditLogs();
  else if (viewId === 'view-settings') loadSettings();
  else if (viewId === 'view-employee-portal') loadEmployeePortal();
}

// Show toast notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-custom toast-${type}`;

  let icon = 'fa-solid fa-circle-info text-info';
  if (type === 'success') icon = 'fa-solid fa-circle-check text-success';
  if (type === 'danger') icon = 'fa-solid fa-triangle-exclamation text-danger';
  if (type === 'warning') icon = 'fa-solid fa-circle-exclamation text-warning';

  toast.innerHTML = `
    <i class="${icon} fs-5"></i>
    <div class="flex-grow-1 small">${escapeHTML(message)}</div>
    <button class="btn btn-sm btn-link text-muted p-0" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Format relative time (e.g. "2 hours ago")
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d ago`;
}

// Format Date Time
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (_) {
    return dateStr;
  }
}

// Generate color-coded status badge HTML
function getStatusBadge(status) {
  if (status === 'ACTIVE') {
    return '<span class="badge-status badge-active"><i class="fa-solid fa-circle-check"></i> ACTIVE</span>';
  } else if (status === 'CRITICAL') {
    return '<span class="badge-status badge-critical"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL (&le;7d)</span>';
  } else if (status === 'URGENT') {
    return '<span class="badge-status badge-urgent"><i class="fa-solid fa-circle-exclamation"></i> URGENT (&le;30d)</span>';
  } else if (status === 'EXPIRING SOON') {
    return '<span class="badge-status badge-expiring"><i class="fa-solid fa-clock"></i> EXPIRING SOON</span>';
  } else if (status === 'EXPIRED') {
    return '<span class="badge-status badge-expired"><i class="fa-solid fa-ban"></i> EXPIRED</span>';
  } else if (status === 'RENEWAL PENDING') {
    return '<span class="badge-status badge-renewal-pending"><i class="fa-solid fa-rotate"></i> RENEWAL PENDING</span>';
  }
  return `<span class="badge-status badge-active">${escapeHTML(status)}</span>`;
}

// Escape HTML strings for safety
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Debounce helper for inputs
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Employee Portal View logic
async function loadEmployeePortal() {
  if (!currentUser) return;

  document.getElementById('emp-portal-name').textContent = currentUser.name;
  document.getElementById('emp-portal-designation').textContent = currentUser.designation || 'Corporate Employee';
  document.getElementById('emp-portal-dept').textContent = currentUser.department || 'Engineering';
  if (currentUser.avatar) {
    document.getElementById('emp-portal-avatar').src = currentUser.avatar;
  }

  try {
    const res = await fetch(`/api/licenses/assignments?employeeId=${currentUser.employeeId || 'EMP-101'}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      const assignments = result.data;
      document.getElementById('emp-portal-tools-count').textContent = assignments.filter(a => a.status === 'ACTIVE').length;

      const tbody = document.getElementById('emp-portal-assets-table');
      if (!assignments || assignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No software tools are currently assigned to your profile. Click "Request Software Access" above.</td></tr>';
        return;
      }

      tbody.innerHTML = assignments.map(a => {
        const isActive = a.status === 'ACTIVE';
        return `
          <tr>
            <td>
              <div class="fw-bold text-white">${escapeHTML(a.softwareName)}</div>
              <span class="small text-muted font-monospace">${a.assignmentId}</span>
            </td>
            <td class="font-monospace small text-primary">${a.licenseId}</td>
            <td>
              <div class="font-monospace small text-white bg-dark p-1 rounded border border-secondary text-truncate" style="max-width: 220px;">${escapeHTML(a.licenseKey || 'Enterprise License')}</div>
            </td>
            <td class="small">${a.assignedDate}</td>
            <td class="small fw-semibold text-white">${a.expirationDate || 'Ongoing'}</td>
            <td><span class="badge-status ${isActive ? 'badge-active' : 'badge-expired'}">${a.status}</span></td>
            <td>
              <button class="btn btn-sm btn-outline-light" onclick="navigator.clipboard.writeText('${a.licenseKey}'); showToast('License key copied to clipboard!', 'success');">
                <i class="fa-regular fa-copy me-1"></i> Copy Key
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load employee portal assets:', err);
  }
}

function openRequestSoftwareModal() {
  document.getElementById('request-software-form').reset();
  populateSoftwareDropdowns();
  const modal = new bootstrap.Modal(document.getElementById('requestSoftwareModal'));
  modal.show();
}

async function handleRequestSoftwareSubmit(e) {
  e.preventDefault();
  const softwareId = document.getElementById('req-software-select').value;
  const reason = document.getElementById('req-software-reason').value;

  try {
    const res = await fetch('/api/employees/request-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ softwareId, reason })
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      bootstrap.Modal.getInstance(document.getElementById('requestSoftwareModal')).hide();
    } else {
      showToast(result.message, 'danger');
    }
  } catch (err) {
    showToast('Failed to submit request: ' + err.message, 'danger');
  }
}

function showSettings() {
  navigateTo('view-settings');
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar Navigation Links
  document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = link.getAttribute('data-view');
      if (viewId) navigateTo(viewId);
    });
  });

  // Sidebar Toggle on Mobile
  document.getElementById('sidebar-toggle-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('show');
  });

  // Notification Bell Toggle
  const bell = document.getElementById('notif-bell-btn');
  const dropdown = document.getElementById('notification-dropdown');
  if (bell && dropdown) {
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  // Global Search Router
  document.getElementById('global-search-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) {
        navigateTo('view-software');
        document.getElementById('software-search-input').value = q;
        loadSoftware();
      }
    }
  });

  // Employee Request Form
  document.getElementById('request-software-form')?.addEventListener('submit', handleRequestSoftwareSubmit);

  // Initialize Session
  checkAuth();

  // Periodic alert refresh (every 30s)
  setInterval(() => {
    if (authToken) loadNotifications();
  }, 30000);
});
