const db = require('../config/db');
const { generateId, getDaysRemaining } = require('../utils/helpers');
const licenseEngine = require('../services/licenseEngine');
const { logAudit } = require('../middleware/auditMiddleware');

const renewalController = {
  // Get all renewals with optional sync against active expiring licenses
  async getAllRenewals(req, res) {
    try {
      let renewals = await db.read('renewals');
      const licenses = await db.read('licenses');
      const { status, urgency, search } = req.query;

      // Ensure every expiring or expired license has an associated renewal tracker entry if not already present
      for (const lic of licenses) {
        const days = getDaysRemaining(lic.expirationDate);
        if (days !== null && days <= 90) {
          const existing = renewals.find(r => r.licenseId === lic.licenseId && r.status !== 'Renewed' && r.status !== 'Cancelled');
          if (!existing) {
            let itemUrgency = 'EXPIRING SOON';
            if (days < 0) itemUrgency = 'EXPIRED';
            else if (days <= 7) itemUrgency = 'CRITICAL';
            else if (days <= 30) itemUrgency = 'URGENT';

            const newRenewal = {
              renewalId: generateId('RNW'),
              licenseId: lic.licenseId,
              softwareName: lic.softwareName,
              vendorName: lic.vendor,
              renewalDate: lic.expirationDate,
              renewalCost: lic.cost,
              currency: lic.currency || '₹',
              status: 'Not Started',
              urgency: itemUrgency,
              notes: `Auto-generated pipeline item for license expiring on ${lic.expirationDate}.`,
              createdAt: new Date().toISOString()
            };
            renewals.unshift(newRenewal);
            await db.insert('renewals', newRenewal);
          }
        }
      }

      if (search) {
        const q = search.toLowerCase();
        renewals = renewals.filter(r =>
          (r.softwareName && r.softwareName.toLowerCase().includes(q)) ||
          (r.vendorName && r.vendorName.toLowerCase().includes(q)) ||
          (r.licenseId && r.licenseId.toLowerCase().includes(q))
        );
      }

      if (status && status !== 'ALL') {
        renewals = renewals.filter(r => r.status === status);
      }

      if (urgency && urgency !== 'ALL') {
        renewals = renewals.filter(r => r.urgency === urgency);
      }

      res.json({ success: true, count: renewals.length, data: renewals });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getRenewalById(req, res) {
    try {
      const { id } = req.params;
      const renewal = await db.findById('renewals', id, 'renewalId');
      if (!renewal) {
        return res.status(404).json({ success: false, message: 'Renewal record not found.' });
      }
      res.json({ success: true, data: renewal });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createRenewal(req, res) {
    try {
      const { licenseId, renewalDate, renewalCost, status, notes } = req.body;
      const license = await db.findById('licenses', licenseId, 'licenseId');
      if (!license) {
        return res.status(400).json({ success: false, message: 'Invalid license ID.' });
      }

      const days = getDaysRemaining(renewalDate || license.expirationDate);
      let urgency = 'EXPIRING SOON';
      if (days !== null) {
        if (days < 0) urgency = 'EXPIRED';
        else if (days <= 7) urgency = 'CRITICAL';
        else if (days <= 30) urgency = 'URGENT';
      }

      const renewalId = generateId('RNW');
      const newRenewal = {
        renewalId,
        licenseId: license.licenseId,
        softwareName: license.softwareName,
        vendorName: license.vendor,
        renewalDate: renewalDate || license.expirationDate,
        renewalCost: Number(renewalCost) || license.cost,
        currency: license.currency || '₹',
        status: status || 'Not Started',
        urgency,
        notes: notes ? notes.trim() : 'Manual renewal entry created',
        createdAt: new Date().toISOString()
      };

      await db.insert('renewals', newRenewal);

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'RENEWAL_CREATED',
        module: 'RENEWALS',
        recordId: renewalId,
        description: `Created renewal entry ${renewalId} for license "${license.softwareName}".`
      });

      res.status(201).json({ success: true, message: 'Renewal entry created.', data: newRenewal });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateRenewal(req, res) {
    try {
      const { id } = req.params;
      const existing = await db.findById('renewals', id, 'renewalId');
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Renewal record not found.' });
      }

      const updates = {
        renewalDate: req.body.renewalDate || existing.renewalDate,
        renewalCost: req.body.renewalCost !== undefined ? Number(req.body.renewalCost) : existing.renewalCost,
        status: req.body.status || existing.status,
        notes: req.body.notes !== undefined ? req.body.notes.trim() : existing.notes
      };

      // If status is updated to 'Renewed' or extension provided
      if (req.body.status === 'Renewed' && req.body.newExpirationDate) {
        await licenseEngine.processRenewal({
          renewalId: id,
          licenseId: existing.licenseId,
          newExpirationDate: req.body.newExpirationDate,
          renewalCost: updates.renewalCost,
          updatedBy: req.user?.name ? `${req.user.name} (${req.user.role})` : 'System Admin',
          notes: updates.notes
        });
      } else {
        await db.update('renewals', id, updates, 'renewalId');
        
        await logAudit({
          user: req.user,
          role: req.user?.role,
          action: 'RENEWAL_STATUS_UPDATED',
          module: 'RENEWALS',
          recordId: id,
          description: `Updated renewal ${id} status to "${updates.status}".`
        });
      }

      const updated = await db.findById('renewals', id, 'renewalId');
      res.json({ success: true, message: 'Renewal status updated successfully.', data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Direct execute renewal action
  async executeRenewal(req, res) {
    try {
      const { id } = req.params;
      const { newExpirationDate, renewalCost, notes } = req.body;
      const renewal = await db.findById('renewals', id, 'renewalId');
      if (!renewal) {
        return res.status(404).json({ success: false, message: 'Renewal record not found.' });
      }

      if (!newExpirationDate) {
        return res.status(400).json({ success: false, message: 'New expiration date is required for license renewal.' });
      }

      const updatedLicense = await licenseEngine.processRenewal({
        renewalId: id,
        licenseId: renewal.licenseId,
        newExpirationDate,
        renewalCost: renewalCost !== undefined ? Number(renewalCost) : renewal.renewalCost,
        updatedBy: req.user?.name ? `${req.user.name} (${req.user.role})` : 'System Admin',
        notes
      });

      res.json({
        success: true,
        message: `License "${renewal.softwareName}" renewed successfully until ${newExpirationDate}.`,
        data: updatedLicense
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = renewalController;
