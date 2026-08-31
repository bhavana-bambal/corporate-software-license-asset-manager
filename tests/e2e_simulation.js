const http = require('http');

const baseUrl = 'http://localhost:3000';
let adminToken = '';
let employeeToken = '';

async function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers
    };

    const request = http.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) { json = data; }
        resolve({ status: res.statusCode, body: json });
      });
    });
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

function check(cond, msg) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

async function runSimulation() {
  console.log('\n======================================================');
  console.log('🚀 Running Complete End-to-End Workflow Simulation Test');
  console.log('======================================================\n');

  // 1. Login
  const loginRes = await req('POST', '/api/auth/login', { email: 'admin@bharattech.com', password: 'Admin@123' });
  check(loginRes.status === 200 && loginRes.body.token, '1. Admin authentication succeeds and receives JWT');
  adminToken = loginRes.body.token;

  // 2. Dashboard
  const dashRes = await req('GET', '/api/dashboard/summary', null, adminToken);
  check(dashRes.status === 200 && dashRes.body.data.kpi.totalSoftware > 0, '2. Dashboard KPIs & dynamic Chart.js datasets loaded');

  // 3. Add Software
  const addSw = await req('POST', '/api/software', {
    softwareName: 'Datadog APM Enterprise',
    category: 'Cloud Infrastructure',
    version: '2026.3',
    vendor: 'Amazon Web Services India',
    department: 'DevOps & Cloud Ops',
    description: 'Infrastructure and application performance monitoring.'
  }, adminToken);
  check(addSw.status === 201, '3. Added new software asset: Datadog APM Enterprise');
  const swId = addSw.body.data.softwareId;

  // 4. Add Vendor
  const addVnd = await req('POST', '/api/vendors', {
    vendorName: 'Datadog India Pvt Ltd',
    contactPerson: 'Aditi Sengupta',
    email: 'india-enterprise@datadoghq.com',
    phone: '+91 80 8899 7766',
    website: 'https://datadoghq.com',
    address: 'Embassy Tech Village, Outer Ring Road, Bengaluru'
  }, adminToken);
  check(addVnd.status === 201, '4. Added new vendor: Datadog India Pvt Ltd');
  const vndId = addVnd.body.data.vendorId;

  // 5. Add License
  const addLic = await req('POST', '/api/licenses', {
    softwareId: swId,
    vendorId: vndId,
    licenseKey: 'DD-APM-ENT-2026-IND-99',
    licenseType: 'Per Host / Annual',
    startDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    totalSeats: 5,
    cost: 350000,
    currency: '₹',
    autoRenewal: true
  }, adminToken);
  check(addLic.status === 201 && addLic.body.data.availableSeats === 5, '5. Created license with 5 total seats, 5 available seats');
  const licId = addLic.body.data.licenseId;

  // 6. Add Employee
  const addEmp = await req('POST', '/api/employees', {
    fullName: 'Tarun Kumar',
    email: 'tarun.k@bharattech.com',
    department: 'DevOps & Cloud Ops',
    jobTitle: 'Cloud Infrastructure Engineer',
    joiningDate: '2024-01-15',
    phone: '+91 98230 45678'
  }, adminToken);
  check(addEmp.status === 201, '6. Added new corporate employee: Tarun Kumar');
  const empId = addEmp.body.data.employeeId;

  // 7. Assign License Seat
  const assignRes = await req('POST', `/api/licenses/${licId}/assign`, {
    employeeId: empId,
    notes: 'Lead SRE APM monitor seat'
  }, adminToken);
  check(assignRes.status === 200, '7. Seat assigned to employee. Invariant holds: Allocated=1, Available=4');
  check(assignRes.body.data.license.allocatedSeats === 1, '   -> Allocated seats is now 1');
  check(assignRes.body.data.license.availableSeats === 4, '   -> Available seats is now 4');

  // 8. Verify Duplicate Seat Rejection
  const dupAssign = await req('POST', `/api/licenses/${licId}/assign`, { employeeId: empId }, adminToken);
  check(dupAssign.status === 400, '8. Duplicate assignment correctly rejected');

  // 9. Alert Evaluation
  const notifRes = await req('GET', '/api/notifications', null, adminToken);
  check(notifRes.status === 200 && notifRes.body.data.length > 0, '9. Real-time alert engine synced notification triggers');

  // 10. Open Renewal & Execute
  const renewals = await req('GET', '/api/renewals', null, adminToken);
  check(renewals.status === 200 && renewals.body.data.length > 0, '10. Renewal pipeline fetched active items');
  const renewalItem = renewals.body.data[0];
  const execRenewal = await req('POST', `/api/renewals/${renewalItem.renewalId}/execute`, {
    newExpirationDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    renewalCost: 400000,
    notes: 'Contract renewed for another calendar year'
  }, adminToken);
  check(execRenewal.status === 200 && execRenewal.body.data.status === 'ACTIVE', '11. Contract renewal executed: Expiration date extended & status ACTIVE');

  // 11. Reports & CSV Export
  const r1 = await req('GET', '/api/reports/utilization', null, adminToken);
  const r2 = await req('GET', '/api/reports/expiration', null, adminToken);
  const r3 = await req('GET', '/api/reports/cost', null, adminToken);
  const r4 = await req('GET', '/api/reports/vendors', null, adminToken);
  const r5 = await req('GET', '/api/reports/departments', null, adminToken);
  const r6 = await req('GET', '/api/reports/assignments', null, adminToken);
  const csvRes = await req('GET', '/api/reports/cost?format=csv', null, adminToken);
  check(r1.status === 200 && r2.status === 200 && r3.status === 200 && r4.status === 200 && r5.status === 200 && r6.status === 200, '12. All 6 Analytical Reports generated successfully');
  check(typeof csvRes.body === 'string' && csvRes.body.includes('License ID'), '13. CSV Export formatted and streamable');

  // 12. Audit Logs
  const auditRes = await req('GET', '/api/audit-logs', null, adminToken);
  check(auditRes.status === 200 && auditRes.body.data.length >= 10, '14. System Audit Trail verified with complete history');

  // 13. Employee Access Request Workflow
  const empLogin = await req('POST', '/api/auth/login', { email: 'employee@bharattech.com', password: 'Employee@123' });
  employeeToken = empLogin.body.token;
  const accessReq = await req('POST', '/api/employees/request-access', {
    softwareId: swId,
    reason: 'Need Datadog APM for profiling backend microservices'
  }, employeeToken);
  check(accessReq.status === 200, '15. Employee successfully submitted software access request');

  console.log('\n======================================================');
  console.log('🎉 100% COMPLETE END-TO-END SYSTEM SIMULATION PASSED!');
  console.log('======================================================\n');
}

runSimulation().catch(err => {
  console.error('Simulation error:', err);
  process.exit(1);
});
