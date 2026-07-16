"use client";

import {
  Search,
  Bell,
  RefreshCw,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";

export default function AdminHeader({ 
  sidebarOpen, 
  onToggleSidebar, 
  search, 
  onSearchChange, 
  onLogout, 
  loggingOut 
}) {
  return (
    <header className="h-16 shrink-0 bg-white border-b border-line flex items-center gap-4 px-5">
      <button
        onClick={onToggleSidebar}
        className="w-9 h-9 rounded-[9px] flex items-center justify-center text-ink-soft hover:bg-[#F2F4F1]"
      >
        <Menu size={18} />
      </button>

      <div className="relative flex-1 max-w-[420px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search packages, categories, questions..."
          className="w-full pl-9 pr-3 py-2.5 rounded-[9px] bg-[#F5F6F4] border border-transparent text-[13.5px] text-ink placeholder:text-ink-soft focus:outline-none focus:border-teal-400 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="w-9 h-9 rounded-[9px] flex items-center justify-center text-ink-soft hover:bg-[#F2F4F1]">
          <RefreshCw size={16} />
        </button>
        <button className="relative w-9 h-9 rounded-[9px] flex items-center justify-center text-ink-soft hover:bg-[#F2F4F1]">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral-600 border border-white" />
        </button>
        <button className="w-9 h-9 rounded-[9px] flex items-center justify-center text-ink-soft hover:bg-[#F2F4F1]">
          <Settings size={16} />
        </button>
        <div className="w-9 h-9 rounded-full bg-teal-900 text-white flex items-center justify-center text-[13px] font-semibold ml-1">
          A
        </div>
        <button
          onClick={onLogout}
          disabled={loggingOut}
          title="Logout"
          className="flex items-center gap-1.5 ml-1 px-3 py-2 rounded-[9px] border border-line text-ink-soft hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-[12.5px] font-semibold transition-colors disabled:opacity-60"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">{loggingOut ? "Signing out..." : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}