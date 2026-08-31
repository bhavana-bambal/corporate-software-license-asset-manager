// Software Assets Management Module
let softwareList = [];

async function loadSoftware() {
  if (!authToken) return;

  const search = document.getElementById('software-search-input')?.value || '';
  const category = document.getElementById('software-filter-category')?.value || 'ALL';
  const department = document.getElementById('software-filter-dept')?.value || 'ALL';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category !== 'ALL') params.append('category', category);
  if (department !== 'ALL') params.append('department', department);

  try {
    const res = await fetch(`/api/software?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      softwareList = result.data;
      renderSoftwareTable(softwareList);
      document.getElementById('software-results-count').textContent = softwareList.length;
    }
  } catch (err) {
    console.error('Failed to load software:', err);
    showToast('Failed to load software assets.', 'danger');
  }
}

function renderSoftwareTable(items) {
  const tbody = document.getElementById('software-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No software assets match your filters.</td></tr>';
    return;
  }

  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const isManager = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'LICENSE_MANAGER');

  tbody.innerHTML = items.map(s => {
    const total = s.totalSeats || 0;
    const allocated = s.allocatedSeats || 0;
    const percent = total > 0 ? Math.round((allocated / total) * 100) : 0;

    let barColor = 'bg-primary';
    if (percent >= 100) barColor = 'bg-danger';
    else if (percent >= 80) barColor = 'bg-warning';

    return `
      <tr>
        <td class="font-monospace small text-primary fw-semibold">${s.softwareId}</td>
        <td>
          <div class="fw-bold text-white">${escapeHTML(s.softwareName)}</div>
          <div class="small text-muted">${escapeHTML(s.version)} &bull; ${escapeHTML(s.licenseType)}</div>
        </td>
        <td><span class="badge bg-dark border border-secondary text-secondary">${escapeHTML(s.category)}</span></td>
        <td class="small">${escapeHTML(s.vendor)}</td>
        <td><span class="badge bg-dark border border-secondary text-secondary">${escapeHTML(s.department)}</span></td>
        <td class="text-center"><span class="badge bg-primary">${s.licensesCount}</span></td>
        <td>
          <div class="seat-progress-container">
            <div class="d-flex justify-content-between small">
              <span class="text-white">${allocated}/${total}</span>
              <span class="text-muted">${percent}%</span>
            </div>
            <div class="seat-progress-bar">
              <div class="seat-progress-fill ${barColor}" style="width: ${percent}%;"></div>
            </div>
          </div>
        </td>
        <td><span class="badge-status badge-active"><i class="fa-solid fa-circle small"></i> ${s.status}</span></td>
        <td class="text-end">
          <div class="d-flex justify-content-end gap-1">
            ${isManager ? `<button class="btn-action-icon" title="Edit Software" onclick="openEditSoftwareModal('${s.softwareId}')"><i class="fa-regular fa-pen-to-square"></i></button>` : ''}
            ${isAdmin ? `<button class="btn-action-icon btn-action-delete" title="Delete Software" onclick="confirmDeleteSoftware('${s.softwareId}', '${escapeHTML(s.softwareName)}')"><i class="fa-regular fa-trash-can"></i></button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function populateVendorDropdowns() {
  try {
    const res = await fetch('/api/vendors', { headers: { 'Authorization': `Bearer ${authToken}` } });
    const result = await res.json();
    if (result.success) {
      const swVendor = document.getElementById('sw-vendor');
      const licFilter = document.getElementById('license-filter-vendor');

      if (swVendor) {
        swVendor.innerHTML = result.data.map(v => `<option value="${escapeHTML(v.vendorName)}">${escapeHTML(v.vendorName)}</option>`).join('');
      }
      if (licFilter) {
        licFilter.innerHTML = '<option value="ALL">All Vendors</option>' + result.data.map(v => `<option value="${escapeHTML(v.vendorName)}">${escapeHTML(v.vendorName)}</option>`).join('');
      }
    }
  } catch (err) {
    console.error('Failed to populate vendors dropdown:', err);
  }
}

function openAddSoftwareModal() {
  document.getElementById('software-form').reset();
  document.getElementById('sw-id').value = '';
  document.getElementById('softwareModalTitle').innerHTML = '<i class="fa-solid fa-cube me-2 text-primary"></i> Add Software Asset';
  populateVendorDropdowns();
  const modal = new bootstrap.Modal(document.getElementById('softwareModal'));
  modal.show();
}

async function openEditSoftwareModal(softwareId) {
  try {
    const res = await fetch(`/api/software/${softwareId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    const result = await res.json();
    if (!result.success) return;

    const s = result.data;
    await populateVendorDropdowns();

    document.getElementById('sw-id').value = s.softwareId;
    document.getElementById('sw-name').value = s.softwareName;
    document.getElementById('sw-category').value = s.category;
    document.getElementById('sw-version').value = s.version;
    document.getElementById('sw-vendor').value = s.vendor;
    document.getElementById('sw-department').value = s.department;
    document.getElementById('sw-description').value = s.description || '';

    document.getElementById('softwareModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square me-2 text-primary"></i> Edit Software Asset';
    const modal = new bootstrap.Modal(document.getElementById('softwareModal'));
    modal.show();
  } catch (err) {
    showToast('Failed to load software details', 'danger');
  }
}

async function handleSoftwareSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('sw-id').value;
  const payload = {
    softwareName: document.getElementById('sw-name').value,
    category: document.getElementById('sw-category').value,
    version: document.getElementById('sw-version').value,
    vendor: document.getElementById('sw-vendor').value,
    department: document.getElementById('sw-department').value,
    description: document.getElementById('sw-description').value
  };

  const url = id ? `/api/software/${id}` : '/api/software';
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
      bootstrap.Modal.getInstance(document.getElementById('softwareModal')).hide();
      loadSoftware();
      refreshDashboard();
    } else {
      showToast(result.message || 'Failed to save software', 'danger');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'danger');
  }
}

async function confirmDeleteSoftware(softwareId, softwareName) {
  if (!confirm(`Are you sure you want to delete software "${softwareName}" (${softwareId})?`)) return;

  try {
    const res = await fetch(`/api/software/${softwareId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      loadSoftware();
      refreshDashboard();
    } else {
      showToast(result.message, 'danger');
    }
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'danger');
  }
}

document.getElementById('software-form')?.addEventListener('submit', handleSoftwareSubmit);
document.getElementById('software-search-input')?.addEventListener('input', debounce(() => loadSoftware(), 300));
