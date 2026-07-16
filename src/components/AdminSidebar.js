"use client";

import Image from "next/image";
import {
  Package,
  LayoutGrid,
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  CalendarDays,
  ClipboardList,
  LogOut,
  CreditCard,
  DollarSign,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard, chip: "bg-indigo-500" }],
  },
  {
    label: "Main Menu",
    items: [
      { key: "packages", label: "Packages", icon: Package, chip: "bg-coral-500" },
      { key: "patients", label: "Patients", icon: Users, chip: "bg-teal-500" },
      { key: "payments", label: "Payments", icon: CreditCard, chip: "bg-emerald-500" },
    ],
  },
  {
    label: "Care Team",
    items: [
      { key: "assessments", label: "Assessments", icon: ClipboardList, chip: "bg-amber-500" },
    ],
  },
  {
    label: "Administration",
    items: [{ key: "users", label: "Admin Users", icon: UserPlus, chip: "bg-fuchsia-500" }],
  },
  {
    label: "System",
    items: [{ key: "settings", label: "Settings", icon: Settings, chip: "bg-slate-500" }],
  },
];

export default function AdminSidebar({ sidebarOpen, activeNav, onNavClick, onLogout, loggingOut }) {
  return (
    <aside
      className={`${
        sidebarOpen ? "w-[248px]" : "w-[76px]"
      } shrink-0 bg-teal-900 text-white flex flex-col py-6 transition-[width] duration-200 overflow-hidden`}
    >
      <div className={`flex items-center gap-3 mb-8 ${sidebarOpen ? "px-8" : "px-0 justify-center"}`}>
        <div className="bg-white rounded-xl p-2 shrink-0">
          <Image src="/Athmalogo.webp" alt="Athma" width={160} height={160} className="object-contain" />
        </div>
      </div>

      <nav className="flex flex-col gap-6 px-3 flex-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            {sidebarOpen && (
              <p className="px-3 mb-2 text-[10.5px] font-semibold tracking-wider uppercase text-teal-300/70">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavClick(item.key)}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] text-[13.5px] font-medium transition-colors ${
                      isActive ? "bg-white/10 text-white" : "text-teal-100 hover:bg-white/5"
                    } ${!sidebarOpen && "justify-center"}`}
                  >
                    <span className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 ${item.chip}`}>
                      <Icon size={15} className="text-white" />
                    </span>
                    {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout — bottom of sidebar */}
      <div className={`px-3 mt-4 ${!sidebarOpen && "px-2"}`}>
        <button
          onClick={onLogout}
          disabled={loggingOut}
          title={!sidebarOpen ? "Logout" : undefined}
          className={`flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] text-[13.5px] font-medium text-rose-200 hover:bg-rose-500/10 hover:text-rose-100 transition-colors w-full disabled:opacity-60 ${
            !sidebarOpen && "justify-center"
          }`}
        >
          <span className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 bg-rose-500/80">
            <LogOut size={15} className="text-white" />
          </span>
          {sidebarOpen && <span className="whitespace-nowrap">{loggingOut ? "Signing out..." : "Logout"}</span>}
        </button>
      </div>
    </aside>
  );
}