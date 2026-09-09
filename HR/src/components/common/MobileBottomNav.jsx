import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutGrid, X } from "lucide-react";

/**
 * Mobile-only bottom navigation (hidden on md+).
 * items: [{ to, label, icon: <Icon/> }] — first 4 pinned in the bar.
 * moreItems: extra routes shown in a slide-up sheet.
 * hideOn: paths where the nav is hidden (login pages etc).
 */
export default function MobileBottomNav({ items = [], moreItems = [], hideOn = [] }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();

  if (hideOn.some((p) => pathname === p)) return null;

  const linkCls = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[10px] font-medium transition ${
      isActive ? "text-indigo-600" : "text-gray-400"
    }`;

  return (
    <>
      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl shadow-2xl p-4 pb-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">All Pages</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-[11px] font-medium ${
                      isActive
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-gray-100 bg-gray-50 text-gray-600"
                    }`
                  }
                >
                  {item.icon}
                  <span className="leading-tight">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch">
          {items.slice(0, 4).map((item) => (
            <NavLink key={item.to} to={item.to} className={linkCls}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          {moreItems.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[10px] font-medium text-gray-400"
            >
              <LayoutGrid size={20} />
              <span>More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
