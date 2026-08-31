const db = require('../config/db');
const { generateId } = require('../utils/helpers');
const { logAudit } = require('../middleware/auditMiddleware');

const employeeController = {
  async getAllEmployees(req, res) {
    try {
      let employees = await db.read('employees');
      const assignments = await db.read('assignments');
      const { search, department, status, sortBy, sortOrder } = req.query;

      if (search) {
        const q = search.toLowerCase();
        employees = employees.filter(e =>
          (e.fullName && e.fullName.toLowerCase().includes(q)) ||
          (e.employeeId && e.employeeId.toLowerCase().includes(q)) ||
          (e.email && e.email.toLowerCase().includes(q)) ||
          (e.jobTitle && e.jobTitle.toLowerCase().includes(q))
        );
      }

      if (department && department !== 'ALL') {
        employees = employees.filter(e => e.department === department);
      }

      if (status && status !== 'ALL') {
        employees = employees.filter(e => e.status === status);
      }

      // Attach active assignments count and list
      employees = employees.map(emp => {
        const empAssignments = assignments.filter(a => a.employeeId === emp.employeeId && a.status === 'ACTIVE');
        return {
          ...emp,
          activeAssignmentsCount: empAssignments.length,
          activeLicenses: empAssignments.map(a => a.softwareName)
        };
      });

      if (sortBy) {
        const order = sortOrder === 'desc' ? -1 : 1;
        employees.sort((a, b) => {
          if (a[sortBy] < b[sortBy]) return -1 * order;
          if (a[sortBy] > b[sortBy]) return 1 * order;
          return 0;
        });
      }

      res.json({ success: true, count: employees.length, data: employees });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEmployeeById(req, res) {
    try {
      const { id } = req.params;
      const employee = await db.findById('employees', id, 'employeeId');
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }

      // Get all assignments (active and revoked history)
      const allAssignments = await db.find('assignments', a => a.employeeId === employee.employeeId);
      const activeAssignments = allAssignments.filter(a => a.status === 'ACTIVE');
      const assignmentHistory = allAssignments.filter(a => a.status !== 'ACTIVE');

      res.json({
        success: true,
        data: {
          ...employee,
          activeAssignments,
          assignmentHistory,
          totalAssigned: activeAssignments.length
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createEmployee(req, res) {
    try {
      const { fullName, email, department, jobTitle, joiningDate, phone, status } = req.body;

      // Check unique email
      const existing = await db.findOne('employees', e => e.email.toLowerCase() === email.trim().toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'An employee with this email already exists.' });
      }

      const employeeId = generateId('EMP');
      const newEmployee = {
        employeeId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        department: department.trim(),
        jobTitle: jobTitle.trim(),
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        phone: phone ? phone.trim() : '',
        status: status || 'ACTIVE',
        createdAt: new Date().toISOString()
      };

      await db.insert('employees', newEmployee);

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'EMPLOYEE_ADDED',
        module: 'EMPLOYEES',
        recordId: employeeId,
        description: `Added employee ${newEmployee.fullName} (${employeeId}) to ${newEmployee.department}.`
      });

      res.status(201).json({
        success: true,
        message: 'Employee registered successfully.',
        data: newEmployee
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const existing = await db.findById('employees', id, 'employeeId');
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }

      const updates = {
        fullName: req.body.fullName?.trim() || existing.fullName,
        email: req.body.email?.trim().toLowerCase() || existing.email,
        department: req.body.department?.trim() || existing.department,
        jobTitle: req.body.jobTitle?.trim() || existing.jobTitle,
        joiningDate: req.body.joiningDate || existing.joiningDate,
        phone: req.body.phone !== undefined ? req.body.phone.trim() : existing.phone,
        status: req.body.status || existing.status
      };

      const updated = await db.update('employees', id, updates, 'employeeId');

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'EMPLOYEE_UPDATED',
        module: 'EMPLOYEES',
        recordId: id,
        description: `Updated employee profile for ${updated.fullName} (${id}).`
      });

      res.json({
        success: true,
        message: 'Employee details updated successfully.',
        data: updated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteEmployee(req, res) {
    try {
      const { id } = req.params;
      const employee = await db.findById('employees', id, 'employeeId');
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }

      // Check if employee has active assignments
      const activeAssignments = await db.find('assignments', a => a.employeeId === id && a.status === 'ACTIVE');
      if (activeAssignments.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete employee ${employee.fullName}. They have ${activeAssignments.length} active software license(s) allocated. Revoke seats before deleting.`
        });
      }

      await db.delete('employees', id, 'employeeId');

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'EMPLOYEE_DELETED',
        module: 'EMPLOYEES',
        recordId: id,
        description: `Deleted employee record for ${employee.fullName} (${id}).`
      });

      res.json({
        success: true,
        message: `Employee ${employee.fullName} deleted successfully.`
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Endpoint for employees to submit software access requests
  async requestSoftwareAccess(req, res) {
    try {
      const { softwareId, reason } = req.body;
      const employeeEmail = req.user.email;
      const employee = await db.findOne('employees', e => e.email.toLowerCase() === employeeEmail.toLowerCase());
      const software = await db.findById('software', softwareId, 'softwareId');

      if (!software) {
        return res.status(400).json({ success: false, message: 'Software asset not found.' });
      }

      const notifId = generateId('NOTIF');
      const notification = {
        notificationId: notifId,
        type: 'SOFTWARE_ACCESS_REQUEST',
        severity: 'INFO',
        title: `Software Access Request: ${software.softwareName}`,
        message: `${employee ? employee.fullName : req.user.name} (${req.user.department || 'Engineering'}) requested access to ${software.softwareName}. Reason: ${reason || 'Work requirement'}.`,
        relatedId: software.softwareId,
        module: 'SEAT_ALLOCATION',
        isRead: false,
        isDismissed: false,
        createdAt: new Date().toISOString()
      };

      await db.insert('notifications', notification);

      await logAudit({
        user: req.user,
        role: req.user?.role,
        action: 'ACCESS_REQUESTED',
        module: 'EMPLOYEES',
        recordId: software.softwareId,
        description: `${req.user.name} submitted an access request for ${software.softwareName}.`
      });

      res.json({
        success: true,
        message: 'Software access request submitted to License Manager.'
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = employeeController;
