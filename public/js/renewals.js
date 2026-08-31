// Renewals Pipeline Management Module
let renewalsList = [];

async function loadRenewals() {
  if (!authToken) return;

  const search = document.getElementById('renewal-search-input')?.value || '';
  const urgency = document.getElementById('renewal-filter-urgency')?.value || 'ALL';
  const status = document.getElementById('renewal-filter-status')?.value || 'ALL';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (urgency !== 'ALL') params.append('urgency', urgency);
  if (status !== 'ALL') params.append('status', status);

  try {
    const res = await fetch(`/api/renewals?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      renewalsList = result.data;
      renderRenewalsTable(renewalsList);
      document.getElementById('renewal-results-count').textContent = renewalsList.length;
    }
  } catch (err) {
    console.error('Failed to load renewals:', err);
    showToast('Failed to load renewals pipeline.', 'danger');
  }
}

function renderRenewalsTable(items) {
  const tbody = document.getElementById('renewals-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No renewal items in pipeline.</td></tr>';
    return;
  }

  const isManager = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'LICENSE_MANAGER');

  tbody.innerHTML = items.map(r => {
    let urgencyBadge = '';
    if (r.urgency === 'CRITICAL') urgencyBadge = '<span class="badge-status badge-critical"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL (&le;7d)</span>';
    else if (r.urgency === 'URGENT') urgencyBadge = '<span class="badge-status badge-urgent"><i class="fa-solid fa-circle-exclamation"></i> URGENT (&le;30d)</span>';
    else if (r.urgency === 'EXPIRED') urgencyBadge = '<span class="badge-status badge-expired"><i class="fa-solid fa-ban"></i> EXPIRED</span>';
    else urgencyBadge = '<span class="badge-status badge-expiring"><i class="fa-solid fa-clock"></i> EXPIRING SOON</span>';

    const isRenewed = r.status === 'Renewed';

    return `
      <tr>
        <td class="font-monospace small text-primary fw-semibold">${r.renewalId}</td>
        <td>
          <div class="fw-bold text-white">${escapeHTML(r.softwareName)}</div>
          <span class="small font-monospace text-muted">${r.licenseId}</span>
        </td>
        <td class="small">${escapeHTML(r.vendorName)}</td>
        <td>
          <div class="small text-white fw-semibold">${r.renewalDate}</div>
        </td>
        <td class="small fw-semibold text-white">₹ ${(r.renewalCost || 0).toLocaleString('en-IN')}</td>
        <td>${urgencyBadge}</td>
        <td>
          ${isManager && !isRenewed ? `
            <select class="form-select form-select-sm bg-dark border-secondary text-white" style="width: 170px;" onchange="updateRenewalStatus('${r.renewalId}', this.value)">
              <option value="Not Started" ${r.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
              <option value="Review Required" ${r.status === 'Review Required' ? 'selected' : ''}>Review Required</option>
              <option value="Renewal Requested" ${r.status === 'Renewal Requested' ? 'selected' : ''}>Renewal Requested</option>
              <option value="Approved" ${r.status === 'Approved' ? 'selected' : ''}>Approved</option>
              <option value="Renewed" ${r.status === 'Renewed' ? 'selected' : ''}>Renewed</option>
              <option value="Cancelled" ${r.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          ` : `<span class="badge ${isRenewed ? 'bg-success' : 'bg-secondary'}">${r.status}</span>`}
        </td>
        <td class="text-end">
          ${isManager && !isRenewed ? `
            <button class="btn btn-sm btn-primary-custom py-1 px-2" title="Execute Renewal Contract" onclick="openExecuteRenewalModal('${r.renewalId}', '${r.licenseId}', '${escapeHTML(r.softwareName)}', ${r.renewalCost || 0})">
              <i class="fa-solid fa-rotate me-1"></i> Execute
            </button>
          ` : `<span class="text-success small fw-semibold"><i class="fa-solid fa-circle-check me-1"></i> Renewed</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

async function updateRenewalStatus(renewalId, status) {
  try {
    const res = await fetch(`/api/renewals/${renewalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status })
    });
    const result = await res.json();

    if (result.success) {
      showToast(`Renewal status updated to "${status}"`, 'success');
      loadRenewals();
      refreshDashboard();
    } else {
      showToast(result.message || 'Failed to update renewal status', 'danger');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'danger');
  }
}

function openExecuteRenewal(licenseId) {
  navigateTo('view-renewals');
  const renewal = renewalsList.find(r => r.licenseId === licenseId);
  if (renewal) {
    openExecuteRenewalModal(renewal.renewalId, renewal.licenseId, renewal.softwareName, renewal.renewalCost);
  } else {
    // Open create renewal
    openCreateRenewalModal(licenseId);
  }
}

function openExecuteRenewalModal(renewalId, licenseId, softwareName, cost) {
  document.getElementById('execute-renewal-form').reset();
  document.getElementById('exec-renewal-id').value = renewalId;
  document.getElementById('exec-renewal-software-name').textContent = softwareName;
  document.getElementById('exec-renewal-license-id').textContent = licenseId;
  document.getElementById('exec-renewal-cost').value = cost || 0;

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  document.getElementById('exec-renewal-new-date').value = nextYear.toISOString().split('T')[0];

  const modal = new bootstrap.Modal(document.getElementById('executeRenewalModal'));
  modal.show();
}

async function handleExecuteRenewalSubmit(e) {
  e.preventDefault();
  const renewalId = document.getElementById('exec-renewal-id').value;
  const newExpirationDate = document.getElementById('exec-renewal-new-date').value;
  const renewalCost = Number(document.getElementById('exec-renewal-cost').value);
  const notes = document.getElementById('exec-renewal-notes').value;

  try {
    const res = await fetch(`/api/renewals/${renewalId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ newExpirationDate, renewalCost, notes })
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      bootstrap.Modal.getInstance(document.getElementById('executeRenewalModal')).hide();
      loadRenewals();
      loadLicenses();
      refreshDashboard();
    } else {
      showToast(result.message || 'Renewal failed', 'danger');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'danger');
  }
}

function openCreateRenewalModal(licenseId = null) {
  const lic = licensesList.find(l => l.licenseId === licenseId) || licensesList[0];
  if (!lic) {
    showToast('No licenses available to create renewal', 'warning');
    return;
  }
  openExecuteRenewalModal('RNW-NEW', lic.licenseId, lic.softwareName, lic.cost);
}

document.getElementById('execute-renewal-form')?.addEventListener('submit', handleExecuteRenewalSubmit);
document.getElementById('renewal-search-input')?.addEventListener('input', debounce(() => loadRenewals(), 300));
