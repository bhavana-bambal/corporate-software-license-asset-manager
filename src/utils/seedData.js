const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Helper to get future or past date string YYYY-MM-DD
function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function seedDatabase(force = false) {
  const users = await db.read('users');
  if (users && users.length > 0 && !force) {
    return false; // Database already seeded
  }

  console.log('🌱 Seeding JSON Database with Indian Corporate Dataset...');

  // 1. Users
  const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordHashManager = await bcrypt.hash('Manager@123', 10);
  const passwordHashEmployee = await bcrypt.hash('Employee@123', 10);

  const seedUsers = [
    {
      id: 'USR-001',
      name: 'Aarav Sharma',
      email: 'admin@bharattech.com',
      password: passwordHashAdmin,
      role: 'ADMIN',
      department: 'Information Technology',
      designation: 'VP of IT Infrastructure',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      createdAt: '2025-01-10T09:00:00.000Z'
    },
    {
      id: 'USR-002',
      name: 'Priya Sundaram',
      email: 'manager@bharattech.com',
      password: passwordHashManager,
      role: 'LICENSE_MANAGER',
      department: 'IT Procurement & Assets',
      designation: 'Senior Software License Manager',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
      createdAt: '2025-01-15T10:00:00.000Z'
    },
    {
      id: 'USR-003',
      name: 'Rohan Deshmukh',
      email: 'employee@bharattech.com',
      password: passwordHashEmployee,
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'Senior Full Stack Engineer',
      employeeId: 'EMP-101',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      createdAt: '2025-02-01T11:00:00.000Z'
    }
  ];

  // 2. Vendors (9+ Vendors)
  const seedVendors = [
    {
      vendorId: 'VND-001',
      vendorName: 'Microsoft India Pvt Ltd',
      contactPerson: 'Vikram Malhotra',
      email: 'enterprisesales@microsoft.co.in',
      phone: '+91 80 6789 1000',
      website: 'https://www.microsoft.com/en-in',
      address: 'Signature Towers, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
      rating: 4.8,
      status: 'ACTIVE',
      createdAt: '2025-01-10T10:00:00.000Z'
    },
    {
      vendorId: 'VND-002',
      vendorName: 'Adobe Systems India Pvt Ltd',
      contactPerson: 'Ananya Roy',
      email: 'corporate.india@adobe.com',
      phone: '+91 120 244 4711',
      website: 'https://www.adobe.com/in',
      address: 'Adobe Towers, Sector 132, Noida, Uttar Pradesh 201304',
      rating: 4.6,
      status: 'ACTIVE',
      createdAt: '2025-01-10T10:30:00.000Z'
    },
    {
      vendorId: 'VND-003',
      vendorName: 'Atlassian India LLP',
      contactPerson: 'Karan Patel',
      email: 'sales-in@atlassian.com',
      phone: '+91 80 4683 2000',
      website: 'https://www.atlassian.com',
      address: 'Prestige Trade Tower, Palace Road, Bengaluru, Karnataka 560001',
      rating: 4.7,
      status: 'ACTIVE',
      createdAt: '2025-01-11T09:15:00.000Z'
    },
    {
      vendorId: 'VND-004',
      vendorName: 'JetBrains s.r.o. (India Distributor)',
      contactPerson: 'Siddharth Nair',
      email: 'sales@jetbrains-india.in',
      phone: '+91 22 6123 4567',
      website: 'https://www.jetbrains.com',
      address: 'Bandra-Kurla Complex, Bandra East, Mumbai, Maharashtra 400051',
      rating: 4.9,
      status: 'ACTIVE',
      createdAt: '2025-01-12T11:00:00.000Z'
    },
    {
      vendorId: 'VND-005',
      vendorName: 'Amazon Web Services India',
      contactPerson: 'Sneha Kulkarni',
      email: 'aws-sales-india@amazon.com',
      phone: '+91 80 4000 8000',
      website: 'https://aws.amazon.com/in',
      address: 'World Trade Centre, Malleshwaram West, Bengaluru, Karnataka 560055',
      rating: 4.9,
      status: 'ACTIVE',
      createdAt: '2025-01-12T14:00:00.000Z'
    },
    {
      vendorId: 'VND-006',
      vendorName: 'Salesforce.com India Pvt Ltd',
      contactPerson: 'Rahul Sen',
      email: 'apac-support@salesforce.com',
      phone: '+91 40 6789 2200',
      website: 'https://www.salesforce.com/in',
      address: 'Divyasree Orion, Gachibowli, Hyderabad, Telangana 500032',
      rating: 4.5,
      status: 'ACTIVE',
      createdAt: '2025-01-14T10:00:00.000Z'
    },
    {
      vendorId: 'VND-007',
      vendorName: 'Zoom Video Communications India',
      contactPerson: 'Deepika Rao',
      email: 'india-enterprise@zoom.us',
      phone: '+91 22 4567 8900',
      website: 'https://zoom.us',
      address: 'Maker Maxity, BKC, Mumbai, Maharashtra 400051',
      rating: 4.4,
      status: 'ACTIVE',
      createdAt: '2025-01-15T15:30:00.000Z'
    },
    {
      vendorId: 'VND-008',
      vendorName: 'GitHub Inc. (Microsoft)',
      contactPerson: 'Arjun Dasgupta',
      email: 'enterprise@github.com',
      phone: '+91 80 6789 5555',
      website: 'https://github.com',
      address: 'Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560037',
      rating: 4.9,
      status: 'ACTIVE',
      createdAt: '2025-01-16T12:00:00.000Z'
    },
    {
      vendorId: 'VND-009',
      vendorName: 'Figma Inc. APAC',
      contactPerson: 'Meera Chawla',
      email: 'apac-sales@figma.com',
      phone: '+91 80 4321 9876',
      website: 'https://www.figma.com',
      address: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
      rating: 4.8,
      status: 'ACTIVE',
      createdAt: '2025-01-17T11:45:00.000Z'
    }
  ];

  // 3. Software Assets (12+ Software Assets)
  const seedSoftware = [
    {
      softwareId: 'SW-001',
      softwareName: 'Microsoft 365 E5 Enterprise',
      category: 'Productivity & Collaboration',
      version: '2026.1',
      vendor: 'Microsoft India Pvt Ltd',
      vendorId: 'VND-001',
      description: 'Full productivity suite with Exchange, Teams, SharePoint, Defender security, and PowerBI.',
      licenseType: 'Subscription / Per-User',
      department: 'All Departments',
      status: 'ACTIVE',
      createdAt: '2025-01-10T12:00:00.000Z'
    },
    {
      softwareId: 'SW-002',
      softwareName: 'Adobe Creative Cloud Enterprise',
      category: 'Design & Multimedia',
      version: 'CC 2026',
      vendor: 'Adobe Systems India Pvt Ltd',
      vendorId: 'VND-002',
      description: 'Photoshop, Illustrator, Premiere Pro, After Effects, XD, and Acrobat Pro for design teams.',
      licenseType: 'Subscription / Per-User',
      department: 'Design & Marketing',
      status: 'ACTIVE',
      createdAt: '2025-01-10T12:30:00.000Z'
    },
    {
      softwareId: 'SW-003',
      softwareName: 'JetBrains All Products Pack',
      category: 'Development Tools',
      version: '2025.3',
      vendor: 'JetBrains s.r.o. (India Distributor)',
      vendorId: 'VND-004',
      description: 'IntelliJ IDEA Ultimate, WebStorm, PyCharm, CLion, GoLand, DataGrip IDE suite.',
      licenseType: 'Annual Subscription',
      department: 'Engineering',
      status: 'ACTIVE',
      createdAt: '2025-01-11T10:00:00.000Z'
    },
    {
      softwareId: 'SW-004',
      softwareName: 'Atlassian Jira Software & Confluence',
      category: 'Project Management & Agile',
      version: 'Cloud Enterprise',
      vendor: 'Atlassian India LLP',
      vendorId: 'VND-003',
      description: 'Sprint planning, Kanban, bug tracking, and corporate knowledge base documentation.',
      licenseType: 'Tiered Seat License',
      department: 'Engineering & Product',
      status: 'ACTIVE',
      createdAt: '2025-01-11T11:00:00.000Z'
    },
    {
      softwareId: 'SW-005',
      softwareName: 'GitHub Enterprise Cloud',
      category: 'DevOps & Source Control',
      version: '3.14 Enterprise',
      vendor: 'GitHub Inc. (Microsoft)',
      vendorId: 'VND-008',
      description: 'Source code management, GitHub Actions CI/CD, Copilot Enterprise, Advanced Security.',
      licenseType: 'Per Seat / Monthly',
      department: 'Engineering',
      status: 'ACTIVE',
      createdAt: '2025-01-12T09:30:00.000Z'
    },
    {
      softwareId: 'SW-006',
      softwareName: 'AWS Enterprise Support & Cloud Platform',
      category: 'Cloud Infrastructure',
      version: 'v4.0',
      vendor: 'Amazon Web Services India',
      vendorId: 'VND-005',
      description: '24/7 technical advisory, cloud workloads, compute, containerization, and data warehousing.',
      licenseType: 'Usage-Based / Annual Contract',
      department: 'DevOps & Cloud Ops',
      status: 'ACTIVE',
      createdAt: '2025-01-12T14:30:00.000Z'
    },
    {
      softwareId: 'SW-007',
      softwareName: 'Salesforce Sales Cloud Enterprise',
      category: 'CRM & Customer Success',
      version: 'Spring 2026',
      vendor: 'Salesforce.com India Pvt Ltd',
      vendorId: 'VND-006',
      description: 'Enterprise pipeline management, client accounts, revenue forecasting, CPQ.',
      licenseType: 'Per User / Annual',
      department: 'Sales & Business Dev',
      status: 'ACTIVE',
      createdAt: '2025-01-14T11:00:00.000Z'
    },
    {
      softwareId: 'SW-008',
      softwareName: 'Figma Enterprise Organization',
      category: 'Design & Multimedia',
      version: 'Enterprise 2026',
      vendor: 'Figma Inc. APAC',
      vendorId: 'VND-009',
      description: 'Collaborative UI/UX wireframing, interactive prototyping, and design system tokens.',
      licenseType: 'Per Seat / Annual',
      department: 'Design & Marketing',
      status: 'ACTIVE',
      createdAt: '2025-01-15T09:00:00.000Z'
    },
    {
      softwareId: 'SW-009',
      softwareName: 'Zoom Business Workplace',
      category: 'Productivity & Collaboration',
      version: '6.2.0',
      vendor: 'Zoom Video Communications India',
      vendorId: 'VND-007',
      description: 'HD Video conferencing, cloud recording, webinar 500, whiteboard collaboration.',
      licenseType: 'Per Host / Annual',
      department: 'All Departments',
      status: 'ACTIVE',
      createdAt: '2025-01-15T16:00:00.000Z'
    },
    {
      softwareId: 'SW-010',
      softwareName: 'Tableau Server Analytics',
      category: 'Business Intelligence & Data',
      version: '2025.4',
      vendor: 'Salesforce.com India Pvt Ltd',
      vendorId: 'VND-006',
      description: 'Interactive corporate dashboards, predictive analytics, enterprise data governance.',
      licenseType: 'Core-based / Named Creator',
      department: 'Data & Analytics',
      status: 'ACTIVE',
      createdAt: '2025-01-16T10:00:00.000Z'
    },
    {
      softwareId: 'SW-011',
      softwareName: 'Docker Business Enterprise',
      category: 'DevOps & Source Control',
      version: 'v4.28',
      vendor: 'JetBrains s.r.o. (India Distributor)',
      vendorId: 'VND-004',
      description: 'Container security scanning, SSO/SAML, centralized management for dev teams.',
      licenseType: 'Per User / Annual',
      department: 'Engineering',
      status: 'ACTIVE',
      createdAt: '2025-01-17T14:00:00.000Z'
    },
    {
      softwareId: 'SW-012',
      softwareName: 'Postman Enterprise API Platform',
      category: 'Development Tools',
      version: 'v11.2',
      vendor: 'Microsoft India Pvt Ltd',
      vendorId: 'VND-001',
      description: 'API testing, mock servers, automated contract testing, API documentation repository.',
      licenseType: 'Per Developer / Annual',
      department: 'Engineering & QA',
      status: 'ACTIVE',
      createdAt: '2025-01-18T10:30:00.000Z'
    }
  ];

  // 4. Employees (22 Employees)
  const seedEmployees = [
    {
      employeeId: 'EMP-101',
      fullName: 'Rohan Deshmukh',
      email: 'rohan.deshmukh@bharattech.com',
      department: 'Engineering',
      jobTitle: 'Senior Full Stack Engineer',
      joiningDate: '2023-03-15',
      phone: '+91 98201 12345',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-102',
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@bharattech.com',
      department: 'Engineering',
      jobTitle: 'Lead Backend Architect',
      joiningDate: '2022-07-10',
      phone: '+91 98202 23456',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-103',
      fullName: 'Vikramaditya Verma',
      email: 'vikram.verma@bharattech.com',
      department: 'Design & Marketing',
      jobTitle: 'Principal Product Designer',
      joiningDate: '2023-01-20',
      phone: '+91 98203 34567',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-104',
      fullName: 'Kavya Krishnan',
      email: 'kavya.krishnan@bharattech.com',
      department: 'Design & Marketing',
      jobTitle: 'UI/UX Visual Designer',
      joiningDate: '2024-02-12',
      phone: '+91 98204 45678',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-105',
      fullName: 'Aditya Swaminathan',
      email: 'aditya.swami@bharattech.com',
      department: 'DevOps & Cloud Ops',
      jobTitle: 'DevOps Staff Engineer',
      joiningDate: '2022-11-01',
      phone: '+91 98205 56789',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-106',
      fullName: 'Meenakshi Iyer',
      email: 'meenakshi.iyer@bharattech.com',
      department: 'Data & Analytics',
      jobTitle: 'Senior Data Scientist',
      joiningDate: '2023-05-18',
      phone: '+91 98206 67890',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-107',
      fullName: 'Tanvi Agarwal',
      email: 'tanvi.agarwal@bharattech.com',
      department: 'Sales & Business Dev',
      jobTitle: 'Enterprise Account Executive',
      joiningDate: '2023-08-01',
      phone: '+91 98207 78901',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-108',
      fullName: 'Rajesh Mukherjee',
      email: 'rajesh.m@bharattech.com',
      department: 'Engineering & Product',
      jobTitle: 'Lead Product Manager',
      joiningDate: '2022-04-10',
      phone: '+91 98208 89012',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-109',
      fullName: 'Neha Bansal',
      email: 'neha.bansal@bharattech.com',
      department: 'Human Resources',
      jobTitle: 'HR Operations Lead',
      joiningDate: '2023-09-15',
      phone: '+91 98209 90123',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-110',
      fullName: 'Siddharth Joshi',
      email: 'siddharth.j@bharattech.com',
      department: 'Finance & Accounts',
      jobTitle: 'Corporate Financial Analyst',
      joiningDate: '2024-01-08',
      phone: '+91 98210 01234',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-111',
      fullName: 'Deepak Choudhary',
      email: 'deepak.c@bharattech.com',
      department: 'Engineering',
      jobTitle: 'Frontend Engineer II',
      joiningDate: '2024-03-01',
      phone: '+91 98211 12345',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-112',
      fullName: 'Shreya Sengupta',
      email: 'shreya.s@bharattech.com',
      department: 'Engineering & QA',
      jobTitle: 'Senior SDET / QA Lead',
      joiningDate: '2023-10-15',
      phone: '+91 98212 23456',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-113',
      fullName: 'Manish Reddy',
      email: 'manish.reddy@bharattech.com',
      department: 'Engineering',
      jobTitle: 'Mobile App Developer (iOS/Flutter)',
      joiningDate: '2023-11-20',
      phone: '+91 98213 34567',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-114',
      fullName: 'Ishaan Kapoor',
      email: 'ishaan.k@bharattech.com',
      department: 'Information Technology',
      jobTitle: 'IT Systems Administrator',
      joiningDate: '2022-09-01',
      phone: '+91 98214 45678',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-115',
      fullName: 'Pooja Hegde',
      email: 'pooja.hegde@bharattech.com',
      department: 'Sales & Business Dev',
      jobTitle: 'Business Development Manager',
      joiningDate: '2024-04-10',
      phone: '+91 98215 56789',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-116',
      fullName: 'Harsh Vardhan',
      email: 'harsh.v@bharattech.com',
      department: 'DevOps & Cloud Ops',
      jobTitle: 'Site Reliability Engineer (SRE)',
      joiningDate: '2023-06-05',
      phone: '+91 98216 67890',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-117',
      fullName: 'Divya Nair',
      email: 'divya.nair@bharattech.com',
      department: 'Data & Analytics',
      jobTitle: 'Data Engineer',
      joiningDate: '2024-05-15',
      phone: '+91 98217 78901',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-118',
      fullName: 'Abhishek Tripathi',
      email: 'abhishek.t@bharattech.com',
      department: 'Engineering',
      jobTitle: 'Backend Developer (Java/Go)',
      joiningDate: '2024-06-01',
      phone: '+91 98218 89012',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-119',
      fullName: 'Sunita Rao',
      email: 'sunita.rao@bharattech.com',
      department: 'Legal & Compliance',
      jobTitle: 'Corporate Compliance Officer',
      joiningDate: '2023-02-14',
      phone: '+91 98219 90123',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-120',
      fullName: 'Gautam Menon',
      email: 'gautam.m@bharattech.com',
      department: 'Engineering & Product',
      jobTitle: 'Technical Product Manager',
      joiningDate: '2023-12-01',
      phone: '+91 98220 01234',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-121',
      fullName: 'Rashmi Pillai',
      email: 'rashmi.p@bharattech.com',
      department: 'Design & Marketing',
      jobTitle: 'Motion Graphics Animator',
      joiningDate: '2024-07-15',
      phone: '+91 98221 12345',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    },
    {
      employeeId: 'EMP-122',
      fullName: 'Alok Pandey',
      email: 'alok.p@bharattech.com',
      department: 'Information Technology',
      jobTitle: 'Helpdesk & Security Specialist',
      joiningDate: '2024-08-01',
      phone: '+91 98222 23456',
      status: 'ACTIVE',
      createdAt: '2025-01-01T09:00:00.000Z'
    }
  ];

  // 5. Licenses (18+ Licenses with varying dynamic dates for testing all statuses: Expired, 7d Critical, 30d Urgent, 90d Expiring Soon, Active, Renewal Pending)
  const seedLicenses = [
    {
      licenseId: 'LIC-001',
      softwareId: 'SW-001',
      softwareName: 'Microsoft 365 E5 Enterprise',
      vendor: 'Microsoft India Pvt Ltd',
      vendorId: 'VND-001',
      licenseKey: 'MSFT-E5-8892-IND-99124-KL',
      licenseType: 'Subscription / Per-User',
      purchaseDate: getDateOffset(-300),
      startDate: getDateOffset(-300),
      expirationDate: getDateOffset(65), // Expiring in ~65 days (EXPIRING SOON)
      totalSeats: 30,
      allocatedSeats: 26, // High utilization > 85%
      availableSeats: 4,
      cost: 450000,
      currency: '₹',
      autoRenewal: true,
      status: 'EXPIRING SOON',
      notes: 'Enterprise wide email and productivity for lead teams.'
    },
    {
      licenseId: 'LIC-002',
      softwareId: 'SW-002',
      softwareName: 'Adobe Creative Cloud Enterprise',
      vendor: 'Adobe Systems India Pvt Ltd',
      vendorId: 'VND-002',
      licenseKey: 'ADBE-CC-ENTERPRISE-5542-XYZ',
      licenseType: 'Subscription / Per-User',
      purchaseDate: getDateOffset(-360),
      startDate: getDateOffset(-360),
      expirationDate: getDateOffset(5), // Expiring in 5 days (CRITICAL <= 7 days)
      totalSeats: 10,
      allocatedSeats: 9, // 90% utilization
      availableSeats: 1,
      cost: 380000,
      currency: '₹',
      autoRenewal: false,
      status: 'CRITICAL',
      notes: 'Creative studio team licenses. Urgent renewal action needed.'
    },
    {
      licenseId: 'LIC-003',
      softwareId: 'SW-003',
      softwareName: 'JetBrains All Products Pack',
      vendor: 'JetBrains s.r.o. (India Distributor)',
      vendorId: 'VND-004',
      licenseKey: 'JB-ALL-COMMERCIAL-90021-IN',
      licenseType: 'Annual Subscription',
      purchaseDate: getDateOffset(-350),
      startDate: getDateOffset(-350),
      expirationDate: getDateOffset(18), // Expiring in 18 days (URGENT <= 30 days)
      totalSeats: 15,
      allocatedSeats: 15, // 100% capacity!
      availableSeats: 0,
      cost: 295000,
      currency: '₹',
      autoRenewal: true,
      status: 'URGENT',
      notes: 'Core development IDE licenses. Currently fully allocated.'
    },
    {
      licenseId: 'LIC-004',
      softwareId: 'SW-004',
      softwareName: 'Atlassian Jira Software & Confluence',
      vendor: 'Atlassian India LLP',
      vendorId: 'VND-003',
      licenseKey: 'ATLS-JIRA-CONF-CLOUD-7718',
      licenseType: 'Tiered Seat License',
      purchaseDate: getDateOffset(-180),
      startDate: getDateOffset(-180),
      expirationDate: getDateOffset(185), // Healthy Active
      totalSeats: 50,
      allocatedSeats: 38,
      availableSeats: 12,
      cost: 540000,
      currency: '₹',
      autoRenewal: true,
      status: 'ACTIVE',
      notes: 'Agile project tracking and enterprise wiki.'
    },
    {
      licenseId: 'LIC-005',
      softwareId: 'SW-005',
      softwareName: 'GitHub Enterprise Cloud',
      vendor: 'GitHub Inc. (Microsoft)',
      vendorId: 'VND-008',
      licenseKey: 'GH-ENT-ORG-BHARATTECH-2026',
      licenseType: 'Per Seat / Monthly',
      purchaseDate: getDateOffset(-200),
      startDate: getDateOffset(-200),
      expirationDate: getDateOffset(165), // Active
      totalSeats: 25,
      allocatedSeats: 21,
      availableSeats: 4,
      cost: 360000,
      currency: '₹',
      autoRenewal: true,
      status: 'ACTIVE',
      notes: 'Includes GitHub Copilot enterprise access.'
    },
    {
      licenseId: 'LIC-006',
      softwareId: 'SW-006',
      softwareName: 'AWS Enterprise Support & Cloud Platform',
      vendor: 'Amazon Web Services India',
      vendorId: 'VND-005',
      licenseKey: 'AWS-ACC-ENTERPRISE-9938210',
      licenseType: 'Usage-Based / Annual Contract',
      purchaseDate: getDateOffset(-400),
      startDate: getDateOffset(-400),
      expirationDate: getDateOffset(-15), // EXPIRED (-15 days ago)
      totalSeats: 5,
      allocatedSeats: 4,
      availableSeats: 1,
      cost: 950000,
      currency: '₹',
      autoRenewal: false,
      status: 'EXPIRED',
      notes: 'Annual support contract expired. Need renewal review.'
    },
    {
      licenseId: 'LIC-007',
      softwareId: 'SW-007',
      softwareName: 'Salesforce Sales Cloud Enterprise',
      vendor: 'Salesforce.com India Pvt Ltd',
      vendorId: 'VND-006',
      licenseKey: 'SFDC-ENT-SALES-88210-ORG',
      licenseType: 'Per User / Annual',
      purchaseDate: getDateOffset(-120),
      startDate: getDateOffset(-120),
      expirationDate: getDateOffset(245), // Active
      totalSeats: 10,
      allocatedSeats: 6,
      availableSeats: 4,
      cost: 720000,
      currency: '₹',
      autoRenewal: true,
      status: 'ACTIVE',
      notes: 'Sales executive seats.'
    },
    {
      licenseId: 'LIC-008',
      softwareId: 'SW-008',
      softwareName: 'Figma Enterprise Organization',
      vendor: 'Figma Inc. APAC',
      vendorId: 'VND-009',
      licenseKey: 'FIGMA-ENT-DESIGN-44109',
      licenseType: 'Per Seat / Annual',
      purchaseDate: getDateOffset(-150),
      startDate: getDateOffset(-150),
      expirationDate: getDateOffset(215), // Active
      totalSeats: 12,
      allocatedSeats: 8,
      availableSeats: 4,
      cost: 210000,
      currency: '₹',
      autoRenewal: true,
      status: 'ACTIVE',
      notes: 'Design tokens and prototype review.'
    },
    {
      licenseId: 'LIC-009',
      softwareId: 'SW-009',
      softwareName: 'Zoom Business Workplace',
      vendor: 'Zoom Video Communications India',
      vendorId: 'VND-007',
      licenseKey: 'ZOOM-PRO-ENT-99120-INDIA',
      licenseType: 'Per Host / Annual',
      purchaseDate: getDateOffset(-340),
      startDate: getDateOffset(-340),
      expirationDate: getDateOffset(25), // URGENT (25 days remaining)
      totalSeats: 20,
      allocatedSeats: 18,
      availableSeats: 2,
      cost: 240000,
      currency: '₹',
      autoRenewal: false,
      status: 'URGENT',
      notes: 'Renewal proposal under vendor negotiation.'
    },
    {
      licenseId: 'LIC-010',
      softwareId: 'SW-010',
      softwareName: 'Tableau Server Analytics',
      vendor: 'Salesforce.com India Pvt Ltd',
      vendorId: 'VND-006',
      licenseKey: 'TBL-SERVER-CORE-8CORE-2025',
      licenseType: 'Core-based / Named Creator',
      purchaseDate: getDateOffset(-280),
      startDate: getDateOffset(-280),
      expirationDate: getDateOffset(85), // EXPIRING SOON (85 days)
      totalSeats: 8,
      allocatedSeats: 6,
      availableSeats: 2,
      cost: 650000,
      currency: '₹',
      autoRenewal: true,
      status: 'EXPIRING SOON',
      notes: 'Analytics creator & viewer licenses.'
    },
    {
      licenseId: 'LIC-011',
      softwareId: 'SW-011',
      softwareName: 'Docker Business Enterprise',
      vendor: 'JetBrains s.r.o. (India Distributor)',
      vendorId: 'VND-004',
      licenseKey: 'DCKR-BIZ-ENT-SUBS-11029',
      licenseType: 'Per User / Annual',
      purchaseDate: getDateOffset(-90),
      startDate: getDateOffset(-90),
      expirationDate: getDateOffset(275), // Active
      totalSeats: 20,
      allocatedSeats: 14,
      availableSeats: 6,
      cost: 185000,
      currency: '₹',
      autoRenewal: true,
      status: 'ACTIVE',
      notes: 'Container runtime security for backend developers.'
    },
    {
      licenseId: 'LIC-012',
      softwareId: 'SW-012',
      softwareName: 'Postman Enterprise API Platform',
      vendor: 'Microsoft India Pvt Ltd',
      vendorId: 'VND-001',
      licenseKey: 'POSTMAN-ENT-API-TEAM-7721',
      licenseType: 'Per Developer / Annual',
      purchaseDate: getDateOffset(-110),
      startDate: getDateOffset(-110),
      expirationDate: getDateOffset(255), // Active
      totalSeats: 15,
      allocatedSeats: 12,
      availableSeats: 3,
      cost: 215000,
      currency: '₹',
      autoRenewal: true,
      status: 'ACTIVE',
      notes: 'API collections and automation runner.'
    },
    {
      licenseId: 'LIC-013',
      softwareId: 'SW-001',
      softwareName: 'Microsoft 365 E5 Enterprise (Branch Office)',
      vendor: 'Microsoft India Pvt Ltd',
      vendorId: 'VND-001',
      licenseKey: 'MSFT-E5-BRANCH-NOIDA-5510',
      licenseType: 'Subscription / Per-User',
      purchaseDate: getDateOffset(-420),
      startDate: getDateOffset(-420),
      expirationDate: getDateOffset(-50), // EXPIRED (-50 days)
      totalSeats: 10,
      allocatedSeats: 0,
      availableSeats: 10,
      cost: 150000,
      currency: '₹',
      autoRenewal: false,
      status: 'EXPIRED',
      notes: 'Legacy branch office contract discontinued.'
    },
    {
      licenseId: 'LIC-014',
      softwareId: 'SW-003',
      softwareName: 'JetBrains All Products Pack (QA Team)',
      vendor: 'JetBrains s.r.o. (India Distributor)',
      vendorId: 'VND-004',
      licenseKey: 'JB-QA-COMMERCIAL-5512-IND',
      licenseType: 'Annual Subscription',
      purchaseDate: getDateOffset(-100),
      startDate: getDateOffset(-100),
      expirationDate: getDateOffset(265),
      totalSeats: 8,
      allocatedSeats: 4,
      availableSeats: 4,
      cost: 160000,
      currency: '₹',
      autoRenewal: true,
      status: 'ACTIVE',
      notes: 'Dedicated PyCharm & DataGrip pack for automation engineers.'
    },
    {
      licenseId: 'LIC-015',
      softwareId: 'SW-008',
      softwareName: 'Figma Enterprise Organization (Marketing)',
      vendor: 'Figma Inc. APAC',
      vendorId: 'VND-009',
      licenseKey: 'FIGMA-MKTG-IND-881290',
      licenseType: 'Per Seat / Annual',
      purchaseDate: getDateOffset(-310),
      startDate: getDateOffset(-310),
      expirationDate: getDateOffset(55), // EXPIRING SOON (55 days)
      totalSeats: 5,
      allocatedSeats: 4,
      availableSeats: 1,
      cost: 95000,
      currency: '₹',
      autoRenewal: false,
      status: 'EXPIRING SOON',
      notes: 'Marketing graphics creators.'
    },
    {
      licenseId: 'LIC-016',
      softwareId: 'SW-002',
      softwareName: 'Adobe Creative Cloud (Video Editing Pod)',
      vendor: 'Adobe Systems India Pvt Ltd',
      vendorId: 'VND-002',
      licenseKey: 'ADBE-VID-POD-MUMBAI-771',
      licenseType: 'Subscription / Per-User',
      purchaseDate: getDateOffset(-365),
      startDate: getDateOffset(-365),
      expirationDate: getDateOffset(2), // CRITICAL (2 days left!)
      totalSeats: 4,
      allocatedSeats: 4, // 100% capacity
      availableSeats: 0,
      cost: 175000,
      currency: '₹',
      autoRenewal: false,
      status: 'CRITICAL',
      notes: 'High priority renewal approval submitted to finance.'
    }
  ];

  // 6. Seat Allocations (Realistic Assignments across employees & software)
  const seedAssignments = [
    {
      assignmentId: 'ASN-001',
      employeeId: 'EMP-101',
      employeeName: 'Rohan Deshmukh',
      employeeEmail: 'rohan.deshmukh@bharattech.com',
      department: 'Engineering',
      softwareId: 'SW-003',
      softwareName: 'JetBrains All Products Pack',
      licenseId: 'LIC-003',
      licenseKey: 'JB-ALL-COMMERCIAL-90021-IN',
      assignedDate: getDateOffset(-120),
      expirationDate: getDateOffset(18),
      assignedBy: 'Aarav Sharma (Admin)',
      status: 'ACTIVE',
      notes: 'Primary IDE for full-stack projects.'
    },
    {
      assignmentId: 'ASN-002',
      employeeId: 'EMP-101',
      employeeName: 'Rohan Deshmukh',
      employeeEmail: 'rohan.deshmukh@bharattech.com',
      department: 'Engineering',
      softwareId: 'SW-005',
      softwareName: 'GitHub Enterprise Cloud',
      licenseId: 'LIC-005',
      licenseKey: 'GH-ENT-ORG-BHARATTECH-2026',
      assignedDate: getDateOffset(-120),
      expirationDate: getDateOffset(165),
      assignedBy: 'Aarav Sharma (Admin)',
      status: 'ACTIVE',
      notes: 'GitHub Copilot + repo access.'
    },
    {
      assignmentId: 'ASN-003',
      employeeId: 'EMP-101',
      employeeName: 'Rohan Deshmukh',
      employeeEmail: 'rohan.deshmukh@bharattech.com',
      department: 'Engineering',
      softwareId: 'SW-001',
      softwareName: 'Microsoft 365 E5 Enterprise',
      licenseId: 'LIC-001',
      licenseKey: 'MSFT-E5-8892-IND-99124-KL',
      assignedDate: getDateOffset(-120),
      expirationDate: getDateOffset(65),
      assignedBy: 'Priya Sundaram (License Manager)',
      status: 'ACTIVE',
      notes: 'Standard corporate communication.'
    },
    {
      assignmentId: 'ASN-004',
      employeeId: 'EMP-102',
      employeeName: 'Ananya Sharma',
      employeeEmail: 'ananya.sharma@bharattech.com',
      department: 'Engineering',
      softwareId: 'SW-003',
      softwareName: 'JetBrains All Products Pack',
      licenseId: 'LIC-003',
      licenseKey: 'JB-ALL-COMMERCIAL-90021-IN',
      assignedDate: getDateOffset(-150),
      expirationDate: getDateOffset(18),
      assignedBy: 'Priya Sundaram (License Manager)',
      status: 'ACTIVE',
      notes: 'Backend development in Go and Java.'
    },
    {
      assignmentId: 'ASN-005',
      employeeId: 'EMP-103',
      employeeName: 'Vikramaditya Verma',
      employeeEmail: 'vikram.verma@bharattech.com',
      department: 'Design & Marketing',
      softwareId: 'SW-002',
      softwareName: 'Adobe Creative Cloud Enterprise',
      licenseId: 'LIC-002',
      licenseKey: 'ADBE-CC-ENTERPRISE-5542-XYZ',
      assignedDate: getDateOffset(-200),
      expirationDate: getDateOffset(5),
      assignedBy: 'Aarav Sharma (Admin)',
      status: 'ACTIVE',
      notes: 'Brand visual identity and design system.'
    },
    {
      assignmentId: 'ASN-006',
      employeeId: 'EMP-103',
      employeeName: 'Vikramaditya Verma',
      employeeEmail: 'vikram.verma@bharattech.com',
      department: 'Design & Marketing',
      softwareId: 'SW-008',
      softwareName: 'Figma Enterprise Organization',
      licenseId: 'LIC-008',
      licenseKey: 'FIGMA-ENT-DESIGN-44109',
      assignedDate: getDateOffset(-180),
      expirationDate: getDateOffset(215),
      assignedBy: 'Priya Sundaram (License Manager)',
      status: 'ACTIVE',
      notes: 'Design team lead access.'
    },
    {
      assignmentId: 'ASN-007',
      employeeId: 'EMP-104',
      employeeName: 'Kavya Krishnan',
      employeeEmail: 'kavya.krishnan@bharattech.com',
      department: 'Design & Marketing',
      softwareId: 'SW-008',
      softwareName: 'Figma Enterprise Organization',
      licenseId: 'LIC-008',
      licenseKey: 'FIGMA-ENT-DESIGN-44109',
      assignedDate: getDateOffset(-100),
      expirationDate: getDateOffset(215),
      assignedBy: 'Priya Sundaram (License Manager)',
      status: 'ACTIVE',
      notes: 'UI screens and user research.'
    },
    {
      employeeId: 'EMP-105',
      assignmentId: 'ASN-008',
      employeeName: 'Aditya Swaminathan',
      employeeEmail: 'aditya.swami@bharattech.com',
      department: 'DevOps & Cloud Ops',
      softwareId: 'SW-011',
      softwareName: 'Docker Business Enterprise',
      licenseId: 'LIC-011',
      licenseKey: 'DCKR-BIZ-ENT-SUBS-11029',
      assignedDate: getDateOffset(-80),
      expirationDate: getDateOffset(275),
      assignedBy: 'Aarav Sharma (Admin)',
      status: 'ACTIVE',
      notes: 'Container image build node and pipeline security.'
    },
    {
      assignmentId: 'ASN-009',
      employeeId: 'EMP-106',
      employeeName: 'Meenakshi Iyer',
      employeeEmail: 'meenakshi.iyer@bharattech.com',
      department: 'Data & Analytics',
      softwareId: 'SW-010',
      softwareName: 'Tableau Server Analytics',
      licenseId: 'LIC-010',
      licenseKey: 'TBL-SERVER-CORE-8CORE-2025',
      assignedDate: getDateOffset(-90),
      expirationDate: getDateOffset(85),
      assignedBy: 'Priya Sundaram (License Manager)',
      status: 'ACTIVE',
      notes: 'Data warehouse analytical workbook creator.'
    },
    {
      assignmentId: 'ASN-010',
      employeeId: 'EMP-107',
      employeeName: 'Tanvi Agarwal',
      employeeEmail: 'tanvi.agarwal@bharattech.com',
      department: 'Sales & Business Dev',
      softwareId: 'SW-007',
      softwareName: 'Salesforce Sales Cloud Enterprise',
      licenseId: 'LIC-007',
      licenseKey: 'SFDC-ENT-SALES-88210-ORG',
      assignedDate: getDateOffset(-110),
      expirationDate: getDateOffset(245),
      assignedBy: 'Priya Sundaram (License Manager)',
      status: 'ACTIVE',
      notes: 'Client relationship management.'
    },
    {
      assignmentId: 'ASN-011',
      employeeId: 'EMP-108',
      employeeName: 'Rajesh Mukherjee',
      employeeEmail: 'rajesh.m@bharattech.com',
      department: 'Engineering & Product',
      softwareId: 'SW-004',
      softwareName: 'Atlassian Jira Software & Confluence',
      licenseId: 'LIC-004',
      licenseKey: 'ATLS-JIRA-CONF-CLOUD-7718',
      assignedDate: getDateOffset(-160),
      expirationDate: getDateOffset(185),
      assignedBy: 'Aarav Sharma (Admin)',
      status: 'ACTIVE',
      notes: 'Product roadmapping and sprint backlog.'
    },
    {
      assignmentId: 'ASN-012',
      employeeId: 'EMP-112',
      employeeName: 'Shreya Sengupta',
      employeeEmail: 'shreya.s@bharattech.com',
      department: 'Engineering & QA',
      softwareId: 'SW-012',
      softwareName: 'Postman Enterprise API Platform',
      licenseId: 'LIC-012',
      licenseKey: 'POSTMAN-ENT-API-TEAM-7721',
      assignedDate: getDateOffset(-70),
      expirationDate: getDateOffset(255),
      assignedBy: 'Priya Sundaram (License Manager)',
      status: 'ACTIVE',
      notes: 'Automated CI regression collections.'
    }
  ];

  // 7. Renewals Pipeline
  const seedRenewals = [
    {
      renewalId: 'RNW-001',
      licenseId: 'LIC-002',
      softwareName: 'Adobe Creative Cloud Enterprise',
      vendorName: 'Adobe Systems India Pvt Ltd',
      renewalDate: getDateOffset(5),
      renewalCost: 395000,
      currency: '₹',
      status: 'Approved',
      urgency: 'CRITICAL',
      notes: 'Executive approval obtained for 10-seat annual subscription renewal.'
    },
    {
      renewalId: 'RNW-002',
      licenseId: 'LIC-003',
      softwareName: 'JetBrains All Products Pack',
      vendorName: 'JetBrains s.r.o. (India Distributor)',
      renewalDate: getDateOffset(18),
      renewalCost: 310000,
      currency: '₹',
      status: 'Renewal Requested',
      urgency: 'URGENT',
      notes: 'Quote received with 10% volume discount for expanding from 15 to 20 seats.'
    },
    {
      renewalId: 'RNW-003',
      licenseId: 'LIC-006',
      softwareName: 'AWS Enterprise Support & Cloud Platform',
      vendorName: 'Amazon Web Services India',
      renewalDate: getDateOffset(-15),
      renewalCost: 950000,
      currency: '₹',
      status: 'Review Required',
      urgency: 'EXPIRED',
      notes: 'Contract lapsed 15 days ago. Reviewing SLA requirements with cloud team.'
    },
    {
      renewalId: 'RNW-004',
      licenseId: 'LIC-009',
      softwareName: 'Zoom Business Workplace',
      vendorName: 'Zoom Video Communications India',
      renewalDate: getDateOffset(25),
      renewalCost: 245000,
      currency: '₹',
      status: 'Not Started',
      urgency: 'URGENT',
      notes: 'Needs confirmation on attendee capacity required for FY26-27.'
    },
    {
      renewalId: 'RNW-005',
      licenseId: 'LIC-001',
      softwareName: 'Microsoft 365 E5 Enterprise',
      vendorName: 'Microsoft India Pvt Ltd',
      renewalDate: getDateOffset(65),
      renewalCost: 460000,
      currency: '₹',
      status: 'Not Started',
      urgency: 'EXPIRING SOON',
      notes: 'Auto-renewal configured on corporate billing portal.'
    }
  ];

  // 8. Notifications / Dynamic Alerts
  const seedNotifications = [
    {
      notificationId: 'NOTIF-001',
      type: 'EXPIRATION_CRITICAL',
      severity: 'CRITICAL',
      title: 'Adobe Creative Cloud expires in 5 days!',
      message: 'License LIC-002 (Adobe Creative Cloud) will expire on ' + getDateOffset(5) + '. Immediate renewal action required.',
      relatedId: 'LIC-002',
      module: 'LICENSES',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      notificationId: 'NOTIF-002',
      type: 'UTILIZATION_100',
      severity: 'WARNING',
      title: '100% Seat Utilization on JetBrains Suite',
      message: 'License LIC-003 has reached maximum capacity (15/15 seats allocated). New requests will be blocked.',
      relatedId: 'LIC-003',
      module: 'SEAT_ALLOCATION',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      notificationId: 'NOTIF-003',
      type: 'EXPIRATION_EXPIRED',
      severity: 'CRITICAL',
      title: 'AWS Enterprise Support has expired',
      message: 'License LIC-006 expired ' + Math.abs(-15) + ' days ago. Please check renewal pipeline.',
      relatedId: 'LIC-006',
      module: 'RENEWALS',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      notificationId: 'NOTIF-004',
      type: 'EXPIRATION_URGENT',
      severity: 'WARNING',
      title: 'Zoom Business Workplace expires in 25 days',
      message: 'License LIC-009 will expire on ' + getDateOffset(25) + '. Status: URGENT.',
      relatedId: 'LIC-009',
      module: 'LICENSES',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      notificationId: 'NOTIF-005',
      type: 'UTILIZATION_HIGH',
      severity: 'INFO',
      title: 'Microsoft 365 seat allocation at 86.7%',
      message: 'License LIC-001 has 26 of 30 seats allocated (above 80% threshold).',
      relatedId: 'LIC-001',
      module: 'SEAT_ALLOCATION',
      isRead: true,
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  // 9. Audit Logs
  const seedAuditLogs = [
    {
      logId: 'AUD-001',
      timestamp: new Date().toISOString(),
      user: 'Aarav Sharma (admin@bharattech.com)',
      role: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      module: 'SYSTEM',
      recordId: 'SYS-INIT',
      description: 'System seed database loaded with Indian corporate sample assets.'
    },
    {
      logId: 'AUD-002',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      user: 'Aarav Sharma (admin@bharattech.com)',
      role: 'ADMIN',
      action: 'LOGIN',
      module: 'AUTH',
      recordId: 'USR-001',
      description: 'Admin user logged in from 192.168.1.100 (Bengaluru HQ).'
    },
    {
      logId: 'AUD-003',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      user: 'Priya Sundaram (manager@bharattech.com)',
      role: 'LICENSE_MANAGER',
      action: 'LICENSE_ASSIGNED',
      module: 'SEAT_ALLOCATION',
      recordId: 'ASN-012',
      description: 'Assigned 1 seat of Postman Enterprise (LIC-012) to Shreya Sengupta (EMP-112).'
    },
    {
      logId: 'AUD-004',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      user: 'Aarav Sharma (admin@bharattech.com)',
      role: 'ADMIN',
      action: 'RENEWAL_APPROVED',
      module: 'RENEWALS',
      recordId: 'RNW-001',
      description: 'Approved renewal request RNW-001 for Adobe Creative Cloud Enterprise (₹ 3,95,000).'
    },
    {
      logId: 'AUD-005',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      user: 'Priya Sundaram (manager@bharattech.com)',
      role: 'LICENSE_MANAGER',
      action: 'SOFTWARE_ADDED',
      module: 'SOFTWARE',
      recordId: 'SW-012',
      description: 'Added new software asset: Postman Enterprise API Platform.'
    }
  ];

  // 10. System Settings
  const seedSettings = {
    companyName: 'BharatTech Solutions Ltd',
    companyAddress: 'Prestige Tech Park, Outer Ring Road, Bengaluru, Karnataka 560103',
    companyEmail: 'it-assets@bharattech.com',
    companyPhone: '+91 80 4400 9900',
    currency: '₹',
    currencyCode: 'INR',
    dateFormat: 'YYYY-MM-DD',
    alertThresholds: {
      criticalDays: 7,
      urgentDays: 30,
      warningDays: 90,
      highUtilizationPercent: 80,
      criticalUtilizationPercent: 90
    },
    autoRenewalDefault: true,
    allowEmployeeSoftwareRequests: true,
    lastBackup: new Date().toISOString()
  };

  // Write all collections
  await db.write('users', seedUsers);
  await db.write('vendors', seedVendors);
  await db.write('software', seedSoftware);
  await db.write('employees', seedEmployees);
  await db.write('licenses', seedLicenses);
  await db.write('assignments', seedAssignments);
  await db.write('renewals', seedRenewals);
  await db.write('notifications', seedNotifications);
  await db.write('auditLogs', seedAuditLogs);
  await db.write('settings', seedSettings);

  console.log('✅ Successfully seeded database with complete corporate dataset!');
  return true;
}

// Allow standalone running: node src/utils/seedData.js
if (require.main === module) {
  seedDatabase(true).then(() => {
    console.log('Seed process finished.');
    process.exit(0);
  }).catch(err => {
    console.error('Error seeding data:', err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
