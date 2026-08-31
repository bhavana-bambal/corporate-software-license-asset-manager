const db = require('../config/db');
const { generateId, getDaysRemaining } = require('../utils/helpers');
const { logAudit } = require('../middleware/auditMiddleware');

const vendorController = {
  async getAllVendors(req, res) {
    try {
      let vendors = await db.read('vendors');
      const software = await db.read('software');
      const licenses = await db.read('licenses');
      const { search, status, sortBy, sortOrder } = req.query;

      if (search) {
        const q = search.toLowerCase();
        vendors = vendors.filter(v =>
          (v.vendorName && v.vendorName.toLowerCase().includes(q)) ||
          (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
          (v.email && v.email.toLowerCase().includes(q)) ||
          (v.vendorId && v.vendorId.toLowerCase().includes(q))
        );
      }

      if (status && status !== 'ALL') {
        vendors = vendors.filter(v => v.status === status);
      }

      // Calculate dynamic aggregated statistics for each vendor
      vendors = vendors.map(v => {
        const vendorSoftware = software.filter(s => s.vendorId === v.vendorId || s.vendor === v.vendorName);
        const vendorLicenses = licenses.filter(l => l.vendorId === v.vendorId || l.vendor === v.vendorName);
        const totalSpending = vendorLicenses.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
        const upcomingRenewals = vendorLicenses.filter(l => {
          const days = getDaysRemaining(l.expirationDate);
          return days !== null && days >= 0 && days <= 90;
        }).length;

        return {
          ...v,
          softwareCount: vendorSoftware.length,
          licenseCount: vendorLicenses.length,
          totalSpending,
          upcomingRenewals
        };
      });

      if (sortBy) {
        const order = sortOrder === 'desc' ? -1 : 1;
        vendors.sort((a, b) => {
          if (a[sortBy] < b[sortBy]) return -1 * order;
          if (a[sortBy] > b[sortBy]) return 1 * order;
          return 0;
        });
      }

      res.json({ success: true, count: vendors.length, data: vendors });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVendorById(req, res) {
    try {
      const { id } = req.params;
      const vendor = await db.findById('vendors', id, 'vendorId');
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found.' });
      }

      const software = await db.find('software', s => s.vendorId === vendor.vendorId || s.vendor === vendor.vendorName);
      const licenses = await db.find('licenses', l => l.vendorId === vendor.vendorId || l.vendor === vendor.vendorName);
      const totalSpending = licenses.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

      res.json({
        success: true,
        data: {
          ...vendor,
          software,
          licenses,
          softwareCount: software.length,
          licenseCount: licenses.length,
          totalSpending
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createVendor(req, res) {
    try {
      const { vendorName, contactPerson, email, phone, website, address, rating, status } = req.body;

      const vendorId = generateId('VND');
      const newVendor = {
        vendorId,
        vendorName: vendorName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : '',
        website: website ? website.trim() : '',
        address: address ? address.trim() : '',
        rating: Number(rating) || 4.5,
        status: status || 'ACTIVE',
        createdAt: new Date().toISOString()
      };

      await db.insert('vendors', newVendor);

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'VENDOR_ADDED',
        module: 'VENDORS',
        recordId: vendorId,
        description: `Added new vendor "${newVendor.vendorName}" (${vendorId}).`
      });

      res.status(201).json({
        success: true,
        message: 'Vendor created successfully.',
        data: newVendor
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateVendor(req, res) {
    try {
      const { id } = req.params;
      const existing = await db.findById('vendors', id, 'vendorId');
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Vendor not found.' });
      }

      const updates = {
        vendorName: req.body.vendorName?.trim() || existing.vendorName,
        contactPerson: req.body.contactPerson?.trim() || existing.contactPerson,
        email: req.body.email?.trim().toLowerCase() || existing.email,
        phone: req.body.phone !== undefined ? req.body.phone.trim() : existing.phone,
        website: req.body.website !== undefined ? req.body.website.trim() : existing.website,
        address: req.body.address !== undefined ? req.body.address.trim() : existing.address,
        rating: req.body.rating !== undefined ? Number(req.body.rating) : existing.rating,
        status: req.body.status || existing.status
      };

      const updated = await db.update('vendors', id, updates, 'vendorId');

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'VENDOR_UPDATED',
        module: 'VENDORS',
        recordId: id,
        description: `Updated vendor details for "${updated.vendorName}" (${id}).`
      });

      res.json({
        success: true,
        message: 'Vendor updated successfully.',
        data: updated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteVendor(req, res) {
    try {
      const { id } = req.params;
      const vendor = await db.findById('vendors', id, 'vendorId');
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found.' });
      }

      // Check if software or licenses are linked to this vendor
      const linkedSoftware = await db.find('software', s => s.vendorId === id || s.vendor === vendor.vendorName);
      if (linkedSoftware.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete vendor "${vendor.vendorName}". ${linkedSoftware.length} software asset(s) are associated with it.`
        });
      }

      await db.delete('vendors', id, 'vendorId');

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'VENDOR_DELETED',
        module: 'VENDORS',
        recordId: id,
        description: `Deleted vendor "${vendor.vendorName}" (${id}).`
      });

      res.json({
        success: true,
        message: `Vendor "${vendor.vendorName}" deleted successfully.`
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = vendorController;
