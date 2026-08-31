// Employee Directory Module
let employeesList = [];

async function loadEmployees() {
  if (!authToken) return;

  const search = document.getElementById('employee-search-input')?.value || '';
  const department = document.getElementById('employee-filter-dept')?.value || 'ALL';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (department !== 'ALL') params.append('department', department);

  try {
    const res = await fetch(`/api/employees?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      employeesList = result.data;
      renderEmployeesTable(employeesList);
      document.getElementById('employee-results-count').textContent = employeesList.length;
    }
  } catch (err) {
    console.error('Failed to load employees:', err);
    showToast('Failed to load employee directory.', 'danger');
  }
}

function renderEmployeesTable(items) {
  const tbody = document.getElementById('employees-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No employees match your search criteria.</td></tr>';
    return;
  }

  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  tbody.innerHTML = items.map(e => {
    const swBadges = (e.activeLicenses || []).map(sw => `<span class="badge bg-primary-subtle text-primary border border-primary me-1 mb-1 small">${escapeHTML(sw)}</span>`).join('') || '<span class="text-muted small">No active software</span>';

    return `
      <tr>
        <td class="font-monospace small text-primary fw-semibold">${e.employeeId}</td>
        <td>
          <div class="fw-bold text-white">${escapeHTML(e.fullName)}</div>
          <div class="small text-muted">${e.phone || 'No phone'}</div>
        </td>
        <td><a href="mailto:${e.email}" class="text-secondary small text-decoration-none">${escapeHTML(e.email)}</a></td>
        <td><span class="badge bg-dark border border-secondary text-secondary">${escapeHTML(e.department)}</span></td>
        <td class="small text-white">${escapeHTML(e.jobTitle)}</td>
        <td style="max-width: 250px;">${swBadges}</td>
        <td><span class="badge-status badge-active"><i class="fa-solid fa-circle small"></i> ${e.status}</span></td>
        <td class="text-end">
          <div class="d-flex justify-content-end gap-1">
            <button class="btn-action-icon" title="View Details & History" onclick="viewEmployeeDetails('${e.employeeId}')"><i class="fa-regular fa-eye"></i></button>
            ${isAdmin ? `
              <button class="btn-action-icon" title="Edit Employee" onclick="openEditEmployeeModal('${e.employeeId}')"><i class="fa-regular fa-pen-to-square"></i></button>
              <button class="btn-action-icon btn-action-delete" title="Delete Employee" onclick="confirmDeleteEmployee('${e.employeeId}', '${escapeHTML(e.fullName)}')"><i class="fa-regular fa-trash-can"></i></button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddEmployeeModal() {
  document.getElementById('employee-form').reset();
  document.getElementById('emp-id').value = '';
  document.getElementById('emp-join-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('employeeModalTitle').innerHTML = '<i class="fa-solid fa-user-plus me-2 text-primary"></i> Add Corporate Employee';
  const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
  modal.show();
}

async function openEditEmployeeModal(employeeId) {
  try {
    const res = await fetch(`/api/employees/${employeeId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    const result = await res.json();
    if (!result.success) return;

    const e = result.data;
    document.getElementById('emp-id').value = e.employeeId;
    document.getElementById('emp-name').value = e.fullName;
    document.getElementById('emp-email').value = e.email;
    document.getElementById('emp-department').value = e.department;
    document.getElementById('emp-title').value = e.jobTitle;
    document.getElementById('emp-join-date').value = e.joiningDate || '';
    document.getElementById('emp-phone').value = e.phone || '';

    document.getElementById('employeeModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square me-2 text-primary"></i> Edit Corporate Employee';
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    modal.show();
  } catch (err) {
    showToast('Failed to load employee data', 'danger');
  }
}

async function handleEmployeeSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('emp-id').value;
  const payload = {
    fullName: document.getElementById('emp-name').value,
    email: document.getElementById('emp-email').value,
    department: document.getElementById('emp-department').value,
    jobTitle: document.getElementById('emp-title').value,
    joiningDate: document.getElementById('emp-join-date').value,
    phone: document.getElementById('emp-phone').value
  };

  const url = id ? `/api/employees/${id}` : '/api/employees';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
      loadEmployees();
      refreshDashboard();
    } else {
      showToast(result.message || 'Failed to save employee profile', 'danger');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'danger');
  }
}

async function viewEmployeeDetails(employeeId) {
  try {
    const res = await fetch(`/api/employees/${employeeId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    const result = await res.json();
    if (!result.success) return;

    const e = result.data;
    const activeLicenses = e.activeAssignments.map(a => `
      <div class="p-2 mb-2 rounded bg-dark border border-secondary d-flex justify-content-between align-items-center">
        <div>
          <div class="fw-semibold text-white small">${escapeHTML(a.softwareName)}</div>
          <span class="small font-monospace text-muted">${a.licenseKey || a.licenseId}</span>
        </div>
        <span class="badge bg-success small">Expires: ${a.expirationDate || 'N/A'}</span>
      </div>
    `).join('') || '<div class="text-muted small">No active software assigned.</div>';

    const historyItems = e.assignmentHistory.map(h => `
      <li class="small text-secondary mb-1">
        ${h.softwareName} &bull; Revoked ${h.revokedDate} (${h.revocationReason || 'N/A'})
      </li>
    `).join('') || '<li class="small text-muted">No revocation history.</li>';

    alert(`👤 EMPLOYEE PROFILE: ${e.fullName} (${e.employeeId})\n\nEmail: ${e.email}\nDepartment: ${e.department}\nJob Title: ${e.jobTitle}\nJoining Date: ${e.joiningDate}\n\nACTIVE SOFTWARE LICENSES (${e.totalAssigned}):\n${e.activeAssignments.map(a => `• ${a.softwareName} (Key: ${a.licenseKey})`).join('\n') || 'None'}`);
  } catch (err) {
    showToast('Failed to load employee details', 'danger');
  }
}

async function confirmDeleteEmployee(employeeId, fullName) {
  if (!confirm(`Are you sure you want to delete employee "${fullName}" (${employeeId})?`)) return;

  try {
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      loadEmployees();
      refreshDashboard();
    } else {
      showToast(result.message, 'danger');
    }
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'danger');
  }
}

document.getElementById('employee-form')?.addEventListener('submit', handleEmployeeSubmit);
document.getElementById('employee-search-input')?.addEventListener('input', debounce(() => loadEmployees(), 300));
