/**
 * Utility helper functions for Corporate Software License & Asset Manager
 */

// Generate short random code
function generateId(prefix = 'ID') {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

// Calculate days remaining between a date and today
function getDaysRemaining(targetDate) {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const today = new Date();
  // Set both to start of day for accurate day-difference
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Dynamic license status calculation based on dates and existing status
function calculateLicenseStatus(license) {
  if (!license.expirationDate) {
    return license.status || 'ACTIVE';
  }

  const days = getDaysRemaining(license.expirationDate);

  if (days < 0) {
    return 'EXPIRED';
  }
  if (days <= 7) {
    return 'CRITICAL';
  }
  if (days <= 30) {
    return 'URGENT';
  }
  if (days <= 90) {
    return 'EXPIRING SOON';
  }
  if (license.status === 'RENEWAL PENDING') {
    return 'RENEWAL PENDING';
  }
  return 'ACTIVE';
}

// Format currency as Indian Rupees (₹)
function formatCurrency(amount, currency = '₹') {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString('en-IN')}`;
}

// Format ISO date to YYYY-MM-DD
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  } catch (_) {
    return dateStr;
  }
}

// Helper to convert array of objects to CSV string
function convertToCSV(data, headers = null) {
  if (!data || !data.length) return '';
  const keys = headers ? headers.map(h => h.key) : Object.keys(data[0]);
  const labels = headers ? headers.map(h => h.label) : keys;

  const headerRow = labels.map(l => `"${String(l).replace(/"/g, '""')}"`).join(',');
  const rows = data.map(item => {
    return keys.map(k => {
      let val = item[k];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

module.exports = {
  generateId,
  getDaysRemaining,
  calculateLicenseStatus,
  formatCurrency,
  formatDate,
  convertToCSV
};
