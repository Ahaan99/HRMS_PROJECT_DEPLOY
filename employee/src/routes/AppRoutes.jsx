import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";

import ProtectedRoute from "./ProtectedRoute";
import WorkAssignment from "../pages/work/MyAssignments";
import MyEOD from "../pages/work/MyEOD";
import MyTargets from "../pages/myTargets/MyTargets";
import Performance from "../pages/performance/PerformanceSheet";
import ChatPage from "../pages/ChatPage";
import MyLeave from "../pages/leave/MyLeave";
import MyCompensation from "../pages/compensation/MyCompensation";
import SOPLibrary from "../pages/sop/SOPLibrary";
import OtpAttendance from "../pages/attendance/OtpAttendance";
import MyProfile from "../pages/profile/MyProfile";
import MobileBottomNav from "../components/common/MobileBottomNav";
import {
  Home,
  ClipboardList,
  FileText,
  CalendarDays,
  Target,
  BarChart3,
  MessageSquare,
  Wallet,
  UserCircle2,
  Fingerprint,
} from "lucide-react";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<Login />} />
        {/* PROTECTED */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sops"
          element={
            <ProtectedRoute>
              <SOPLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <WorkAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eod"
          element={
            <ProtectedRoute>
              <MyEOD />
            </ProtectedRoute>
          }
        />

        <Route
          path="/targets"
          element={
            <ProtectedRoute>
              <MyTargets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <Performance />
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
          path="/leave"
          element={
            <ProtectedRoute>
              <MyLeave />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compensation"
          element={
            <ProtectedRoute>
              <MyCompensation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <OtpAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />
      </Routes>

      <MobileBottomNav
        hideOn={["/login"]}
        items={[
          { to: "/dashboard", label: "Home", icon: <Home size={20} /> },
          { to: "/assignments", label: "Work", icon: <ClipboardList size={20} /> },
          { to: "/eod", label: "EOD", icon: <FileText size={20} /> },
          { to: "/attendance", label: "Attend", icon: <Fingerprint size={20} /> },
        ]}
        moreItems={[
          { to: "/leave", label: "Leave", icon: <CalendarDays size={18} /> },
          { to: "/targets", label: "My Targets", icon: <Target size={18} /> },
          { to: "/performance", label: "Performance", icon: <BarChart3 size={18} /> },
          { to: "/chat", label: "Chat", icon: <MessageSquare size={18} /> },
          { to: "/compensation", label: "Compensation", icon: <Wallet size={18} /> },
          { to: "/profile", label: "My Profile", icon: <UserCircle2 size={18} /> },
        ]}
      />
    </BrowserRouter>
  );
}
