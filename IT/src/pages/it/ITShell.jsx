import HRNavbar from "../../components/hr/HRNavbar";

export default function ITShell({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <HRNavbar />

      <div className="px-3 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto">
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
