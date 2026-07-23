// components/AssessmentComponents.js
"use client";

import { useRef, useState } from "react";
import {
  XCircle,
  CheckCircle2,
  Clock,
  Circle,
  BadgeCheck,
  Download,
  Loader2,
  Package,
  User,
  Mail,
  Phone,
  Calendar,
  Check,
  X,
  ArrowLeft,
  ListChecks,
  Sparkles,
  Activity,
  Heart,
  Brain,
  Stethoscope,
  Square,
  CheckSquare,
  AlertTriangle,
  Wind,
  Zap,
  Shield,
} from "lucide-react";

// ---- Helper Functions ----
export function formatEpiValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "object") {
    if (value.personality_type) return value.personality_type;
    const parts = [];
    if (value.e_score !== undefined) parts.push(`E:${value.e_score}`);
    if (value.n_score !== undefined) parts.push(`N:${value.n_score}`);
    if (value.l_score !== undefined) parts.push(`L:${value.l_score}`);
    return parts.length > 0 ? parts.join(" ") : JSON.stringify(value);
  }
  
  // Handle JOBS scores - convert numeric scores to labels
  const numValue = Number(value);
  if (!isNaN(numValue) && numValue >= 1 && numValue <= 6) {
    const labels = {
      1: "Disagree very much",
      2: "Disagree moderately",
      3: "Disagree slightly",
      4: "Agree slightly",
      5: "Agree moderately",
      6: "Agree very much",
    };
    return labels[numValue] || value;
  }
  
  return value;
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

export async function loadPdfLibs() {
  if (!window.jspdf) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  }
}

// ---- Color Helper Functions ----
export function getPHQ9SeverityColor(label) {
  const config = PHQ9_SEVERITY_CONFIG[label];
  return config ? config.color : "#64748B";
}

export function getPHQ9ScoreColor(score) {
  if (score === 0) return "#CBD5E1";
  if (score === 1) return "#84CC16";
  if (score === 2) return "#E85720";
  if (score === 3) return "#DC2626";
  return "#CBD5E1";
}

export function getBDISeverityColor(label) {
  const config = BDI_SEVERITY_CONFIG[label];
  return config ? config.color : "#64748B";
}

export function getBDIScoreColor(score) {
  if (score === 0) return "#CBD5E1";
  if (score === 1) return "#84CC16";
  if (score === 2) return "#E85720";
  if (score === 3) return "#DC2626";
  return "#CBD5E1";
}

export function getBAISeverityColor(label) {
  const config = BAI_SEVERITY_CONFIG[label];
  return config ? config.color : "#64748B";
}

export function getBAIScoreColor(score) {
  if (score === 0) return "#CBD5E1";
  if (score === 1) return "#84CC16";
  if (score === 2) return "#E85720";
  if (score === 3) return "#DC2626";
  return "#CBD5E1";
}

export function getPSSSeverityColor(label) {
  const config = PSS_SEVERITY_CONFIG[label];
  return config ? config.color : "#64748B";
}

export function getPSSScoreColor(score) {
  if (score === 0) return "#CBD5E1";
  if (score === 1) return "#84CC16";
  if (score === 2) return "#E85720";
  if (score === 3) return "#F59E0B";
  if (score === 4) return "#DC2626";
  return "#CBD5E1";
}

export function getBSISeverityColor(label) {
  const config = BSI_SEVERITY_CONFIG[label];
  return config ? config.color : "#64748B";
}

export function getBSIScoreColor(score) {
  if (score === 0) return "#CBD5E1";
  if (score === 1) return "#E85720";
  if (score === 2) return "#DC2626";
  return "#CBD5E1";
}

export function getGHQ28AnswerColor(value) {
  const val = parseInt(value);
  if (val === 0) return "#CBD5E1";
  if (val === 1) return "#84CC16";
  if (val === 2) return "#E85720";
  if (val === 3) return "#DC2626";
  return "#CBD5E1";
}

// ---- Severity Configurations ----
export const PHQ9_SEVERITY_CONFIG = {
  "None-minimal": { range: [0, 4], color: "#1F6D48", description: "No significant depressive symptoms" },
  "Mild": { range: [5, 9], color: "#84CC16", description: "Mild depression - Monitor and reassess" },
  "Moderate": { range: [10, 14], color: "#E85720", description: "Moderate depression - Consider professional help" },
  "Moderately Severe": { range: [15, 19], color: "#DC2626", description: "Moderately severe depression - Professional help recommended" },
  "Severe": { range: [20, 27], color: "#991B1B", description: "Severe depression - Immediate professional help needed" },
};

export const BDI_SEVERITY_CONFIG = {
  "Normal": { range: [0, 10], color: "#1F6D48", description: "Normal mood fluctuations" },
  "Mild mood disturbance": { range: [11, 16], color: "#84CC16", description: "Mild mood disturbance - Monitor and reassess" },
  "Borderline clinical depression": { range: [17, 20], color: "#E85720", description: "Borderline clinical depression - Professional help recommended" },
  "Moderate Depression": { range: [21, 30], color: "#DC2626", description: "Moderate depression - Professional help recommended" },
  "Severe Depression": { range: [31, 40], color: "#991B1B", description: "Severe depression - Immediate professional help needed" },
  "Extreme Depression": { range: [40, 63], color: "#7C2D2D", description: "Extreme depression - Immediate professional intervention required" },
};

export const BAI_SEVERITY_CONFIG = {
  "Low Anxiety": { range: [0, 21], color: "#1F6D48", description: "Low anxiety - No significant anxiety symptoms" },
  "Moderate Anxiety": { range: [22, 35], color: "#E85720", description: "Moderate anxiety. Consider professional help if symptoms persist." },
  "Severe Anxiety": { range: [36, 63], color: "#DC2626", description: "Severe anxiety - Immediate professional help recommended" },
};

export const PSS_SEVERITY_CONFIG = {
  "Low Stress": { range: [0, 13], color: "#1F6D48", description: "Low perceived stress - Healthy stress management" },
  "Moderate Stress": { range: [14, 26], color: "#E85720", description: "Moderate perceived stress. Consider stress management techniques." },
  "High Stress": { range: [27, 40], color: "#DC2626", description: "High perceived stress - Professional help recommended" },
};

export const BSI_SEVERITY_CONFIG = {
  "Low Risk": {
    range: [0, 10],
    color: "#1F6D48",
    description: "Send home with advice to see Community Mental Health Team or GP.",
    recommendations: {
      action: "Send home with advice",
      follow_up: "See Community Mental Health Team or GP"
    }
  },
  "Medium Risk": {
    range: [11, 19],
    color: "#E85720",
    description: "Assessment by Community Mental Health Team or Psychiatrist is advisable.",
    recommendations: {
      action: "Assessment by CMHT or Psychiatrist",
      follow_up: "Admission option if alone, previous attempts, or depressed"
    }
  },
  "High Risk": {
    range: [20, 40],
    color: "#DC2626",
    description: "Immediate psychiatric assessment. Psychiatric admission recommended.",
    recommendations: {
      action: "Immediate psychiatric assessment",
      follow_up: "Involuntary admission may be required"
    }
  },
};

// ---- JOBS Score to Label Mapping ----
export const JOBS_SCORE_TO_LABEL = {
  1: "Disagree very much",
  2: "Disagree moderately",
  3: "Disagree slightly",
  4: "Agree slightly",
  5: "Agree moderately",
  6: "Agree very much",
};

// ---- MPQ Scale Config ----
export const MPQ_SCALE_CONFIG = {
  K: { name: "Defensiveness", totalQuestions: 12, description: "Measures test-taking attitude and defensiveness" },
  SC: { name: "Schizophrenia", totalQuestions: 18, description: "Measures unusual thinking and detachment from reality" },
  PA: { name: "Paranoia", totalQuestions: 18, description: "Measures suspiciousness and paranoid thoughts" },
  MA: { name: "Hypomania", totalQuestions: 17, description: "Measures energy, activity level, and impulsivity" },
  D: { name: "Depression", totalQuestions: 15, description: "Measures depressive symptoms" },
  A: { name: "Anxiety", totalQuestions: 26, description: "Measures anxiety symptoms" },
  HY: { name: "Hysteria", totalQuestions: 8, description: "Measures somatic complaints and conversion symptoms" },
  PD: { name: "Psychopathic Deviate", totalQuestions: 34, description: "Measures antisocial tendencies and rule-breaking" },
  REPRESSOR_SENSITISER: { name: "Repressor-Sensitiser", totalQuestions: 41, description: "Measures coping style (repressor vs sensitiser)" },
};

// ---- GHQ28 Scale Config ----
export const GHQ28_SCALE_CONFIG = {
  A: { name: "Somatic Symptoms", color: "#E85720", maxScore: 21, description: "Physical symptoms of psychological distress" },
  B: { name: "Anxiety & Insomnia", color: "#2F4479", maxScore: 21, description: "Anxiety and sleep-related symptoms" },
  C: { name: "Social Dysfunction", color: "#7C3AED", maxScore: 21, description: "Social functioning and daily activities" },
  D: { name: "Severe Depression", color: "#DC2626", maxScore: 21, description: "Severe depressive symptoms and suicidal ideation" },
};

// ---- Reusable Components ----
export function ReportCardWrapper({ icon, iconBg, title, subtitle, badge, onDownload, downloading, downloadError, setDownloadError, printRef, children }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
      <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
          <div className="min-w-0"><p className="text-[12px] sm:text-[13px] md:text-[14px] font-semibold text-slate-800">{title}</p><p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-500">{subtitle}</p></div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {badge && <span className={`hidden sm:inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] md:text-[12.5px] font-semibold border ${badge.className}`}>{badge.icon}{badge.text}</span>}
          <button onClick={onDownload} disabled={downloading} className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#2F4479] text-white text-[11px] sm:text-[12px] md:text-[12.5px] font-medium hover:bg-[#263a68] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {downloading ? <><Loader2 size={12} className="sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px] animate-spin" /> Generating PDF...</> : <><Download size={12} className="sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px]" /> Download Report</>}
          </button>
        </div>
      </div>
      {downloadError && (
        <div className="px-3 sm:px-4 md:px-5 py-2 sm:py-3 mx-3 sm:mx-4 md:mx-5 mb-2 sm:mb-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-1.5 sm:gap-2">
            <XCircle size={14} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px] text-red-500 mt-0.5 shrink-0" />
            <div><p className="text-[11px] sm:text-[12px] md:text-[13px] font-medium text-red-700">Download Failed</p><p className="text-[10px] sm:text-[11px] md:text-[12px] text-red-600 mt-0.5">{downloadError}</p>
              <button onClick={() => setDownloadError(null)} className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] md:text-[11px] text-red-600 hover:text-red-700 underline">Dismiss</button>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function ReportHeader({ title, user, savedReport }) {
  return (
    <div className="border-b border-slate-200 pb-4 sm:pb-5 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-1">{title}</h1>
          <div className="flex flex-col xs:flex-row xs:flex-wrap xs:items-center gap-2 xs:gap-3 sm:gap-4 mt-2 sm:mt-3">
            <div><p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-slate-500 uppercase tracking-wide">Patient Name</p><p className="text-[13px] sm:text-[14px] md:text-[15px] font-semibold text-slate-800">{user?.name || "N/A"}</p></div>
            <div className="hidden xs:block w-px h-6 sm:h-8 bg-slate-200" />
            <div><p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-slate-500 uppercase tracking-wide">Email</p><p className="text-[12px] sm:text-[13px] md:text-[14px] text-slate-700">{user?.email || "N/A"}</p></div>
            {user?.id && <><div className="hidden xs:block w-px h-6 sm:h-8 bg-slate-200" /><div><p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-slate-500 uppercase tracking-wide">Patient ID</p><p className="text-[12px] sm:text-[13px] md:text-[14px] text-slate-700">#{user.id}</p></div></>}
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          {savedReport?.completed_at && <div><p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-slate-500 uppercase tracking-wide">Assessment Date</p><p className="text-[12px] sm:text-[13px] md:text-[14px] font-semibold text-slate-700">{new Date(savedReport.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div>}
          {savedReport?.status && <div className="mt-1.5 sm:mt-2"><StatusBadge status={savedReport.status} /></div>}
        </div>
      </div>
    </div>
  );
}

export function ReportFooter() {
  return (
    <div className="border-t border-slate-200 pt-3 sm:pt-4 text-center">
      <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-400">Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] md:text-[12px] font-medium border shrink-0 ${status === "completed" ? "bg-[#1F6D48]/10 text-[#1F6D48] border-[#1F6D48]/20" : "bg-[#E85720]/10 text-[#E85720] border-[#E85720]/20"}`}>
      {status === "completed" ? <CheckCircle2 size={11} className="sm:w-[12px] sm:h-[12px] md:w-[13px] md:h-[13px]" /> : <Clock size={11} className="sm:w-[12px] sm:h-[12px] md:w-[13px] md:h-[13px]" />}
      {status === "completed" ? "Completed" : "In progress"}
    </span>
  );
}

export function SummaryBox({ summary }) {
  return (
    <div>
      <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Summary</h2>
      <div className="rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-50 to-[#E85720]/5 border border-slate-200 px-4 sm:px-5 py-3 sm:py-4">
        <p className="text-[12px] sm:text-[13px] md:text-[14px] text-slate-700 leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}

export function LoadingState({ label }) {
  return <div className="flex items-center justify-center py-12 sm:py-16 md:py-20"><div className="flex flex-col items-center gap-2 sm:gap-3"><div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 border-[2px] sm:border-[3px] border-[#2F4479]/15 border-t-[#2F4479] rounded-full animate-spin" /><p className="text-slate-500 text-[11px] sm:text-[12px] md:text-[13px] font-medium">{label}</p></div></div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="flex items-center justify-center py-12 sm:py-16 md:py-20"><div className="flex flex-col items-center gap-2 sm:gap-3"><div className="p-2.5 sm:p-3 md:p-3.5 rounded-full bg-rose-50"><XCircle size={22} className="sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] text-rose-500" /></div><p className="text-slate-700 font-medium text-[12px] sm:text-[13px] md:text-[14px]">Something went wrong</p><p className="text-slate-500 text-[11px] sm:text-[12px] md:text-[13px]">{message}</p>{onRetry && <button onClick={onRetry} className="mt-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#2F4479] text-white rounded-lg sm:rounded-xl hover:bg-[#263a68] transition-colors text-[11px] sm:text-[12px] md:text-[13px] font-medium">Try Again</button>}</div></div>;
}

// ---- Detect assessment type ----
export function detectAssessmentType(name) {
  if (!name) return {};
  const lower = name.toLowerCase();
  return {
    isEpi: lower.includes("epi") || lower.includes("e.p.i") || lower.includes("eysenck"),
    isMpq: lower.includes("mpq") || lower.includes("m.p.q") || lower.includes("multi") || lower.includes("pain"),
    isPhq9: lower.includes("phq") || lower.includes("phq-9") || lower.includes("phq9") || lower.includes("patient health"),
    isSct: lower.includes("sct") || lower.includes("sentence completion"),
    isGhq28: lower.includes("ghq") || lower.includes("ghq-28") || lower.includes("ghq28") || lower.includes("general health"),
    isBdi: lower.includes("bdi") || lower.includes("b.d.i") || lower.includes("beck depression"),
    isBai: lower.includes("bai") || lower.includes("b.a.i") || lower.includes("beck anxiety"),
    isPss: lower.includes("pss") || lower.includes("p.s.s") || lower.includes("perceived stress"),
    isBsi: lower.includes("bsi") || lower.includes("b.s.i") || lower.includes("brief symptom"),
    isIpde: lower.includes("ipde") || lower.includes("i.p.d.e") || lower.includes("personality disorder"),
    isJobs: lower.includes("jobs") || lower.includes("job satisfaction") || 
             lower.includes("job_satisfaction") || lower.includes("jobs-") ||
             lower.includes("jobs-men") || lower.includes("jobs-women") ||
             lower.includes("jobsmen") || lower.includes("jobswomen"),
    isEpds: lower.includes("epds") || lower.includes("edinburgh") || lower.includes("postnatal") ||
             lower.includes("epds-") || lower.includes("epds-women") || lower.includes("epds-men"),
  };
}

// ---- Assessment Badge ----
export function AssessmentBadge({ label, color }) {
  return <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded ${color}`}>{label}</span>;
}

// ---- Progress Pill ----
export function ProgressPill({ percentage, wide }) {
  const pct = Math.min(100, Math.max(0, percentage || 0));
  const color = pct >= 100 ? "#1F6D48" : pct > 0 ? "#E85720" : "#CBD5E1";
  return (
    <div className={wide ? "w-full" : "w-full"}>
      <div className="flex items-center justify-between mb-0.5 sm:mb-1"><span className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-slate-500">{pct.toFixed(0)}%</span></div>
      <div className="h-1 sm:h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} /></div>
    </div>
  );
}

// ---- Status Icon ----
export function StatusIcon({ status }) {
  if (status === "completed") return <span className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-[#1F6D48]/10 flex items-center justify-center shrink-0"><CheckCircle2 size={13} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px] text-[#1F6D48]" /></span>;
  if (status === "in_progress") return <span className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-[#E85720]/10 flex items-center justify-center shrink-0"><Clock size={13} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px] text-[#E85720]" /></span>;
  return <span className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Circle size={13} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px] text-slate-400" /></span>;
}

// ---- Mini Stat ----
export function MiniStat({ label, value }) {
  return <div className="text-right"><p className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-800">{value}</p><p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-400">{label}</p></div>;
}

// ---- Summary Stat ----
export function SummaryStat({ label, value, valueClass = "text-slate-800" }) {
  return <div className="rounded-lg sm:rounded-xl bg-slate-50 px-2.5 sm:px-3 py-2 sm:py-2.5 text-center"><p className={`text-[13px] sm:text-[15px] md:text-[16px] font-semibold ${valueClass}`}>{value}</p><p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-500 mt-0.5">{label}</p></div>;
}

// ---- Answer Chip ----
export function AnswerChip({ label, value, tone }) {
  const toneClass = {
    success: "bg-[#1F6D48]/10 text-[#1F6D48] border-[#1F6D48]/20",
    wrong: "bg-rose-50 text-rose-600 border-rose-200",
    neutral: "bg-slate-100 text-slate-500 border-slate-200",
    muted: "bg-slate-50 text-slate-500 border-slate-200",
  }[tone];
  const displayValue = formatEpiValue(value);
  return (
    <span className={`inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] md:text-[11.5px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md border ${toneClass}`}>
      <span className="opacity-70">{label}:</span> {displayValue}
    </span>
  );
}

// ---- Empty State ----
export function EmptyState({ icon, title, subtitle }) {
  return <div className="flex items-center justify-center py-12 sm:py-16 md:py-20"><div className="flex flex-col items-center gap-2 sm:gap-3"><div className="p-2.5 sm:p-3 md:p-3.5 rounded-full bg-slate-50">{icon}</div><p className="text-slate-700 font-medium text-[12px] sm:text-[13px] md:text-[14px]">{title}</p><p className="text-slate-500 text-[11px] sm:text-[12px] md:text-[13px]">{subtitle}</p></div></div>;
}

// ---- Info Item ----
export function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 sm:px-4 py-2.5 sm:py-3">
      <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}