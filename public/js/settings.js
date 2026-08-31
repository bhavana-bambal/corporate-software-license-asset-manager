// System Settings & Database Tools Module

async function loadSettings() {
  if (!authToken) return;

  try {
    const res = await fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      const s = result.data;
      document.getElementById('setting-company-name').value = s.companyName || '';
      document.getElementById('setting-company-address').value = s.companyAddress || '';
      document.getElementById('setting-company-email').value = s.companyEmail || '';
      document.getElementById('setting-currency').value = s.currency || '₹';

      const thresh = s.alertThresholds || {};
      document.getElementById('setting-crit-days').value = thresh.criticalDays || 7;
      document.getElementById('setting-urg-days').value = thresh.urgentDays || 30;
      document.getElementById('setting-warn-days').value = thresh.warningDays || 90;
      document.getElementById('setting-high-util').value = thresh.highUtilizationPercent || 80;
      document.getElementById('setting-crit-util').value = thresh.criticalUtilizationPercent || 90;
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  const payload = {
    companyName: document.getElementById('setting-company-name').value,
    companyAddress: document.getElementById('setting-company-address').value,
    companyEmail: document.getElementById('setting-company-email').value,
    currency: document.getElementById('setting-currency').value,
    alertThresholds: {
      criticalDays: Number(document.getElementById('setting-crit-days').value),
      urgentDays: Number(document.getElementById('setting-urg-days').value),
      warningDays: Number(document.getElementById('setting-warn-days').value),
      highUtilizationPercent: Number(document.getElementById('setting-high-util').value),
      criticalUtilizationPercent: Number(document.getElementById('setting-crit-util').value)
    }
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      showToast('Settings saved successfully.', 'success');
      refreshDashboard();
    } else {
      showToast(result.message || 'Failed to save settings', 'danger');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'danger');
  }
}

function downloadDatabaseBackup() {
  const url = `/api/settings/backup?token=${authToken}`;
  window.open(url, '_blank');
  showToast('Exporting complete JSON database backup...', 'info');
}

async function confirmResetDatabase() {
  if (!confirm('⚠️ Are you sure you want to reset the entire JSON database to initial Indian corporate demo state? All newly added test data will be restored to seed defaults.')) {
    return;
  }

  try {
    const res = await fetch('/api/settings/reset', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      refreshDashboard();
      loadSoftware();
      loadLicenses();
      loadAllocations();
      loadEmployees();
      loadVendors();
      loadRenewals();
      loadNotifications();
      loadAuditLogs();
    } else {
      showToast(result.message || 'Failed to reset database', 'danger');
    }
  } catch (err) {
    showToast('Reset failed: ' + err.message, 'danger');
  }
}

document.getElementById('settings-form')?.addEventListener('submit', handleSettingsSubmit);
