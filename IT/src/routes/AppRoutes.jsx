import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import ProtectedRoute from "./ProtectedRoute";
import ITDashboard from "../pages/it/ITDashboard";
import TaskAssignment from "../pages/it/TaskAssignment";
import DailyWorkSubmission from "../pages/it/DailyWorkSubmission";
import Timesheet from "../pages/it/Timesheet";
import CodeReviewStatus from "../pages/it/CodeReviewStatus";
import MilestoneTracker from "../pages/it/MilestoneTracker";
import PerformanceReporting from "../pages/it/PerformanceReporting";
import BugReporting from "../pages/it/BugReporting";
import DeploymentLog from "../pages/it/DeploymentLog";
import SOPManagement from "../pages/it/SOPManagement";
import Deliverables from "../pages/it/Deliverables";
import ChatPage from "../components/chat/ChatPage";
import AutomatedAttendance from "../pages/attendance/AutomatedAttendance";
import MyPerformance from "../pages/performance/PerformanceSheet";
import WorkPolicy from "../pages/workpolicy/WorkPolicy";
import MyTargets from "../pages/myTargets/MyTargets";
import MyAssignments from "../pages/work/MyAssignments";
import MyEOD from "../pages/work/MyEOD";
import ComplaintList from "../pages/complaint/ComplaintList";
import ComplaintDetail from "../pages/complaint/ComplaintDetail";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<ITDashboard />} />

        {/* IT features */}
        <Route path="/it/tasks" element={<TaskAssignment />} />
        <Route path="/it/daily-work" element={<DailyWorkSubmission />} />
        <Route path="/it/timesheet" element={<Timesheet />} />
        <Route path="/it/code-reviews" element={<CodeReviewStatus />} />
        <Route path="/it/milestones" element={<MilestoneTracker />} />
        <Route
          path="/it/performance-report"
          element={<PerformanceReporting />}
        />
        <Route path="/it/bugs" element={<BugReporting />} />
        <Route path="/it/deployments" element={<DeploymentLog />} />
        <Route path="/it/sop" element={<SOPManagement />} />
        <Route path="/sop-management" element={<SOPManagement />} />
        <Route path="/it/videos" element={<Deliverables type="video" />} />
        <Route
          path="/it/project-reports"
          element={<Deliverables type="project_report" />}
        />
        <Route
          path="/it/source-code"
          element={<Deliverables type="source_code" />}
        />

        {/* shared employee features (same as HR dashboard) */}
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/attendance" element={<AutomatedAttendance />} />
        <Route path="/my-performance" element={<MyPerformance />} />
        <Route path="/work-policy" element={<WorkPolicy />} />
        <Route path="/my-targets" element={<MyTargets />} />
        <Route path="/my-assignments" element={<MyAssignments />} />
        <Route path="/my-eod" element={<MyEOD />} />
        <Route path="/complaint" element={<ComplaintList />} />
        <Route path="/complaints/:id" element={<ComplaintDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
