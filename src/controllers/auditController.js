const db = require('../config/db');

const auditController = {
  async getAuditLogs(req, res) {
    try {
      let logs = await db.read('auditLogs');
      const { search, module, action, user, limit } = req.query;

      if (search) {
        const q = search.toLowerCase();
        logs = logs.filter(l =>
          (l.description && l.description.toLowerCase().includes(q)) ||
          (l.recordId && l.recordId.toLowerCase().includes(q)) ||
          (l.user && l.user.toLowerCase().includes(q))
        );
      }

      if (module && module !== 'ALL') {
        logs = logs.filter(l => l.module === module);
      }

      if (action && action !== 'ALL') {
        logs = logs.filter(l => l.action === action);
      }

      if (user && user !== 'ALL') {
        logs = logs.filter(l => l.user && l.user.toLowerCase().includes(user.toLowerCase()));
      }

      // Sort reverse chronological
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (limit) {
        logs = logs.slice(0, Number(limit));
      }

      res.json({ success: true, count: logs.length, data: logs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = auditController;
