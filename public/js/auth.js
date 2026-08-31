// Authentication & Session Management
let currentUser = null;
let authToken = localStorage.getItem('csam_token') || null;

async function checkAuth() {
  if (!authToken) {
    showLogin();
    return false;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      applyUserSession();
      return true;
    } else {
      logout();
      return false;
    }
  } catch (err) {
    console.error('Auth verification failed:', err);
    logout();
    return false;
  }
}

function applyUserSession() {
  if (!currentUser) return;

  // Update UI Elements
  document.getElementById('sidebar-user-name').textContent = currentUser.name;
  document.getElementById('sidebar-user-role').textContent = currentUser.role.replace('_', ' ');
  document.getElementById('top-user-name').textContent = currentUser.name;
  document.getElementById('top-user-designation').textContent = `${currentUser.designation} (${currentUser.department})`;
  document.getElementById('quick-role-switcher').value = currentUser.role;

  if (currentUser.avatar) {
    document.getElementById('sidebar-user-avatar').src = currentUser.avatar;
    document.getElementById('top-user-avatar').src = currentUser.avatar;
  }

  // Role-based visibility
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'LICENSE_MANAGER';
  const isEmployee = currentUser.role === 'EMPLOYEE';

  document.querySelectorAll('.role-admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });

  document.querySelectorAll('.role-admin-manager').forEach(el => {
    el.style.display = (isAdmin || isManager) ? '' : 'none';
  });

  document.querySelectorAll('.role-employee-only').forEach(el => {
    el.style.display = isEmployee ? '' : 'none';
  });

  // Switch to main app view
  document.getElementById('view-login').classList.add('d-none');
  document.getElementById('app-container').classList.remove('d-none');

  // Load initial data
  if (isEmployee) {
    navigateTo('view-employee-portal');
    loadEmployeePortal();
  } else {
    navigateTo('view-dashboard');
    refreshDashboard();
  }
}

function showLogin() {
  document.getElementById('app-container').classList.add('d-none');
  document.getElementById('view-login').classList.remove('d-none');
}

function fillLoginForm(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const submitBtn = document.getElementById('login-submit-btn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Authenticating...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('csam_token', authToken);
      showToast('Login successful! Welcome to Asset Manager.', 'success');
      applyUserSession();
    } else {
      showToast(data.message || 'Login failed', 'danger');
    }
  } catch (err) {
    showToast('Failed to connect to server: ' + err.message, 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-2"></i> Sign In to Portal';
  }
}

async function switchRole(targetRole) {
  try {
    const res = await fetch('/api/auth/switch-demo-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: targetRole })
    });
    const data = await res.json();

    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('csam_token', authToken);
      showToast(`Switched active profile to ${targetRole}`, 'info');
      applyUserSession();
    } else {
      showToast(data.message, 'danger');
    }
  } catch (err) {
    showToast('Failed to switch role: ' + err.message, 'danger');
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('csam_token');
  showLogin();
  showToast('Logged out successfully.', 'info');
}

document.getElementById('login-form').addEventListener('submit', handleLogin);
