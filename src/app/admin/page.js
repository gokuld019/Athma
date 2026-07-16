"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  UserPlus,
  Plus,
  ChevronRight,
  FileQuestion,
  IndianRupee,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
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

// Helper to parse currency string with commas
function parseCurrency(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  // Remove commas and parse as float
  const cleaned = String(value).replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Brand palette pulled from the Athma logo — flat colors, no gradients
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

// Ring-style hover donut with segment thickening + center readout swap
function RingChart({ items, centerLabel, centerSubLabel, size = 168, hole = 116 }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const stops = buildDonut(items);
  const active = hoverIdx !== null ? stops[hoverIdx] : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
          {stops.map((s, idx) => {
            const r = 40;
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
                strokeWidth={isHovered ? 15 : 11}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full pointer-events-none" style={{ margin: (size - hole) / 2 }}>
          {active ? (
            <>
              <span className="text-[20px] font-bold" style={{ color: active.color }}>{active.value}</span>
              <span className="text-[10px] text-ink-soft text-center leading-tight px-3">{active.label}</span>
              <span className="text-[9.5px] font-semibold mt-0.5" style={{ color: active.color }}>{Math.round(active.pct)}%</span>
            </>
          ) : (
            <>
              <span className="text-[24px] font-bold" style={{ color: BRAND.navy }}>{centerLabel}</span>
              <span className="text-[10.5px] text-ink-soft">{centerSubLabel}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-5 w-full">
        {stops.map((s, idx) => (
          <button
            key={s.label}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
            className="flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 rounded-full transition-colors"
            style={{ background: hoverIdx === idx ? `${s.color}16` : "#F5F6F4", color: hoverIdx === idx ? s.color : "#5A5F58" }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            {s.label} · {s.value}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("athma_admin_token");
    if (!token) { router.replace("/admin/login"); return; }
    try {
      const stored = localStorage.getItem("athma_admin_user");
      if (stored) setAdminUser(JSON.parse(stored));
    } catch {}
    setCheckingAuth(false);
  }, [router]);

  const [view, setView] = useState({ level: "packages", packageId: null, categoryId: null });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [loggingOut, setLoggingOut] = useState(false);

  const [counts, setCounts] = useState(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Parse revenue values properly
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

  // Determine if we should show the coming soon message
  const isComingSoon = activeNav !== "dashboard" && 
                       activeNav !== "packages" && 
                       activeNav !== "users" && 
                       activeNav !== "patients" && 
                       activeNav !== "payments" && 
                       activeNav !== "assessments";

  return (
    <div className="min-h-screen flex bg-[#F4F6F8]">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        activeNav={activeNav}
        onNavClick={(key) => {
          setActiveNav(key);
          if (key === "packages") setView({ level: "packages", packageId: null, categoryId: null });
          if (key === "assessments") goToAssessments();
          if (key === "users") goToUsers();
          if (key === "patients") goToPatients();
        }}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          search={search}
          onSearchChange={setSearch}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="w-full py-4 max-w-[1560px] mx-auto">

            {/* Breadcrumb Header - Show for all pages */}
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-brand text-[25px] font-bold tracking-tight" style={{ color: BRAND.navy }}>
                  {activeNav === "dashboard" && "Dashboard"}
                  {activeNav === "packages" && "Packages"}
                  {activeNav === "users" && "Admin Users"}
                  {activeNav === "patients" && "Patients"}
                  {activeNav === "payments" && "Payments"}
                  {activeNav === "assessments" && "Assessments"}
                </h1>
                <div className="flex items-center gap-1.5 text-[12.5px] text-ink-soft mt-1.5">
                  <button 
                    onClick={goToDashboard} 
                    className={activeNav === "dashboard" ? "font-semibold" : "hover:text-ink"} 
                    style={activeNav === "dashboard" ? { color: BRAND.navy } : undefined}
                  >
                    Dashboard
                  </button>
                  
                  {activeNav === "packages" && (
                    <>
                      <ChevronRight size={13} />
                      <button onClick={goToPackages} className={view.level === "packages" ? "font-semibold" : "hover:text-ink"} style={view.level === "packages" ? { color: BRAND.navy } : undefined}>Packages</button>
                    </>
                  )}
                  
                  {activeNav === "users" && (
                    <>
                      <ChevronRight size={13} />
                      <span className="font-semibold" style={{ color: BRAND.navy }}>Admin Users</span>
                    </>
                  )}
                  
                  {activeNav === "patients" && (
                    <>
                      <ChevronRight size={13} />
                      <span className="font-semibold" style={{ color: BRAND.navy }}>Patients</span>
                    </>
                  )}
                  
                  {activeNav === "payments" && (
                    <>
                      <ChevronRight size={13} />
                      <span className="font-semibold" style={{ color: BRAND.navy }}>Payments</span>
                    </>
                  )}
                  
                  {activeNav === "assessments" && (
                    <>
                      <ChevronRight size={13} />
                      <span className="font-semibold" style={{ color: BRAND.navy }}>Assessments</span>
                    </>
                  )}
                </div>
              </div>
              {activeNav === "dashboard" && (
                <button onClick={fetchDashboardCounts} disabled={countsLoading} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#E7EAE7] text-ink-soft font-semibold text-[12.5px] hover:shadow-md transition-all disabled:opacity-60">
                  <RefreshCw size={14} className={countsLoading ? "animate-spin" : ""} /> Refresh
                </button>
              )}
            </div>

            {/* Dashboard Content */}
            {activeNav === "dashboard" && (
              <>
                {countsError && (
                  <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 mb-5 text-[13px]">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{countsError}</span>
                    <button onClick={fetchDashboardCounts} className="ml-auto font-semibold underline underline-offset-2">Retry</button>
                  </div>
                )}

                {countsLoading ? (
                  <div className="bg-white border border-[#E7EAE7] rounded-3xl px-6 py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={24} className="animate-spin" style={{ color: BRAND.coral }} />
                    <p className="text-ink-soft text-[13.5px]">Loading dashboard...</p>
                  </div>
                ) : (
                  <>
                    {/* ===== Hero strip — flat navy, thin left accent, no gradient blend ===== */}
                    <div className="relative overflow-hidden rounded-[10px] mb-6 pl-7 pr-6 py-6" style={{ background: BRAND.navy, borderLeft: `6px solid ${BRAND.coral}` }}>
                      <div className="flex items-center justify-between gap-6 flex-wrap">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-[20px] shrink-0" style={{ background: BRAND.coral }}>
                            {(adminUser?.name || "A").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#F2A98A" }}>
                              <Sparkles size={11} /> Athma Admin Console
                            </span>
                            <h2 className="font-brand text-[19px] font-bold text-white leading-tight">Welcome back, {adminUser?.name || "Admin"}</h2>
                            <p className="text-[12.5px] mt-0.5" style={{ color: "#AEBEDA" }}>
                              {packages.active ?? 0} active packages · {questions.total ?? 0} questions · {patients.total ?? 0} patients
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="hidden md:flex flex-col items-end px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
                            <span className="text-[10.5px]" style={{ color: "#AEBEDA" }}>Total revenue</span>
                            <span className="text-[17px] font-bold text-white flex items-center gap-0.5">
                              <IndianRupee size={13} />
                              {paymentsTotalRevenue.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <button onClick={goToPackages} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-[13px] hover:brightness-110 transition" style={{ background: BRAND.coral }}>
                            <Plus size={15} /> Add Package
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ===== KPI grid — flat left-border cards ===== */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                      {[
                        { label: "Total Packages", value: packages.total ?? 0, sub: `${packages.active ?? 0} active`, icon: Package, color: BRAND.coral },
                        { label: "Total Patients", value: patients.total ?? 0, sub: `+${patients.new_today ?? 0} today`, icon: Users, color: "#3B7DB8", up: (patients.new_this_week ?? 0) > 0 },
                        { label: "Total Questions", value: questions.total ?? 0, sub: `${subheadings.total ?? 0} subheadings`, icon: FileQuestion, color: BRAND.navy },
                        { label: "Total Revenue", value: `₹${paymentsTotalRevenue.toLocaleString("en-IN")}`, sub: `₹${paymentsRevenueToday.toLocaleString("en-IN")} today`, icon: TrendingUp, color: BRAND.green, up: (payments.today ?? 0) > 0 },
                      ].map((c) => (
                        <div key={c.label} className="bg-white rounded-2xl p-5 border border-[#E7EAE7] hover:shadow-[0_10px_26px_rgba(27,58,107,0.09)] hover:-translate-y-0.5 transition-all" style={{ borderLeft: `4px solid ${c.color}` }}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c.color}18` }}>
                              <c.icon size={17} style={{ color: c.color }} />
                            </span>
                            {c.up && <ArrowUpRight size={14} style={{ color: BRAND.green }} />}
                          </div>
                          <p className="text-[11.5px] text-ink-soft font-medium">{c.label}</p>
                          <p className="text-[23px] font-bold mt-0.5" style={{ color: BRAND.navy }}>{c.value}</p>
                          <p className="text-[10.5px] text-ink-soft mt-0.5">{c.sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "New This Week", value: patients.new_this_week ?? 0, icon: UserCheck, color: "#3B7DB8" },
                        { label: "New This Month", value: patients.new_this_month ?? 0, icon: CalendarDays, color: BRAND.navy },
                        { label: "Pending Payments", value: payments.pending ?? 0, icon: Clock, color: BRAND.gold },
                        { label: "Assessments Done", value: `${assessments.completed ?? 0}/${assessments.total ?? 0}`, icon: CheckCircle2, color: BRAND.green },
                      ].map((s) => (
                        <div key={s.label} className="bg-white border border-[#E7EAE7] rounded-2xl px-5 py-3.5 flex items-center gap-3 hover:border-[#1B3A6B]/25 transition-colors">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                            <s.icon size={15} style={{ color: s.color }} />
                          </span>
                          <div>
                            <p className="text-[11px] text-ink-soft">{s.label}</p>
                            <p className="text-[16px] font-bold" style={{ color: BRAND.navy }}>{s.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ===== Three ring charts side by side ===== */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
                      <div className="bg-white border border-[#E7EAE7] rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-brand text-[15px] font-bold" style={{ color: BRAND.navy }}>Question Types</h3>
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${BRAND.navy}14` }}>
                            <FileQuestion size={14} style={{ color: BRAND.navy }} />
                          </span>
                        </div>
                        <p className="text-ink-soft text-[11.5px] mb-3">Yes/No vs open text</p>
                        <RingChart
                          items={[{ label: "Yes / No", value: questions.yes_no ?? 0 }, { label: "Text", value: questions.text ?? 0 }]}
                          centerLabel={questions.total ?? 0}
                          centerSubLabel="total Qs"
                        />
                      </div>

                      <div className="bg-white border border-[#E7EAE7] rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-brand text-[15px] font-bold" style={{ color: BRAND.navy }}>Subheading Mix</h3>
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#3B7DB818" }}>
                            <ClipboardList size={14} style={{ color: "#3B7DB8" }} />
                          </span>
                        </div>
                        <p className="text-ink-soft text-[11.5px] mb-3">Volume by section</p>
                        {subheadingQuestions.length > 0 ? (
                          <RingChart
                            items={subheadingQuestions.map((s) => ({ label: s.name, value: s.question_count }))}
                            centerLabel={subheadings.total ?? 0}
                            centerSubLabel="sections"
                          />
                        ) : (
                          <p className="text-center text-[12px] text-ink-soft py-10">No data yet.</p>
                        )}
                      </div>

                      <div className="bg-white border border-[#E7EAE7] rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-brand text-[15px] font-bold" style={{ color: BRAND.navy }}>Package Share</h3>
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${BRAND.green}18` }}>
                            <Package size={14} style={{ color: BRAND.green }} />
                          </span>
                        </div>
                        <p className="text-ink-soft text-[11.5px] mb-3">Where questions live</p>
                        {activePackagesWithQs.length > 0 ? (
                          <RingChart
                            items={activePackagesWithQs.map((p) => ({ label: p.name, value: p.total_questions }))}
                            centerLabel={activePackagesWithQs.length}
                            centerSubLabel="packages"
                          />
                        ) : (
                          <p className="text-center text-[12px] text-ink-soft py-10">No data yet.</p>
                        )}
                      </div>
                    </div>

                    {/* ===== Bar chart — questions per package (all 6) ===== */}
                    <div className="bg-white border border-[#E7EAE7] rounded-3xl p-6 mb-5">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="font-brand text-[16px] font-bold" style={{ color: BRAND.navy }}>Questions per Package</h3>
                          <p className="text-ink-soft text-[12.5px] mt-0.5">All 6 packages, click to view</p>
                        </div>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.coral}18` }}>
                          <Layers size={16} style={{ color: BRAND.coral }} />
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {packageQuestions.map((p, idx) => {
                          const widthPct = Math.max(3, Math.round((p.total_questions / maxQPerPackage) * 100));
                          const c = CHART_PALETTE[idx % CHART_PALETTE.length];
                          return (
                            <button
                              key={p.id}
                              onClick={() => { setActiveNav("packages"); setView({ level: "categories", packageId: p.id, categoryId: null }); }}
                              className="text-left group/bar"
                            >
                              <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                                <span className="font-semibold text-ink flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                                  {p.name}
                                  <span className="text-[10.5px] font-normal text-ink-soft">{p.age_group}</span>
                                </span>
                                <span className="text-ink-soft font-medium">{p.total_questions} Qs · ₹{Number(p.price).toLocaleString("en-IN")}</span>
                              </div>
                              <div className="h-3 rounded-full bg-[#F1F3F1] overflow-hidden">
                                <div style={{ width: `${widthPct}%`, background: c }} className="h-3 rounded-full transition-all duration-700 ease-out group-hover/bar:brightness-110" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ===== Popular packages + payment health side by side ===== */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                      <div className="bg-white border border-[#E7EAE7] rounded-3xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EEF1EE] flex items-center justify-between">
                          <h3 className="font-brand text-[16px] font-bold" style={{ color: BRAND.navy }}>Popular Packages</h3>
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.coral}18` }}>
                            <TrendingUp size={16} style={{ color: BRAND.coral }} />
                          </span>
                        </div>
                        <div className="divide-y divide-[#EEF1EE]">
                          {popularPackages.map((p, idx) => (
                            <div key={p.package_id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F9FAF9] transition-colors">
                              <div className="flex items-center gap-3.5">
                                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-[13px]" style={{ background: CHART_PALETTE[idx % CHART_PALETTE.length] }}>{idx + 1}</span>
                                <div>
                                  <p className="text-[13.5px] font-semibold text-ink">{p.package_name}</p>
                                  <p className="text-[11.5px] text-ink-soft">{p.total_purchases} purchases</p>
                                </div>
                              </div>
                              <span className="font-bold text-[14px] flex items-center gap-0.5" style={{ color: BRAND.navy }}>
                                <IndianRupee size={13} />{parseCurrency(p.total_revenue).toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))}
                          {popularPackages.length === 0 && <p className="px-6 py-8 text-center text-[12.5px] text-ink-soft">No purchases yet.</p>}
                        </div>
                      </div>

                      <div className="bg-white border border-[#E7EAE7] rounded-3xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EEF1EE] flex items-center justify-between">
                          <h3 className="font-brand text-[16px] font-bold" style={{ color: BRAND.navy }}>Payment Health</h3>
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.green}18` }}>
                            <Wallet size={16} style={{ color: BRAND.green }} />
                          </span>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: `${BRAND.green}10` }}>
                            <CheckCircle2 size={20} style={{ color: BRAND.green }} />
                            <div>
                              <p className="text-[11px] text-ink-soft">Paid</p>
                              <p className="text-[18px] font-bold" style={{ color: BRAND.green }}>{payments.total ?? 0}</p>
                            </div>
                          </div>
                          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: `${BRAND.gold}10` }}>
                            <Clock size={20} style={{ color: BRAND.gold }} />
                            <div>
                              <p className="text-[11px] text-ink-soft">Pending</p>
                              <p className="text-[18px] font-bold" style={{ color: BRAND.gold }}>{payments.pending ?? 0}</p>
                            </div>
                          </div>
                          <div className="rounded-2xl p-4 flex items-center gap-3 col-span-2" style={{ background: "#A8432F10" }}>
                            <XCircle size={20} style={{ color: "#A8432F" }} />
                            <div>
                              <p className="text-[11px] text-ink-soft">Failed transactions</p>
                              <p className="text-[18px] font-bold" style={{ color: "#A8432F" }}>{payments.failed ?? 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ===== Recent activity + patients ===== */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="bg-white border border-[#E7EAE7] rounded-3xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EEF1EE] flex items-center justify-between">
                          <h3 className="font-brand text-[16px] font-bold" style={{ color: BRAND.navy }}>Recent Activity</h3>
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.gold}18` }}>
                            <Activity size={16} style={{ color: BRAND.gold }} />
                          </span>
                        </div>
                        <div className="divide-y divide-[#EEF1EE] max-h-[340px] overflow-y-auto">
                          {recentActivity.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 px-6 py-3.5 hover:bg-[#F9FAF9] transition-colors">
                              <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: activityColor(a.type) }}>
                                {activityIcon(a.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12.5px] text-ink">{a.message}</p>
                                <p className="text-[11px] text-ink-soft mt-0.5">{timeAgo(a.time)}</p>
                              </div>
                            </div>
                          ))}
                          {recentActivity.length === 0 && <p className="px-6 py-8 text-center text-[12.5px] text-ink-soft">No recent activity.</p>}
                        </div>
                      </div>

                      <div className="bg-white border border-[#E7EAE7] rounded-3xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EEF1EE] flex items-center justify-between">
                          <h3 className="font-brand text-[16px] font-bold" style={{ color: BRAND.navy }}>Recent Patients & Payments</h3>
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#3B7DB818" }}>
                            <Users size={16} style={{ color: "#3B7DB8" }} />
                          </span>
                        </div>
                        <div className="divide-y divide-[#EEF1EE] max-h-[340px] overflow-y-auto">
                          {recentPatients.map((p) => {
                            const payment = recentPayments.find((pay) => pay.user_name === p.name);
                            return (
                              <div key={p.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F9FAF9] transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[12px] shrink-0" style={{ background: BRAND.navy }}>
                                    {p.name.charAt(0).toUpperCase()}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-ink truncate">{p.name}</p>
                                    <p className="text-[11px] text-ink-soft truncate">{p.email}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  {payment && (
                                    <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: BRAND.green }}>
                                      <IndianRupee size={10} />
                                      {parseCurrency(payment.amount).toLocaleString("en-IN")}
                                    </span>
                                  )}
                                  <p className="text-[10.5px] text-ink-soft mt-0.5">{timeAgo(p.registered_at)}</p>
                                </div>
                              </div>
                            );
                          })}
                          {recentPatients.length === 0 && <p className="px-6 py-8 text-center text-[12.5px] text-ink-soft">No recent patients.</p>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Payments Page */}
            {activeNav === "payments" && <AdminPayments />}

            {/* Packages Page */}
            {activeNav === "packages" && <PackagesPage search={search} />}

            {/* Admin Users Page */}
            {activeNav === "users" && <AdminUsersPage />}

            {/* Patients Page */}
            {activeNav === "patients" && <PatientsPage />}

            {/* Assessments Page */}
            {activeNav === "assessments" && <AdminAssessments />}

            {/* Coming Soon for other sections */}
            {isComingSoon && (
              <div className="bg-white border border-[#E7EAE7] rounded-3xl px-6 py-16 text-center">
                <p className="text-ink-soft text-[13.5px]">This section is coming soon.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}