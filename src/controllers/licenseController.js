const db = require('../config/db');
const { generateId, getDaysRemaining } = require('../utils/helpers');
const licenseEngine = require('../services/licenseEngine');
const { logAudit } = require('../middleware/auditMiddleware');

const licenseController = {
  // Get all licenses with dynamic statuses and calculated fields
  async getAllLicenses(req, res) {
    try {
      let licenses = await licenseEngine.getAllLicenses();
      const { search, status, vendor, softwareId, expiringWithinDays, sortBy, sortOrder } = req.query;

      if (search) {
        const q = search.toLowerCase();
        licenses = licenses.filter(l =>
          (l.softwareName && l.softwareName.toLowerCase().includes(q)) ||
          (l.licenseId && l.licenseId.toLowerCase().includes(q)) ||
          (l.licenseKey && l.licenseKey.toLowerCase().includes(q)) ||
          (l.vendor && l.vendor.toLowerCase().includes(q))
        );
      }

      if (status && status !== 'ALL') {
        licenses = licenses.filter(l => l.status === status);
      }

      if (vendor && vendor !== 'ALL') {
        licenses = licenses.filter(l => l.vendor === vendor);
      }

      if (softwareId && softwareId !== 'ALL') {
        licenses = licenses.filter(l => l.softwareId === softwareId);
      }

      if (expiringWithinDays) {
        const maxDays = Number(expiringWithinDays);
        licenses = licenses.filter(l => {
          const days = getDaysRemaining(l.expirationDate);
          return days !== null && days >= 0 && days <= maxDays;
        });
      }

      // Sort
      if (sortBy) {
        const order = sortOrder === 'desc' ? -1 : 1;
        licenses.sort((a, b) => {
          if (a[sortBy] < b[sortBy]) return -1 * order;
          if (a[sortBy] > b[sortBy]) return 1 * order;
          return 0;
        });
      } else {
        // Default sort: Critical & Urgent & Expiring Soon first
        const priority = { 'CRITICAL': 1, 'URGENT': 2, 'EXPIRED': 3, 'EXPIRING SOON': 4, 'RENEWAL PENDING': 5, 'ACTIVE': 6 };
        licenses.sort((a, b) => (priority[a.status] || 99) - (priority[b.status] || 99));
      }

      res.json({ success: true, count: licenses.length, data: licenses });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getLicenseById(req, res) {
    try {
      const { id } = req.params;
      const license = await db.findById('licenses', id, 'licenseId');
      if (!license) {
        return res.status(404).json({ success: false, message: 'License record not found.' });
      }

      const refreshed = licenseEngine.recomputeStatus(license);
      const assignments = await db.find('assignments', a => a.licenseId === refreshed.licenseId && a.status === 'ACTIVE');
      const renewals = await db.find('renewals', r => r.licenseId === refreshed.licenseId);

      res.json({
        success: true,
        data: {
          ...refreshed,
          assignments,
          renewals
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createLicense(req, res) {
    try {
      const {
        softwareId,
        vendorId,
        licenseKey,
        licenseType,
        purchaseDate,
        startDate,
        expirationDate,
        totalSeats,
        cost,
        currency,
        autoRenewal,
        notes
      } = req.body;

      const software = await db.findById('software', softwareId, 'softwareId');
      if (!software) {
        return res.status(400).json({ success: false, message: 'Invalid software ID selected.' });
      }

      let vendorName = software.vendor;
      if (vendorId) {
        const vendor = await db.findById('vendors', vendorId, 'vendorId');
        if (vendor) vendorName = vendor.vendorName;
      }

      const totalSeatsNum = Number(totalSeats) || 1;
      const licenseId = generateId('LIC');

      const rawLicense = {
        licenseId,
        softwareId: software.softwareId,
        softwareName: software.softwareName,
        vendor: vendorName,
        vendorId: vendorId || software.vendorId || null,
        licenseKey: licenseKey ? licenseKey.trim() : generateId('KEY'),
        licenseType: licenseType || software.licenseType || 'Subscription',
        purchaseDate: purchaseDate || startDate || new Date().toISOString().split('T')[0],
        startDate: startDate || new Date().toISOString().split('T')[0],
        expirationDate,
        totalSeats: totalSeatsNum,
        allocatedSeats: 0,
        availableSeats: totalSeatsNum,
        cost: Number(cost) || 0,
        currency: currency || '₹',
        autoRenewal: Boolean(autoRenewal),
        status: 'ACTIVE',
        notes: notes ? notes.trim() : '',
        createdAt: new Date().toISOString()
      };

      const finalLicense = licenseEngine.recomputeStatus(rawLicense);
      await db.insert('licenses', finalLicense);

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'LICENSE_ADDED',
        module: 'LICENSES',
        recordId: licenseId,
        description: `Added license "${software.softwareName}" (${licenseId}) with ${totalSeatsNum} seats.`
      });

      res.status(201).json({
        success: true,
        message: 'License created successfully.',
        data: finalLicense
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateLicense(req, res) {
    try {
      const { id } = req.params;
      const existing = await db.findById('licenses', id, 'licenseId');
      if (!existing) {
        return res.status(404).json({ success: false, message: 'License record not found.' });
      }

      const totalSeats = req.body.totalSeats !== undefined ? Number(req.body.totalSeats) : existing.totalSeats;
      const allocatedSeats = Number(existing.allocatedSeats) || 0;

      if (totalSeats < allocatedSeats) {
        return res.status(400).json({
          success: false,
          message: `Total seats (${totalSeats}) cannot be less than currently allocated seats (${allocatedSeats}). Revoke seats first.`
        });
      }

      let softwareName = existing.softwareName;
      if (req.body.softwareId && req.body.softwareId !== existing.softwareId) {
        const sw = await db.findById('software', req.body.softwareId, 'softwareId');
        if (sw) softwareName = sw.softwareName;
      }

      const updates = {
        softwareId: req.body.softwareId || existing.softwareId,
        softwareName,
        vendor: req.body.vendor || existing.vendor,
        vendorId: req.body.vendorId !== undefined ? req.body.vendorId : existing.vendorId,
        licenseKey: req.body.licenseKey !== undefined ? req.body.licenseKey.trim() : existing.licenseKey,
        licenseType: req.body.licenseType || existing.licenseType,
        purchaseDate: req.body.purchaseDate || existing.purchaseDate,
        startDate: req.body.startDate || existing.startDate,
        expirationDate: req.body.expirationDate || existing.expirationDate,
        totalSeats,
        availableSeats: Math.max(0, totalSeats - allocatedSeats),
        cost: req.body.cost !== undefined ? Number(req.body.cost) : existing.cost,
        currency: req.body.currency || existing.currency,
        autoRenewal: req.body.autoRenewal !== undefined ? Boolean(req.body.autoRenewal) : existing.autoRenewal,
        status: req.body.status || existing.status,
        notes: req.body.notes !== undefined ? req.body.notes.trim() : existing.notes
      };

      const updated = await db.update('licenses', id, updates, 'licenseId');
      const refreshed = licenseEngine.recomputeStatus(updated);

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'LICENSE_UPDATED',
        module: 'LICENSES',
        recordId: id,
        description: `Updated license "${refreshed.softwareName}" (${id}).`
      });

      res.json({
        success: true,
        message: 'License record updated successfully.',
        data: refreshed
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteLicense(req, res) {
    try {
      const { id } = req.params;
      const license = await db.findById('licenses', id, 'licenseId');
      if (!license) {
        return res.status(404).json({ success: false, message: 'License record not found.' });
      }

      // Check if there are active assignments
      const activeAssignments = await db.find('assignments', a => a.licenseId === id && a.status === 'ACTIVE');
      if (activeAssignments.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete license ${id}. It currently has ${activeAssignments.length} active seat allocation(s). Please revoke all seats first.`
        });
      }

      await db.delete('licenses', id, 'licenseId');

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'LICENSE_DELETED',
        module: 'LICENSES',
        recordId: id,
        description: `Deleted license "${license.softwareName}" (${id}).`
      });

      res.json({
        success: true,
        message: `License "${license.softwareName}" (${id}) deleted successfully.`
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Assign a seat to an employee
  async assignSeat(req, res) {
    try {
      const { id } = req.params; // licenseId
      const { employeeId, notes } = req.body;

      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID is required for assignment.' });
      }

      const assignedBy = req.user?.name ? `${req.user.name} (${req.user.role})` : 'System Admin';
      const result = await licenseEngine.assignSeat({
        licenseId: id,
        employeeId,
        assignedBy,
        notes
      });

      res.json({
        success: true,
        message: 'Seat allocated successfully to employee.',
        data: result
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Revoke a seat assignment
  async revokeSeat(req, res) {
    try {
      const { assignmentId, reason } = req.body;
      if (!assignmentId) {
        return res.status(400).json({ success: false, message: 'Assignment ID is required to revoke seat.' });
      }

      const revokedBy = req.user?.name ? `${req.user.name} (${req.user.role})` : 'System Admin';
      const result = await licenseEngine.revokeSeat({
        assignmentId,
        revokedBy,
        reason
      });

      res.json({
        success: true,
        message: 'Seat revoked successfully.',
        data: result
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Get all assignments across licenses
  async getAllAssignments(req, res) {
    try {
      let assignments = await db.read('assignments');
      const { status, softwareId, employeeId, department } = req.query;

      if (status && status !== 'ALL') {
        assignments = assignments.filter(a => a.status === status);
      }
      if (softwareId && softwareId !== 'ALL') {
        assignments = assignments.filter(a => a.softwareId === softwareId);
      }
      if (employeeId) {
        assignments = assignments.filter(a => a.employeeId === employeeId);
      }
      if (department && department !== 'ALL') {
        assignments = assignments.filter(a => a.department === department);
      }

      res.json({ success: true, count: assignments.length, data: assignments });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = licenseController;
