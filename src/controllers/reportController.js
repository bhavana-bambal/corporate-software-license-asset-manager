const db = require('../config/db');
const { getDaysRemaining, convertToCSV } = require('../utils/helpers');
const licenseEngine = require('../services/licenseEngine');

const reportController = {
  // 1. License Utilization Report
  async getUtilizationReport(req, res) {
    try {
      const rawLicenses = await db.read('licenses');
      const licenses = rawLicenses.map(l => licenseEngine.recomputeStatus(l));

      const reportData = licenses.map(l => {
        const total = Number(l.totalSeats) || 0;
        const allocated = Number(l.allocatedSeats) || 0;
        const available = Math.max(0, total - allocated);
        const rate = total > 0 ? Math.round((allocated / total) * 100) : 0;
        return {
          licenseId: l.licenseId,
          softwareName: l.softwareName,
          vendor: l.vendor,
          totalSeats: total,
          allocatedSeats: allocated,
          availableSeats: available,
          utilizationPercentage: `${rate}%`,
          costPerSeat: total > 0 ? `₹ ${Math.round((Number(l.cost) || 0) / total).toLocaleString('en-IN')}` : '₹ 0',
          totalCost: `₹ ${(Number(l.cost) || 0).toLocaleString('en-IN')}`,
          status: l.status
        };
      });

      if (req.query.format === 'csv') {
        const csv = convertToCSV(reportData, [
          { key: 'licenseId', label: 'License ID' },
          { key: 'softwareName', label: 'Software Name' },
          { key: 'vendor', label: 'Vendor' },
          { key: 'totalSeats', label: 'Total Seats' },
          { key: 'allocatedSeats', label: 'Allocated Seats' },
          { key: 'availableSeats', label: 'Available Seats' },
          { key: 'utilizationPercentage', label: 'Utilization %' },
          { key: 'costPerSeat', label: 'Cost Per Seat' },
          { key: 'totalCost', label: 'Total Cost (INR)' },
          { key: 'status', label: 'Status' }
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="license_utilization_report.csv"');
        return res.send(csv);
      }

      res.json({ success: true, count: reportData.length, data: reportData });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 2. License Expiration Report
  async getExpirationReport(req, res) {
    try {
      const rawLicenses = await db.read('licenses');
      const licenses = rawLicenses.map(l => licenseEngine.recomputeStatus(l));

      const reportData = licenses.map(l => {
        const days = getDaysRemaining(l.expirationDate);
        return {
          licenseId: l.licenseId,
          softwareName: l.softwareName,
          vendor: l.vendor,
          startDate: l.startDate,
          expirationDate: l.expirationDate,
          daysRemaining: days !== null ? days : 'N/A',
          autoRenewal: l.autoRenewal ? 'Yes' : 'No',
          cost: `₹ ${(Number(l.cost) || 0).toLocaleString('en-IN')}`,
          status: l.status
        };
      });

      if (req.query.format === 'csv') {
        const csv = convertToCSV(reportData, [
          { key: 'licenseId', label: 'License ID' },
          { key: 'softwareName', label: 'Software Name' },
          { key: 'vendor', label: 'Vendor' },
          { key: 'startDate', label: 'Start Date' },
          { key: 'expirationDate', label: 'Expiration Date' },
          { key: 'daysRemaining', label: 'Days Remaining' },
          { key: 'autoRenewal', label: 'Auto Renewal' },
          { key: 'cost', label: 'Annual Cost (INR)' },
          { key: 'status', label: 'Expiration Status' }
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="license_expiration_report.csv"');
        return res.send(csv);
      }

      res.json({ success: true, count: reportData.length, data: reportData });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 3. License Spending / Financial Report
  async getCostReport(req, res) {
    try {
      const licenses = await db.read('licenses');
      const totalBudget = licenses.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);

      const reportData = licenses.map(l => {
        const cost = Number(l.cost) || 0;
        const share = totalBudget > 0 ? ((cost / totalBudget) * 100).toFixed(1) : 0;
        return {
          licenseId: l.licenseId,
          softwareName: l.softwareName,
          vendor: l.vendor,
          licenseType: l.licenseType,
          totalSeats: l.totalSeats,
          annualCost: `₹ ${cost.toLocaleString('en-IN')}`,
          monthlyEquivalent: `₹ ${Math.round(cost / 12).toLocaleString('en-IN')}`,
          shareOfTotalBudget: `${share}%`,
          status: l.status
        };
      });

      if (req.query.format === 'csv') {
        const csv = convertToCSV(reportData, [
          { key: 'licenseId', label: 'License ID' },
          { key: 'softwareName', label: 'Software Name' },
          { key: 'vendor', label: 'Vendor' },
          { key: 'licenseType', label: 'License Type' },
          { key: 'totalSeats', label: 'Seats' },
          { key: 'annualCost', label: 'Annual Cost (INR)' },
          { key: 'monthlyEquivalent', label: 'Monthly Equivalent (INR)' },
          { key: 'shareOfTotalBudget', label: 'Share of Total Budget' },
          { key: 'status', label: 'Status' }
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="license_spending_report.csv"');
        return res.send(csv);
      }

      res.json({
        success: true,
        summary: {
          totalAnnualBudget: `₹ ${totalBudget.toLocaleString('en-IN')}`,
          monthlyAverage: `₹ ${Math.round(totalBudget / 12).toLocaleString('en-IN')}`
        },
        count: reportData.length,
        data: reportData
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 4. Vendor Spending Report
  async getVendorSpendingReport(req, res) {
    try {
      const vendors = await db.read('vendors');
      const software = await db.read('software');
      const licenses = await db.read('licenses');

      const totalCorporateSpend = licenses.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);

      const reportData = vendors.map(v => {
        const vLicenses = licenses.filter(l => l.vendorId === v.vendorId || l.vendor === v.vendorName);
        const vSoftware = software.filter(s => s.vendorId === v.vendorId || s.vendor === v.vendorName);
        const spend = vLicenses.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
        const share = totalCorporateSpend > 0 ? ((spend / totalCorporateSpend) * 100).toFixed(1) : 0;

        return {
          vendorId: v.vendorId,
          vendorName: v.vendorName,
          contactPerson: v.contactPerson,
          email: v.email,
          softwareCount: vSoftware.length,
          activeLicensesCount: vLicenses.length,
          totalSpending: `₹ ${spend.toLocaleString('en-IN')}`,
          budgetShare: `${share}%`,
          rating: v.rating || 4.5
        };
      }).sort((a, b) => parseFloat(b.budgetShare) - parseFloat(a.budgetShare));

      if (req.query.format === 'csv') {
        const csv = convertToCSV(reportData, [
          { key: 'vendorId', label: 'Vendor ID' },
          { key: 'vendorName', label: 'Vendor Name' },
          { key: 'contactPerson', label: 'Contact Person' },
          { key: 'email', label: 'Email' },
          { key: 'softwareCount', label: 'Software Assets' },
          { key: 'activeLicensesCount', label: 'Active Licenses' },
          { key: 'totalSpending', label: 'Total Spending (INR)' },
          { key: 'budgetShare', label: 'Budget Share %' },
          { key: 'rating', label: 'Rating' }
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="vendor_spending_report.csv"');
        return res.send(csv);
      }

      res.json({ success: true, count: reportData.length, data: reportData });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 5. Department Spending Report
  async getDepartmentSpendingReport(req, res) {
    try {
      const software = await db.read('software');
      const licenses = await db.read('licenses');
      const employees = await db.read('employees');

      const deptMap = {};
      software.forEach(s => {
        const dept = s.department || 'General';
        if (!deptMap[dept]) {
          deptMap[dept] = {
            department: dept,
            softwareList: [],
            totalSpend: 0,
            employeeCount: 0
          };
        }
        deptMap[dept].softwareList.push(s.softwareName);

        const swLicenses = licenses.filter(l => l.softwareId === s.softwareId);
        const spend = swLicenses.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
        deptMap[dept].totalSpend += spend;
      });

      // Employee counts per department
      employees.forEach(e => {
        const dept = e.department || 'General';
        if (deptMap[dept]) {
          deptMap[dept].employeeCount += 1;
        }
      });

      const totalSpendAll = Object.values(deptMap).reduce((sum, d) => sum + d.totalSpend, 0);

      const reportData = Object.values(deptMap).map(d => ({
        department: d.department,
        softwareCount: d.softwareList.length,
        employeesInDept: d.employeeCount,
        totalSpending: `₹ ${d.totalSpend.toLocaleString('en-IN')}`,
        spendShare: totalSpendAll > 0 ? `${((d.totalSpend / totalSpendAll) * 100).toFixed(1)}%` : '0%'
      })).sort((a, b) => parseFloat(b.spendShare) - parseFloat(a.spendShare));

      if (req.query.format === 'csv') {
        const csv = convertToCSV(reportData, [
          { key: 'department', label: 'Department' },
          { key: 'softwareCount', label: 'Software Assets Count' },
          { key: 'employeesInDept', label: 'Employees Count' },
          { key: 'totalSpending', label: 'Total Spending (INR)' },
          { key: 'spendShare', label: 'Spending Share %' }
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="department_spending_report.csv"');
        return res.send(csv);
      }

      res.json({ success: true, count: reportData.length, data: reportData });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 6. Employee Assignments Report
  async getEmployeeAssignmentsReport(req, res) {
    try {
      const assignments = await db.read('assignments');
      const employees = await db.read('employees');

      const reportData = assignments.map(a => {
        const emp = employees.find(e => e.employeeId === a.employeeId);
        return {
          assignmentId: a.assignmentId,
          employeeId: a.employeeId,
          employeeName: a.employeeName,
          email: a.employeeEmail || emp?.email || 'N/A',
          department: a.department || emp?.department || 'N/A',
          softwareName: a.softwareName,
          licenseId: a.licenseId,
          assignedDate: a.assignedDate,
          expirationDate: a.expirationDate || 'N/A',
          assignedBy: a.assignedBy,
          status: a.status
        };
      });

      if (req.query.format === 'csv') {
        const csv = convertToCSV(reportData, [
          { key: 'assignmentId', label: 'Assignment ID' },
          { key: 'employeeId', label: 'Employee ID' },
          { key: 'employeeName', label: 'Employee Name' },
          { key: 'email', label: 'Email' },
          { key: 'department', label: 'Department' },
          { key: 'softwareName', label: 'Software' },
          { key: 'licenseId', label: 'License ID' },
          { key: 'assignedDate', label: 'Assigned Date' },
          { key: 'expirationDate', label: 'Expiration Date' },
          { key: 'assignedBy', label: 'Assigned By' },
          { key: 'status', label: 'Assignment Status' }
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="employee_assignments_report.csv"');
        return res.send(csv);
      }

      res.json({ success: true, count: reportData.length, data: reportData });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = reportController;
