import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Login from "../pages/auth/Login";
import NotFound from "../pages/NotFound";
import SalesReports from "../pages/SalesReports";
import SalesCalls from "../pages/calls/SalesCalls";
import FieldSales from "../pages/fieldsales/FieldSales";
import WorkTarget from "../pages/worktarget/WorkAssignment";
import WorkAssignment from "../pages/work/MyAssignments";
import WorkPolicy from "../pages/workpolicy/WorkPolicy";
import PerformanceSheet from "../pages/performance/PerformanceSheet";
import EOD from "../pages/work/MyEOD";
import ComplaintList from "../pages/complaint/ComplaintList";
import ComplaintDetail from "../pages/complaint/ComplaintDetail";
import LeadList from "../pages/leads/LeadList";
import LeadDetails from "../pages/leads/LeadDetails";
import Services from "../pages/services/Services";
import Invoices from "../pages/invoices/Invoices";
import CreateInvoice from "../pages/invoices/CreateInvoice";
import InvoicePreview from "../pages/invoices/InvoicePreview";
import ServiceTemplate from "../pages/services/ServiceTemplate";
import SalesInventory from "../pages/inventory/SalesInventory";
import AddClient from "../pages/clients/AddClient";
import Proposals from "../pages/proposals/Proposals";
import CreateProposal from "../pages/proposals/CreateProposal";
import ProposalPreview from "../pages/proposals/ProposalPreview";
import ChatPage from "../pages/ChatPage";
import MobileBottomNav from "../components/common/MobileBottomNav";
import {
  BarChart3,
  Phone,
  Receipt,
  Users,
  MapPin,
  Briefcase,
  Boxes,
  Target,
  ClipboardList,
  BookOpen,
  FileText,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Handshake,
} from "lucide-react";

export default function AppRoutes() {
  return (
    <>
    <Routes>
      {/* public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* protected */}
      <Route
        path="/sales-reports"
        element={
          <ProtectedRoute>
            <SalesReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales-calls"
        element={
          <ProtectedRoute>
            <SalesCalls />
          </ProtectedRoute>
        }
      />

      <Route
        path="/field-sales"
        element={
          <ProtectedRoute>
            <FieldSales />
          </ProtectedRoute>
        }
      />

      <Route
        path="/work-target"
        element={
          <ProtectedRoute>
            <WorkTarget />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-assignment"
        element={
          <ProtectedRoute>
            <WorkAssignment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <PerformanceSheet />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <AddClient />
          </ProtectedRoute>
        }
      />

      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <Services />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/:id"
        element={
          <ProtectedRoute>
            <ServiceTemplate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <SalesInventory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/work-policy"
        element={
          <ProtectedRoute>
            <WorkPolicy />
          </ProtectedRoute>
        }
      />

      <Route
        path="/eod"
        element={
          <ProtectedRoute>
            <EOD />
          </ProtectedRoute>
        }
      />

      <Route
        path="/complaint"
        element={
          <ProtectedRoute>
            <ComplaintList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints/:id"
        element={
          <ProtectedRoute>
            <ComplaintDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/complaints/:id"
        element={
          <ProtectedRoute>
            <ComplaintDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <LeadList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-invoice"
        element={
          <ProtectedRoute>
            <CreateInvoice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoice/:id"
        element={
          <ProtectedRoute>
            <InvoicePreview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/proposals"
        element={
          <ProtectedRoute>
            <Proposals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/create"
        element={
          <ProtectedRoute>
            <CreateProposal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/:id"
        element={
          <ProtectedRoute>
            <ProposalPreview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id"
        element={
          <ProtectedRoute>
            <LeadDetails />
          </ProtectedRoute>
        }
      />

      {/* default redirect */}
      <Route path="/" element={<Login />} />

      <Route path="*" element={<NotFound />} />
    </Routes>

    <MobileBottomNav
      hideOn={["/", "/login"]}
      items={[
        { to: "/sales-reports", label: "Reports", icon: <BarChart3 size={20} /> },
        { to: "/sales-calls", label: "Calls", icon: <Phone size={20} /> },
        { to: "/invoices", label: "Invoices", icon: <Receipt size={20} /> },
        { to: "/leads", label: "Leads", icon: <Users size={20} /> },
      ]}
      moreItems={[
        { to: "/field-sales", label: "Field Sales", icon: <MapPin size={18} /> },
        { to: "/clients", label: "Clients", icon: <Briefcase size={18} /> },
        { to: "/proposals", label: "Proposals", icon: <Handshake size={18} /> },
        { to: "/services", label: "Services", icon: <Boxes size={18} /> },
        { to: "/inventory", label: "Inventory", icon: <Boxes size={18} /> },
        { to: "/work-target", label: "Targets", icon: <Target size={18} /> },
        { to: "/work-assignment", label: "Assignments", icon: <ClipboardList size={18} /> },
        { to: "/work-policy", label: "Policies", icon: <BookOpen size={18} /> },
        { to: "/performance", label: "Performance", icon: <TrendingUp size={18} /> },
        { to: "/eod", label: "EOD", icon: <FileText size={18} /> },
        { to: "/complaint", label: "Complaints", icon: <AlertCircle size={18} /> },
        { to: "/chat", label: "Chat", icon: <MessageSquare size={18} /> },
      ]}
    />
    </>
  );
}
