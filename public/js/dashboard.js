// Dashboard Visualizations & Metrics Engine
let charts = {};

async function refreshDashboard() {
  if (!authToken) return;

  try {
    const res = await fetch('/api/dashboard/summary', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (!result.success) return;
    const { kpi, charts: chartData, recentAudits, urgentActions } = result.data;

    // 1. Update KPI Counters
    document.getElementById('kpi-total-software').textContent = kpi.totalSoftware;
    document.getElementById('kpi-active-licenses').textContent = kpi.activeLicenses;
    document.getElementById('kpi-total-seats').textContent = kpi.totalSeats;
    document.getElementById('kpi-allocated-seats').textContent = kpi.allocatedSeats;
    document.getElementById('kpi-available-seats').textContent = kpi.availableSeats;
    document.getElementById('kpi-total-spend').textContent = `₹ ${kpi.totalSpending.toLocaleString('en-IN')}`;
    document.getElementById('kpi-expiring-soon').textContent = kpi.expiringSoon;
    document.getElementById('kpi-expired').textContent = kpi.expiredLicenses;
    document.getElementById('kpi-active-assignments').textContent = kpi.activeAssignments;
    document.getElementById('kpi-pending-renewals').textContent = kpi.pendingRenewals;

    document.getElementById('kpi-utilization-rate').textContent = `${kpi.seatUtilizationRate}%`;
    document.getElementById('kpi-total-vendors').textContent = kpi.totalVendors;
    document.getElementById('kpi-employees-count').textContent = kpi.totalEmployees;

    // Badges in sidebar
    document.getElementById('sidebar-sw-count').textContent = kpi.totalSoftware;
    document.getElementById('sidebar-lic-count').textContent = kpi.activeLicenses;
    document.getElementById('sidebar-renewal-badge').textContent = kpi.pendingRenewals;

    // 2. Render Charts
    renderChartUtilization(chartData.utilization);
    renderChartExpiration(chartData.expiration);
    renderChartCategory(chartData.category);
    renderChartVendorSpend(chartData.vendorSpend);
    renderChartStatus(chartData.statusDistribution);

    // 3. Populate Tables
    populateUrgentLicenses(urgentActions);
    populateRecentAudits(recentAudits);

  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

function renderChartUtilization(data) {
  const ctx = document.getElementById('chart-utilization');
  if (!ctx) return;
  if (charts.utilization) charts.utilization.destroy();

  charts.utilization = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Allocated Seats',
          data: data.datasets[0].data,
          backgroundColor: '#6366f1',
          borderRadius: 4
        },
        {
          label: 'Available Seats',
          data: data.datasets[1].data,
          backgroundColor: '#10b981',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        },
        y: {
          stacked: true,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        }
      },
      plugins: {
        legend: { labels: { color: '#cbd5e1', font: { size: 11 } } }
      }
    }
  });
}

function renderChartExpiration(data) {
  const ctx = document.getElementById('chart-expiration');
  if (!ctx) return;
  if (charts.expiration) charts.expiration.destroy();

  charts.expiration = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.data,
        backgroundColor: data.backgroundColor,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 10 }
        }
      }
    }
  });
}

function renderChartCategory(data) {
  const ctx = document.getElementById('chart-category');
  if (!ctx) return;
  if (charts.category) charts.category.destroy();

  charts.category = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.data,
        backgroundColor: data.backgroundColor,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderChartVendorSpend(data) {
  const ctx = document.getElementById('chart-vendor-spend');
  if (!ctx) return;
  if (charts.vendorSpend) charts.vendorSpend.destroy();

  charts.vendorSpend = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Spend (₹)',
        data: data.data,
        backgroundColor: data.backgroundColor,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', callback: val => '₹ ' + (val / 1000) + 'k' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#cbd5e1', font: { size: 10 } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderChartStatus(data) {
  const ctx = document.getElementById('chart-status');
  if (!ctx) return;
  if (charts.status) charts.status.destroy();

  charts.status = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.data,
        backgroundColor: data.backgroundColor,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 10 }
        }
      }
    }
  });
}

function populateUrgentLicenses(licenses) {
  const tbody = document.getElementById('dashboard-urgent-licenses-table');
  if (!tbody) return;

  if (!licenses || licenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No urgent expiration items found.</td></tr>';
    return;
  }

  tbody.innerHTML = licenses.map(l => `
    <tr>
      <td>
        <div class="fw-semibold text-white">${escapeHTML(l.softwareName)}</div>
        <span class="small text-muted font-monospace">${l.licenseId}</span>
      </td>
      <td>
        <div class="small">${l.expirationDate}</div>
        <span class="small text-${l.daysRemaining < 0 ? 'danger' : 'warning'}">
          ${l.daysRemaining < 0 ? `${Math.abs(l.daysRemaining)} days expired` : `${l.daysRemaining} days remaining`}
        </span>
      </td>
      <td>${getStatusBadge(l.status)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="openExecuteRenewal('${l.licenseId}')">Renew</button>
      </td>
    </tr>
  `).join('');
}

function populateRecentAudits(audits) {
  const tbody = document.getElementById('dashboard-recent-audits-table');
  if (!tbody) return;

  if (!audits || audits.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No audit logs available.</td></tr>';
    return;
  }

  tbody.innerHTML = audits.map(a => `
    <tr>
      <td class="text-muted small">${formatTimeAgo(a.timestamp)}</td>
      <td class="small fw-medium">${escapeHTML(a.user)}</td>
      <td><span class="badge bg-dark border border-secondary" style="font-size: 0.65rem;">${a.action}</span></td>
      <td class="small text-secondary text-truncate" style="max-width: 220px;">${escapeHTML(a.description)}</td>
    </tr>
  `).join('');
}
