const db = require('../config/db');
const { getDaysRemaining } = require('../utils/helpers');
const licenseEngine = require('../services/licenseEngine');

const dashboardController = {
  async getDashboardSummary(req, res) {
    try {
      const software = await db.read('software');
      const rawLicenses = await db.read('licenses');
      const employees = await db.read('employees');
      const vendors = await db.read('vendors');
      const assignments = await db.read('assignments');
      const renewals = await db.read('renewals');

      // Recompute dynamic status for each license
      const licenses = rawLicenses.map(l => licenseEngine.recomputeStatus(l));

      // 1. KPI Calculations
      const totalSoftware = software.length;
      const activeLicenses = licenses.filter(l => l.status === 'ACTIVE' || l.status === 'EXPIRING SOON' || l.status === 'URGENT' || l.status === 'CRITICAL').length;
      const totalSeats = licenses.reduce((sum, l) => sum + (Number(l.totalSeats) || 0), 0);
      const allocatedSeats = licenses.reduce((sum, l) => sum + (Number(l.allocatedSeats) || 0), 0);
      const availableSeats = Math.max(0, totalSeats - allocatedSeats);

      const expiringSoon = licenses.filter(l => {
        const d = getDaysRemaining(l.expirationDate);
        return d !== null && d >= 0 && d <= 90;
      }).length;

      const expiredLicenses = licenses.filter(l => {
        const d = getDaysRemaining(l.expirationDate);
        return d !== null && d < 0;
      }).length;

      const totalSpending = licenses.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);

      const seatUtilizationRate = totalSeats > 0 ? Math.round((allocatedSeats / totalSeats) * 100) : 0;

      // 2. Chart 1: License Utilization (Software vs Allocated & Available Seats)
      const utilizationChart = {
        labels: licenses.slice(0, 8).map(l => l.softwareName.length > 20 ? l.softwareName.substring(0, 18) + '...' : l.softwareName),
        datasets: [
          {
            label: 'Allocated Seats',
            data: licenses.slice(0, 8).map(l => Number(l.allocatedSeats) || 0),
            backgroundColor: '#4f46e5'
          },
          {
            label: 'Available Seats',
            data: licenses.slice(0, 8).map(l => Math.max(0, (Number(l.totalSeats) || 0) - (Number(l.allocatedSeats) || 0))),
            backgroundColor: '#10b981'
          }
        ]
      };

      // 3. Chart 2: Expiration Timeline Breakdown
      const expirationBuckets = {
        'Critical (<= 7 Days)': licenses.filter(l => { const d = getDaysRemaining(l.expirationDate); return d !== null && d >= 0 && d <= 7; }).length,
        'Urgent (8-30 Days)': licenses.filter(l => { const d = getDaysRemaining(l.expirationDate); return d !== null && d > 7 && d <= 30; }).length,
        'Upcoming (31-90 Days)': licenses.filter(l => { const d = getDaysRemaining(l.expirationDate); return d !== null && d > 30 && d <= 90; }).length,
        'Safe (> 90 Days)': licenses.filter(l => { const d = getDaysRemaining(l.expirationDate); return d !== null && d > 90; }).length,
        'Expired': expiredLicenses
      };

      const expirationChart = {
        labels: Object.keys(expirationBuckets),
        data: Object.values(expirationBuckets),
        backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#64748b']
      };

      // 4. Chart 3: Software Assets by Category
      const categoryMap = {};
      software.forEach(s => {
        const cat = s.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });

      const categoryChart = {
        labels: Object.keys(categoryMap),
        data: Object.values(categoryMap),
        backgroundColor: ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#06b6d4', '#f97316', '#84cc16']
      };

      // 5. Chart 4: Spending by Vendor (INR ₹)
      const vendorSpendMap = {};
      licenses.forEach(l => {
        const v = l.vendor || 'Unknown Vendor';
        vendorSpendMap[v] = (vendorSpendMap[v] || 0) + (Number(l.cost) || 0);
      });

      const topVendors = Object.entries(vendorSpendMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      const vendorSpendChart = {
        labels: topVendors.map(v => v[0].length > 18 ? v[0].substring(0, 16) + '...' : v[0]),
        data: topVendors.map(v => v[1]),
        backgroundColor: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
      };

      // 6. Chart 5: Department Spending Breakdown
      const deptMap = {};
      software.forEach(s => {
        const dept = s.department || 'General';
        const swLicenses = licenses.filter(l => l.softwareId === s.softwareId);
        const spend = swLicenses.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
        deptMap[dept] = (deptMap[dept] || 0) + spend;
      });

      const departmentSpendChart = {
        labels: Object.keys(deptMap),
        data: Object.values(deptMap),
        backgroundColor: ['#3b82f6', '#10b981', '#f43f5e', '#a855f7', '#eab308', '#06b6d4']
      };

      // 7. Chart 6: Active vs Expired Status Pie
      const statusMap = {
        'Active': licenses.filter(l => l.status === 'ACTIVE').length,
        'Expiring Soon': licenses.filter(l => l.status === 'EXPIRING SOON').length,
        'Urgent / Critical': licenses.filter(l => l.status === 'URGENT' || l.status === 'CRITICAL').length,
        'Expired': expiredLicenses,
        'Renewal Pending': licenses.filter(l => l.status === 'RENEWAL PENDING').length
      };

      const statusChart = {
        labels: Object.keys(statusMap),
        data: Object.values(statusMap),
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#64748b', '#8b5cf6']
      };

      // 8. Recent Activities / Audits
      const recentAudits = (await db.read('auditLogs')).slice(0, 6);

      // 9. Urgent Action Items
      const urgentActions = licenses
        .filter(l => l.status === 'CRITICAL' || l.status === 'URGENT' || l.status === 'EXPIRED')
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          kpi: {
            totalSoftware,
            activeLicenses,
            totalSeats,
            allocatedSeats,
            availableSeats,
            expiringSoon,
            expiredLicenses,
            totalSpending,
            seatUtilizationRate,
            totalEmployees: employees.length,
            totalVendors: vendors.length,
            activeAssignments: assignments.filter(a => a.status === 'ACTIVE').length,
            pendingRenewals: renewals.filter(r => r.status !== 'Renewed' && r.status !== 'Cancelled').length
          },
          charts: {
            utilization: utilizationChart,
            expiration: expirationChart,
            category: categoryChart,
            vendorSpend: vendorSpendChart,
            departmentSpend: departmentSpendChart,
            statusDistribution: statusChart
          },
          recentAudits,
          urgentActions
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = dashboardController;
