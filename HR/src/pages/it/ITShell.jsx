import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HRNavbar from "../../components/hr/HRNavbar";

export default function ITShell({ title, subtitle, icon: Icon, action, children }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <HRNavbar />
      <div className="px-3 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/it-dashboard")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={14} /> IT Dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {Icon && <Icon className="text-indigo-600" size={26} />}
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}
