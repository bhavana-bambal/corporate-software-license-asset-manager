// Licenses Management Module
let licensesList = [];

async function loadLicenses() {
  if (!authToken) return;

  const search = document.getElementById('license-search-input')?.value || '';
  const status = document.getElementById('license-filter-status')?.value || 'ALL';
  const vendor = document.getElementById('license-filter-vendor')?.value || 'ALL';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status !== 'ALL') params.append('status', status);
  if (vendor !== 'ALL') params.append('vendor', vendor);

  try {
    const res = await fetch(`/api/licenses?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      licensesList = result.data;
      renderLicensesTable(licensesList);
      document.getElementById('license-results-count').textContent = licensesList.length;
    }
  } catch (err) {
    console.error('Failed to load licenses:', err);
    showToast('Failed to load licenses.', 'danger');
  }
}

function renderLicensesTable(items) {
  const tbody = document.getElementById('licenses-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No licenses match your query.</td></tr>';
    return;
  }

  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const isManager = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'LICENSE_MANAGER');

  tbody.innerHTML = items.map(l => {
    const total = l.totalSeats || 0;
    const allocated = l.allocatedSeats || 0;
    const percent = total > 0 ? Math.round((allocated / total) * 100) : 0;

    let barColor = 'bg-primary';
    if (percent >= 100) barColor = 'bg-danger';
    else if (percent >= 80) barColor = 'bg-warning';

    const days = l.daysRemaining;
    let daysText = '';
    if (days !== null) {
      if (days < 0) daysText = `<span class="badge bg-secondary small">${Math.abs(days)}d ago</span>`;
      else if (days <= 7) daysText = `<span class="badge bg-danger small">${days}d left</span>`;
      else if (days <= 30) daysText = `<span class="badge bg-warning text-dark small">${days}d left</span>`;
      else daysText = `<span class="text-muted small">${days}d left</span>`;
    }

    return `
      <tr>
        <td class="font-monospace small text-primary fw-semibold">${l.licenseId}</td>
        <td>
          <div class="fw-bold text-white">${escapeHTML(l.softwareName)}</div>
          <div class="small text-muted">${escapeHTML(l.licenseType)}</div>
        </td>
        <td class="small">${escapeHTML(l.vendor)}</td>
        <td>
          <div class="font-monospace small text-secondary">${escapeHTML(l.licenseKey)}</div>
        </td>
        <td>
          <div class="seat-progress-container">
            <div class="d-flex justify-content-between small">
              <span class="text-white">${allocated}/${total} seats</span>
              <span class="text-muted">${percent}%</span>
            </div>
            <div class="seat-progress-bar">
              <div class="seat-progress-fill ${barColor}" style="width: ${percent}%;"></div>
            </div>
          </div>
        </td>
        <td>
          <div class="small text-white">${l.expirationDate}</div>
          ${daysText}
        </td>
        <td class="small fw-semibold text-white">₹ ${(l.cost || 0).toLocaleString('en-IN')}</td>
        <td>${getStatusBadge(l.status)}</td>
        <td class="text-end">
          <div class="d-flex justify-content-end gap-1">
            ${isManager ? `
              <button class="btn-action-icon" title="Allocate Seat" onclick="openAssignSeatForLicense('${l.licenseId}')"><i class="fa-solid fa-user-plus text-success"></i></button>
              <button class="btn-action-icon" title="Renew License" onclick="openExecuteRenewal('${l.licenseId}')"><i class="fa-solid fa-rotate text-info"></i></button>
              <button class="btn-action-icon" title="Edit License" onclick="openEditLicenseModal('${l.licenseId}')"><i class="fa-regular fa-pen-to-square"></i></button>
            ` : ''}
            ${isAdmin ? `<button class="btn-action-icon btn-action-delete" title="Delete License" onclick="confirmDeleteLicense('${l.licenseId}', '${escapeHTML(l.softwareName)}')"><i class="fa-regular fa-trash-can"></i></button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function populateSoftwareDropdowns() {
  try {
    const res = await fetch('/api/software', { headers: { 'Authorization': `Bearer ${authToken}` } });
    const result = await res.json();
    if (result.success) {
      const select = document.getElementById('lic-software-id');
      const reqSelect = document.getElementById('req-software-select');

      const options = result.data.map(s => `<option value="${s.softwareId}">${escapeHTML(s.softwareName)} (${s.vendor})</option>`).join('');
      if (select) select.innerHTML = options;
      if (reqSelect) reqSelect.innerHTML = options;
    }
  } catch (err) {
    console.error('Failed to populate software dropdown:', err);
  }
}

function openAddLicenseModal() {
  document.getElementById('license-form').reset();
  document.getElementById('lic-id').value = '';
  document.getElementById('lic-start-date').value = new Date().toISOString().split('T')[0];
  
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  document.getElementById('lic-expiration-date').value = nextYear.toISOString().split('T')[0];

  document.getElementById('licenseModalTitle').innerHTML = '<i class="fa-solid fa-key me-2 text-warning"></i> Add Software License';
  populateSoftwareDropdowns();
  const modal = new bootstrap.Modal(document.getElementById('licenseModal'));
  modal.show();
}

async function openEditLicenseModal(licenseId) {
  try {
    const res = await fetch(`/api/licenses/${licenseId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    const result = await res.json();
    if (!result.success) return;

    const l = result.data;
    await populateSoftwareDropdowns();

    document.getElementById('lic-id').value = l.licenseId;
    document.getElementById('lic-software-id').value = l.softwareId;
    document.getElementById('lic-key').value = l.licenseKey;
    document.getElementById('lic-total-seats').value = l.totalSeats;
    document.getElementById('lic-cost').value = l.cost;
    document.getElementById('lic-type').value = l.licenseType;
    document.getElementById('lic-start-date').value = l.startDate;
    document.getElementById('lic-expiration-date').value = l.expirationDate;
    document.getElementById('lic-auto-renewal').checked = l.autoRenewal;
    document.getElementById('lic-notes').value = l.notes || '';

    document.getElementById('licenseModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Edit Software License';
    const modal = new bootstrap.Modal(document.getElementById('licenseModal'));
    modal.show();
  } catch (err) {
    showToast('Failed to load license details', 'danger');
  }
}

async function handleLicenseSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('lic-id').value;
  const payload = {
    softwareId: document.getElementById('lic-software-id').value,
    licenseKey: document.getElementById('lic-key').value,
    totalSeats: Number(document.getElementById('lic-total-seats').value),
    cost: Number(document.getElementById('lic-cost').value),
    licenseType: document.getElementById('lic-type').value,
    startDate: document.getElementById('lic-start-date').value,
    expirationDate: document.getElementById('lic-expiration-date').value,
    autoRenewal: document.getElementById('lic-auto-renewal').checked,
    notes: document.getElementById('lic-notes').value
  };

  const url = id ? `/api/licenses/${id}` : '/api/licenses';
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
      bootstrap.Modal.getInstance(document.getElementById('licenseModal')).hide();
      loadLicenses();
      refreshDashboard();
    } else {
      showToast(result.message || 'Failed to save license', 'danger');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'danger');
  }
}

async function confirmDeleteLicense(licenseId, softwareName) {
  if (!confirm(`Are you sure you want to delete license record for "${softwareName}" (${licenseId})?`)) return;

  try {
    const res = await fetch(`/api/licenses/${licenseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      loadLicenses();
      refreshDashboard();
    } else {
      showToast(result.message, 'danger');
    }
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'danger');
  }
}

document.getElementById('license-form')?.addEventListener('submit', handleLicenseSubmit);
document.getElementById('license-search-input')?.addEventListener('input', debounce(() => loadLicenses(), 300));
