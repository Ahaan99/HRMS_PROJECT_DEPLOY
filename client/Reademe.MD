File structure :-

Client/
└── src/
    ├── api/
    │   └── axios.js
    │
    ├── assets/
    │
    ├── components/
    │   ├── layout/
    │   │   ├── ClientSidebar.jsx
    │   │   ├── ClientNavbar.jsx
    │   │   └── ClientLayout.jsx
    │   │
    │   ├── common/
    │   │   ├── StatCard.jsx
    │   │   ├── Table.jsx
    │   │   ├── Modal.jsx
    │   │   └── EmptyState.jsx
    │   │
    │   └── featureToggle/
    │       └── FeatureGuard.jsx   ⭐ IMPORTANT
    │
    ├── pages/
    │   ├── auth/
    │   │   └── ClientLogin.jsx
    │   │
    │   ├── overview/
    │   │   └── Overview.jsx
    │   │
    │   ├── employees/
    │   │   └── EmployeeManagement.jsx
    │   │
    │   ├── attendance/
    │   │   └── AttendanceTracker.jsx
    │   │
    │   ├── interviews/
    │   │   └── InterviewTracker.jsx
    │   │
    │   ├── payroll/
    │   │   └── Payroll.jsx
    │   │
    │   └── sales/
    │       └── SalesReport.jsx
    │
    ├── config/
    │   └── clientMenu.config.js   ⭐ SCALABILITY BRAIN
    │
    ├── context/
    │   └── ClientAuthContext.jsx
    │
    ├── routes/
    │   └── ClientRoutes.jsx
    │
    ├── utils/
    │
    └── App.jsx
    