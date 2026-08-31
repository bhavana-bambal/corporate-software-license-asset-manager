const http = require('http');
const app = require('../src/app');
const db = require('../src/config/db');
const { seedDatabase } = require('../src/utils/seedData');
const { calculateLicenseStatus, getDaysRemaining } = require('../src/utils/helpers');

let server;
let baseUrl;
let adminToken = '';
let managerToken = '';
let employeeToken = '';

async function request(method, path, body = null, token = null) {
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

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = data;
        }
        resolve({ status: res.statusCode, body: json, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('🧪 Starting Corporate Software License & Asset Manager Test Suite...\n');

  // 1. Seed fresh DB
  await seedDatabase(true);

  // 2. Start temporary test server
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // TEST 1: Healthcheck
    console.log('\n--- 1. Healthcheck & System Diagnostics ---');
    const health = await request('GET', '/api/health');
    assert(health.status === 200, 'Health endpoint responds with 200 OK');
    assert(health.body.status === 'UP', 'Health status is UP');

    // TEST 2: Authentication & RBAC
    console.log('\n--- 2. Authentication & Role Permissions ---');
    const loginFail = await request('POST', '/api/auth/login', { email: 'admin@bharattech.com', password: 'WrongPassword' });
    assert(loginFail.status === 401, 'Rejects invalid password with 401 Unauthorized');

    const adminLogin = await request('POST', '/api/auth/login', { email: 'admin@bharattech.com', password: 'Admin@123' });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin login succeeds and returns JWT token');
    adminToken = adminLogin.body.token;
    assert(adminLogin.body.user.role === 'ADMIN', 'Admin user profile has role ADMIN');

    const managerLogin = await request('POST', '/api/auth/login', { email: 'manager@bharattech.com', password: 'Manager@123' });
    assert(managerLogin.status === 200 && managerLogin.body.token, 'License Manager login succeeds');
    managerToken = managerLogin.body.token;

    const employeeLogin = await request('POST', '/api/auth/login', { email: 'employee@bharattech.com', password: 'Employee@123' });
    assert(employeeLogin.status === 200 && employeeLogin.body.token, 'Employee login succeeds');
    employeeToken = employeeLogin.body.token;

    // TEST 3: Dashboard Analytics
    console.log('\n--- 3. Dynamic Dashboard Analytics & KPI Engine ---');
    const dashRes = await request('GET', '/api/dashboard/summary', null, adminToken);
    assert(dashRes.status === 200, 'Dashboard summary returns 200 OK');
    const kpi = dashRes.body.data.kpi;
    assert(kpi.totalSoftware >= 10, `Dynamic total software count >= 10 (actual: ${kpi.totalSoftware})`);
    assert(kpi.totalSeats > 0, `Dynamic total seats > 0 (actual: ${kpi.totalSeats})`);
    assert(kpi.allocatedSeats > 0, `Dynamic allocated seats > 0 (actual: ${kpi.allocatedSeats})`);
    assert(kpi.availableSeats === kpi.totalSeats - kpi.allocatedSeats, `Seat invariant holds: Available (${kpi.availableSeats}) = Total (${kpi.totalSeats}) - Allocated (${kpi.allocatedSeats})`);
    assert(kpi.totalSpending > 0, `Dynamic total spend > 0 (actual: ₹ ${kpi.totalSpending.toLocaleString('en-IN')})`);
    assert(dashRes.body.data.charts.utilization.labels.length > 0, 'Utilization chart dataset is populated dynamically');

    // TEST 4: Software CRUD
    console.log('\n--- 4. Software Assets Management (CRUD & Search) ---');
    const newSw = await request('POST', '/api/software', {
      softwareName: 'IntelliTest Pro Suite',
      category: 'Development Tools',
      version: '2026.1',
      vendor: 'Microsoft India Pvt Ltd',
      department: 'Engineering',
      description: 'Automated test harness and API mocking tool'
    }, adminToken);
    assert(newSw.status === 201, 'Admin can create new software asset');
    const swId = newSw.body.data.softwareId;

    const searchSw = await request('GET', `/api/software?search=IntelliTest`, null, adminToken);
    assert(searchSw.body.count >= 1, 'Software search filters correctly');

    // TEST 5: License Management & Invariant Seat Allocation
    console.log('\n--- 5. License Allocation Engine & Seat Invariants ---');
    const newLic = await request('POST', '/api/licenses', {
      softwareId: swId,
      licenseKey: 'ITEST-2026-KEY-999',
      licenseType: 'Subscription',
      startDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], // 30 days
      totalSeats: 2,
      cost: 50000,
      currency: '₹',
      autoRenewal: true
    }, adminToken);
    assert(newLic.status === 201, 'Admin can create license for software');
    const licId = newLic.body.data.licenseId;
    assert(newLic.body.data.availableSeats === 2, 'Available seats initially equals total seats (2)');

    // Assign seat to Employee EMP-101
    const assign1 = await request('POST', `/api/licenses/${licId}/assign`, {
      employeeId: 'EMP-101',
      notes: 'Testing seat allocation'
    }, adminToken);
    assert(assign1.status === 200, 'Seat allocation to EMP-101 succeeds');
    assert(assign1.body.data.license.allocatedSeats === 1, 'Allocated seats incremented to 1');
    assert(assign1.body.data.license.availableSeats === 1, 'Available seats decremented to 1');
    const asn1Id = assign1.body.data.assignment.assignmentId;

    // Duplicate assignment should fail
    const assignDup = await request('POST', `/api/licenses/${licId}/assign`, {
      employeeId: 'EMP-101'
    }, adminToken);
    assert(assignDup.status === 400, 'Rejects duplicate seat allocation to same employee');

    // Assign 2nd seat to EMP-102
    const assign2 = await request('POST', `/api/licenses/${licId}/assign`, {
      employeeId: 'EMP-102'
    }, adminToken);
    assert(assign2.status === 200, 'Seat allocation to EMP-102 succeeds (Capacity now 2/2)');
    assert(assign2.body.data.license.availableSeats === 0, 'Available seats now 0');

    // Assign 3rd seat should fail because capacity is full (2/2)
    const assignFull = await request('POST', `/api/licenses/${licId}/assign`, {
      employeeId: 'EMP-103'
    }, adminToken);
    assert(assignFull.status === 400, 'Rejects allocation when total seats capacity is reached');

    // Revoke 1st seat
    const revokeRes = await request('POST', `/api/licenses/${licId}/revoke`, {
      assignmentId: asn1Id,
      reason: 'Project completed'
    }, adminToken);
    assert(revokeRes.status === 200, 'Seat revocation succeeds');
    assert(revokeRes.body.data.license.allocatedSeats === 1, 'Allocated seats decremented back to 1');
    assert(revokeRes.body.data.license.availableSeats === 1, 'Available seats incremented back to 1');

    // TEST 6: Renewal Management Workflow
    console.log('\n--- 6. Renewal Pipeline & Execution ---');
    const renewals = await request('GET', '/api/renewals', null, adminToken);
    assert(renewals.status === 200 && renewals.body.data.length > 0, 'Renewals pipeline retrieves items');

    const renewExec = await request('POST', `/api/renewals/RNW-001/execute`, {
      newExpirationDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      renewalCost: 410000,
      notes: 'Executed automated annual contract renewal'
    }, adminToken);
    assert(renewExec.status === 200, 'Renewal execution successfully extended license expiration date');
    assert(renewExec.body.data.status === 'ACTIVE', 'License status updated to ACTIVE after renewal');

    // TEST 7: Notifications Engine
    console.log('\n--- 7. Dynamic Alert & Notification Engine ---');
    const notifs = await request('GET', '/api/notifications', null, adminToken);
    assert(notifs.status === 200, 'Notifications endpoint responds with 200 OK');
    assert(notifs.body.count > 0, `Alerts dynamically evaluated (count: ${notifs.body.count})`);

    // TEST 8: Reporting & CSV Exports
    console.log('\n--- 8. Analytical Reports & CSV Export Engine ---');
    const utilRep = await request('GET', '/api/reports/utilization', null, adminToken);
    assert(utilRep.status === 200 && utilRep.body.data.length > 0, 'Utilization report generated');

    const csvRep = await request('GET', '/api/reports/utilization?format=csv', null, adminToken);
    assert(csvRep.status === 200, 'CSV export returns 200 OK');
    assert(typeof csvRep.body === 'string' && csvRep.body.includes('License ID'), 'CSV headers formatted properly');

    const costRep = await request('GET', '/api/reports/cost', null, adminToken);
    assert(costRep.status === 200 && costRep.body.summary, 'Cost & spending report generated with summary');

    // TEST 9: Audit Trail
    console.log('\n--- 9. Audit Logging System ---');
    const audits = await request('GET', '/api/audit-logs', null, adminToken);
    assert(audits.status === 200 && audits.body.count > 0, `Audit logs captured all operations (count: ${audits.body.count})`);
    assert(audits.body.data.some(a => a.action === 'LICENSE_ASSIGNED'), 'Audit log contains LICENSE_ASSIGNED action');
    assert(audits.body.data.some(a => a.action === 'LICENSE_REVOKED'), 'Audit log contains LICENSE_REVOKED action');

    // Clean up test software & license
    await request('POST', `/api/licenses/${licId}/revoke`, { assignmentId: assign2.body.data.assignment.assignmentId }, adminToken);
    await request('DELETE', `/api/licenses/${licId}`, null, adminToken);
    await request('DELETE', `/api/software/${swId}`, null, adminToken);

    console.log('\n====================================================');
    console.log('🎉 ALL BACKEND UNIT & INTEGRATION TESTS PASSED (100%)');
    console.log('====================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('Test suite failure:', err);
  if (server) server.close();
  process.exit(1);
});
