"use client";

import { useState } from "react";
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown,
  LogOut,
  Settings,
  User,
  X
} from "lucide-react";

export default function AdminHeader({ 
  sidebarOpen, 
  onToggleSidebar, 
  search, 
  onSearchChange, 
  onLogout, 
  loggingOut 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E7EAE7]">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3">
        {/* Left section */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <X size={20} className="text-gray-600 sm:w-[22px] sm:h-[22px]" />
            ) : (
              <Menu size={20} className="text-gray-600 sm:w-[22px] sm:h-[22px]" />
            )}
          </button>

          {/* Search bar - hidden on mobile unless toggled */}
          <div className={`
            relative flex-1 max-w-[600px]
            ${showMobileSearch ? 'block' : 'hidden sm:block'}
          `}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:w-[18px] sm:h-[18px]" />
            <input
              type="text"
              placeholder="Search packages, patients..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-[#E7EAE7] rounded-xl text-[13px] sm:text-sm bg-[#FCFDFC] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="w-9 h-9 sm:hidden rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
            aria-label="Toggle search"
          >
            <Search size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notification button */}
          <button 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors relative shrink-0"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-gray-600 sm:w-[20px] sm:h-[20px]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-900 flex items-center justify-center text-white font-semibold text-[13px] sm:text-sm shrink-0">
                A
              </div>
              <div className="hidden md:flex items-center gap-1">
                <span className="text-[13px] sm:text-sm font-medium text-gray-700">Admin</span>
                <ChevronDown size={14} className="text-gray-400 sm:w-[16px] sm:h-[16px]" />
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-lg border border-[#E7EAE7] py-1.5 z-20">
                  <div className="px-4 py-2.5 sm:py-3 border-b border-[#E7EAE7] md:hidden">
                    <p className="text-[13px] sm:text-sm font-medium text-gray-900">Admin</p>
                    <p className="text-[11px] sm:text-xs text-gray-500">admin@athma.com</p>
                  </div>
                  
                  <button className="w-full flex items-center gap-2.5 sm:gap-3 px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User size={16} className="text-gray-400 sm:w-[18px] sm:h-[18px]" />
                    Profile
                  </button>
                  
                  <button className="w-full flex items-center gap-2.5 sm:gap-3 px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings size={16} className="text-gray-400 sm:w-[18px] sm:h-[18px]" />
                    Settings
                  </button>
                  
                  <div className="border-t border-[#E7EAE7] my-1.5" />
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 sm:gap-3 px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-60"
                  >
                    <LogOut size={16} className="text-rose-400 sm:w-[18px] sm:h-[18px]" />
                    {loggingOut ? "Signing out..." : "Logout"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}