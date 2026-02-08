# TCRMS Static Prototype - Visual Navigation Guide

## 🎯 Quick Overview

This document provides a visual guide to navigating the TCRMS prototype system.

---

## 📱 Login Screen

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ PROTOTYPE SYSTEM - For Walkthrough Only            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    TCRMS                                │
│     Training and Certification Record Management       │
│                                                         │
│     ┌──────────────────────────────────┐              │
│     │ Username: [____________]         │              │
│     │ Password: [____________]         │              │
│     │                                  │              │
│     │      [Login Button]              │              │
│     └──────────────────────────────────┘              │
│                                                         │
│     Test Accounts:                                      │
│     • admin / admin123                                  │
│     • encoder / encoder123                              │
│     • viewer / viewer123                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**File:** `index.html`

---

## 👑 Admin Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️ PROTOTYPE SYSTEM                                             │
├──────────┬───────────────────────────────────────────────────────┤
│          │  Dashboard                            🔔(3) Admin User│
│  TRMS    ├───────────────────────────────────────────────────────┤
│ Training │                                                        │
│  Record  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│   Mngt.  │  │ 👤  │ │ ✅  │ │ 📈  │ │ ⚠️  │                │
│  System  │  │ 245 │ │ 892 │ │ 87% │ │  23 │                │
│          │  └──────┘ └──────┘ └──────┘ └──────┘                │
│  ADMIN   │                                                        │
│          │  Upcoming Expirations                                 │
├──────────┤  ┌────────────────────────────────────┐              │
│          │  │ Name    │ Training  │ Exp. Date   │              │
│📊DASHBOARD│ │─────────│───────────│─────────────│              │
│👥USERS    │ │ Maria   │ Soldering │ 2026-02-15  │              │
│📚TRAINING │ │ John    │ QC Assess │ 2026-02-20  │              │
│📈REPORTS  │ └────────────────────────────────────┘              │
│          │                                                        │
│          │  Recent Activities                                    │
│[Logout]  │  • Carlos completed SMT Process Training              │
│          │  • New training assigned to Team A                    │
└──────────┴───────────────────────────────────────────────────────┘
```

**Files:** `admin-dashboard.html`, `admin-users.html`, `admin-training.html`, `admin-reports.html`

### Admin Navigation:
1. **Dashboard** - Overview metrics and alerts
2. **Users** - Manage system users (add, edit, view)
3. **Training and Certification** - Full training records management
4. **Reports** - Generate and export reports

---

## 👨‍💼 Encoder Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️ PROTOTYPE SYSTEM                                             │
├──────────┬───────────────────────────────────────────────────────┤
│          │  Dashboard                              Encoder User  │
│  TRMS    ├───────────────────────────────────────────────────────┤
│ Training │                                                        │
│  Record  │  ┌──────┐ ┌──────┐ ┌──────┐                          │
│   Mngt.  │  │ 👤  │ │ ✅  │ │ ⚠️  │                          │
│  System  │  │ 245 │ │ 892 │ │  15 │                          │
│          │  └──────┘ └──────┘ └──────┘                          │
│ ENCODER  │                                                        │
│          │  Recent Training Records                               │
├──────────┤  ┌────────────────────────────────────┐              │
│          │  │ Employee │ Training   │ Status     │              │
│📊DASHBOARD│ │──────────│────────────│────────────│              │
│👤EMPLOYEE │ │ Carlos   │ SMT        │ Active     │              │
│📚TRAINING │ │ Maria    │ Soldering  │ Expiring   │              │
│📈REPORTS  │ └────────────────────────────────────┘              │
│          │                                                        │
│[Logout]  │                                                        │
└──────────┴───────────────────────────────────────────────────────┘
```

**Files:** `encoder-dashboard.html`, `encoder-employee.html`, `encoder-training.html`, `encoder-reports.html`

### Encoder Navigation:
1. **Dashboard** - Overview metrics
2. **Employee Info** - View and add employee information
3. **Training and Certification** - View and input training records
4. **Reports** - View-only access to reports

---

## 👁️ External Viewer Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️ PROTOTYPE SYSTEM                                             │
├──────────┬───────────────────────────────────────────────────────┤
│          │  Employee Training and Certification    External User │
│  TRMS    ├───────────────────────────────────────────────────────┤
│ Training │                                                        │
│  Record  │  ℹ️ You have view-only access to employee names      │
│   Mngt.  │     and their certifications.                         │
│  System  │                                                        │
│          │  [Search: ________________]                           │
│ EXTERNAL │                                                        │
│  VIEWER  │  ┌──────────────────────────────────────────────────┐│
│          │  │ Name      │ Training      │ Category │ Status   ││
├──────────┤  │───────────│───────────────│──────────│──────────││
│          │  │ Maria     │ Soldering     │ Hands-on │ Expiring ││
│👁️EMPLOYEE│ │ John      │ QC Assessment │ Assess.  │ Expiring ││
│  TRAINING│  │ Ana       │ Safety        │ Hands-on │ Active   ││
│   & CERT │  │ Pedro     │ Equipment Op. │ Hands-on │ Active   ││
│          │  │ Carlos    │ SMT Process   │ Hands-on │ Active   ││
│[Logout]  │  │ Lisa      │ Critical Proc │ Assess.  │ Expired  ││
│          │  └──────────────────────────────────────────────────┘│
└──────────┴───────────────────────────────────────────────────────┘
```

**File:** `viewer-dashboard.html`

### External Viewer Access:
- **View Only** - No editing capabilities
- **Limited Info** - Names and certifications only
- **Search** - Can search through records

---

## 📊 Key Features by Page

### 1. Admin - Dashboard (`admin-dashboard.html`)
```
Features:
├─ 4 Metric Cards (Employees, Certifications, Completion Rate, Expired)
├─ Upcoming Expirations Table (next 30 days)
├─ Recent Activities Feed
├─ Training by Factory Chart
└─ Notification Bell with Alerts
```

### 2. Admin - Users (`admin-users.html`)
```
Features:
├─ [+ Add User] Button
├─ User List Table
│   ├─ Username, Full Name, Role, Email, Status
│   └─ Actions (View, Edit)
├─ Search Box
└─ User Management Modal (simulated)
```

### 3. Admin/Encoder - Training Records (`admin-training.html`, `encoder-training.html`)
```
Features:
├─ [+ Add Training Record] Button
├─ [Export] Button
├─ Filters (Factory, Line)
├─ Search Box
├─ Training Records Table
│   ├─ ID, Name, Factory, Line, Team, Training, Dates, Status
│   └─ Actions (View, Edit, Print)
└─ Training Details Modal
    └─ Complete record with all fields
```

### 4. Admin - Reports (`admin-reports.html`)
```
Features:
├─ Report Filters
│   ├─ Report Type (dropdown)
│   ├─ Year (dropdown)
│   ├─ Month (dropdown)
│   └─ [Generate Report] Button
├─ Certifications per Month (Bar Chart)
├─ Expiring Certifications Table
├─ Separated vs. Certified Table
├─ Training by Category (Pie Chart Legend)
└─ Training by Process Classification (Bar Chart)
```

### 5. Encoder - Employee Info (`encoder-employee.html`)
```
Features:
├─ [+ Add Employee] Button
├─ Search Box
├─ Employee List Table
│   ├─ ID, Name, Status, Date Hired, Factory, Line, Team
│   └─ Actions (View, Edit)
└─ Employee Details Modal (simulated)
```

---

## 🎨 Visual Elements Guide

### Status Badges
```
✅ Active       - Green badge   (certification valid)
⚠️  Expiring    - Orange badge  (expires within 30 days)
❌ Expired      - Red badge     (past expiration date)
```

### Role Badges
```
👑 Admin        - Purple badge
✏️  Encoder     - Green badge
👁️  Viewer      - Blue badge
```

### Color Scheme
```
Primary:     #667eea (Purple/Blue gradient)
Success:     #4caf50 (Green)
Warning:     #ff9800 (Orange)
Error:       #f44336 (Red)
Background:  #f5f5f5 (Light Gray)
Sidebar:     #2c3e50 (Dark Blue-Gray)
```

---

## 🔔 Notification System

```
Click Bell Icon (🔔) to see:

┌────────────────────────────────────┐
│  Notifications                  ×  │
├────────────────────────────────────┤
│  🔴 Expiring Soon:                │
│     5 certifications expiring     │
│     in next 7 days                │
├────────────────────────────────────┤
│  ℹ️  New Training:                 │
│     Advanced Sensing Process      │
│     training scheduled            │
├────────────────────────────────────┤
│  ⚠️  Overdue:                      │
│     2 employees have overdue      │
│     training assignments          │
└────────────────────────────────────┘
```

---

## 📝 Data Field Reference

### Employee Record Fields:
1. ID No. (e.g., EMP-2024-001)
2. Full Name
3. Employment Status (Active/Separated)
4. Date Hired
5. Factory (1ST/2ND)
6. Line (MX68, MX48, MX79AC, etc.)
7. Team (Team A, Team B)

### Training Record Fields:
1. All Employee Fields (above)
2. Training Title
3. Training Category (Hands-on/Assessment)
4. Training Date
5. Trainer
6. Validity Period (2 weeks to 1 year)
7. Expiration Date (auto-calculated)
8. Process Classification (Easy/Difficult/Critical-Special)
9. Sensing Type (Sensing/Non-sensing)

---

## 🔄 Sample Workflows

### Workflow 1: View Training Details
```
1. Login → admin/admin123
2. Click "TRAINING AND CERTIFICATION" in sidebar
3. Find employee (e.g., Maria Santos)
4. Click 👁️ (View) icon
5. Modal opens with complete training details
6. Review all fields
7. Click Close
```

### Workflow 2: Generate Report
```
1. Login → admin/admin123
2. Click "REPORTS" in sidebar
3. Select Report Type (e.g., "Certifications per Month")
4. Select Year (e.g., "2026")
5. Select Month (optional)
6. Click [Generate Report]
7. View results
8. Click [Export] to simulate export
```

### Workflow 3: Add New Employee (Simulated)
```
1. Login → encoder/encoder123
2. Click "EMPLOYEE INFO" in sidebar
3. Click [+ Add Employee] button
4. Alert shows form structure (simulated)
5. Review fields that would be in the form
```

### Workflow 4: External Viewer Access
```
1. Login → viewer/viewer123
2. Automatically see training certifications table
3. Use search box to find specific employee/training
4. View limited information (names and certifications only)
5. No edit capabilities available
```

---

## 📱 Responsive Behavior

### Desktop (1920x1080+)
- Sidebar: 280px fixed left
- Content: Full width with sidebar
- Tables: All columns visible
- Charts: Full size

### Laptop (1366x768)
- Same as desktop
- Slightly compressed layout
- All features accessible

### Tablet (768x1024)
- Sidebar: Full width, stacked on top
- Content: Below sidebar
- Tables: Horizontal scroll if needed
- Charts: Adjusted width

### Mobile (375x667)
- Sidebar: Full width menu
- Content: Single column
- Tables: Scroll horizontally
- Cards: Stack vertically

---

## 🎯 Testing Quick Reference

### Quick Test (5 minutes)
1. ✓ Open index.html
2. ✓ Login as admin/admin123
3. ✓ Check dashboard metrics
4. ✓ Click through all 4 menu items
5. ✓ Logout and try encoder account
6. ✓ Logout and try viewer account

### Full Test (15 minutes)
1. ✓ Test all 3 user roles
2. ✓ Check all pages
3. ✓ Click all buttons (see simulated actions)
4. ✓ Test search boxes
5. ✓ Test filters
6. ✓ View training details modal
7. ✓ Check notifications
8. ✓ Verify all data fields present
9. ✓ Test logout

---

## 📋 Checklist for Client Approval

```
UI/UX Design:
[ ] Color scheme appropriate
[ ] Layout clear and organized
[ ] Navigation intuitive
[ ] Buttons clearly labeled
[ ] Prototype banner visible

Data Fields:
[ ] All 15 fields present in training records
[ ] Employee information complete
[ ] Validity periods match requirements (15 days to 1 year)
[ ] Factory and Line options correct
[ ] Process classifications correct

User Roles:
[ ] Admin has full access
[ ] Encoder has appropriate access
[ ] Viewer is read-only
[ ] Navigation differs by role

Reports:
[ ] All 4+ report types present
[ ] Charts display correctly
[ ] Tables formatted well
[ ] Export option visible

Workflows:
[ ] Login/logout works
[ ] Add/Edit actions simulated properly
[ ] View details works
[ ] Filters and search functional
[ ] Notifications display

Overall:
[ ] Meets all requirements from draft
[ ] Ready to proceed to production
[ ] No major changes needed
```

---

**This is your complete visual guide to the TCRMS Static Prototype!**

Start with `QUICK_START.txt` for immediate testing, then refer to this guide for detailed navigation.

---

JAE Philippines, Inc. Proprietary  
Copyright ©2026, JAE Philippines, Inc.  
Confidential
