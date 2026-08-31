const db = require('../config/db');
const { generateId } = require('../utils/helpers');
const { logAudit } = require('../middleware/auditMiddleware');

const softwareController = {
  // Get all software with optional query params (search, category, department, status, sort)
  async getAllSoftware(req, res) {
    try {
      let software = await db.read('software');
      const { search, category, department, status, sortBy, sortOrder } = req.query;

      if (search) {
        const q = search.toLowerCase();
        software = software.filter(s =>
          (s.softwareName && s.softwareName.toLowerCase().includes(q)) ||
          (s.softwareId && s.softwareId.toLowerCase().includes(q)) ||
          (s.vendor && s.vendor.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q))
        );
      }

      if (category && category !== 'ALL') {
        software = software.filter(s => s.category === category);
      }

      if (department && department !== 'ALL') {
        software = software.filter(s => s.department === department || s.department === 'All Departments');
      }

      if (status && status !== 'ALL') {
        software = software.filter(s => s.status === status);
      }

      // Attach license and seat count summary to each software asset
      const licenses = await db.read('licenses');
      software = software.map(s => {
        const relatedLicenses = licenses.filter(l => l.softwareId === s.softwareId);
        const totalSeats = relatedLicenses.reduce((acc, curr) => acc + (Number(curr.totalSeats) || 0), 0);
        const allocatedSeats = relatedLicenses.reduce((acc, curr) => acc + (Number(curr.allocatedSeats) || 0), 0);
        const availableSeats = Math.max(0, totalSeats - allocatedSeats);
        const totalSpend = relatedLicenses.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

        return {
          ...s,
          licensesCount: relatedLicenses.length,
          totalSeats,
          allocatedSeats,
          availableSeats,
          totalSpend
        };
      });

      // Sorting
      if (sortBy) {
        const order = sortOrder === 'desc' ? -1 : 1;
        software.sort((a, b) => {
          if (a[sortBy] < b[sortBy]) return -1 * order;
          if (a[sortBy] > b[sortBy]) return 1 * order;
          return 0;
        });
      }

      res.json({ success: true, count: software.length, data: software });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getSoftwareById(req, res) {
    try {
      const { id } = req.params;
      const software = await db.findById('software', id, 'softwareId');
      if (!software) {
        return res.status(404).json({ success: false, message: 'Software asset not found.' });
      }

      // Attach related licenses and assignments
      const licenses = await db.find('licenses', l => l.softwareId === software.softwareId);
      const assignments = await db.find('assignments', a => a.softwareId === software.softwareId && a.status === 'ACTIVE');

      res.json({
        success: true,
        data: {
          ...software,
          licenses,
          assignments
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createSoftware(req, res) {
    try {
      const { softwareName, category, version, vendor, vendorId, description, licenseType, department, status } = req.body;

      const softwareId = generateId('SW');
      const newSoftware = {
        softwareId,
        softwareName: softwareName.trim(),
        category: category.trim(),
        version: version.trim(),
        vendor: vendor.trim(),
        vendorId: vendorId || null,
        description: description ? description.trim() : '',
        licenseType: licenseType || 'Subscription',
        department: department.trim(),
        status: status || 'ACTIVE',
        createdAt: new Date().toISOString()
      };

      await db.insert('software', newSoftware);

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'SOFTWARE_ADDED',
        module: 'SOFTWARE',
        recordId: softwareId,
        description: `Added new software asset "${newSoftware.softwareName}" (${softwareId}).`
      });

      res.status(201).json({
        success: true,
        message: 'Software asset created successfully.',
        data: newSoftware
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateSoftware(req, res) {
    try {
      const { id } = req.params;
      const existing = await db.findById('software', id, 'softwareId');
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Software asset not found.' });
      }

      const updates = {
        softwareName: req.body.softwareName?.trim() || existing.softwareName,
        category: req.body.category?.trim() || existing.category,
        version: req.body.version?.trim() || existing.version,
        vendor: req.body.vendor?.trim() || existing.vendor,
        vendorId: req.body.vendorId !== undefined ? req.body.vendorId : existing.vendorId,
        description: req.body.description !== undefined ? req.body.description.trim() : existing.description,
        licenseType: req.body.licenseType || existing.licenseType,
        department: req.body.department?.trim() || existing.department,
        status: req.body.status || existing.status
      };

      const updated = await db.update('software', id, updates, 'softwareId');

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'SOFTWARE_UPDATED',
        module: 'SOFTWARE',
        recordId: id,
        description: `Updated software details for "${updated.softwareName}" (${id}).`
      });

      res.json({
        success: true,
        message: 'Software asset updated successfully.',
        data: updated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteSoftware(req, res) {
    try {
      const { id } = req.params;
      const software = await db.findById('software', id, 'softwareId');
      if (!software) {
        return res.status(404).json({ success: false, message: 'Software asset not found.' });
      }

      // Check if active licenses exist
      const activeLicenses = await db.find('licenses', l => l.softwareId === id);
      if (activeLicenses.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete "${software.softwareName}". It has ${activeLicenses.length} associated license(s). Delete or reassign licenses first.`
        });
      }

      await db.delete('software', id, 'softwareId');

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'SOFTWARE_DELETED',
        module: 'SOFTWARE',
        recordId: id,
        description: `Deleted software asset "${software.softwareName}" (${id}).`
      });

      res.json({
        success: true,
        message: `Software "${software.softwareName}" deleted successfully.`
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = softwareController;
