const db = require('../config/db');
const { generateId, getDaysRemaining, calculateLicenseStatus } = require('../utils/helpers');

const licenseEngine = {
  /**
   * Recompute dynamic status for all licenses or a specific license
   */
  recomputeStatus(license) {
    const status = calculateLicenseStatus(license);
    const available = Math.max(0, (license.totalSeats || 0) - (license.allocatedSeats || 0));
    return {
      ...license,
      status,
      availableSeats: available,
      daysRemaining: getDaysRemaining(license.expirationDate)
    };
  },

  /**
   * Get all licenses with refreshed dynamic statuses and days remaining
   */
  async getAllLicenses() {
    const licenses = await db.read('licenses');
    const updated = licenses.map(lic => this.recomputeStatus(lic));
    return updated;
  },

  /**
   * Assign a license seat to an employee
   */
  async assignSeat({ licenseId, employeeId, assignedBy = 'System Admin', notes = '' }) {
    // 1. Fetch license and employee
    const license = await db.findById('licenses', licenseId, 'licenseId');
    if (!license) {
      throw new Error(`License with ID "${licenseId}" not found.`);
    }

    const employee = await db.findById('employees', employeeId, 'employeeId');
    if (!employee) {
      throw new Error(`Employee with ID "${employeeId}" not found.`);
    }

    // 2. Check seat availability
    const allocated = Number(license.allocatedSeats) || 0;
    const total = Number(license.totalSeats) || 0;
    if (allocated >= total) {
      throw new Error(`Cannot assign seat. License "${license.softwareName}" is at maximum capacity (${allocated}/${total} seats).`);
    }

    // 3. Check if employee already has active assignment for this specific license
    const existing = await db.findOne('assignments', a =>
      a.licenseId === licenseId && a.employeeId === employeeId && a.status === 'ACTIVE'
    );
    if (existing) {
      throw new Error(`Employee ${employee.fullName} already has an active seat assigned for this license.`);
    }

    // 4. Create assignment record
    const assignmentId = generateId('ASN');
    const newAssignment = {
      assignmentId,
      employeeId: employee.employeeId,
      employeeName: employee.fullName,
      employeeEmail: employee.email,
      department: employee.department,
      softwareId: license.softwareId,
      softwareName: license.softwareName,
      licenseId: license.licenseId,
      licenseKey: license.licenseKey,
      assignedDate: new Date().toISOString().split('T')[0],
      expirationDate: license.expirationDate,
      assignedBy,
      status: 'ACTIVE',
      notes: notes || 'Assigned via Corporate Asset Manager'
    };

    await db.insert('assignments', newAssignment);

    // 5. Update license seat counts
    const newAllocated = allocated + 1;
    const newAvailable = Math.max(0, total - newAllocated);

    const updatedLicense = await db.update('licenses', licenseId, {
      allocatedSeats: newAllocated,
      availableSeats: newAvailable
    }, 'licenseId');

    // 6. Create Audit Log
    const auditId = generateId('AUD');
    await db.insert('auditLogs', {
      logId: auditId,
      timestamp: new Date().toISOString(),
      user: assignedBy,
      role: 'ADMIN_OR_MANAGER',
      action: 'LICENSE_ASSIGNED',
      module: 'SEAT_ALLOCATION',
      recordId: assignmentId,
      description: `Assigned 1 seat of "${license.softwareName}" (${license.licenseId}) to ${employee.fullName} (${employee.employeeId}).`
    });

    return {
      assignment: newAssignment,
      license: this.recomputeStatus(updatedLicense)
    };
  },

  /**
   * Revoke a license seat assignment
   */
  async revokeSeat({ assignmentId, revokedBy = 'System Admin', reason = '' }) {
    // 1. Fetch assignment
    const assignment = await db.findById('assignments', assignmentId, 'assignmentId');
    if (!assignment) {
      throw new Error(`Assignment with ID "${assignmentId}" not found.`);
    }

    if (assignment.status === 'REVOKED') {
      throw new Error(`Assignment is already revoked.`);
    }

    // 2. Fetch license
    const license = await db.findById('licenses', assignment.licenseId, 'licenseId');
    
    // 3. Mark assignment as revoked
    const updatedAssignment = await db.update('assignments', assignmentId, {
      status: 'REVOKED',
      revokedDate: new Date().toISOString().split('T')[0],
      revokedBy,
      revocationReason: reason || 'Seat revoked by administrator'
    }, 'assignmentId');

    // 4. Update license counts if license exists
    let updatedLicense = null;
    if (license) {
      const currentAllocated = Number(license.allocatedSeats) || 0;
      const newAllocated = Math.max(0, currentAllocated - 1);
      const total = Number(license.totalSeats) || 0;
      const newAvailable = Math.max(0, total - newAllocated);

      updatedLicense = await db.update('licenses', license.licenseId, {
        allocatedSeats: newAllocated,
        availableSeats: newAvailable
      }, 'licenseId');
    }

    // 5. Create Audit Log
    const auditId = generateId('AUD');
    await db.insert('auditLogs', {
      logId: auditId,
      timestamp: new Date().toISOString(),
      user: revokedBy,
      role: 'ADMIN_OR_MANAGER',
      action: 'LICENSE_REVOKED',
      module: 'SEAT_ALLOCATION',
      recordId: assignmentId,
      description: `Revoked seat of "${assignment.softwareName}" from ${assignment.employeeName} (${assignment.employeeId}). Reason: ${reason || 'Normal reclamation'}.`
    });

    return {
      assignment: updatedAssignment,
      license: updatedLicense ? this.recomputeStatus(updatedLicense) : null
    };
  },

  /**
   * Execute license renewal
   */
  async processRenewal({ renewalId, licenseId, newExpirationDate, renewalCost, updatedBy = 'System Admin', notes = '' }) {
    const license = await db.findById('licenses', licenseId, 'licenseId');
    if (!license) {
      throw new Error(`License with ID "${licenseId}" not found.`);
    }

    // Update license dates and cost
    const updatedLicense = await db.update('licenses', licenseId, {
      expirationDate: newExpirationDate,
      startDate: new Date().toISOString().split('T')[0],
      cost: renewalCost !== undefined ? Number(renewalCost) : license.cost,
      status: 'ACTIVE',
      notes: notes ? `${license.notes || ''} | Renewed: ${notes}` : license.notes
    }, 'licenseId');

    // Update renewal record if exists
    if (renewalId) {
      await db.update('renewals', renewalId, {
        status: 'Renewed',
        renewalDate: newExpirationDate,
        notes: notes || 'License renewed successfully',
        renewedAt: new Date().toISOString(),
        renewedBy: updatedBy
      }, 'renewalId');
    }

    // Update associated active assignments expiration date
    const assignments = await db.read('assignments');
    for (const a of assignments) {
      if (a.licenseId === licenseId && a.status === 'ACTIVE') {
        await db.update('assignments', a.assignmentId, {
          expirationDate: newExpirationDate
        }, 'assignmentId');
      }
    }

    // Create Audit Log
    const auditId = generateId('AUD');
    await db.insert('auditLogs', {
      logId: auditId,
      timestamp: new Date().toISOString(),
      user: updatedBy,
      role: 'ADMIN_OR_MANAGER',
      action: 'LICENSE_RENEWED',
      module: 'RENEWALS',
      recordId: licenseId,
      description: `Renewed license "${license.softwareName}" (${license.licenseId}) until ${newExpirationDate}. Cost: ₹ ${renewalCost || license.cost}.`
    });

    return this.recomputeStatus(updatedLicense);
  }
};

module.exports = licenseEngine;
