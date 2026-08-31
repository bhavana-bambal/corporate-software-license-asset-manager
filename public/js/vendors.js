// Vendor Management Module
let vendorsList = [];

async function loadVendors() {
  if (!authToken) return;

  const search = document.getElementById('vendor-search-input')?.value || '';
  const params = new URLSearchParams();
  if (search) params.append('search', search);

  try {
    const res = await fetch(`/api/vendors?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      vendorsList = result.data;
      renderVendorsTable(vendorsList);
      document.getElementById('vendor-results-count').textContent = vendorsList.length;
    }
  } catch (err) {
    console.error('Failed to load vendors:', err);
    showToast('Failed to load vendor directory.', 'danger');
  }
}

function renderVendorsTable(items) {
  const tbody = document.getElementById('vendors-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No vendors match your search.</td></tr>';
    return;
  }

  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  tbody.innerHTML = items.map(v => {
    return `
      <tr>
        <td class="font-monospace small text-primary fw-semibold">${v.vendorId}</td>
        <td>
          <div class="fw-bold text-white">${escapeHTML(v.vendorName)}</div>
          <a href="${v.website || '#'}" target="_blank" class="small text-secondary text-decoration-none"><i class="fa-solid fa-arrow-up-right-from-square me-1 small"></i> ${v.website || 'No website'}</a>
        </td>
        <td class="small text-white">${escapeHTML(v.contactPerson)}</td>
        <td>
          <div><a href="mailto:${v.email}" class="text-secondary small text-decoration-none">${escapeHTML(v.email)}</a></div>
          <div class="small text-muted">${v.phone || ''}</div>
        </td>
        <td class="text-center"><span class="badge bg-dark border border-secondary">${v.softwareCount}</span></td>
        <td class="text-center"><span class="badge bg-primary">${v.licenseCount}</span></td>
        <td class="small fw-semibold text-white">₹ ${(v.totalSpending || 0).toLocaleString('en-IN')}</td>
        <td>
          ${v.upcomingRenewals > 0 
            ? `<span class="badge bg-warning text-dark">${v.upcomingRenewals} Upcoming</span>`
            : `<span class="badge bg-secondary text-muted">0 Due</span>`}
        </td>
        <td class="text-end">
          <div class="d-flex justify-content-end gap-1">
            ${isAdmin ? `
              <button class="btn-action-icon" title="Edit Vendor" onclick="openEditVendorModal('${v.vendorId}')"><i class="fa-regular fa-pen-to-square"></i></button>
              <button class="btn-action-icon btn-action-delete" title="Delete Vendor" onclick="confirmDeleteVendor('${v.vendorId}', '${escapeHTML(v.vendorName)}')"><i class="fa-regular fa-trash-can"></i></button>
            ` : `<span class="text-muted small">-</span>`}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddVendorModal() {
  document.getElementById('vendor-form').reset();
  document.getElementById('vnd-id').value = '';
  document.getElementById('vendorModalTitle').innerHTML = '<i class="fa-solid fa-building me-2 text-primary"></i> Add Software Vendor';
  const modal = new bootstrap.Modal(document.getElementById('vendorModal'));
  modal.show();
}

async function openEditVendorModal(vendorId) {
  try {
    const res = await fetch(`/api/vendors/${vendorId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    const result = await res.json();
    if (!result.success) return;

    const v = result.data;
    document.getElementById('vnd-id').value = v.vendorId;
    document.getElementById('vnd-name').value = v.vendorName;
    document.getElementById('vnd-contact').value = v.contactPerson;
    document.getElementById('vnd-email').value = v.email;
    document.getElementById('vnd-phone').value = v.phone || '';
    document.getElementById('vnd-website').value = v.website || '';
    document.getElementById('vnd-address').value = v.address || '';

    document.getElementById('vendorModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square me-2 text-primary"></i> Edit Software Vendor';
    const modal = new bootstrap.Modal(document.getElementById('vendorModal'));
    modal.show();
  } catch (err) {
    showToast('Failed to load vendor data', 'danger');
  }
}

async function handleVendorSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('vnd-id').value;
  const payload = {
    vendorName: document.getElementById('vnd-name').value,
    contactPerson: document.getElementById('vnd-contact').value,
    email: document.getElementById('vnd-email').value,
    phone: document.getElementById('vnd-phone').value,
    website: document.getElementById('vnd-website').value,
    address: document.getElementById('vnd-address').value
  };

  const url = id ? `/api/vendors/${id}` : '/api/vendors';
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
      bootstrap.Modal.getInstance(document.getElementById('vendorModal')).hide();
      loadVendors();
      populateVendorDropdowns();
      refreshDashboard();
    } else {
      showToast(result.message || 'Failed to save vendor', 'danger');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'danger');
  }
}

async function confirmDeleteVendor(vendorId, vendorName) {
  if (!confirm(`Are you sure you want to delete vendor "${vendorName}" (${vendorId})?`)) return;

  try {
    const res = await fetch(`/api/vendors/${vendorId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      loadVendors();
      refreshDashboard();
    } else {
      showToast(result.message, 'danger');
    }
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'danger');
  }
}

document.getElementById('vendor-form')?.addEventListener('submit', handleVendorSubmit);
document.getElementById('vendor-search-input')?.addEventListener('input', debounce(() => loadVendors(), 300));
