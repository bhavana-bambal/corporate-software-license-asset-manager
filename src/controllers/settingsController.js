const db = require('../config/db');
const { seedDatabase } = require('../utils/seedData');
const { logAudit } = require('../middleware/auditMiddleware');

const settingsController = {
  async getSettings(req, res) {
    try {
      const settings = await db.read('settings');
      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateSettings(req, res) {
    try {
      const current = await db.read('settings');
      const updated = {
        ...current,
        companyName: req.body.companyName?.trim() || current.companyName,
        companyAddress: req.body.companyAddress?.trim() || current.companyAddress,
        companyEmail: req.body.companyEmail?.trim() || current.companyEmail,
        companyPhone: req.body.companyPhone?.trim() || current.companyPhone,
        currency: req.body.currency || current.currency,
        currencyCode: req.body.currencyCode || current.currencyCode,
        dateFormat: req.body.dateFormat || current.dateFormat,
        alertThresholds: {
          criticalDays: req.body.alertThresholds?.criticalDays !== undefined ? Number(req.body.alertThresholds.criticalDays) : current.alertThresholds?.criticalDays || 7,
          urgentDays: req.body.alertThresholds?.urgentDays !== undefined ? Number(req.body.alertThresholds.urgentDays) : current.alertThresholds?.urgentDays || 30,
          warningDays: req.body.alertThresholds?.warningDays !== undefined ? Number(req.body.alertThresholds.warningDays) : current.alertThresholds?.warningDays || 90,
          highUtilizationPercent: req.body.alertThresholds?.highUtilizationPercent !== undefined ? Number(req.body.alertThresholds.highUtilizationPercent) : current.alertThresholds?.highUtilizationPercent || 80,
          criticalUtilizationPercent: req.body.alertThresholds?.criticalUtilizationPercent !== undefined ? Number(req.body.alertThresholds.criticalUtilizationPercent) : current.alertThresholds?.criticalUtilizationPercent || 90
        },
        autoRenewalDefault: req.body.autoRenewalDefault !== undefined ? Boolean(req.body.autoRenewalDefault) : current.autoRenewalDefault,
        allowEmployeeSoftwareRequests: req.body.allowEmployeeSoftwareRequests !== undefined ? Boolean(req.body.allowEmployeeSoftwareRequests) : current.allowEmployeeSoftwareRequests,
        updatedAt: new Date().toISOString()
      };

      await db.write('settings', updated);

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'SETTINGS_UPDATED',
        module: 'SETTINGS',
        recordId: 'SYSTEM_SETTINGS',
        description: `Updated corporate configuration and alert threshold settings.`
      });

      res.json({ success: true, message: 'Settings updated successfully.', data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async exportBackup(req, res) {
    try {
      const backupData = await db.exportAll();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="corporate_asset_manager_backup_${Date.now()}.json"`);
      res.send(JSON.stringify(backupData, null, 2));
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async resetToDemoData(req, res) {
    try {
      await seedDatabase(true);
      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'DATABASE_RESET',
        module: 'SYSTEM',
        recordId: 'SYS_RESET',
        description: `Reset entire JSON database to factory seed dataset.`
      });

      res.json({
        success: true,
        message: 'Database has been successfully restored to initial Indian corporate demo state.'
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = settingsController;
