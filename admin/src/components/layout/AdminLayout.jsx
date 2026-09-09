import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import VoiceAssistant from "../VoiceAssistant";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen bg-[#f7f8fb] flex overflow-hidden">
      {/* Mobile Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar — fixed height, no scroll */}
      <div
        className={`fixed z-50 inset-y-0 left-0 transform 
        ${open ? "translate-x-0" : "-translate-x-full"} 
        transition duration-300 ease-in-out 
        lg:translate-x-0 lg:static lg:shrink-0`}
      >
        <Sidebar />
      </div>

      {/* Main Content — yahan scroll hoga */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar setOpen={setOpen} />

<main
  style={{ overflow: "auto", flex: 1 }}
  className="p-4 sm:p-6"
>
  <Outlet />
</main>
      </div>

      <VoiceAssistant />
    </div>
  );
}