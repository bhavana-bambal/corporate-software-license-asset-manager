const db = require('../config/db');
const { generateId } = require('../utils/helpers');

async function logAudit({ user, role, action, module, recordId, description }) {
  try {
    const auditId = generateId('AUD');
    const logEntry = {
      logId: auditId,
      timestamp: new Date().toISOString(),
      user: typeof user === 'string' ? user : (user?.name ? `${user.name} (${user.email})` : 'System User'),
      role: role || (typeof user === 'object' ? user?.role : 'USER'),
      action,
      module,
      recordId: String(recordId || 'N/A'),
      description
    };

    await db.insert('auditLogs', logEntry);
    return logEntry;
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
