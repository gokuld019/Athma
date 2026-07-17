"use client";

import Image from "next/image";
import {
  Package,
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  ClipboardList,
  LogOut,
  CreditCard,
  X,
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

export default function AdminSidebar({ 
  sidebarOpen, 
  activeNav, 
  onNavClick, 
  onLogout, 
  loggingOut, 
  isMobile = false 
}) {
  const handleNavClick = (key) => {
    if (onNavClick) {
      onNavClick(key);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => handleNavClick(activeNav)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-teal-900 text-white flex flex-col h-screen
          transition-all duration-300 ease-in-out overflow-hidden
          ${isMobile 
            ? `fixed top-0 left-0 z-50 w-[280px] sm:w-[300px] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`
            : `sticky top-0 shrink-0 ${sidebarOpen ? 'w-[248px] lg:w-[260px] xl:w-[280px]' : 'w-[68px] sm:w-[72px] md:w-[76px]'}`
          }
        `}
      >
        {/* Mobile close button */}
        {isMobile && sidebarOpen && (
          <button
            onClick={() => handleNavClick(activeNav)}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} className="text-white" />
          </button>
        )}

        {/* Logo */}
        <div className={`
          flex items-center gap-3 mb-6 sm:mb-8 shrink-0
          ${sidebarOpen || isMobile 
            ? 'px-6 md:px-8 pt-5 md:pt-6' 
            : 'px-0 pt-5 justify-center'
          }
        `}>
          {sidebarOpen || isMobile ? (
            <div className="bg-white rounded-xl p-1.5 sm:p-2 shrink-0">
              <Image 
                src="/Athmalogo.webp" 
                alt="Athma" 
                width={140} 
                height={42} 
                className="object-contain w-[110px] h-[33px] sm:w-[120px] sm:h-[36px] md:w-[140px] md:h-[42px]"
                priority
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 shrink-0">
              <Image 
                src="/Athmalogo.webp" 
                alt="Athma" 
                width={40} 
                height={40} 
                className="object-contain w-[28px] h-[28px] sm:w-[32px] sm:h-[32px]"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`
          flex flex-col gap-4 sm:gap-5 md:gap-6 px-2 sm:px-3 flex-1 overflow-y-auto 
          scrollbar-thin scrollbar-thumb-teal-700 scrollbar-track-transparent
          ${!sidebarOpen && !isMobile ? 'px-1.5 items-center' : ''}
        `}>
          {navGroups.map((group) => (
            <div key={group.label} className={!sidebarOpen && !isMobile ? 'w-full flex flex-col items-center' : ''}>
              {(sidebarOpen || isMobile) && (
                <p className="px-3 mb-2 text-[9px] sm:text-[10px] md:text-[10.5px] font-semibold tracking-wider uppercase text-teal-300/70">
                  {group.label}
                </p>
              )}
              {!sidebarOpen && !isMobile && group.label === "Overview" && (
                <div className="w-6 sm:w-8 h-px bg-teal-700/50 mb-2" />
              )}
              <div className="flex flex-col gap-0.5 sm:gap-1 w-full">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavClick(item.key)}
                      title={!sidebarOpen && !isMobile ? item.label : undefined}
                      className={`
                        flex items-center gap-2 sm:gap-3 px-2.5 py-2.5 
                        rounded-[8px] sm:rounded-[10px] 
                        text-[12px] sm:text-[13px] md:text-[13.5px] font-medium 
                        transition-all duration-200 w-full
                        ${isActive 
                          ? 'bg-white/15 text-white shadow-lg shadow-black/10' 
                          : 'text-teal-100 hover:bg-white/5 hover:text-white'
                        } 
                        ${!sidebarOpen && !isMobile ? 'justify-center px-0' : ''}
                      `}
                    >
                      <span className={`
                        rounded-[6px] sm:rounded-[8px] flex items-center justify-center shrink-0
                        transition-all duration-200 ${item.chip}
                        ${sidebarOpen || isMobile 
                          ? 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8' 
                          : 'w-8 h-8 sm:w-9 sm:h-9'
                        }
                        ${isActive && (!sidebarOpen && !isMobile) ? 'ring-2 ring-white/20' : ''}
                      `}>
                        <Icon 
                          size={sidebarOpen || isMobile ? 13 : 15} 
                          className="text-white sm:w-[15px] sm:h-[15px]" 
                        />
                      </span>
                      {(sidebarOpen || isMobile) && (
                        <span className="whitespace-nowrap truncate">{item.label}</span>
                      )}
                      {isActive && (sidebarOpen || isMobile) && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle for desktop */}
        {!isMobile && (
          <div className="px-3 pt-2 shrink-0">
            <button
              onClick={() => handleNavClick('toggle')}
              className="w-full flex items-center justify-center py-2 rounded-[8px] hover:bg-white/5 transition-colors"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <div className="w-5 h-5 flex items-center justify-center text-teal-300/60">
                {sidebarOpen ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M4 2L2 6l2 4M8 2l2 4-2 4" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M2 2l4 4-4 4M10 2l-4 4 4 4" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Logout */}
        <div className={`
          px-2 sm:px-3 mt-3 sm:mt-4 pb-4 sm:pb-5 md:pb-6 shrink-0
          ${!sidebarOpen && !isMobile ? 'px-1 sm:px-1.5' : ''}
        `}>
          <button
            onClick={onLogout}
            disabled={loggingOut}
            title={!sidebarOpen && !isMobile ? "Logout" : undefined}
            className={`
              flex items-center gap-2 sm:gap-3 px-2.5 py-2.5 
              rounded-[8px] sm:rounded-[10px] text-[12px] sm:text-[13px] md:text-[13.5px] 
              font-medium text-rose-200 hover:bg-rose-500/10 hover:text-rose-100 
              transition-all duration-200 w-full disabled:opacity-60
              ${!sidebarOpen && !isMobile ? 'justify-center px-0' : ''}
            `}
          >
            <span className={`
              rounded-[6px] sm:rounded-[8px] flex items-center justify-center shrink-0 
              bg-rose-500/80
              ${sidebarOpen || isMobile ? 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'}
            `}>
              <LogOut size={sidebarOpen || isMobile ? 13 : 15} className="text-white sm:w-[15px] sm:h-[15px]" />
            </span>
            {(sidebarOpen || isMobile) && (
              <span className="whitespace-nowrap truncate">
                {loggingOut ? "Signing out..." : "Logout"}
              </span>
            )}
          </button>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 4px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 20px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.25);
          }
        `}</style>
      </aside>
    </>
  );
}