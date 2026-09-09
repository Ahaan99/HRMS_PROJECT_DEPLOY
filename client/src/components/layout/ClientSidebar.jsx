import { NavLink } from "react-router-dom";
import { CLIENT_MENU } from "../../config/clientMenu.config";
import FeatureGuard from "../featureToggle/FeatureGuard";

export default function ClientSidebar({ open, setOpen }) {
  return (
    <>
      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
        fixed md:sticky z-50 top-0 left-0 w-72 h-screen
        bg-gradient-to-b from-[#0b1220] to-[#0f172a] text-white flex flex-col
        border-r border-white/5
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
      >
        {/* Logo */}
        <div className="mx-6 my-8 flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="logo"
            className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10"
          />

          <div>
            <h1 className="text-sm font-extrabold tracking-wide text-white leading-tight">
              ARDHNARISHWAR
            </h1>
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
              HRMS Client Panel
            </p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 pb-6 space-y-1 overflow-y-auto scrollbar-hide">
          {CLIENT_MENU.map((item) => {
            const Icon = item.icon;

            return (
              <FeatureGuard key={item.key} featureKey={item.key}>
                <NavLink
                  to={item.path}
                  onClick={() => setOpen(false)} // auto close on mobile
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                     ${
                       isActive
                         ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white shadow-inner ring-1 ring-indigo-400/20"
                         : "text-white/60 hover:bg-white/5 hover:text-white"
                     }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500" />
                      )}
                      <Icon size={18} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </FeatureGuard>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
