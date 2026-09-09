import Payroll from "../pages/payroll/Payroll";
import ClientLogin from "../pages/auth/ClientLogin";
import { Routes, Route, Navigate } from "react-router-dom";
import AttendanceTracker from "../pages/attendance/AttendanceTracker";
import EmployeeManagement from "../pages/employees/EmployeeManagement";
import InterviewTracker from "../pages/interviews/InterviewTracker";
import ClientLayout from "../components/layout/ClientLayout";
import Overview from "../pages/overview/Overview";
import ClientChatPage from "../pages/chat/ClientChatPage";

import PerformanceTracker from "../pages/performance/PerformanceTracker";
import EmployeePerformanceReport from "../pages/performance/EmployeePerformanceReport";
import WorkPolicy from "../pages/workPolicy/WorkPolicy";
import ClientSOPLibrary from "../pages/sop/ClientSOPLibrary";
import LeaveApprovals from "../pages/hrActions/LeaveApprovals";
import OfferLetters from "../pages/hrActions/OfferLetters";
import EmployeeSearch from "../pages/search/EmployeeSearch";

import FinanceDashboard from "../pages/finance/FinanceDashboard";
import RevenueManagement from "../pages/finance/RevenueManagement";
import ExpenseManagement from "../pages/finance/ExpenseManagement";
import GeneralLedger from "../pages/finance/GeneralLedger";
import InventoryManagement from "../pages/finance/InventoryManagement";
import AssetManagement from "../pages/finance/AssetManagement";
import PurchaseOrders from "../pages/finance/PurchaseOrders";
import TaxManagement from "../pages/finance/TaxManagement";
import FinancialReports from "../pages/finance/FinancialReports";
import AuditLogs from "../pages/finance/AuditLogs";
import WorkAssignment from "../pages/workassignment/WorkAssignment";

import { useClientAuth } from "../context/ClientAuthContext";
import { canAccessFeature } from "../config/access";
import ClientDashboard from "../pages/finance/ClientDashboard";
import WorkTarget from "../pages/workTarget/WorkTarget";
import ComplaintList from "../pages/complaint/ComplaintList";
import ComplaintDetail from "../pages/complaint/ComplaintDetail";
import LeadList from "../pages/leads/LeadAssigner";
import LeadDetails from "../pages/leads/LeadBatchDetail";
import CreateInvoice from "../pages/invoices/CreateInvoice";
import InvoicePreview from "../pages/invoices/InvoicePreview";
import Invoices from "../pages/invoices/Invoices";
import ClientProposals from "../pages/proposals/ClientProposals";
import SalesReports from "../pages/sales/SalesReports";
import SalesCall from "../pages/sales/SalesCall";
import FieldSales from "../pages/sales/FieldSales";
import ServiceManagement from "../pages/finance/ServiceManagement"
import ServiceTemplate from "../components/finance/ServiceTemplate";

function ProtectedRoute({ children }) {
  const { token } = useClientAuth();
  return token ? children : <Navigate to="/login" replace />;
}

// Route guard: redirects to overview if the module is disabled in Master
// Control or not available to the signed-in role (client admin vs employee).
function FeatureRoute({ featureKey, children }) {
  const { client, enabledFeatures } = useClientAuth();
  if (!canAccessFeature(featureKey, { client, enabledFeatures })) {
    return <Navigate to="/overview" replace />;
  }
  return children;
}

export default function ClientRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<ClientLogin />} />

      {/* PROTECTED */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="payroll" element={<FeatureRoute featureKey="PAYROLL"><Payroll /></FeatureRoute>} />
        <Route path="sales" element={<FeatureRoute featureKey="SALES_REPORT"><SalesCall /></FeatureRoute>} />
        <Route path="chat" element={<FeatureRoute featureKey="LIVE_CHAT"><ClientChatPage /></FeatureRoute>} />
        <Route path="field-sales" element={<FeatureRoute featureKey="SALES_REPORT"><FieldSales /></FeatureRoute>} />
        <Route path="sales-report" element={<FeatureRoute featureKey="SALES_REPORT"><SalesReports /></FeatureRoute>} />
        <Route path="attendance" element={<FeatureRoute featureKey="ATTENDANCE_TRACKER"><AttendanceTracker /></FeatureRoute>} />
        <Route path="interviews" element={<FeatureRoute featureKey="INTERVIEW_TRACKER"><InterviewTracker /></FeatureRoute>} />
        <Route path="dashboard" element={<FeatureRoute featureKey="FINANCE_DASHBOARD"><ClientDashboard /></FeatureRoute>} />
        <Route path="overview" element={<Overview />} />
        <Route path="employees" element={<FeatureRoute featureKey="EMPLOYEE_MANAGEMENT"><EmployeeManagement /></FeatureRoute>} />

        <Route path="performance" element={<FeatureRoute featureKey="PERFORMANCE_TRACKER"><PerformanceTracker /></FeatureRoute>} />
        <Route
          path="performance-report"
          element={<FeatureRoute featureKey="PERFORMANCE_REPORT"><EmployeePerformanceReport /></FeatureRoute>}
        />
        <Route path="work-policy" element={<FeatureRoute featureKey="WORK_POLICY"><WorkPolicy /></FeatureRoute>} />
          <Route path="sop-library" element={<FeatureRoute featureKey="SOP_LIBRARY"><ClientSOPLibrary /></FeatureRoute>} />
        <Route path="leave-approvals" element={<FeatureRoute featureKey="LEAVE_APPROVALS"><LeaveApprovals /></FeatureRoute>} />
        <Route path="offer-letters" element={<FeatureRoute featureKey="OFFER_LETTERS"><OfferLetters /></FeatureRoute>} />
        <Route path="employee-search" element={<FeatureRoute featureKey="EMPLOYEE_SEARCH"><EmployeeSearch /></FeatureRoute>} />
        <Route path="work-target" element={<FeatureRoute featureKey="WORK_TARGET"><WorkTarget /></FeatureRoute>} />

        <Route path="expenses" element={<FeatureRoute featureKey="FINANCE_DASHBOARD"><ClientDashboard /></FeatureRoute>} />

        <Route path="finance" element={<FeatureRoute featureKey="FINANCE_DASHBOARD"><FinanceDashboard /></FeatureRoute>} />
        <Route path="finance/revenue" element={<FeatureRoute featureKey="FINANCE_DASHBOARD"><RevenueManagement /></FeatureRoute>} />
        <Route path="finance/expenses" element={<FeatureRoute featureKey="FINANCE_DASHBOARD"><ExpenseManagement /></FeatureRoute>} />
        <Route path="finance/ledger" element={<FeatureRoute featureKey="FINANCE_DASHBOARD"><GeneralLedger /></FeatureRoute>} />
        <Route path="finance/inventory" element={<FeatureRoute featureKey="INVENTORY"><InventoryManagement /></FeatureRoute>} />
        <Route path="finance/services" element={<FeatureRoute featureKey="FINANCE_DASHBOARD"><ServiceManagement /></FeatureRoute>} />
        <Route path="finance/assets" element={<FeatureRoute featureKey="ASSETS"><AssetManagement /></FeatureRoute>} />
        <Route path="finance/purchase-orders" element={<FeatureRoute featureKey="PURCHASE_ORDERS"><PurchaseOrders /></FeatureRoute>} />
        <Route path="finance/tax" element={<FeatureRoute featureKey="TAX"><TaxManagement /></FeatureRoute>} />
        <Route path="finance/reports" element={<FeatureRoute featureKey="FINANCE_DASHBOARD"><FinancialReports /></FeatureRoute>} />
        <Route path="finance/audit-logs" element={<FeatureRoute featureKey="AUDIT_LOGS"><AuditLogs /></FeatureRoute>} />
        <Route path="/services/:id" element={<FeatureRoute featureKey="FINANCE_DASHBOARD"><ServiceTemplate /></FeatureRoute>} />

        <Route path="work-assignment" element={<FeatureRoute featureKey="WORK_ASSIGNMENT"><WorkAssignment /></FeatureRoute>} />

        <Route path="/complaint" element={<FeatureRoute featureKey="COMPLAINT"><ComplaintList /></FeatureRoute>} />
        <Route path="/complaints/:id" element={<FeatureRoute featureKey="COMPLAINT"><ComplaintDetail /></FeatureRoute>} />
        <Route path="/leads" element={<FeatureRoute featureKey="LEADS"><LeadList /></FeatureRoute>} />
        <Route path="/leads/:id" element={<FeatureRoute featureKey="LEADS"><LeadDetails /></FeatureRoute>} />
        <Route path="/invoices" element={<FeatureRoute featureKey="INVOICES"><Invoices /></FeatureRoute>} />
        <Route path="/create-invoice" element={<FeatureRoute featureKey="INVOICES"><CreateInvoice /></FeatureRoute>} />
        <Route path="/invoice/:id" element={<FeatureRoute featureKey="INVOICES"><InvoicePreview /></FeatureRoute>} />
        <Route path="/proposals" element={<FeatureRoute featureKey="PROPOSALS"><ClientProposals /></FeatureRoute>} />
       <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  );
}
