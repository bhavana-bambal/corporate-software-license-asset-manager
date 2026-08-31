// Analytical Reports & Document Export Module
let currentReportType = 'utilization';
let currentReportData = [];

const reportMeta = {
  utilization: {
    title: 'License Seat Utilization Report',
    subtitle: 'Comprehensive analysis of seat capacities, active allocations, utilization rates, and per-seat costs',
    endpoint: '/api/reports/utilization',
    columns: ['License ID', 'Software Name', 'Vendor', 'Total Seats', 'Allocated', 'Available', 'Utilization %', 'Cost/Seat', 'Total Cost', 'Status']
  },
  expiration: {
    title: 'License Expiration & Renewal Timeline Report',
    subtitle: 'Auditing license start dates, expiration windows, days remaining, and auto-renewal agreements',
    endpoint: '/api/reports/expiration',
    columns: ['License ID', 'Software Name', 'Vendor', 'Start Date', 'Expiration Date', 'Days Left', 'Auto Renewal', 'Annual Cost', 'Status']
  },
  cost: {
    title: 'Corporate Software License Spending Report',
    subtitle: 'Annual expenditure analysis, monthly amortized cost equivalents, and budget share percentages',
    endpoint: '/api/reports/cost',
    columns: ['License ID', 'Software Name', 'Vendor', 'License Type', 'Seats', 'Annual Cost', 'Monthly Equiv', 'Budget Share', 'Status']
  },
  vendors: {
    title: 'Vendor Spending & Engagement Report',
    subtitle: 'Vendor-wise expenditure distribution, active license count, contact details, and provider ratings',
    endpoint: '/api/reports/vendors',
    columns: ['Vendor ID', 'Vendor Name', 'Contact Person', 'Email', 'Software Assets', 'Licenses', 'Total Spend', 'Budget Share', 'Rating']
  },
  departments: {
    title: 'Departmental Software Allocation & Expenditure Report',
    subtitle: 'Cost allocation per corporate department, employee headcounts, and departmental budget shares',
    endpoint: '/api/reports/departments',
    columns: ['Department', 'Software Tools Count', 'Employees in Dept', 'Total Spend (INR)', 'Spending Share %']
  },
  assignments: {
    title: 'Employee Software Assignments Master Audit',
    subtitle: 'Active employee seat allocations, assigned software portfolios, and assignment timestamps',
    endpoint: '/api/reports/assignments',
    columns: ['Assignment ID', 'Employee ID', 'Employee Name', 'Department', 'Software Name', 'License ID', 'Assigned Date', 'Expiration', 'Status']
  }
};

async function loadReports(reportType = 'utilization') {
  if (!authToken) return;
  currentReportType = reportType;

  const meta = reportMeta[reportType];
  document.getElementById('report-display-title').textContent = meta.title;
  document.getElementById('report-display-subtitle').textContent = meta.subtitle;
  document.getElementById('report-timestamp').textContent = 'Generated: ' + new Date().toLocaleTimeString();

  // Highlight active tab
  document.querySelectorAll('#report-tabs button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-report') === reportType);
  });

  try {
    const res = await fetch(meta.endpoint, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      currentReportData = result.data;
      renderReportTable(reportType, currentReportData, meta.columns);
    }
  } catch (err) {
    console.error('Failed to load report:', err);
    showToast('Failed to load analytical report.', 'danger');
  }
}

function switchReportTab(reportType) {
  loadReports(reportType);
}

function renderReportTable(type, data, columns) {
  const thead = document.getElementById('report-table-head');
  const tbody = document.getElementById('report-table-body');
  if (!thead || !tbody) return;

  // Header Row
  thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center text-muted py-4">No report data available.</td></tr>`;
    return;
  }

  // Body Rows mapping based on report type
  tbody.innerHTML = data.map(item => {
    if (type === 'utilization') {
      return `
        <tr>
          <td class="font-monospace small text-primary fw-semibold">${item.licenseId}</td>
          <td class="fw-semibold text-white">${escapeHTML(item.softwareName)}</td>
          <td class="small">${escapeHTML(item.vendor)}</td>
          <td class="text-center">${item.totalSeats}</td>
          <td class="text-center text-warning">${item.allocatedSeats}</td>
          <td class="text-center text-success">${item.availableSeats}</td>
          <td class="fw-bold">${item.utilizationPercentage}</td>
          <td class="small">${item.costPerSeat}</td>
          <td class="small fw-semibold text-white">${item.totalCost}</td>
          <td>${getStatusBadge(item.status)}</td>
        </tr>
      `;
    } else if (type === 'expiration') {
      return `
        <tr>
          <td class="font-monospace small text-primary fw-semibold">${item.licenseId}</td>
          <td class="fw-semibold text-white">${escapeHTML(item.softwareName)}</td>
          <td class="small">${escapeHTML(item.vendor)}</td>
          <td class="small">${item.startDate}</td>
          <td class="small text-white fw-bold">${item.expirationDate}</td>
          <td class="small font-monospace">${item.daysRemaining}</td>
          <td><span class="badge ${item.autoRenewal === 'Yes' ? 'bg-success' : 'bg-secondary'}">${item.autoRenewal}</span></td>
          <td class="small fw-semibold text-white">${item.cost}</td>
          <td>${getStatusBadge(item.status)}</td>
        </tr>
      `;
    } else if (type === 'cost') {
      return `
        <tr>
          <td class="font-monospace small text-primary fw-semibold">${item.licenseId}</td>
          <td class="fw-semibold text-white">${escapeHTML(item.softwareName)}</td>
          <td class="small">${escapeHTML(item.vendor)}</td>
          <td class="small">${escapeHTML(item.licenseType)}</td>
          <td class="text-center">${item.totalSeats}</td>
          <td class="small fw-semibold text-white">${item.annualCost}</td>
          <td class="small text-muted">${item.monthlyEquivalent}</td>
          <td class="small fw-bold text-primary">${item.shareOfTotalBudget}</td>
          <td>${getStatusBadge(item.status)}</td>
        </tr>
      `;
    } else if (type === 'vendors') {
      return `
        <tr>
          <td class="font-monospace small text-primary fw-semibold">${item.vendorId}</td>
          <td class="fw-semibold text-white">${escapeHTML(item.vendorName)}</td>
          <td class="small">${escapeHTML(item.contactPerson)}</td>
          <td class="small text-secondary">${escapeHTML(item.email)}</td>
          <td class="text-center"><span class="badge bg-dark border border-secondary">${item.softwareCount}</span></td>
          <td class="text-center"><span class="badge bg-primary">${item.activeLicensesCount}</span></td>
          <td class="small fw-semibold text-white">${item.totalSpending}</td>
          <td class="small fw-bold text-success">${item.budgetShare}</td>
          <td><span class="badge bg-warning text-dark"><i class="fa-solid fa-star small me-1"></i>${item.rating}</span></td>
        </tr>
      `;
    } else if (type === 'departments') {
      return `
        <tr>
          <td class="fw-semibold text-white">${escapeHTML(item.department)}</td>
          <td class="text-center"><span class="badge bg-dark border border-secondary">${item.softwareCount}</span></td>
          <td class="text-center"><span class="badge bg-primary">${item.employeesInDept}</span></td>
          <td class="small fw-semibold text-white">${item.totalSpending}</td>
          <td class="small fw-bold text-primary">${item.spendShare}</td>
        </tr>
      `;
    } else if (type === 'assignments') {
      return `
        <tr>
          <td class="font-monospace small text-primary fw-semibold">${item.assignmentId}</td>
          <td class="font-monospace small text-muted">${item.employeeId}</td>
          <td class="fw-semibold text-white">${escapeHTML(item.employeeName)}</td>
          <td><span class="badge bg-dark border border-secondary">${escapeHTML(item.department)}</span></td>
          <td class="small text-white">${escapeHTML(item.softwareName)}</td>
          <td class="font-monospace small text-secondary">${item.licenseId}</td>
          <td class="small">${item.assignedDate}</td>
          <td class="small text-white">${item.expirationDate}</td>
          <td><span class="badge-status ${item.status === 'ACTIVE' ? 'badge-active' : 'badge-expired'}">${item.status}</span></td>
        </tr>
      `;
    }
  }).join('');
}

function exportCurrentReportCSV() {
  const meta = reportMeta[currentReportType];
  const url = `${meta.endpoint}?format=csv&token=${authToken}`;
  window.open(url, '_blank');
  showToast('Exporting report as CSV...', 'info');
}

function exportCurrentReportPDF() {
  if (typeof window.jspdf === 'undefined') {
    window.print();
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');
  const meta = reportMeta[currentReportType];

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('BharatTech Solutions Ltd - Corporate IT Asset Management', 14, 15);

  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text(meta.title, 14, 23);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Currency: INR (₹)`, 14, 29);

  // Generate Table in PDF
  doc.autoTable({
    html: '#report-data-table',
    startY: 34,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`${currentReportType}_report_${Date.now()}.pdf`);
  showToast('PDF report downloaded successfully.', 'success');
}
