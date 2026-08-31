// Seat Allocation Management Module
let allocationsList = [];

async function loadAllocations() {
  if (!authToken) return;

  const search = document.getElementById('alloc-search-input')?.value || '';
  const dept = document.getElementById('alloc-filter-dept')?.value || 'ALL';
  const status = document.getElementById('alloc-filter-status')?.value || 'ACTIVE';

  const params = new URLSearchParams();
  if (dept !== 'ALL') params.append('department', dept);
  if (status !== 'ALL') params.append('status', status);

  try {
    const res = await fetch(`/api/licenses/assignments?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      allocationsList = result.data;
      if (search) {
        const q = search.toLowerCase();
        allocationsList = allocationsList.filter(a =>
          (a.employeeName && a.employeeName.toLowerCase().includes(q)) ||
          (a.softwareName && a.softwareName.toLowerCase().includes(q)) ||
          (a.assignmentId && a.assignmentId.toLowerCase().includes(q)) ||
          (a.employeeId && a.employeeId.toLowerCase().includes(q))
        );
      }
      renderAllocationsTable(allocationsList);
      document.getElementById('alloc-results-count').textContent = allocationsList.length;

      // Update Allocation KPIs
      updateAllocationKPIs();
    }
  } catch (err) {
    console.error('Failed to load allocations:', err);
    showToast('Failed to load seat allocations.', 'danger');
  }
}

async function updateAllocationKPIs() {
  try {
    const res = await fetch('/api/licenses', { headers: { 'Authorization': `Bearer ${authToken}` } });
    const result = await res.json();
    if (result.success) {
      const licenses = result.data;
      const totalAllocated = licenses.reduce((sum, l) => sum + (Number(l.allocatedSeats) || 0), 0);
      const totalFree = licenses.reduce((sum, l) => sum + Math.max(0, (Number(l.totalSeats) || 0) - (Number(l.allocatedSeats) || 0)), 0);
      const maxedOut = licenses.filter(l => (Number(l.allocatedSeats) || 0) >= (Number(l.totalSeats) || 0)).length;

      document.getElementById('alloc-total-active').textContent = totalAllocated;
      document.getElementById('alloc-free-seats').textContent = totalFree;
      document.getElementById('alloc-maxed-licenses').textContent = maxedOut;
    }
  } catch (_) {}
}

function renderAllocationsTable(items) {
  const tbody = document.getElementById('allocations-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No seat allocation records found.</td></tr>';
    return;
  }

  const isManager = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'LICENSE_MANAGER');

  tbody.innerHTML = items.map(a => {
    const isActive = a.status === 'ACTIVE';
    return `
      <tr>
        <td class="font-monospace small text-primary fw-semibold">${a.assignmentId}</td>
        <td>
          <div class="fw-bold text-white">${escapeHTML(a.employeeName)}</div>
          <div class="small text-muted font-monospace">${a.employeeId} &bull; ${escapeHTML(a.employeeEmail || '')}</div>
        </td>
        <td><span class="badge bg-dark border border-secondary text-secondary">${escapeHTML(a.department || 'General')}</span></td>
        <td>
          <div class="fw-semibold text-white">${escapeHTML(a.softwareName)}</div>
          <div class="small text-muted font-monospace text-truncate" style="max-width: 180px;">${escapeHTML(a.licenseKey || '')}</div>
        </td>
        <td class="font-monospace small text-secondary">${a.licenseId}</td>
        <td class="small">${a.assignedDate}</td>
        <td class="small text-${isActive ? 'white' : 'muted'}">${a.expirationDate || 'N/A'}</td>
        <td>
          <span class="badge-status ${isActive ? 'badge-active' : 'badge-expired'}">
            <i class="fa-solid fa-${isActive ? 'circle-check' : 'ban'} small"></i> ${a.status}
          </span>
        </td>
        <td class="text-end">
          ${isManager && isActive ? `
            <button class="btn btn-sm btn-outline-danger" onclick="confirmRevokeSeat('${a.assignmentId}', '${escapeHTML(a.employeeName)}', '${escapeHTML(a.softwareName)}')">
              <i class="fa-solid fa-user-xmark me-1"></i> Revoke
            </button>
          ` : `<span class="text-muted small">${a.revokedDate ? `Revoked ${a.revokedDate}` : '-'}</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

async function openAssignSeatModal() {
  document.getElementById('allocate-seat-form').reset();
  await populateAssignModalDropdowns();
  const modal = new bootstrap.Modal(document.getElementById('allocateSeatModal'));
  modal.show();
}

async function openAssignSeatForLicense(licenseId) {
  await openAssignSeatModal();
  document.getElementById('alloc-license-select').value = licenseId;
  updateSeatAvailabilityPreview(licenseId);
}

async function populateAssignModalDropdowns() {
  try {
    const [licRes, empRes] = await Promise.all([
      fetch('/api/licenses', { headers: { 'Authorization': `Bearer ${authToken}` } }),
      fetch('/api/employees', { headers: { 'Authorization': `Bearer ${authToken}` } })
    ]);

    const licData = await licRes.json();
    const empData = await empRes.json();

    if (licData.success) {
      const select = document.getElementById('alloc-license-select');
      select.innerHTML = '<option value="">-- Choose License --</option>' + licData.data.map(l => {
        const free = Math.max(0, (l.totalSeats || 0) - (l.allocatedSeats || 0));
        return `<option value="${l.licenseId}" data-free="${free}">${escapeHTML(l.softwareName)} (${l.licenseId}) - [${free} free of ${l.totalSeats} seats]</option>`;
      }).join('');
    }

    if (empData.success) {
      const select = document.getElementById('alloc-employee-select');
      select.innerHTML = '<option value="">-- Choose Employee --</option>' + empData.data.map(e => {
        return `<option value="${e.employeeId}">${escapeHTML(e.fullName)} (${e.department} - ${e.employeeId})</option>`;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to populate assign dropdowns:', err);
  }
}

function updateSeatAvailabilityPreview(licenseId) {
  const select = document.getElementById('alloc-license-select');
  const option = select.options[select.selectedIndex];
  const badge = document.getElementById('alloc-availability-badge');
  if (!badge) return;

  if (!option || !option.value) {
    badge.innerHTML = '';
    return;
  }

  const free = Number(option.getAttribute('data-free')) || 0;
  if (free > 0) {
    badge.innerHTML = `<span class="badge bg-success-subtle text-success border border-success"><i class="fa-solid fa-check me-1"></i> ${free} seat(s) available for allocation</span>`;
  } else {
    badge.innerHTML = `<span class="badge bg-danger-subtle text-danger border border-danger"><i class="fa-solid fa-triangle-exclamation me-1"></i> No seats available! License is at full capacity.</span>`;
  }
}

async function handleAllocateSeatSubmit(e) {
  e.preventDefault();
  const licenseId = document.getElementById('alloc-license-select').value;
  const employeeId = document.getElementById('alloc-employee-select').value;
  const notes = document.getElementById('alloc-notes').value;

  if (!licenseId || !employeeId) {
    showToast('Please select both a license and an employee.', 'warning');
    return;
  }

  try {
    const res = await fetch(`/api/licenses/${licenseId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ employeeId, notes })
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      bootstrap.Modal.getInstance(document.getElementById('allocateSeatModal')).hide();
      loadAllocations();
      loadLicenses();
      refreshDashboard();
    } else {
      showToast(result.message || 'Seat allocation rejected', 'danger');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'danger');
  }
}

async function confirmRevokeSeat(assignmentId, employeeName, softwareName) {
  const reason = prompt(`Enter reason for revoking "${softwareName}" seat from ${employeeName}:`, 'Project completion / role transfer');
  if (reason === null) return;

  try {
    const res = await fetch(`/api/licenses/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ assignmentId, reason })
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      loadAllocations();
      loadLicenses();
      refreshDashboard();
    } else {
      showToast(result.message || 'Failed to revoke seat', 'danger');
    }
  } catch (err) {
    showToast('Revoke failed: ' + err.message, 'danger');
  }
}

document.getElementById('allocate-seat-form')?.addEventListener('submit', handleAllocateSeatSubmit);
document.getElementById('alloc-search-input')?.addEventListener('input', debounce(() => loadAllocations(), 300));
