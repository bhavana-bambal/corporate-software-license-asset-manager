// System Audit Trail Module
let auditLogsList = [];

async function loadAuditLogs() {
  if (!authToken) return;

  const search = document.getElementById('audit-search-input')?.value || '';
  const module = document.getElementById('audit-filter-module')?.value || 'ALL';
  const action = document.getElementById('audit-filter-action')?.value || 'ALL';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (module !== 'ALL') params.append('module', module);
  if (action !== 'ALL') params.append('action', action);

  try {
    const res = await fetch(`/api/audit-logs?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      auditLogsList = result.data;
      renderAuditTable(auditLogsList);
      document.getElementById('audit-results-count').textContent = auditLogsList.length;
    }
  } catch (err) {
    console.error('Failed to load audit logs:', err);
    showToast('Failed to load audit logs.', 'danger');
  }
}

function renderAuditTable(items) {
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No audit log records match your filter.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(a => {
    let actionBadge = 'bg-primary';
    if (a.action.includes('DELETED') || a.action.includes('REVOKED')) actionBadge = 'bg-danger';
    else if (a.action.includes('ADDED') || a.action.includes('ASSIGNED')) actionBadge = 'bg-success';
    else if (a.action.includes('RENEW') || a.action.includes('UPDATED')) actionBadge = 'bg-warning text-dark';

    return `
      <tr>
        <td class="text-secondary small font-monospace">${formatDateTime(a.timestamp)}</td>
        <td>
          <div class="fw-semibold text-white small">${escapeHTML(a.user)}</div>
          <span class="badge bg-dark border border-secondary text-muted" style="font-size: 0.65rem;">${a.role}</span>
        </td>
        <td><span class="badge bg-dark border border-secondary text-info">${a.module}</span></td>
        <td><span class="badge ${actionBadge}" style="font-size: 0.7rem;">${a.action}</span></td>
        <td class="font-monospace small text-secondary">${a.recordId}</td>
        <td class="small text-white">${escapeHTML(a.description)}</td>
      </tr>
    `;
  }).join('');
}

document.getElementById('audit-search-input')?.addEventListener('input', debounce(() => loadAuditLogs(), 300));
