# Training and Certification Record Management System (TCRMS)
## STATIC PROTOTYPE - For Client Walkthrough and Approval

---

## ⚠️ IMPORTANT NOTICE

**This is a STATIC PROTOTYPE system for demonstration and approval purposes only.**

- **NO DATABASE** - All data is hardcoded in JavaScript files
- **NO BACKEND** - Pure HTML/CSS/JavaScript frontend only
- **NO DATA PERSISTENCE** - Nothing is saved, all changes are simulated
- **FOR WALKTHROUGH ONLY** - To demonstrate workflows and UI/UX design

---

## 📋 System Overview

The TCRMS is designed to:
- Track all employee trainings and certifications from date of hire
- Monitor training compliance (validity, expiration dates)
- Send alerts for expiring certifications or due trainings
- Store employee employment information
- Generate reports

---

## 🚀 How to Run the Prototype

### Method 1: Double-click to open
1. Navigate to the TCRMS folder
2. Double-click `index.html`
3. The **Employee Certifications Directory** (public viewer) opens — no login required. Use **Staff login** in the sidebar to sign in as Admin or Encoder.

### Method 2: Using VS Code Live Server (Recommended)
1. Open the TCRMS folder in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Method 3: Using Python HTTP Server
```bash
cd TCRMS
python -m http.server 8000
```
Then open: http://localhost:8000

---

## 👥 User Roles (per System Draft)

| Role | Access | Login |
|------|--------|--------|
| **Outside (External Viewer)** | View employee names and certifications only | **No** — public; first screen is the Employee Certifications Directory |
| **Encoder** | Data entry: Employee Info, Training & Certification (view + input); Reports (view only) | Yes — use **Staff login** or open `login.html` |
| **Admin** | All access: Dashboard, Users, Training & Certification, Reports (full CRUD, generate/export) | Yes — use **Staff login** or open `login.html` |

### Test Accounts (Staff only)
- **Admin:** admin / admin123  
- **Encoder:** encoder / encoder123

---

## 📁 System Structure

```
TCRMS/
│
├── index.html                    # Default: redirects to viewer-dashboard (public)
├── login.html                    # Staff login (Admin / Encoder)
│
├── Admin Pages/
│   ├── admin-dashboard.html     # Admin dashboard with metrics
│   ├── admin-users.html         # User management
│   ├── admin-training.html      # Training records management
│   └── admin-reports.html       # Reports and analytics
│
├── Encoder Pages/
│   ├── encoder-dashboard.html   # Encoder dashboard
│   ├── encoder-employee.html    # Employee information
│   ├── encoder-training.html    # Training records
│   └── encoder-reports.html     # View reports
│
├── External Viewer Pages/
│   └── viewer-dashboard.html    # View-only certification list
│
├── css/
│   └── style.css                # All styling
│
└── js/
    ├── data.js                  # Static data (employees, trainings)
    ├── auth.js                  # Authentication logic
    ├── main.js                  # Common functions
    ├── users.js                 # User management functions
    ├── training.js              # Training management functions
    ├── employee.js              # Employee management functions
    ├── reports.js               # Report generation functions
    └── viewer.js                # Viewer-specific functions
```

---

## 📊 Features Demonstrated

### 1. Dashboard (Admin & Encoder)
- Total employees count
- Active certifications count
- Training completion rate (last 60 days)
- Expired certifications alert
- Upcoming expirations table
- Recent activities feed
- Training by factory chart

### 2. User Management (Admin Only)
- View all system users
- Add new users (simulated)
- Edit user details (simulated)
- Role-based access control display
- User roles: Admin, Encoder, Outside User

### 3. Training and Certification Records
**Data fields displayed:**
- ID No.
- Full Name
- Employment Status
- Date Hired
- Factory (1ST, 2ND)
- Line (MX68, MX48, MX79AC, MX68)
- Team (Team A, Team B)
- Training Title
- Training Category (Hands-on, Assessment)
- Training Date
- Trainer
- Validity Period (2 weeks, 1 month, 1.5 months, 2 months, 3 months, 6 months, 1 year)
- Expiration Date (auto-calculated based on validity)
- Process Classification (Easy, Difficult, Critical/Special)
- Sensing Type (Sensing, Non-sensing)

**Features:**
- Add training record (simulated)
- View detailed record
- Edit record (simulated)
- Print record (simulated)
- Filter by factory, line
- Search functionality
- Export to CSV/Excel (simulated)

### 4. Employee Information (Encoder)
- View all employees
- Add new employee (simulated)
- Edit employee details (simulated)
- View employee training history
- Search and filter

### 5. Reports (Admin & Encoder View)
**Report Types:**
- Number of certifications per month
- Certifications expiring (next 3 months)
- Separated vs. Certified employees
- Training by category
- Training by process classification

**Visualizations:**
- Bar charts (horizontal & vertical)
- Data tables
- Pie chart legends
- Graphical presentations

### 6. External Viewer Access
- View-only access
- Employee names and certifications visible
- No sensitive employee information
- Search capability

---

## 🎨 Static Sample Data

### Employees (6 sample records)
1. Maria Santos - EMP-2024-001
2. John Reyes - EMP-2024-002
3. Ana Cruz - EMP-2024-003
4. Pedro Garcia - EMP-2023-045
5. Carlos Mendoza - EMP-2024-015
6. Lisa Fernandez - EMP-2023-089

### Training Records (6 sample records)
- Various training types (Soldering, Quality Control, Safety, Equipment Operation, SMT Process, Critical Process Sensing)
- Different validity periods (3 months, 6 months, 1 year)
- Different statuses (Active, Expiring Soon, Expired)
- Different classifications (Easy, Difficult, Critical/Special)

---

## 🔔 Simulated Features

The following actions are **simulated** with alerts/messages:

1. **Add/Edit/Delete Operations**
   - Adding new employee
   - Adding new training record
   - Editing records
   - Adding/editing users

2. **Data Export**
   - Export to CSV
   - Export to Excel
   - Print records

3. **Notifications**
   - Expiring certifications
   - Overdue trainings
   - New assignments

4. **Approvals**
   - Training assignment approval workflow

---

## 🎯 Workflows Demonstrated

### 1. New Employee Workflow
1. Login as Admin/Encoder
2. Navigate to Employee Info
3. Click "Add Employee"
4. See simulated form (all fields as per requirements)

### 2. Training Assignment Workflow
1. Login as Admin/Encoder
2. Navigate to Training and Certification
3. Click "Add Training Record"
4. See simulated form with all required fields
5. Expiration date auto-calculated based on validity period

### 3. Notification System
1. Bell icon shows notification count
2. Click to view notifications:
   - Expiring certifications
   - Overdue trainings
   - New assignments

### 4. Report Generation
1. Navigate to Reports
2. Select report type and parameters
3. View static sample reports
4. Simulate export functionality

---

## 📱 Responsive Design

The prototype is responsive and works on:
- Desktop (1920x1080 and above)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

---

## 🔐 Security Features (Simulated)

1. **Role-based access control**
   - Admin: Full access
   - Encoder: Data entry and view
   - Outside User: View only (names and certifications)

2. **Session management**
   - Login required
   - Role-based page redirects
   - Logout functionality

---

## 📝 Notes for Client Review

### What to Review:
1. ✅ **UI/UX Design** - Layout, colors, navigation
2. ✅ **Data Fields** - All required fields are displayed
3. ✅ **Workflows** - Login → Dashboard → Features
4. ✅ **Reports** - Report types and visualizations
5. ✅ **User Roles** - Different access levels
6. ✅ **Page Structure** - Navigation and organization

### What is NOT in this Prototype:
1. ❌ Database integration
2. ❌ Backend server
3. ❌ Actual data persistence
4. ❌ Email notifications
5. ❌ PDF generation
6. ❌ Advanced filtering/sorting
7. ❌ File uploads
8. ❌ API integrations
9. ❌ Automated expiration calculations
10. ❌ Audit logs

---

## 🛠 Technical Details

### Technologies Used:
- **HTML5** - Page structure
- **CSS3** - Styling and responsive design
- **Vanilla JavaScript** - Interactivity and logic
- **No frameworks** - Pure web technologies for simplicity

### Browser Compatibility:
- Chrome (recommended)
- Firefox
- Edge
- Safari

---

## 📞 Next Steps After Approval

Once this prototype is approved, the production system will include:

1. **Backend Development**
   - Database design and implementation
   - API development
   - Server setup on JAE main server

2. **Features Implementation**
   - Real CRUD operations
   - Automated expiration calculation
   - Email notifications
   - Report generation with real data
   - Data export functionality
   - Audit logging
   - Advanced search and filters

3. **Integration**
   - Main server JAE storage integration
   - Email server integration
   - Active Directory integration (if needed)

4. **Testing**
   - Unit testing
   - Integration testing
   - User acceptance testing
   - Security testing

5. **Deployment**
   - Production environment setup
   - Data migration
   - User training
   - Documentation

---

## 📄 Copyright

**JAE Philippines, Inc. Proprietary**  
Copyright ©2026, JAE Philippines, Inc.  
Confidential

---

## 🎯 Prototype Purpose

This prototype serves to:
1. Visualize the proposed system design
2. Validate data fields and requirements
3. Confirm workflows and user journeys
4. Approve UI/UX design
5. Establish a foundation for production development

**All feedback and change requests should be provided before production development begins.**

---

*Last Updated: February 8, 2026*
