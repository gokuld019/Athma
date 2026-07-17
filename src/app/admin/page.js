"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import PackagesPage from "@/components/PackagesPage";
import AdminUsersPage from "@/components/AdminUsersPage";
import PatientsPage from "@/components/PatientsPage";
import AdminPayments from "@/components/Payments";
import AdminAssessments from "@/components/assesment";
import {
  Package,
  Users,
  Plus,
  ChevronRight,
  FileQuestion,
  IndianRupee,
  CalendarDays,
  ClipboardList,
  Layers,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wallet,
  UserCheck,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
} from "lucide-react";

const API_BASE_URL = "https://api.crazystory.in/api";
const DASHBOARD_COUNTS_URL = `${API_BASE_URL}/admin/dashboard/counts`;

function timeAgo(isoString) {
  if (!isoString) return "";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function parseCurrency(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

const BRAND = { navy: "#1B3A6B", coral: "#F2622E", green: "#2F6B3A", gold: "#C9A227" };
const CHART_PALETTE = ["#F2622E", "#1B3A6B", "#2F6B3A", "#C9A227", "#3B7DB8", "#A8432F", "#5A7247", "#8C5A2B"];

function buildDonut(items) {
  const total = items.reduce((s, i) => s + (i.value || 0), 0) || 1;
  let acc = 0;
  return items.map((item, idx) => {
    const pct = (item.value / total) * 100;
    const start = acc;
    acc += pct;
    return { ...item, pct, start, end: acc, color: CHART_PALETTE[idx % CHART_PALETTE.length] };
  });
}

function RingChart({ items, centerLabel, centerSubLabel }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const [chartSize, setChartSize] = useState(168);
  const stops = buildDonut(items);
  const active = hoverIdx !== null ? stops[hoverIdx] : null;
  
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 360) setChartSize(120);
      else if (width < 480) setChartSize(140);
      else if (width < 640) setChartSize(150);
      else if (width < 1024) setChartSize(155);
      else if (width < 1280) setChartSize(165);
      else setChartSize(180);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const r = 38;
  const strokeW = 11;
  const hoverStrokeW = 15;
  const hole = chartSize * 0.62;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative mx-auto" style={{ width: chartSize, height: chartSize, maxWidth: '100%' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" className="-rotate-90" style={{ maxWidth: chartSize }}>
          {stops.map((s, idx) => {
            const circ = 2 * Math.PI * r;
            const dash = (s.pct / 100) * circ;
            const gap = circ - dash;
            const offset = (s.start / 100) * circ;
            const isHovered = hoverIdx === idx;
            return (
              <circle
                key={s.label}
                cx="50" cy="50" r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={isHovered ? hoverStrokeW : strokeW}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                opacity={hoverIdx === null || isHovered ? 1 : 0.3}
                style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            );
          })}
        </svg>
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center rounded-full pointer-events-none"
          style={{ margin: `${(chartSize - hole) / 2}px` }}
        >
          {active ? (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-tight" style={{ color: active.color }}>
                {active.value}
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] text-ink-soft text-center leading-tight px-1 mt-0.5">
                {active.label}
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold mt-0.5" style={{ color: active.color }}>
                {Math.round(active.pct)}%
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] font-bold leading-tight" style={{ color: BRAND.navy }}>
                {centerLabel}
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] text-ink-soft mt-0.5">
                {centerSubLabel}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-1.5 sm:gap-y-2 mt-3 sm:mt-4 w-full">
        {stops.map((s, idx) => (
          <button
            key={s.label}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
            className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] md:text-[11.5px] font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-colors whitespace-nowrap"
            style={{ background: hoverIdx === idx ? `${s.color}16` : "#F5F6F4", color: hoverIdx === idx ? s.color : "#5A5F58" }}
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="truncate max-w-[80px] xs:max-w-[100px] sm:max-w-[120px]">{s.label}</span> · {s.value}
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminDashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState({ level: "packages", packageId: null, categoryId: null });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [counts, setCounts] = useState(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState("");

  const activeNav = searchParams.get("tab") || "dashboard";

  const setActiveNav = (tab) => {
    router.push(`/admin?tab=${tab}`);
  };

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("athma_admin_token");
    if (!token) { router.replace("/admin/login"); return; }
    try {
      const stored = localStorage.getItem("athma_admin_user");
      if (stored) setAdminUser(JSON.parse(stored));
    } catch {}
    setCheckingAuth(false);
  }, [router]);

  // Responsive handler
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDashboardCounts = async () => {
    setCountsLoading(true);
    setCountsError("");
    try {
      const token = localStorage.getItem("athma_admin_token");
      const tokenType = localStorage.getItem("athma_admin_token_type") || "Bearer";
      const res = await fetch(DASHBOARD_COUNTS_URL, {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `${tokenType} ${token}` },
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result || result.status !== "success") {
        if (res.status === 401) {
          localStorage.removeItem("athma_admin_token");
          localStorage.removeItem("athma_admin_token_type");
          localStorage.removeItem("athma_admin_user");
          router.replace("/admin/login");
          return;
        }
        setCountsError(result?.message || "Couldn't load dashboard data.");
        setCountsLoading(false);
        return;
      }
      setCounts(result.data);
      setCountsLoading(false);
    } catch {
      setCountsError("Couldn't reach the server. Check your connection and try again.");
      setCountsLoading(false);
    }
  };

  useEffect(() => {
    if (checkingAuth) return;
    fetchDashboardCounts();
  }, [checkingAuth]);

  const goToDashboard = () => setActiveNav("dashboard");
  const goToPackages = () => { setActiveNav("packages"); setView({ level: "packages", packageId: null, categoryId: null }); };
  const goToPayments = () => { setActiveNav("payments"); };
  const goToAssessments = () => { setActiveNav("assessments"); };
  const goToUsers = () => { setActiveNav("users"); };
  const goToPatients = () => { setActiveNav("patients"); };

  const handleLogout = () => {
    if (loggingOut) return;
    if (!confirm("Sign out of the admin console?")) return;
    setLoggingOut(true);
    localStorage.removeItem("athma_admin_token");
    localStorage.removeItem("athma_admin_token_type");
    localStorage.removeItem("athma_admin_user");
    router.push("/admin/login");
  };

  // Parse counts data
  const patients = counts?.patients ?? {};
  const packages = counts?.packages ?? {};
  const subheadings = counts?.subheadings ?? {};
  const questions = counts?.questions ?? {};
  const payments = counts?.payments ?? {};
  const assessments = counts?.assessments ?? {};
  const packageQuestions = counts?.package_questions ?? [];
  const subheadingQuestions = counts?.subheading_questions ?? [];
  const popularPackages = counts?.popular_packages ?? [];
  const recentPatients = counts?.recent_patients ?? [];
  const recentPayments = counts?.recent_payments ?? [];
  const recentActivity = counts?.recent_activity ?? [];

  const paymentsTotalRevenue = parseCurrency(payments.total_revenue);
  const paymentsRevenueToday = parseCurrency(payments.revenue_today);
  const maxQPerPackage = Math.max(1, ...packageQuestions.map((p) => p.total_questions || 0));
  const activePackagesWithQs = packageQuestions.filter((p) => p.total_questions > 0);

  const activityIcon = (type) => {
    if (type === "payment") return <Wallet size={13} className="text-white" />;
    if (type === "registration") return <UserCheck size={13} className="text-white" />;
    if (type === "assessment") return <ClipboardList size={13} className="text-white" />;
    return <Activity size={13} className="text-white" />;
  };
  
  const activityColor = (type) => {
    if (type === "payment") return BRAND.green;
    if (type === "registration") return "#3B7DB8";
    if (type === "assessment") return BRAND.gold;
    return "#8A8F87";
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={22} className="animate-spin" style={{ color: BRAND.coral }} />
          <p className="text-ink-soft text-sm">Checking session...</p>
        </div>
      </div>
    );
  }

  const isComingSoon = activeNav !== "dashboard" && 
                       activeNav !== "packages" && 
                       activeNav !== "users" && 
                       activeNav !== "patients" && 
                       activeNav !== "payments" && 
                       activeNav !== "assessments";

  return (
    <div className="min-h-screen flex bg-[#F4F6F8]">
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        sidebarOpen={sidebarOpen}
        activeNav={activeNav}
        onNavClick={(key) => {
          if (key === 'toggle') {
            setSidebarOpen((s) => !s);
            return;
          }
          setActiveNav(key);
          if (key === "packages") setView({ level: "packages", packageId: null, categoryId: null });
          if (key === "assessments") goToAssessments();
          if (key === "users") goToUsers();
          if (key === "patients") goToPatients();
          if (isMobile) setSidebarOpen(false);
        }}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          search={search}
          onSearchChange={setSearch}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-3 sm:py-4 max-w-[1920px] mx-auto">
            {/* Breadcrumb Header */}
            <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="font-brand text-xl sm:text-2xl md:text-[25px] font-bold tracking-tight truncate" style={{ color: BRAND.navy }}>
                  {activeNav === "dashboard" && "Dashboard"}
                  {activeNav === "packages" && "Packages"}
                  {activeNav === "users" && "Admin Users"}
                  {activeNav === "patients" && "Patients"}
                  {activeNav === "payments" && "Payments"}
                  {activeNav === "assessments" && "Assessments"}
                </h1>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs md:text-[12.5px] text-ink-soft mt-1 sm:mt-1.5 flex-wrap">
                  <button 
                    onClick={goToDashboard} 
                    className={`whitespace-nowrap ${activeNav === "dashboard" ? "font-semibold" : "hover:text-ink"} transition-colors`}
                    style={activeNav === "dashboard" ? { color: BRAND.navy } : undefined}
                  >
                    Dashboard
                  </button>
                  
                  {(activeNav === "packages" || activeNav === "users" || activeNav === "patients" || 
                    activeNav === "payments" || activeNav === "assessments") && (
                    <>
                      <ChevronRight size={12} className="shrink-0" />
                      <span className="font-semibold whitespace-nowrap truncate" style={{ color: BRAND.navy }}>
                        {activeNav === "packages" && "Packages"}
                        {activeNav === "users" && "Admin Users"}
                        {activeNav === "patients" && "Patients"}
                        {activeNav === "payments" && "Payments"}
                        {activeNav === "assessments" && "Assessments"}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {activeNav === "dashboard" && (
                <button 
                  onClick={fetchDashboardCounts} 
                  disabled={countsLoading} 
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white border border-[#E7EAE7] text-ink-soft font-semibold text-[11px] sm:text-xs md:text-[12.5px] hover:shadow-md transition-all disabled:opacity-60 w-fit whitespace-nowrap self-start sm:self-auto"
                >
                  <RefreshCw size={13} className={`${countsLoading ? "animate-spin" : ""}`} /> 
                  <span>Refresh</span>
                </button>
              )}
            </div>

            {/* Dashboard Content */}
            {activeNav === "dashboard" && (
              <>
                {countsError && (
                  <div className="flex items-start gap-2 sm:gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-[11px] sm:text-xs md:text-[13px]">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span className="flex-1">{countsError}</span>
                    <button onClick={fetchDashboardCounts} className="ml-auto font-semibold underline underline-offset-2 whitespace-nowrap text-[11px] sm:text-xs">Retry</button>
                  </div>
                )}

                {countsLoading ? (
                  <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-16 sm:py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={22} className="animate-spin" style={{ color: BRAND.coral }} />
                    <p className="text-ink-soft text-xs sm:text-sm">Loading dashboard...</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    {/* Hero strip */}
                    <div className="relative overflow-hidden rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6" style={{ background: BRAND.navy, borderLeft: `4px solid ${BRAND.coral}` }}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-10 h-10 sm:w-12 md:w-14 sm:h-12 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg md:text-xl shrink-0" style={{ background: BRAND.coral }}>
                            {(adminUser?.name || "A").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] md:text-[10.5px] font-semibold uppercase tracking-wider mb-0.5 sm:mb-1" style={{ color: "#F2A98A" }}>
                              <Sparkles size={10} className="sm:w-[11px] sm:h-[11px]" /> Athma Admin Console
                            </span>
                            <h2 className="font-brand text-base sm:text-lg md:text-xl font-bold text-white leading-tight truncate">
                              Welcome back, {adminUser?.name || "Admin"}
                            </h2>
                            <p className="text-[10px] sm:text-[11px] md:text-xs mt-0.5" style={{ color: "#AEBEDA" }}>
                              {packages.active ?? 0} active packages · {questions.total ?? 0} questions · {patients.total ?? 0} patients
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                          <div className="hidden lg:flex flex-col items-end px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
                            <span className="text-[10px] md:text-[10.5px]" style={{ color: "#AEBEDA" }}>Total revenue</span>
                            <span className="text-base sm:text-lg font-bold text-white flex items-center gap-0.5">
                              <IndianRupee size={12} className="sm:w-[13px] sm:h-[13px]" />
                              {paymentsTotalRevenue.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <button 
                            onClick={goToPackages} 
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-white font-semibold text-[11px] sm:text-xs md:text-[13px] hover:brightness-110 transition whitespace-nowrap" 
                            style={{ background: BRAND.coral }}
                          >
                            <Plus size={13} className="sm:w-[15px] sm:h-[15px]" /> 
                            <span className="hidden xs:inline">Add Package</span>
                            <span className="xs:hidden">Add</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* KPI grid - 2 cols on mobile, 4 cols on desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                      {[
                        { label: "Packages", value: packages.total ?? 0, sub: `${packages.active ?? 0} active`, icon: Package, color: BRAND.coral },
                        { label: "Patients", value: patients.total ?? 0, sub: `+${patients.new_today ?? 0} today`, icon: Users, color: "#3B7DB8", up: (patients.new_this_week ?? 0) > 0 },
                        { label: "Questions", value: questions.total ?? 0, sub: `${subheadings.total ?? 0} subheadings`, icon: FileQuestion, color: BRAND.navy },
                        { label: "Revenue", value: `₹${paymentsTotalRevenue.toLocaleString("en-IN")}`, sub: `₹${paymentsRevenueToday.toLocaleString("en-IN")} today`, icon: TrendingUp, color: BRAND.green, up: (payments.today ?? 0) > 0 },
                      ].map((c) => (
                        <div key={c.label} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-[#E7EAE7] hover:shadow-lg transition-all" style={{ borderLeft: `3px solid ${c.color}` }}>
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <span className="w-8 h-8 sm:w-9 md:w-10 sm:h-9 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ background: `${c.color}18` }}>
                              <c.icon size={15} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px]" style={{ color: c.color }} />
                            </span>
                            {c.up && <ArrowUpRight size={14} style={{ color: BRAND.green }} />}
                          </div>
                          <p className="text-[10px] sm:text-[11px] md:text-[11.5px] text-ink-soft font-medium truncate">{c.label}</p>
                          <p className="text-lg sm:text-xl md:text-[22px] font-bold mt-0.5 truncate" style={{ color: BRAND.navy }}>{c.value}</p>
                          <p className="text-[9px] sm:text-[10px] md:text-[10.5px] text-ink-soft mt-0.5 truncate">{c.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Secondary stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                      {[
                        { label: "New This Week", value: patients.new_this_week ?? 0, icon: UserCheck, color: "#3B7DB8" },
                        { label: "New This Month", value: patients.new_this_month ?? 0, icon: CalendarDays, color: BRAND.navy },
                        { label: "Pending", value: payments.pending ?? 0, icon: Clock, color: BRAND.gold },
                        { label: "Assessments", value: `${assessments.completed ?? 0}/${assessments.total ?? 0}`, icon: CheckCircle2, color: BRAND.green },
                      ].map((s) => (
                        <div key={s.label} className="bg-white border border-[#E7EAE7] rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 flex items-center gap-2 sm:gap-3 hover:border-[#1B3A6B]/25 transition-colors">
                          <span className="w-7 h-7 sm:w-8 md:w-9 sm:h-8 md:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                            <s.icon size={13} className="sm:w-[14px] sm:h-[14px] md:w-[15px] md:h-[15px]" style={{ color: s.color }} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] md:text-[11px] text-ink-soft truncate">{s.label}</p>
                            <p className="text-sm sm:text-base md:text-[16px] font-bold truncate" style={{ color: BRAND.navy }}>{s.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ring charts grid - 1 col mobile, 2 col tablet, 3 col desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                      <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div>
                            <h3 className="font-brand text-sm sm:text-base md:text-[15px] font-bold" style={{ color: BRAND.navy }}>Question Types</h3>
                            <p className="text-ink-soft text-[10px] sm:text-[11px] md:text-[11.5px]">Yes/No vs open text</p>
                          </div>
                          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${BRAND.navy}14` }}>
                            <FileQuestion size={12} className="sm:w-[14px] sm:h-[14px]" style={{ color: BRAND.navy }} />
                          </span>
                        </div>
                        <RingChart
                          items={[{ label: "Yes / No", value: questions.yes_no ?? 0 }, { label: "Text", value: questions.text ?? 0 }]}
                          centerLabel={questions.total ?? 0}
                          centerSubLabel="total Qs"
                        />
                      </div>

                      <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div>
                            <h3 className="font-brand text-sm sm:text-base md:text-[15px] font-bold" style={{ color: BRAND.navy }}>Subheading Mix</h3>
                            <p className="text-ink-soft text-[10px] sm:text-[11px] md:text-[11.5px]">Volume by section</p>
                          </div>
                          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#3B7DB818" }}>
                            <ClipboardList size={12} className="sm:w-[14px] sm:h-[14px]" style={{ color: "#3B7DB8" }} />
                          </span>
                        </div>
                        {subheadingQuestions.length > 0 ? (
                          <RingChart
                            items={subheadingQuestions.map((s) => ({ label: s.name, value: s.question_count }))}
                            centerLabel={subheadings.total ?? 0}
                            centerSubLabel="sections"
                          />
                        ) : (
                          <p className="text-center text-[11px] sm:text-xs text-ink-soft py-8 sm:py-10">No data yet.</p>
                        )}
                      </div>

                      <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div>
                            <h3 className="font-brand text-sm sm:text-base md:text-[15px] font-bold" style={{ color: BRAND.navy }}>Package Share</h3>
                            <p className="text-ink-soft text-[10px] sm:text-[11px] md:text-[11.5px]">Where questions live</p>
                          </div>
                          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${BRAND.green}18` }}>
                            <Package size={12} className="sm:w-[14px] sm:h-[14px]" style={{ color: BRAND.green }} />
                          </span>
                        </div>
                        {activePackagesWithQs.length > 0 ? (
                          <RingChart
                            items={activePackagesWithQs.map((p) => ({ label: p.name, value: p.total_questions }))}
                            centerLabel={activePackagesWithQs.length}
                            centerSubLabel="packages"
                          />
                        ) : (
                          <p className="text-center text-[11px] sm:text-xs text-ink-soft py-8 sm:py-10">No data yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Bar chart */}
                    <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
                      <div className="flex items-center justify-between mb-4 sm:mb-5">
                        <div>
                          <h3 className="font-brand text-sm sm:text-base md:text-[16px] font-bold" style={{ color: BRAND.navy }}>Questions per Package</h3>
                          <p className="text-ink-soft text-[10px] sm:text-[11px] md:text-xs mt-0.5">Click to view details</p>
                        </div>
                        <span className="w-7 h-7 sm:w-8 md:w-9 sm:h-8 md:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BRAND.coral}18` }}>
                          <Layers size={14} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px]" style={{ color: BRAND.coral }} />
                        </span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-3 sm:gap-y-4">
                        {packageQuestions.map((p, idx) => {
                          const widthPct = Math.max(3, Math.round((p.total_questions / maxQPerPackage) * 100));
                          const c = CHART_PALETTE[idx % CHART_PALETTE.length];
                          return (
                            <button
                              key={p.id}
                              onClick={() => { setActiveNav("packages"); setView({ level: "categories", packageId: p.id, categoryId: null }); }}
                              className="text-left group/bar w-full"
                            >
                              <div className="flex items-center justify-between text-[10px] sm:text-[11px] md:text-xs mb-1 sm:mb-1.5 gap-2">
                                <span className="font-semibold text-ink flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                                  <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shrink-0" style={{ background: c }} />
                                  <span className="truncate">{p.name}</span>
                                </span>
                                <span className="text-ink-soft font-medium text-[10px] sm:text-[11px] md:text-xs whitespace-nowrap shrink-0">
                                  {p.total_questions} Qs · ₹{Number(p.price).toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="h-2 sm:h-2.5 md:h-3 rounded-full bg-[#F1F3F1] overflow-hidden">
                                <div style={{ width: `${widthPct}%`, background: c }} className="h-2 sm:h-2.5 md:h-3 rounded-full transition-all duration-700 ease-out group-hover/bar:brightness-110" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Popular packages + payment health */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                      <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl overflow-hidden">
                        <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-[#EEF1EE] flex items-center justify-between">
                          <h3 className="font-brand text-sm sm:text-base md:text-[16px] font-bold" style={{ color: BRAND.navy }}>Popular Packages</h3>
                          <span className="w-7 h-7 sm:w-8 md:w-9 sm:h-8 md:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BRAND.coral}18` }}>
                            <TrendingUp size={14} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px]" style={{ color: BRAND.coral }} />
                          </span>
                        </div>
                        <div className="divide-y divide-[#EEF1EE] max-h-[300px] sm:max-h-[340px] overflow-y-auto">
                          {popularPackages.map((p, idx) => (
                            <div key={p.package_id} className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 sm:py-4 hover:bg-[#F9FAF9] transition-colors gap-3">
                              <div className="flex items-center gap-2.5 sm:gap-3 md:gap-3.5 min-w-0 flex-1">
                                <span className="w-7 h-7 sm:w-8 md:w-9 sm:h-8 md:h-9 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-[11px] sm:text-xs md:text-[13px] shrink-0" style={{ background: CHART_PALETTE[idx % CHART_PALETTE.length] }}>{idx + 1}</span>
                                <div className="min-w-0">
                                  <p className="text-[11px] sm:text-xs md:text-[13.5px] font-semibold text-ink truncate">{p.package_name}</p>
                                  <p className="text-[10px] sm:text-[11px] md:text-[11.5px] text-ink-soft">{p.total_purchases} purchases</p>
                                </div>
                              </div>
                              <span className="font-bold text-[11px] sm:text-xs md:text-sm flex items-center gap-0.5 whitespace-nowrap shrink-0" style={{ color: BRAND.navy }}>
                                <IndianRupee size={11} className="sm:w-[12px] sm:h-[12px] md:w-[13px] md:h-[13px]" />{parseCurrency(p.total_revenue).toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))}
                          {popularPackages.length === 0 && (
                            <p className="px-4 sm:px-6 py-6 sm:py-8 text-center text-[11px] sm:text-xs text-ink-soft">No purchases yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl overflow-hidden">
                        <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-[#EEF1EE] flex items-center justify-between">
                          <h3 className="font-brand text-sm sm:text-base md:text-[16px] font-bold" style={{ color: BRAND.navy }}>Payment Health</h3>
                          <span className="w-7 h-7 sm:w-8 md:w-9 sm:h-8 md:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BRAND.green}18` }}>
                            <Wallet size={14} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px]" style={{ color: BRAND.green }} />
                          </span>
                        </div>
                        <div className="p-4 sm:p-5 md:p-6 grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
                          <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3" style={{ background: `${BRAND.green}10` }}>
                            <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px] shrink-0" style={{ color: BRAND.green }} />
                            <div className="min-w-0">
                              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-ink-soft">Paid</p>
                              <p className="text-base sm:text-lg md:text-[18px] font-bold" style={{ color: BRAND.green }}>{payments.total ?? 0}</p>
                            </div>
                          </div>
                          <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3" style={{ background: `${BRAND.gold}10` }}>
                            <Clock size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px] shrink-0" style={{ color: BRAND.gold }} />
                            <div className="min-w-0">
                              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-ink-soft">Pending</p>
                              <p className="text-base sm:text-lg md:text-[18px] font-bold" style={{ color: BRAND.gold }}>{payments.pending ?? 0}</p>
                            </div>
                          </div>
                          <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 col-span-2" style={{ background: "#A8432F10" }}>
                            <XCircle size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px] shrink-0" style={{ color: "#A8432F" }} />
                            <div className="min-w-0">
                              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-ink-soft">Failed transactions</p>
                              <p className="text-base sm:text-lg md:text-[18px] font-bold" style={{ color: "#A8432F" }}>{payments.failed ?? 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent activity + patients */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                      <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl overflow-hidden">
                        <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-[#EEF1EE] flex items-center justify-between">
                          <h3 className="font-brand text-sm sm:text-base md:text-[16px] font-bold" style={{ color: BRAND.navy }}>Recent Activity</h3>
                          <span className="w-7 h-7 sm:w-8 md:w-9 sm:h-8 md:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BRAND.gold}18` }}>
                            <Activity size={14} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px]" style={{ color: BRAND.gold }} />
                          </span>
                        </div>
                        <div className="divide-y divide-[#EEF1EE] max-h-[300px] sm:max-h-[340px] overflow-y-auto">
                          {recentActivity.map((a, i) => (
                            <div key={i} className="flex items-start gap-2.5 sm:gap-3 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 hover:bg-[#F9FAF9] transition-colors">
                              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: activityColor(a.type) }}>
                                {activityIcon(a.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] sm:text-xs md:text-[12.5px] text-ink">{a.message}</p>
                                <p className="text-[10px] sm:text-[11px] text-ink-soft mt-0.5">{timeAgo(a.time)}</p>
                              </div>
                            </div>
                          ))}
                          {recentActivity.length === 0 && (
                            <p className="px-4 sm:px-6 py-6 sm:py-8 text-center text-[11px] sm:text-xs text-ink-soft">No recent activity.</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl overflow-hidden">
                        <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-[#EEF1EE] flex items-center justify-between">
                          <h3 className="font-brand text-sm sm:text-base md:text-[16px] font-bold" style={{ color: BRAND.navy }}>Recent Patients</h3>
                          <span className="w-7 h-7 sm:w-8 md:w-9 sm:h-8 md:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: "#3B7DB818" }}>
                            <Users size={14} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px]" style={{ color: "#3B7DB8" }} />
                          </span>
                        </div>
                        <div className="divide-y divide-[#EEF1EE] max-h-[300px] sm:max-h-[340px] overflow-y-auto">
                          {recentPatients.map((p) => {
                            const payment = recentPayments.find((pay) => pay.user_name === p.name);
                            return (
                              <div key={p.id} className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 hover:bg-[#F9FAF9] transition-colors gap-3">
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                  <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white font-bold text-[11px] sm:text-xs shrink-0" style={{ background: BRAND.navy }}>
                                    {p.name.charAt(0).toUpperCase()}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[11px] sm:text-xs md:text-[13px] font-semibold text-ink truncate">{p.name}</p>
                                    <p className="text-[10px] sm:text-[11px] text-ink-soft truncate">{p.email}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  {payment && (
                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] md:text-[11.5px] font-semibold" style={{ color: BRAND.green }}>
                                      <IndianRupee size={10} className="sm:w-[10px] sm:h-[10px]" />
                                      {parseCurrency(payment.amount).toLocaleString("en-IN")}
                                    </span>
                                  )}
                                  <p className="text-[9px] sm:text-[10px] md:text-[10.5px] text-ink-soft mt-0.5">{timeAgo(p.registered_at)}</p>
                                </div>
                              </div>
                            );
                          })}
                          {recentPatients.length === 0 && (
                            <p className="px-4 sm:px-6 py-6 sm:py-8 text-center text-[11px] sm:text-xs text-ink-soft">No recent patients.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Other Pages */}
            {activeNav === "payments" && <AdminPayments />}
            {activeNav === "packages" && <PackagesPage search={search} />}
            {activeNav === "users" && <AdminUsersPage />}
            {activeNav === "patients" && <PatientsPage />}
            {activeNav === "assessments" && <AdminAssessments />}

            {isComingSoon && (
              <div className="bg-white border border-[#E7EAE7] rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-12 sm:py-16 text-center">
                <p className="text-ink-soft text-xs sm:text-sm">This section is coming soon.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={22} className="animate-spin" style={{ color: BRAND.coral }} />
            <p className="text-ink-soft text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <AdminDashboardPageInner />
    </Suspense>
  );
}