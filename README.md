# Corporate Software License & Asset Manager

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-lightgrey.svg)](https://expressjs.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple.svg)](https://getbootstrap.com/)
[![Database](https://img.shields.io/badge/Database-JSON%20Storage-blue.svg)]()
[![Deploy on Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7.svg)](https://render.com)

A complete, enterprise-grade administrative web application engineered for managing corporate software assets, enterprise license keys, seat allocations with invariant capacity controls, renewal pipelines, automated expiration notifications, analytical reporting, and audit trails.

Designed for academic evaluation and production-style deployment on **Render**, adhering strictly to the **HTML5/CSS3/JS/Bootstrap frontend + Node.js/Express.js backend + JSON file-based database** technology stack.

---

## 🔗 Project Links

- **GitHub Repository URL:** `https://github.com/your-username/corporate-software-license-asset-manager`
- **Live Render URL:** `https://corporate-software-license-asset-manager.onrender.com`

---

## 🌟 Key Features

### 1. Executive Analytics Dashboard
- **8 Dynamic KPI Cards:** Total Software Assets, Active Licenses, Total Seats Capacity, Allocated Seats, Free Seats, Expiring Soon (&le;90d), Expired Licenses, and Total Annual Expenditure in INR (₹).
- **6 Real-time Interactive Chart.js Visualizations:**
  1. *License Seat Utilization:* Stacked bar chart showing allocated vs available seats per asset.
  2. *Expiration Health:* Doughnut chart classifying Critical (&le;7d), Urgent (&le;30d), Expiring Soon (&le;90d), Safe, and Expired licenses.
  3. *Software Distribution by Category:* Polar area chart.
  4. *Top Vendor Spending:* Amortized corporate financial expenditure in ₹.
  5. *Departmental Spend Breakdown.*
  6. *License Status Breakdown.*
- **Urgent Expiration Action Table & Recent Audit Activity Ticker.**

### 2. Software Asset Management (CRUD)
- Complete catalog of enterprise software assets.
- Fields: Software ID, Name, Category, Version, Vendor, Description, License Type, Target Department, Status.
- Multi-dimensional search, category filtering, department filtering, sorting, and details modal.

### 3. Enterprise License Management
- Dynamic expiration calculation automatically computed against real-time clock.
- Statuses: `ACTIVE`, `EXPIRING SOON` (&le;90d), `URGENT` (&le;30d), `CRITICAL` (&le;7d), `EXPIRED`, `RENEWAL PENDING`.
- Visual seat utilization progress meters with color transitions (Green &rarr; Warning &rarr; Critical Red).
- Quick seat allocation and contract renewal buttons.

### 4. Invariant Seat Allocation Engine
- Strict business rule enforcement:
  $$\text{Available Seats} = \text{Total Seats} - \text{Allocated Seats}$$
  $$\text{Allocated Seats} \le \text{Total Seats}$$
- Atomic seat assignment to employees with duplicate assignment rejection and over-allocation rejection.
- Seat revocation workflow with justification logging and automatic seat replenishment.

### 5. Corporate Directory (Employees & Vendors)
- **Employees:** Manage employee profiles, departments, contact info, and view their assigned software tools and license history.
- **Vendors:** Track software providers, agreements, contact persons, software counts, license counts, and annual financial commitments in INR (₹).

### 6. Automated Renewal Pipeline
- Automatically flags upcoming expirations across 90-day, 60-day, 30-day, and 7-day thresholds.
- Multi-stage renewal pipeline: `Not Started` &rarr; `Review Required` &rarr; `Renewal Requested` &rarr; `Approved` &rarr; `Renewed` &rarr; `Cancelled`.
- One-click **Execute Renewal** action: extends expiration dates, amortizes renewal costs, transitions license status back to `ACTIVE`, updates employee assignments, and records audit logs.

### 7. Real-Time Dynamic Alert & Notification Center
- Automated background sync for:
  - Licenses expiring within 90 days, 30 days, 7 days, or lapsed.
  - High seat utilization (&ge;80%, &ge;90%, and 100% capacity).
  - Software access requests from employees.
- Unread badge counters, top navigation dropdown drawer, mark as read, and dismiss actions.

### 8. Analytical Reports & Exports (CSV & PDF)
- 6 Analytical Reports:
  1. *License Utilization Report*
  2. *License Expiration Timeline Report*
  3. *Corporate License Spending Report*
  4. *Vendor Spending Report*
  5. *Department Spending Report*
  6. *Employee Assignments Master Audit*
- **One-click Export to CSV** (native HTTP stream) and **Export to PDF** (client-side `jsPDF` table generation).

### 9. Tamper-Evident System Audit Trail
- Chronological logging capturing every system event: Logins, Additions, Modifications, Deletions, Seat Allocations, Seat Revocations, Contract Renewals, and Role Switches.
- Filterable by Module, Action, User, and free-text search.

---

## 👥 User Roles & Access Control

The system implements Role-Based Access Control (RBAC) across three distinct roles:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@bharattech.com` | `Admin@123` | Full access across all 12 modules, employee/vendor CRUD, system settings, database backup & reset. |
| **LICENSE MANAGER** | `manager@bharattech.com` | `Manager@123` | Manage software, licenses, seat allocations, revocations, renewals pipeline, notifications, and analytical reports. |
| **EMPLOYEE** | `employee@bharattech.com` | `Employee@123` | Employee Workspace: view own assigned software licenses, copy keys, and request software access. |

*Note: For evaluator convenience, a **Quick Demo Login Bar** is provided on the Login screen and a **Role Switcher** is embedded in the top navbar.*

---

## 💻 Technology Stack

- **Frontend:**
  - HTML5 & CSS3 (Custom Enterprise Slate Design System)
  - JavaScript (Vanilla ES6+ Modules)
  - Bootstrap 5.3.3 & FontAwesome 6
  - Chart.js 4.4.1 (Dynamic charts)
  - jsPDF 2.5.1 & AutoTable (Client PDF export)
- **Backend:**
  - Node.js (v18+)
  - Express.js 4.19 (RESTful APIs)
  - JSON Web Tokens (`jsonwebtoken`) for stateless session authentication
  - `bcryptjs` for secure password hashing
  - `cors` and `morgan` HTTP logger
- **Database:**
  - JSON File Database stored in `/data`
  - Thread-safe repository with file mutex locking and atomic temporary rename writes (`writeFile` + `rename`) to prevent race conditions or corrupted JSON files.

---

## 📁 Project Structure

```
corporate-software-license-asset-manager/
│
├── public/                          # Frontend Static Assets
│   ├── index.html                   # Main SPA Shell with 12 Views & Modals
│   ├── css/
│   │   └── style.css                # Enterprise Dark Slate Theme & Design System
│   └── js/
│       ├── app.js                   # Main Router, Toasts & Global Coordinators
│       ├── auth.js                  # JWT Authentication & RBAC Handler
│       ├── dashboard.js             # 8 KPIs & 6 Chart.js Renderers
│       ├── software.js              # Software Assets CRUD & Filters
│       ├── licenses.js              # Licenses CRUD, Dynamic Badges & Seat Meters
│       ├── allocations.js           # Seat Allocation Engine & Revocation
│       ├── employees.js             # Employee Directory & Portfolios
│       ├── vendors.js               # Vendor Management & Spend Analytics
│       ├── renewals.js              # Renewal Pipeline & Execution Workflows
│       ├── notifications.js         # Real-time Alert Drawer & Center
│       ├── reports.js               # 6 Reports, CSV & PDF Exporters
│       ├── audit.js                 # Audit Trail Viewer & Filters
│       └── settings.js              # Settings, JSON Backup & Demo Reset
│
├── src/                             # Backend Application Source
│   ├── app.js                       # Express App Configuration & Route Mounting
│   ├── config/
│   │   └── db.js                    # Atomic, Thread-Safe JSON Database Repository
│   ├── controllers/                 # REST API Controllers (10 Controllers)
│   ├── middleware/                  # Auth, Audit, and Business Validation Middlewares
│   ├── routes/                      # Express Routers
│   ├── services/                    # Dynamic License & Alert Calculation Engines
│   └── utils/
│       ├── helpers.js               # Date math, Currency (₹ INR), CSV converters
│       └── seedData.js              # Indian Corporate Seed Dataset Generator
│
├── data/                            # JSON Database Storage Directory
│   ├── users.json
│   ├── employees.json
│   ├── software.json
│   ├── licenses.json
│   ├── vendors.json
│   ├── assignments.json
│   ├── renewals.json
│   ├── notifications.json
│   ├── auditLogs.json
│   └── settings.json
│
├── tests/
│   └── test.js                      # Complete Automated Unit & Integration Test Suite
│
├── server.js                        # Main Entrypoint with dynamic PORT binding
├── package.json                     # Dependencies, scripts, metadata
├── .gitignore                       # Git exclusions
├── .env.example                     # Environment variables template
└── README.md                        # Project documentation
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (Node Package Manager)

### Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/corporate-software-license-asset-manager.git
   cd corporate-software-license-asset-manager
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   ```bash
   cp .env.example .env
   ```

4. **Seed the JSON Database (Automatic on first start):**
   ```bash
   npm run seed
   ```

5. **Run the Automated Test Suite:**
   ```bash
   npm test
   ```

6. **Start the Application Server:**
   ```bash
   npm start
   ```
   Open your browser and navigate to: **`http://localhost:3000`**

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Authenticate user credentials & receive JWT
- `GET  /api/auth/me` - Get active authenticated user profile
- `POST /api/auth/switch-demo-role` - Switch demo role session

### Dashboard (`/api/dashboard`)
- `GET  /api/dashboard/summary` - Dynamic KPIs and Chart.js datasets

### Software Assets (`/api/software`)
- `GET    /api/software` - List software assets (supports `search`, `category`, `department`)
- `POST   /api/software` - Create new software asset [Admin/Manager]
- `GET    /api/software/:id` - Get software details with associated licenses
- `PUT    /api/software/:id` - Update software asset [Admin/Manager]
- `DELETE /api/software/:id` - Delete software asset [Admin]

### Licenses & Seat Allocations (`/api/licenses`)
- `GET    /api/licenses` - List licenses with dynamic statuses & days remaining
- `POST   /api/licenses` - Create new license [Admin/Manager]
- `GET    /api/licenses/:id` - Get license details & active assignments
- `PUT    /api/licenses/:id` - Update license parameters [Admin/Manager]
- `DELETE /api/licenses/:id` - Delete license record [Admin]
- `POST   /api/licenses/:id/assign` - Allocate seat to employee [Admin/Manager]
- `POST   /api/licenses/revoke` - Revoke assigned seat [Admin/Manager]
- `GET    /api/licenses/assignments` - Query seat assignments across company

### Employees (`/api/employees`)
- `GET    /api/employees` - List employees with active software count
- `POST   /api/employees` - Register employee [Admin]
- `GET    /api/employees/:id` - Get employee profile & license history
- `PUT    /api/employees/:id` - Update employee profile [Admin]
- `DELETE /api/employees/:id` - Delete employee [Admin]
- `POST   /api/employees/request-access` - Submit software access request [Employee]

### Vendors (`/api/vendors`)
- `GET    /api/vendors` - List vendors with aggregated software/license/spending metrics
- `POST   /api/vendors` - Add vendor [Admin]
- `PUT    /api/vendors/:id` - Update vendor [Admin]
- `DELETE /api/vendors/:id` - Delete vendor [Admin]

### Renewals (`/api/renewals`)
- `GET    /api/renewals` - Get renewal pipeline items
- `POST   /api/renewals` - Create manual renewal entry
- `PUT    /api/renewals/:id` - Update workflow status
- `POST   /api/renewals/:id/execute` - Execute renewal and extend license dates

### Alerts & Notifications (`/api/notifications`)
- `GET    /api/notifications` - Dynamically sync and list active alerts
- `PUT    /api/notifications/:id/read` - Mark alert as read
- `PUT    /api/notifications/read-all` - Mark all alerts as read
- `DELETE /api/notifications/:id` - Dismiss alert

### Analytical Reports (`/api/reports`)
- `GET /api/reports/utilization` (supports `?format=csv`)
- `GET /api/reports/expiration` (supports `?format=csv`)
- `GET /api/reports/cost` (supports `?format=csv`)
- `GET /api/reports/vendors` (supports `?format=csv`)
- `GET /api/reports/departments` (supports `?format=csv`)
- `GET /api/reports/assignments` (supports `?format=csv`)

### Audit Logs & Settings (`/api/audit-logs`, `/api/settings`)
- `GET  /api/audit-logs` - Query system audit log timeline
- `GET  /api/settings` - Retrieve system configuration
- `PUT  /api/settings` - Update corporate parameters & alert thresholds
- `GET  /api/settings/backup` - Download complete JSON database archive
- `POST /api/settings/reset` - Reset database to factory demo seed

---

## ☁️ Deployment on Render

This project is pre-configured for deployment on **Render** as a Web Service.

### Deployment Steps on Render:

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Corporate Software License & Asset Manager"
   git remote add origin https://github.com/your-username/corporate-software-license-asset-manager.git
   git push -u origin main
   ```

2. **Create a New Web Service on Render:**
   - Log in to [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** &rarr; **Web Service**.
   - Select your GitHub repository.

3. **Configure Service Settings:**
   - **Name:** `corporate-software-license-asset-manager`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Environment Variables (Optional):**
   Add the following in the Render Environment tab:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your_custom_secure_jwt_secret_key`

5. **Deploy:**
   Click **Create Web Service**. Render will automatically clone the repository, run `npm install`, and launch `server.js` bound to Render's dynamic `$PORT`.

### ⚠️ Important JSON Storage Note for Render:
Because this application uses a lightweight **JSON file-based database** to fulfill academic requirements:
- Render's free tier provides an ephemeral filesystem. Any changes written to local `.json` files will persist throughout the running container's lifecycle, but may reset to initial repository seed state upon redeployment or cold container restarts.
- For production enterprise deployment, persistent disks or an external database (MongoDB/PostgreSQL) can be plugged in using the modular `src/config/db.js` data-access abstraction layer.

---

## 🧪 Testing & Verification

Run the automated test suite with:
```bash
npm test
```
The test suite validates:
- API health and routing
- Password hashing & JWT authorization
- Dynamic KPI aggregations & seat capacity calculations
- Invariant math: $\text{Allocated} + \text{Available} = \text{Total Seats}$
- Prevention of duplicate/over-capacity allocations
- Automatic license expiration calculations
- Analytical reporting & CSV generation
- Audit trail event logging

---

## 📜 Academic Integrity & License

This project is developed as an academic software engineering project for corporate IT asset governance.
Licensed under the [MIT License](LICENSE).
