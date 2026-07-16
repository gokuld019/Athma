"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  ArrowLeft,
  ListChecks,
  BadgeCheck,
  X,
  Check,
  Sparkles,
  Download,
  Loader2,
  Activity,
  Heart,
  Brain,
  Stethoscope,
  Square,
  CheckSquare,
} from "lucide-react";

const API_BASE_URL = "https://api.crazystory.in/api/admin";

// ---- Brand tokens (Athma logo) ---------------------------------------------
const getAuthHeaders = () => {
  const token = localStorage.getItem("athma_admin_token");
  const tokenType = localStorage.getItem("athma_admin_token_type") || "Bearer";
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `${tokenType} ${token}`,
  };
};

// ---- Assessment Type Configurations ----
const MPQ_SCALE_CONFIG = {
  K: { name: "Defensiveness", totalQuestions: 12, description: "Measures test-taking attitude and defensiveness" },
  Sc: { name: "Schizophrenia", totalQuestions: 18, description: "Measures unusual thinking and detachment from reality" },
  Pa: { name: "Paranoia", totalQuestions: 18, description: "Measures suspiciousness and paranoid thoughts" },
  Ma: { name: "Hypomania", totalQuestions: 17, description: "Measures energy, activity level, and impulsivity" },
  D: { name: "Depression", totalQuestions: 15, description: "Measures depressive symptoms" },
  A: { name: "Anxiety", totalQuestions: 26, description: "Measures anxiety symptoms" },
  Hy: { name: "Hysteria", totalQuestions: 8, description: "Measures somatic complaints and conversion symptoms" },
  Pd: { name: "Psychopathic Deviate", totalQuestions: 34, description: "Measures antisocial tendencies and rule-breaking" },
  "Repressor-Sensitiser": { name: "Repressor-Sensitiser", totalQuestions: 41, description: "Measures coping style (repressor vs sensitiser)" },
};

const PHQ9_SEVERITY_CONFIG = {
  "None-minimal": { range: [0, 4], color: "#1F6D48", description: "No significant depressive symptoms" },
  "Mild": { range: [5, 9], color: "#84CC16", description: "Mild depression - Monitor and reassess" },
  "Moderate": { range: [10, 14], color: "#E85720", description: "Moderate depression - Consider professional help" },
  "Moderately Severe": { range: [15, 19], color: "#DC2626", description: "Moderately severe depression - Professional help recommended" },
  "Severe": { range: [20, 27], color: "#991B1B", description: "Severe depression - Immediate professional help needed" },
};

const GHQ28_SCALE_CONFIG = {
  A: { name: "Somatic Symptoms", color: "#E85720", maxScore: 21, description: "Physical symptoms of psychological distress" },
  B: { name: "Anxiety & Insomnia", color: "#2F4479", maxScore: 21, description: "Anxiety and sleep-related symptoms" },
  C: { name: "Social Dysfunction", color: "#7C3AED", maxScore: 21, description: "Social functioning and daily activities" },
  D: { name: "Severe Depression", color: "#DC2626", maxScore: 21, description: "Severe depressive symptoms and suicidal ideation" },
};

// ---- Helper Functions ----
function formatEpiValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "object") {
    if (value.personality_type) return value.personality_type;
    const parts = [];
    if (value.e_score !== undefined) parts.push(`E:${value.e_score}`);
    if (value.n_score !== undefined) parts.push(`N:${value.n_score}`);
    if (value.l_score !== undefined) parts.push(`L:${value.l_score}`);
    return parts.length > 0 ? parts.join(" ") : JSON.stringify(value);
  }
  return value;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

async function loadPdfLibs() {
  if (!window.jspdf) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  }
}

function getMPQScaleColor(level) {
  switch (level) {
    case "High": return [232, 87, 32];
    case "Medium": return [47, 68, 121];
    case "Low": return [31, 109, 72];
    default: return [100, 100, 100];
  }
}

function getMPQScaleColorHex(level) {
  switch (level) {
    case "High": return "#E85720";
    case "Medium": return "#2F4479";
    case "Low": return "#1F6D48";
    default: return "#64748B";
  }
}

function getPHQ9SeverityColor(label) {
  const config = PHQ9_SEVERITY_CONFIG[label];
  return config ? config.color : "#64748B";
}

function getPHQ9ScoreColor(score) {
  if (score === 0) return "#CBD5E1";
  if (score === 1) return "#84CC16";
  if (score === 2) return "#E85720";
  if (score === 3) return "#DC2626";
  return "#CBD5E1";
}

function getGHQ28AnswerColor(value) {
  const val = parseInt(value);
  if (val === 0) return "#CBD5E1";
  if (val === 1) return "#84CC16";
  if (val === 2) return "#E85720";
  if (val === 3) return "#DC2626";
  return "#CBD5E1";
}

// ---- Detect assessment type from subheading name ----
function detectAssessmentType(name) {
  const n = (name || "").toLowerCase();
  return {
    isMpq: n.includes("mpq") || n.includes("multiphasic"),
    isPhq9: n.includes("phq") || n.includes("phq-9") || n.includes("phq9"),
    isSct: n.includes("sct") || n.includes("sentence completion"),
    isGhq28: n.includes("ghq") || n.includes("ghq-28") || n.includes("ghq28") || n.includes("general health"),
  };
}

export default function AdminAssessments() {
  const [view, setView] = useState("list");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [selectedSubheading, setSelectedSubheading] = useState(null);

  const [patients, setPatients] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [patientData, setPatientData] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState(null);

  const [subheadingData, setSubheadingData] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState(null);

  // Report states
  const [epiReport, setEpiReport] = useState(null);
  const [epiLoading, setEpiLoading] = useState(false);
  const [epiError, setEpiError] = useState(null);
  const [fullReport, setFullReport] = useState(null);

  const [mpqReport, setMpqReport] = useState(null);
  const [mpqLoading, setMpqLoading] = useState(false);
  const [mpqError, setMpqError] = useState(null);

  const [phq9Report, setPhq9Report] = useState(null);
  const [phq9Loading, setPhq9Loading] = useState(false);
  const [phq9Error, setPhq9Error] = useState(null);

  const [sctReport, setSctReport] = useState(null);
  const [sctLoading, setSctLoading] = useState(false);
  const [sctError, setSctError] = useState(null);

  const [ghq28Report, setGhq28Report] = useState(null);
  const [ghq28Loading, setGhq28Loading] = useState(false);
  const [ghq28Error, setGhq28Error] = useState(null);

  // SCT states
  const [sctQuestionsAnswers, setSctQuestionsAnswers] = useState(null);
  const [sctQALoading, setSctQALoading] = useState(false);
  const [sctQAError, setSctQAError] = useState(null);
  const [updatingAnswerIds, setUpdatingAnswerIds] = useState(new Set());

  // ---- API Fetch Functions ----
  const fetchPatientList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/patient-list`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("athma_admin_token");
          localStorage.removeItem("athma_admin_token_type");
          localStorage.removeItem("athma_admin_user");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch patient list");
      }
      const result = await response.json();
      if (result.status === "success") {
        setPatients(result.data.patients || []);
        setTotalPaid(result.data.total_patients_with_paid_packages || 0);
      } else {
        throw new Error(result.message || "Failed to load patients");
      }
    } catch (err) {
      setListError(err.message);
      console.error("Error fetching patient list:", err);
    } finally {
      setListLoading(false);
    }
  }, []);

  const fetchPatientDetail = useCallback(async (userId) => {
    setPatientLoading(true);
    setPatientError(null);
    setPatientData(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/patient/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch patient details");
      const result = await response.json();
      if (result.status === "success") {
        setPatientData(result.data);
      } else {
        throw new Error(result.message || "Failed to load patient details");
      }
    } catch (err) {
      setPatientError(err.message);
      console.error("Error fetching patient detail:", err);
    } finally {
      setPatientLoading(false);
    }
  }, []);

  const fetchSubheadingDetail = useCallback(async (subheadingId, userId) => {
    setSubLoading(true);
    setSubError(null);
    setSubheadingData(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/assessments/subheading/${subheadingId}/patient/${userId}`,
        { method: "GET", headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error("Failed to fetch subheading details");
      const result = await response.json();
      if (result.status === "success") {
        setSubheadingData(result.data);
      } else {
        throw new Error(result.message || "Failed to load subheading details");
      }
    } catch (err) {
      setSubError(err.message);
      console.error("Error fetching subheading detail:", err);
    } finally {
      setSubLoading(false);
    }
  }, []);

  const fetchEpiReport = useCallback(async (userId) => {
    setEpiLoading(true);
    setEpiError(null);
    setEpiReport(null);
    setFullReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/epi-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch EPI report");
      const result = await response.json();
      if (result.status === "success") {
        setEpiReport(result.data.epi_report);
        setFullReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load EPI report");
      }
    } catch (err) {
      setEpiError(err.message);
      console.error("Error fetching EPI report:", err);
    } finally {
      setEpiLoading(false);
    }
  }, []);

  const fetchMpqReport = useCallback(async (userId) => {
    setMpqLoading(true);
    setMpqError(null);
    setMpqReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/mpq-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch MPQ report");
      const result = await response.json();
      if (result.status === "success") {
        setMpqReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load MPQ report");
      }
    } catch (err) {
      setMpqError(err.message);
      console.error("Error fetching MPQ report:", err);
    } finally {
      setMpqLoading(false);
    }
  }, []);

  const fetchPhq9Report = useCallback(async (userId) => {
    setPhq9Loading(true);
    setPhq9Error(null);
    setPhq9Report(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/phq9-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch PHQ-9 report");
      const result = await response.json();
      if (result.status === "success") {
        setPhq9Report(result.data);
      } else {
        throw new Error(result.message || "Failed to load PHQ-9 report");
      }
    } catch (err) {
      setPhq9Error(err.message);
      console.error("Error fetching PHQ-9 report:", err);
    } finally {
      setPhq9Loading(false);
    }
  }, []);

  const fetchSctQuestionsAnswers = useCallback(async (userId) => {
    setSctQALoading(true);
    setSctQAError(null);
    setSctQuestionsAnswers(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/sct/questions-answers/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch SCT questions and answers");
      const result = await response.json();
      if (result.status === "success") {
        setSctQuestionsAnswers(result.data);
      } else {
        throw new Error(result.message || "Failed to load SCT questions");
      }
    } catch (err) {
      setSctQAError(err.message);
      console.error("Error fetching SCT questions:", err);
    } finally {
      setSctQALoading(false);
    }
  }, []);

  const fetchSctReport = useCallback(async (userId) => {
    setSctLoading(true);
    setSctError(null);
    setSctReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/sct-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch SCT report");
      const result = await response.json();
      if (result.status === "success") {
        setSctReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load SCT report");
      }
    } catch (err) {
      setSctError(err.message);
      console.error("Error fetching SCT report:", err);
    } finally {
      setSctLoading(false);
    }
  }, []);

  const fetchGhq28Report = useCallback(async (userId) => {
    setGhq28Loading(true);
    setGhq28Error(null);
    setGhq28Report(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/ghq28-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch GHQ-28 report");
      const result = await response.json();
      if (result.status === "success") {
        setGhq28Report(result.data);
      } else {
        throw new Error(result.message || "Failed to load GHQ-28 report");
      }
    } catch (err) {
      setGhq28Error(err.message);
      console.error("Error fetching GHQ-28 report:", err);
    } finally {
      setGhq28Loading(false);
    }
  }, []);

  const updateSctAnswer = async (answerId, questionId) => {
    // Optimistic UI update - toggle immediately
    setUpdatingAnswerIds(prev => {
      const next = new Set(prev);
      next.add(answerId);
      return next;
    });

    // Optimistically update the local state
    setSctQuestionsAnswers(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        questions_answers: prev.questions_answers.map(qa => {
          if (qa.answer_id === answerId) {
            const newScoreValue = qa.score_value === null ? 1 : null;
            return { ...qa, score_value: newScoreValue };
          }
          return qa;
        })
      };
    });

    try {
      const response = await fetch(`${API_BASE_URL}/assessments/sct/update-answer/${answerId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to update answer");
      // Don't need to refresh - optimistic update is sufficient
    } catch (err) {
      console.error("Error updating SCT answer:", err);
      // Revert optimistic update on error
      await fetchSctQuestionsAnswers(selectedUserId);
    } finally {
      setUpdatingAnswerIds(prev => {
        const next = new Set(prev);
        next.delete(answerId);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchPatientList();
  }, [fetchPatientList]);

  // ---- Navigation Functions ----
  const openPatient = (userId) => {
    setSelectedUserId(userId);
    setView("patient");
    fetchPatientDetail(userId);
  };

  const openSubheading = (subheadingId, packageId, isEpi, assessmentTypes) => {
    setSelectedSubheading({ id: subheadingId, packageId });
    setSelectedPackageId(packageId);
    setView("subheading");
    fetchSubheadingDetail(subheadingId, selectedUserId);

    // Reset all reports
    setEpiReport(null); setEpiError(null); setFullReport(null);
    setMpqReport(null); setMpqError(null);
    setPhq9Report(null); setPhq9Error(null);
    setSctReport(null); setSctError(null);
    setGhq28Report(null); setGhq28Error(null);
    setSctQuestionsAnswers(null);
    setUpdatingAnswerIds(new Set());

    if (isEpi) {
      fetchEpiReport(selectedUserId);
    } else if (assessmentTypes.isMpq) {
      fetchMpqReport(selectedUserId);
    } else if (assessmentTypes.isPhq9) {
      fetchPhq9Report(selectedUserId);
    } else if (assessmentTypes.isSct) {
      fetchSctReport(selectedUserId);
      fetchSctQuestionsAnswers(selectedUserId);
    } else if (assessmentTypes.isGhq28) {
      fetchGhq28Report(selectedUserId);
    }
  };

  const backToList = () => {
    setView("list");
    setSelectedUserId(null);
    setPatientData(null);
    setEpiReport(null); setFullReport(null);
    setMpqReport(null); setPhq9Report(null);
    setSctReport(null); setGhq28Report(null);
    setSctQuestionsAnswers(null);
    setUpdatingAnswerIds(new Set());
  };

  const backToPatient = () => {
    setView("patient");
    setSelectedSubheading(null);
    setSubheadingData(null);
    setEpiReport(null); setFullReport(null);
    setMpqReport(null); setPhq9Report(null);
    setSctReport(null); setGhq28Report(null);
    setSctQuestionsAnswers(null);
    setUpdatingAnswerIds(new Set());
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const filteredPatients = patients.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  });

  const handleSctCheckboxToggle = async (qa) => {
    if (qa.answer_id) {
      await updateSctAnswer(qa.answer_id, qa.question_id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FA]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
        <div className=" mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {view !== "list" && (
                <button
                  onClick={view === "subheading" ? backToPatient : backToList}
                  className="p-2 rounded-lg border border-slate-200 hover:border-[#2F4479]/30 hover:bg-[#2F4479]/5 transition-colors shrink-0"
                >
                  <ArrowLeft size={16} className="text-slate-600" />
                </button>
              )}
              <div className="w-9 h-9 rounded-lg bg-[#2F4479] flex items-center justify-center shrink-0">
                <ListChecks size={18} className="text-white" strokeWidth={2.25} />
              </div>
              <div>
                <Breadcrumb
                  view={view}
                  patientName={patientData?.user?.name}
                  subheadingName={subheadingData?.subheading?.name}
                  onList={backToList}
                  onPatient={backToPatient}
                />
                <p className="text-slate-500 text-[13px] mt-0.5">
                  {view === "list" && (
                    <>
                      Track patient progress across assessments
                      {totalPaid > 0 && <span className="text-slate-400"> · {totalPaid} paid patients</span>}
                    </>
                  )}
                  {view === "patient" && "Package completion by section"}
                  {view === "subheading" && "Question-by-question responses"}
                </p>
              </div>
            </div>
            {view === "list" && (
              <button
                onClick={fetchPatientList}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-[#2F4479]/30 hover:bg-[#2F4479]/5 transition-colors group"
                title="Refresh"
              >
                <RefreshCw
                  size={17}
                  className={`text-slate-500 group-hover:text-[#2F4479] transition-colors ${
                    listLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className=" mx-auto px-6 py-8">
        {view === "list" && (
          <PatientListView
            loading={listLoading}
            error={listError}
            patients={filteredPatients}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onOpen={openPatient}
            onRetry={fetchPatientList}
            formatDate={formatDate}
          />
        )}

        {view === "patient" && (
          <PatientDetailView
            loading={patientLoading}
            error={patientError}
            data={patientData}
            onOpenSubheading={openSubheading}
            onRetry={() => fetchPatientDetail(selectedUserId)}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        )}

        {view === "subheading" && (
          <SubheadingDetailView
            loading={subLoading}
            error={subError}
            data={subheadingData}
            onRetry={() => fetchSubheadingDetail(selectedSubheading.id, selectedUserId)}
            formatDate={formatDate}
            epiReport={epiReport}
            fullReport={fullReport}
            epiLoading={epiLoading}
            epiError={epiError}
            onRetryEpi={() => fetchEpiReport(selectedUserId)}
            mpqReport={mpqReport}
            mpqLoading={mpqLoading}
            mpqError={mpqError}
            onRetryMpq={() => fetchMpqReport(selectedUserId)}
            phq9Report={phq9Report}
            phq9Loading={phq9Loading}
            phq9Error={phq9Error}
            onRetryPhq9={() => fetchPhq9Report(selectedUserId)}
            sctReport={sctReport}
            sctLoading={sctLoading}
            sctError={sctError}
            onRetrySct={() => fetchSctReport(selectedUserId)}
            ghq28Report={ghq28Report}
            ghq28Loading={ghq28Loading}
            ghq28Error={ghq28Error}
            onRetryGhq28={() => fetchGhq28Report(selectedUserId)}
            sctQuestionsAnswers={sctQuestionsAnswers}
            sctQALoading={sctQALoading}
            sctQAError={sctQAError}
            onSctToggle={handleSctCheckboxToggle}
            updatingAnswerIds={updatingAnswerIds}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Breadcrumb Component
// ============================================================================
function Breadcrumb({ view, patientName, subheadingName, onList, onPatient }) {
  return (
    <div className="flex items-center gap-1.5 text-[15px] font-semibold text-[#1E2A47] tracking-tight">
      <button
        onClick={onList}
        className={view === "list" ? "text-[#1E2A47]" : "text-slate-400 hover:text-[#2F4479] transition-colors"}
      >
        Assessments
      </button>
      {view !== "list" && (
        <>
          <ChevronRight size={14} className="text-slate-300" />
          <button
            onClick={onPatient}
            className={view === "patient" ? "text-[#1E2A47]" : "text-slate-400 hover:text-[#2F4479] transition-colors"}
          >
            {patientName || "Patient"}
          </button>
        </>
      )}
      {view === "subheading" && (
        <>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-[#1E2A47]">{subheadingName || "Section"}</span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Patient List View
// ============================================================================
function PatientListView({ loading, error, patients, searchTerm, setSearchTerm, onOpen, onRetry, formatDate }) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#2F4479] focus:ring-2 focus:ring-[#2F4479]/10 outline-none transition-all text-[13.5px] placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <LoadingState label="Loading patients..." />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : patients.length === 0 ? (
          <EmptyState icon={<Users size={28} className="text-slate-400" />} title="No patients found" subtitle="Try adjusting your search" />
        ) : (
          <div className="divide-y divide-slate-50">
            {patients.map((p) => (
              <button
                key={p.user_id}
                onClick={() => onOpen(p.user_id)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#2F4479]/[0.03] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#2F4479] flex items-center justify-center shrink-0">
                  <User size={17} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-slate-800 truncate">{p.name}</p>
                    {!p.has_progress && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                        Not started
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[12px] text-slate-500 truncate">
                      <Mail size={11} className="shrink-0" /> {p.email}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-slate-500 shrink-0">
                      <Phone size={11} /> {p.phone}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {(p.packages || []).map((pkg) => (
                    <span key={pkg.package_id} className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                      <Package size={11} className="text-[#2F4479]" /> {pkg.package_name}
                    </span>
                  ))}
                </div>
                <div className="w-28 shrink-0">
                  <ProgressPill percentage={p.packages?.[0]?.completion_percentage ?? 0} />
                  <p className="text-[10px] text-slate-400 mt-0.5 text-right">
                    {p.packages?.[0]?.answered ?? 0}/{p.packages?.[0]?.total_questions ?? 0}
                  </p>
                </div>
                <ChevronRight size={17} className="text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Patient Detail View
// ============================================================================
function PatientDetailView({ loading, error, data, onOpenSubheading, onRetry, formatDate, formatCurrency }) {
  if (loading) return <LoadingState label="Loading patient details..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data) return null;

  const { user, packages } = data;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2F4479] flex items-center justify-center shrink-0">
            <User size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-slate-800">{user.name}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center gap-1.5 text-[12.5px] text-slate-500"><Mail size={12} /> {user.email}</span>
              <span className="flex items-center gap-1.5 text-[12.5px] text-slate-500"><Phone size={12} /> {user.phone}</span>
              <span className="flex items-center gap-1.5 text-[12.5px] text-slate-500"><Calendar size={12} /> Registered {formatDate(user.registered_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {(packages || []).map((pkg) => (
        <div key={pkg.package_id} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#2F4479]/10 flex items-center justify-center shrink-0">
                <Package size={17} className="text-[#2F4479]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-slate-800">{pkg.package_name}</p>
                  {pkg.overall?.is_completed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#1F6D48]/10 text-[#1F6D48]">
                      <BadgeCheck size={11} /> Complete
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-slate-500">₹{formatCurrency(pkg.package_price)} · Paid {formatDate(pkg.paid_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MiniStat label="Answered" value={`${pkg.overall?.answered_questions ?? 0}/${pkg.overall?.total_questions ?? 0}`} />
              <MiniStat label="Sections" value={`${pkg.overall?.completed_subheadings ?? 0}/${pkg.overall?.total_subheadings ?? 0}`} />
              <ProgressPill percentage={pkg.overall?.completion_percentage ?? 0} wide />
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {(pkg.subheadings || []).map((sh) => {
              const assessmentTypes = detectAssessmentType(sh.subheading_name);
              return (
                <button
                  key={sh.subheading_id}
                  onClick={() => onOpenSubheading(sh.subheading_id, pkg.package_id, sh.is_epi, assessmentTypes)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#2F4479]/[0.03] transition-colors text-left"
                >
                  <StatusIcon status={sh.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-medium text-slate-800">{sh.subheading_name}</p>
                      {sh.is_epi && <AssessmentBadge label="EPI" color="bg-[#E85720]/10 text-[#E85720]" />}
                      {assessmentTypes.isMpq && <AssessmentBadge label="MPQ" color="bg-[#2F4479]/10 text-[#2F4479]" />}
                      {assessmentTypes.isPhq9 && <AssessmentBadge label="PHQ-9" color="bg-[#1F6D48]/10 text-[#1F6D48]" />}
                      {assessmentTypes.isSct && <AssessmentBadge label="SCT" color="bg-purple-100 text-purple-700" />}
                      {assessmentTypes.isGhq28 && <AssessmentBadge label="GHQ-28" color="bg-amber-100 text-amber-700" />}
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      {sh.answered}/{sh.total_questions} answered
                      {sh.pending > 0 && ` · ${sh.pending} pending`}
                      {sh.answered > 0 && ` · ${sh.correct} correct / ${sh.wrong} wrong`}
                    </p>
                  </div>
                  <div className="hidden sm:block w-32 shrink-0">
                    <ProgressPill percentage={sh.completion_percentage} />
                  </div>
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Subheading Detail View
// ============================================================================
function SubheadingDetailView({
  loading, error, data, onRetry, formatDate,
  epiReport, fullReport, epiLoading, epiError, onRetryEpi,
  mpqReport, mpqLoading, mpqError, onRetryMpq,
  phq9Report, phq9Loading, phq9Error, onRetryPhq9,
  sctReport, sctLoading, sctError, onRetrySct,
  ghq28Report, ghq28Loading, ghq28Error, onRetryGhq28,
  sctQuestionsAnswers, sctQALoading, sctQAError, onSctToggle, updatingAnswerIds,
}) {
  if (loading) return <LoadingState label="Loading responses..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data) return null;

  const { subheading, summary, questions, is_epi } = data;
  const assessmentTypes = detectAssessmentType(subheading.name);

  return (
    <div className="space-y-6">
      {/* Subheading Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-semibold text-slate-800">{subheading.name}</p>
              {is_epi && <AssessmentBadge label="EPI" color="bg-[#E85720]/10 text-[#E85720]" />}
              {assessmentTypes.isMpq && <AssessmentBadge label="MPQ" color="bg-[#2F4479]/10 text-[#2F4479]" />}
              {assessmentTypes.isPhq9 && <AssessmentBadge label="PHQ-9" color="bg-[#1F6D48]/10 text-[#1F6D48]" />}
              {assessmentTypes.isSct && <AssessmentBadge label="SCT" color="bg-purple-100 text-purple-700" />}
              {assessmentTypes.isGhq28 && <AssessmentBadge label="GHQ-28" color="bg-amber-100 text-amber-700" />}
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5">{subheading.description}</p>
          </div>
          <StatusBadge status={summary.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          <SummaryStat label="Total" value={summary.total_questions} />
          <SummaryStat label="Answered" value={summary.answered} valueClass="text-[#2F4479]" />
          <SummaryStat label="Pending" value={summary.pending} valueClass="text-[#E85720]" />
          <SummaryStat label="Correct" value={summary.correct} valueClass="text-[#1F6D48]" />
          <SummaryStat label="Accuracy" value={`${summary.accuracy}%`} valueClass="text-slate-800" />
        </div>
        <div className="mt-4">
          <ProgressPill percentage={summary.completion_percentage} wide />
        </div>
      </div>

      {/* Assessment Reports */}
      {is_epi && <EpiReportCard loading={epiLoading} error={epiError} report={fullReport} onRetry={onRetryEpi} />}
      {assessmentTypes.isMpq && <MPQReportCard loading={mpqLoading} error={mpqError} report={mpqReport} onRetry={onRetryMpq} />}
      {assessmentTypes.isPhq9 && <PHQ9ReportCard loading={phq9Loading} error={phq9Error} report={phq9Report} onRetry={onRetryPhq9} />}
      {assessmentTypes.isSct && (
        <SCTReportCard 
          loading={sctLoading} 
          error={sctError} 
          report={sctReport} 
          onRetry={onRetrySct}
          questionsAnswers={sctQuestionsAnswers}
          qaLoading={sctQALoading}
          qaError={sctQAError}
        />
      )}
      {assessmentTypes.isGhq28 && <GHQ28ReportCard loading={ghq28Loading} error={ghq28Error} report={ghq28Report} onRetry={onRetryGhq28} />}

      {/* SCT Scoring Section */}
      {assessmentTypes.isSct && (
        <SCTScoringSection
          questionsAnswers={sctQuestionsAnswers}
          loading={sctQALoading}
          error={sctQAError}
          onToggle={onSctToggle}
          updatingAnswerIds={updatingAnswerIds}
        />
      )}

      {/* Questions List - Show for non-SCT assessments */}
      {!assessmentTypes.isSct && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-[13px] font-semibold text-slate-700">Question Responses</p>
          </div>
          <div className="divide-y divide-slate-50">
            {(questions || []).map((q) => (
              <div key={q.question_id} className="flex items-start gap-4 px-5 py-4">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-500 shrink-0 mt-0.5">
                  {q.display_order}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-slate-800 leading-snug">{q.question_text}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <AnswerChip
                      label="Answer"
                      value={formatEpiValue(q.user_answer) || formatEpiValue(q.answer_text) || "—"}
                      tone={q.status !== "answered" ? "neutral" : q.is_correct ? "success" : "wrong"}
                    />
                    {q.correct_answer && <AnswerChip label="Expected" value={formatEpiValue(q.correct_answer)} tone="muted" />}
                    {q.answered_at && <span className="text-[11px] text-slate-400">{formatDate(q.answered_at)}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  {q.status !== "answered" ? <Circle size={17} className="text-slate-300" /> :
                   q.is_correct ? <Check size={17} className="text-[#1F6D48]" strokeWidth={2.5} /> :
                   <X size={17} className="text-rose-400" strokeWidth={2.5} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SCT Scoring Section Component - Instant loading
// ============================================================================
function SCTScoringSection({ questionsAnswers, loading, error, onToggle, updatingAnswerIds }) {
  if (loading) return <LoadingState label="Loading SCT questions..." />;
  if (error) return <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 p-6"><ErrorState message={error} /></div>;
  if (!questionsAnswers) return null;

  const { questions_answers } = questionsAnswers;
  const scoredCount = questions_answers.filter(qa => qa.score_value !== null).length;
  const totalCount = questions_answers.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div>
          <p className="text-[14px] font-semibold text-slate-800">SCT Question Scoring</p>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {scoredCount} of {totalCount} questions scored · Click checkbox to toggle scoring (instant)
          </p>
        </div>
      </div>
      <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
        {questions_answers.map((qa) => {
          const isScored = qa.score_value !== null;
          const isUpdating = updatingAnswerIds.has(qa.answer_id);
          
          return (
            <div 
              key={qa.question_id} 
              className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                isScored ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'
              }`}
            >
              <span className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-[11px] font-bold text-purple-700 shrink-0 mt-0.5">
                {qa.display_order}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] text-slate-800 font-medium leading-snug">{qa.question_text}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-[12px] text-[#2F4479] italic">
                    "{qa.patient_answer || "No response"}"
                  </p>
                  {isScored && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      <Check size={10} />
                      Negative
                    </span>
                  )}
                </div>
                {qa.answered_at && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Answered {new Date(qa.answered_at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
              {/* Checkbox on RIGHT side */}
              <button
                onClick={() => onToggle(qa)}
                className="shrink-0 mt-0.5"
                title={isScored ? "Click to unscore" : "Click to score as negative"}
              >
                {isUpdating ? (
                  <div className="w-[18px] h-[18px] rounded border-2 border-purple-400 border-t-transparent animate-spin" />
                ) : isScored ? (
                  <CheckSquare size={18} className="text-red-500" />
                ) : (
                  <Square size={18} className="text-slate-300 hover:text-red-400 transition-colors" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// SCT Report Card - Modern Report View
// ============================================================================
function SCTReportCard({ loading, error, report, onRetry, questionsAnswers, qaLoading, qaError }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [showReport, setShowReport] = useState(false);

  if (loading) return <LoadingState label="Loading SCT report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  const { user, sct_report, saved_report } = report;
  if (!sct_report) return null;
  const { 
    answered, 
    total, 
    positive, 
    negative, 
    completion_percentage, 
    is_completed, 
    scale_scores,
    answers 
  } = sct_report;

  // Scale score configurations
  const scaleConfigs = {
    at_mother: { label: "Mother", icon: "👩", color: "#EC4899", description: "Attitude towards mother" },
    at_father: { label: "Father", icon: "👨", color: "#3B82F6", description: "Attitude towards father" },
    at_father_family_unit: { label: "Family Unit", icon: "👨‍👩‍👧‍👦", color: "#8B5CF6", description: "Attitude towards father & family unit" },
    at_women: { label: "Women", icon: "👩‍🦰", color: "#F43F5E", description: "Attitude towards women" },
    at_heterosexual_relationship: { label: "Relationships", icon: "💑", color: "#EF4444", description: "Attitude towards heterosexual relationships" },
    at_friends_acquaintances: { label: "Friends", icon: "🤝", color: "#10B981", description: "Attitude towards friends & acquaintances" },
    at_superiors: { label: "Superiors", icon: "👔", color: "#6366F1", description: "Attitude towards superiors" },
    at_people_supervised: { label: "Subordinates", icon: "👥", color: "#14B8A6", description: "Attitude towards people supervised" },
    at_colleagues: { label: "Colleagues", icon: "💼", color: "#F59E0B", description: "Attitude towards colleagues" },
    fears: { label: "Fears", icon: "😨", color: "#DC2626", description: "Fears" },
    guilt: { label: "Guilt", icon: "😔", color: "#7C3AED", description: "Guilt feelings" },
    at_own_abilities: { label: "Abilities", icon: "💪", color: "#059669", description: "Attitude towards own abilities" },
    at_past: { label: "Past", icon: "⏮️", color: "#6B7280", description: "Attitude towards past" },
    at_future: { label: "Future", icon: "🔮", color: "#0EA5E9", description: "Attitude towards future" },
    goals: { label: "Goals", icon: "🎯", color: "#D946EF", description: "Goals & aspirations" },
  };

  const getScoreLevel = (score) => {
    if (score >= 4) return { level: "Positive", color: "#10B981", bgColor: "#D1FAE5" };
    if (score >= 3) return { level: "Neutral", color: "#F59E0B", bgColor: "#FEF3C7" };
    return { level: "Negative", color: "#EF4444", bgColor: "#FEE2E2" };
  };

  const handleDownload = async () => {
    setDownloading(true); setDownloadError(null);
    try {
      await loadPdfLibs();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; let yPos = margin;

      const addSectionHeader = (text) => { yPos += 3; pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text(text, margin, yPos); yPos += 8; };
      const addLine = () => { yPos += 2; pdf.setDrawColor(200, 200, 200); pdf.line(margin, yPos, pageWidth - margin, yPos); yPos += 5; };

      pdf.setFontSize(20); pdf.setTextColor(126, 34, 206); pdf.text("SCT Assessment Report", margin, yPos); yPos += 12;
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text("Sentence Completion Test Results", margin, yPos); yPos += 8;
      addLine();
      addSectionHeader("PATIENT INFORMATION");
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0);
      pdf.text("Patient Name:", margin, yPos); pdf.setFontSize(12); pdf.setTextColor(47, 68, 121); pdf.text(user?.name || "N/A", margin + 25, yPos);
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text(`Patient ID: #${user?.id || "N/A"}`, pageWidth / 2, yPos); yPos += 8;
      pdf.text(`Completion: ${answered}/${total} (${completion_percentage}%)`, margin, yPos); yPos += 10;
      addLine();
      addSectionHeader("ASSESSMENT SUMMARY");

      pdf.setDrawColor(220, 220, 220); pdf.setFillColor(248, 248, 248); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 3, 3, 'FD');
      pdf.setFontSize(12); pdf.setTextColor(31, 109, 72); pdf.text(`Positive: ${positive || 0}`, margin + 10, yPos + 12);
      pdf.setFontSize(12); pdf.setTextColor(220, 38, 38); pdf.text(`Negative: ${negative || 0}`, margin + 80, yPos + 12);
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text(`Total: ${answered}/${total}`, margin + 150, yPos + 12);
      yPos += 40;

      addSectionHeader("SCALE SCORES");
      if (scale_scores) {
        Object.entries(scale_scores).forEach(([key, score]) => {
          if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
          const config = scaleConfigs[key] || { label: key, color: "#64748B" };
          const { level, color } = getScoreLevel(score);
          pdf.setDrawColor(220, 220, 220); pdf.setFillColor(252, 252, 252); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 1, 1, 'FD');
          pdf.setFontSize(8); pdf.setTextColor(80, 80, 80); pdf.text(`${config.label}`, margin + 5, yPos + 7);
          const colorHex = color.replace("#", "");
          pdf.setFontSize(8); pdf.setTextColor(parseInt(colorHex.substring(0,2),16), parseInt(colorHex.substring(2,4),16), parseInt(colorHex.substring(4,6),16));
          pdf.text(`${score}/5 (${level})`, margin + 80, yPos + 7);
          const barX = margin + 120; const barW = pageWidth - margin * 2 - 125;
          pdf.setDrawColor(220, 220, 220); pdf.setFillColor(240, 240, 240); pdf.roundedRect(barX, yPos + 2, barW, 3, 1, 1, 'FD');
          pdf.setFillColor(parseInt(colorHex.substring(0,2),16), parseInt(colorHex.substring(2,4),16), parseInt(colorHex.substring(4,6),16));
          pdf.roundedRect(barX, yPos + 2, barW * (score / 5), 3, 1, 1, 'F');
          yPos += 12;
        });
      }

      pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform`, pageWidth / 2, pageHeight - 10, { align: "center" });

      const date = new Date().toISOString().split('T')[0];
      const safeName = (user?.name || "patient").replace(/[^a-z0-9]+/gi, "_").toLowerCase().substring(0, 30);
      pdf.save(`SCT_Report_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF. Please check console for details.");
    } finally { setDownloading(false); }
  };

  const scoredCount = answers?.filter(a => a.score_value !== null).length || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <Brain size={17} className="text-purple-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-slate-800">SCT Sentence Completion Test</p>
            <p className="text-[12px] text-slate-500">Sentence completion responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold border bg-purple-100 text-purple-700 border-purple-200">
            {scoredCount > 0 ? `${scoredCount}/${answered} scored` : `${answered}/${total} completed`}
          </span>
          <button 
            onClick={() => setShowReport(!showReport)} 
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 text-white text-[12.5px] font-medium hover:bg-purple-700 transition-colors"
          >
            {showReport ? 'Hide Report' : 'Go Report'}
          </button>
        </div>
      </div>
      {downloadError && (
        <div className="px-5 py-3 mx-5 mb-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-red-700">Download Failed</p>
              <p className="text-[12px] text-red-600 mt-0.5">{downloadError}</p>
              <button onClick={() => setDownloadError(null)} className="mt-2 text-[11px] text-red-600 hover:text-red-700 underline">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      {showReport && (
        <div ref={printRef} className="p-6 space-y-6 bg-white">
          {/* Patient Info Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800 mb-1">SCT Assessment Report</h1>
                <p className="text-[13px] text-slate-500">Sentence Completion Test Results</p>
              </div>
              <div className="text-right">
                <StatusBadge status={is_completed ? "completed" : "in_progress"} />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Patient</p>
                <p className="text-[14px] font-semibold text-slate-800">{user?.name || "N/A"}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Email</p>
                <p className="text-[13px] text-slate-700">{user?.email || "N/A"}</p>
              </div>
              {user?.id && (
                <>
                  <div className="w-px h-8 bg-slate-200" />
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Patient ID</p>
                    <p className="text-[13px] text-slate-700">#{user.id}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4">
              <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wide">Completion</p>
              <p className="text-[24px] font-bold text-purple-700 mt-1">{completion_percentage?.toFixed(1)}%</p>
              <p className="text-[11px] text-purple-500">{answered}/{total} answers</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 p-4">
              <p className="text-[10px] font-medium text-green-600 uppercase tracking-wide">Positive</p>
              <p className="text-[24px] font-bold text-green-700 mt-1">{positive || 0}</p>
              <p className="text-[11px] text-green-500">Responses</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-rose-100 border border-red-200 p-4">
              <p className="text-[10px] font-medium text-red-600 uppercase tracking-wide">Negative</p>
              <p className="text-[24px] font-bold text-red-700 mt-1">{negative || 0}</p>
              <p className="text-[11px] text-red-500">Responses</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 p-4">
              <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">Scored</p>
              <p className="text-[24px] font-bold text-amber-700 mt-1">{scoredCount}</p>
              <p className="text-[11px] text-amber-500">Marked negative</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-slate-500">Response Distribution</p>
              <p className="text-[11px] text-slate-400">{positive || 0} positive · {negative || 0} negative</p>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
              {positive > 0 && (
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all" 
                  style={{ width: `${((positive || 0) / (answered || 1)) * 100}%` }} 
                />
              )}
              {negative > 0 && (
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-rose-500 transition-all" 
                  style={{ width: `${((negative || 0) / (answered || 1)) * 100}%` }} 
                />
              )}
              <div className="h-full bg-slate-200 flex-1" />
            </div>
          </div>

          {/* Scale Scores - Modern Card Grid */}
          <div>
            <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-4">Attitude Scale Scores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {scale_scores && Object.entries(scale_scores).map(([key, score]) => {
                const config = scaleConfigs[key] || { label: key.replace(/_/g, ' '), icon: "📊", color: "#64748B", description: "" };
                const { level, color, bgColor } = getScoreLevel(score);
                const percentage = (score / 4) * 100;
                
                return (
                  <div 
                    key={key} 
                    className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-800">{config.label}</p>
                          <p className="text-[10px] text-slate-400">{config.description}</p>
                        </div>
                      </div>
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: bgColor, color: color }}
                      >
                        {score}/4
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: color }} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{config.description}</span>
                        <span className="text-[10px] font-semibold" style={{ color: color }}>{level}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scale Score Legend */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[11px] text-slate-600">Positive (4-5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-[11px] text-slate-600">Neutral (3)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[11px] text-slate-600">Negative (0-2)</span>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleDownload} 
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F4479] text-white text-[12.5px] font-medium hover:bg-[#263a68] transition-colors disabled:opacity-60"
            >
              {downloading ? (
                <><Loader2 size={14} className="animate-spin" /> Generating...</>
              ) : (
                <><Download size={14} /> Download PDF Report</>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EPI Report Card (with PDF download)
// ============================================================================
function EpiReportCard({ loading, error, report, onRetry }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (loading) return <LoadingState label="Loading EPI report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  const { user, epi_report, saved_report } = report;
  if (!epi_report) return null;
  const { e_score, n_score, l_score, personality_type, traits, summary, graph_data } = epi_report;

  const handleDownload = async () => {
    setDownloading(true); setDownloadError(null);
    try {
      await loadPdfLibs();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; let yPos = margin;

      const addSectionHeader = (text) => { yPos += 3; pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text(text, margin, yPos); yPos += 8; };
      const addLine = () => { yPos += 2; pdf.setDrawColor(200, 200, 200); pdf.line(margin, yPos, pageWidth - margin, yPos); yPos += 5; };

      pdf.setFontSize(20); pdf.setTextColor(47, 68, 121);
      pdf.text("EPI Personality Assessment Report", margin, yPos); yPos += 12;
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100);
      pdf.text("Eysenck Personality Inventory Results", margin, yPos); yPos += 8;
      addLine();
      addSectionHeader("PATIENT INFORMATION");

      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0);
      const leftCol = margin; const rightCol = pageWidth / 2 + 5;
      pdf.text("Patient Name:", leftCol, yPos); pdf.setFontSize(12); pdf.setTextColor(47, 68, 121); pdf.text(user?.name || "N/A", leftCol + 25, yPos);
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Patient ID:", rightCol, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(`#${user?.id || "N/A"}`, rightCol + 20, yPos); yPos += 8;
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Email:", leftCol, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(user?.email || "N/A", leftCol + 25, yPos);
      if (saved_report?.completed_at) { pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Assessment Date:", rightCol, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(new Date(saved_report.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), rightCol + 30, yPos); }
      yPos += 10; addLine();
      addSectionHeader("DIMENSION SCORES"); yPos += 2;

      const scoreBoxWidth = (pageWidth - margin * 2 - 10) / 3; const scoreBoxHeight = 30; const scoreBoxY = yPos;
      const scores = [
        { label: "Extraversion (E)", score: e_score, max: graph_data?.max_score || 24, color: [232, 87, 32] },
        { label: "Neuroticism (N)", score: n_score, max: graph_data?.max_score || 24, color: [47, 68, 121] },
        { label: "Lie Scale (L)", score: l_score, max: 9, color: [31, 109, 72] },
      ];
      scores.forEach((score, index) => {
        const boxX = margin + (scoreBoxWidth + 5) * index;
        pdf.setDrawColor(200, 200, 200); pdf.setFillColor(245, 245, 245); pdf.roundedRect(boxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 2, 2, 'FD');
        pdf.setFontSize(8); pdf.setTextColor(100, 100, 100); pdf.text(score.label, boxX + 3, scoreBoxY + 6);
        pdf.setFontSize(16); pdf.setTextColor(...score.color); pdf.text(`${score.score || 0}/${score.max}`, boxX + 3, scoreBoxY + 20);
        const barY = scoreBoxY + scoreBoxHeight - 5;
        pdf.setDrawColor(220, 220, 220); pdf.setFillColor(240, 240, 240); pdf.roundedRect(boxX + 3, barY, scoreBoxWidth - 6, 3, 1, 1, 'FD');
        const pct = Math.min(100, Math.max(0, score.score / score.max * 100));
        pdf.setFillColor(...score.color); pdf.roundedRect(boxX + 3, barY, (scoreBoxWidth - 6) * pct / 100, 3, 1, 1, 'F');
      });
      yPos = scoreBoxY + scoreBoxHeight + 10; addLine();
      addSectionHeader("PERSONALITY PROFILE"); yPos += 2;

      if (personality_type || graph_data?.quadrant) {
        const profileWidth = (pageWidth - margin * 2 - 10) / 2; const profileHeight = 35; const profileY = yPos;
        if (personality_type) {
          pdf.setDrawColor(31, 109, 72); pdf.setFillColor(241, 250, 245); pdf.roundedRect(margin, profileY, profileWidth, profileHeight, 3, 3, 'FD');
          pdf.setFontSize(9); pdf.setTextColor(100, 100, 100); pdf.text("Personality Type", margin + 4, profileY + 8);
          pdf.setFontSize(18); pdf.setTextColor(31, 109, 72); pdf.text(personality_type, margin + 4, profileY + 25);
        }
        if (graph_data?.quadrant) {
          pdf.setDrawColor(47, 68, 121); pdf.setFillColor(245, 247, 250); pdf.roundedRect(margin + profileWidth + 10, profileY, profileWidth, profileHeight, 3, 3, 'FD');
          pdf.setFontSize(9); pdf.setTextColor(100, 100, 100); pdf.text("Quadrant", margin + profileWidth + 14, profileY + 8);
          pdf.setFontSize(16); pdf.setTextColor(47, 68, 121); pdf.text(graph_data.quadrant.replace("-", " ").toUpperCase(), margin + profileWidth + 14, profileY + 25);
        }
        yPos = profileY + profileHeight + 10;
      }
      addLine();

      if (Array.isArray(traits) && traits.length > 0) {
        addSectionHeader("PERSONALITY TRAITS");
        pdf.setFontSize(10); pdf.setTextColor(80, 80, 80);
        const traitsPerLine = 4; const traitWidth = (pageWidth - margin * 2) / traitsPerLine;
        traits.forEach((trait, index) => {
          const col = index % traitsPerLine; const row = Math.floor(index / traitsPerLine);
          const traitX = margin + col * traitWidth; const traitY = yPos + row * 8;
          pdf.setDrawColor(200, 200, 200); pdf.setFillColor(248, 248, 248); pdf.roundedRect(traitX + 2, traitY - 5, traitWidth - 4, 6, 2, 2, 'FD');
          pdf.text(`• ${trait}`, traitX + 4, traitY);
        });
        yPos += Math.ceil(traits.length / traitsPerLine) * 8 + 8;
      }
      addLine();

      if (summary) {
        addSectionHeader("SUMMARY");
        pdf.setFontSize(10); pdf.setTextColor(60, 60, 60);
        const summaryLines = pdf.splitTextToSize(summary, pageWidth - margin * 2 - 10);
        const summaryHeight = summaryLines.length * 5 + 10;
        pdf.setDrawColor(200, 200, 200); pdf.setFillColor(248, 248, 248); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, summaryHeight, 3, 3, 'FD');
        pdf.setTextColor(60, 60, 60); pdf.text(summaryLines, margin + 5, yPos + 6);
        yPos += summaryHeight + 10;
      }

      pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform`, pageWidth / 2, pageHeight - 10, { align: "center" });

      const date = new Date().toISOString().split('T')[0];
      const safeName = (user?.name || "patient").replace(/[^a-z0-9]+/gi, "_").toLowerCase().substring(0, 30);
      pdf.save(`EPI_Report_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF. Please check console for details.");
    } finally { setDownloading(false); }
  };

  return (
    <ReportCardWrapper
      icon={<Sparkles size={17} className="text-[#E85720]" />}
      iconBg="bg-[#E85720]/10"
      title="EPI Personality Report"
      subtitle="Eysenck Personality Inventory result"
      badge={personality_type ? { icon: <BadgeCheck size={13} />, text: personality_type, className: "bg-[#1F6D48]/10 text-[#1F6D48] border-[#1F6D48]/20" } : null}
      onDownload={handleDownload}
      downloading={downloading}
      downloadError={downloadError}
      setDownloadError={setDownloadError}
      printRef={printRef}
    >
      <div ref={printRef} className="p-8 space-y-8 bg-white">
        <ReportHeader title="EPI Personality Assessment Report" user={user} savedReport={saved_report} />
        <div className="flex justify-center py-4">
          <EpiQuadrantWheel eScore={e_score} nScore={n_score} maxScore={graph_data?.max_score ?? 24} personalityType={personality_type} />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Dimension Scores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <EpiScoreBar label="Extraversion (E)" score={e_score} max={graph_data?.max_score || 24} percentage={graph_data?.e_percentage} color="#E85720" />
            <EpiScoreBar label="Neuroticism (N)" score={n_score} max={graph_data?.max_score || 24} percentage={graph_data?.n_percentage} color="#2F4479" />
            <EpiScoreBar label="Lie Scale (L)" score={l_score} max={9} percentage={l_score ? (l_score / 9) * 100 : 0} color="#1F6D48" />
          </div>
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Personality Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {personality_type && <InfoCard label="Personality Type" value={personality_type} color="[#1F6D48]" />}
            {graph_data?.quadrant && <InfoCard label="Quadrant" value={graph_data.quadrant.replace("-", " ")} color="[#2F4479]" />}
          </div>
        </div>
        {Array.isArray(traits) && traits.length > 0 && <TraitsList traits={traits} />}
        {summary && <SummaryBox summary={summary} />}
        <ReportInfo savedReport={saved_report} />
        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}

// ============================================================================
// MPQ Report Card
// ============================================================================
function MPQReportCard({ loading, error, report, onRetry }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (loading) return <LoadingState label="Loading MPQ report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  const { user, mpq_report, saved_report } = report;
  if (!mpq_report) return null;
  const { scores, interpretation, summary } = mpq_report;

  const handleDownload = async () => {
    setDownloading(true); setDownloadError(null);
    try {
      await loadPdfLibs();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; let yPos = margin;

      const addSectionHeader = (text) => { yPos += 3; pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text(text, margin, yPos); yPos += 8; };
      const addLine = () => { yPos += 2; pdf.setDrawColor(200, 200, 200); pdf.line(margin, yPos, pageWidth - margin, yPos); yPos += 5; };

      pdf.setFontSize(20); pdf.setTextColor(47, 68, 121); pdf.text("MPQ Personality Assessment Report", margin, yPos); yPos += 12;
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text("Multiphasic Personality Questionnaire Results", margin, yPos); yPos += 8;
      addLine();
      addSectionHeader("PATIENT INFORMATION");
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0);
      const leftCol = margin; const rightCol = pageWidth / 2 + 5;
      pdf.text("Patient Name:", leftCol, yPos); pdf.setFontSize(12); pdf.setTextColor(47, 68, 121); pdf.text(user?.name || "N/A", leftCol + 25, yPos);
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Patient ID:", rightCol, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(`#${user?.id || "N/A"}`, rightCol + 20, yPos); yPos += 8;
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Email:", leftCol, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(user?.email || "N/A", leftCol + 25, yPos);
      if (saved_report?.completed_at) { pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Assessment Date:", rightCol, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(new Date(saved_report.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), rightCol + 30, yPos); }
      yPos += 10; addLine();
      addSectionHeader("SCALE SCORES"); yPos += 2;

      Object.entries(scores).forEach(([key, score]) => {
        if (yPos > pageHeight - 30) { pdf.addPage(); yPos = margin; }
        const config = MPQ_SCALE_CONFIG[key] || { name: key, totalQuestions: 24, description: "" };
        const interp = interpretation?.[key];
        const level = interp?.status || "Normal";
        const cutoff = interp?.cutoff;
        const isAbove = !!interp?.is_above_cutoff;
        const color = isAbove ? [232, 87, 32] : [31, 109, 72];
        const pct = (score / config.totalQuestions) * 100;

        pdf.setDrawColor(200, 200, 200); pdf.setFillColor(248, 248, 248); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 18, 2, 2, 'FD');
        pdf.setFontSize(11); pdf.setTextColor(0, 0, 0); pdf.text(`${key}`, margin + 3, yPos + 6);
        pdf.setFontSize(9); pdf.setTextColor(80, 80, 80); pdf.text(`${config.name} (${config.totalQuestions} questions)`, margin + 20, yPos + 6);
        pdf.setFontSize(7); pdf.setTextColor(120, 120, 120); pdf.text(config.description, margin + 20, yPos + 12);
        pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text(`${score}/${config.totalQuestions}`, margin + 130, yPos + 6);
        pdf.setFontSize(9); pdf.setTextColor(...color);
        pdf.text(cutoff !== undefined && cutoff !== null ? `Cutoff: ${cutoff} (${level})` : level, margin + 130, yPos + 12);

        const barX = margin + 155; const barW = pageWidth - margin * 2 - 160;
        pdf.setDrawColor(220, 220, 220); pdf.setFillColor(240, 240, 240); pdf.roundedRect(barX, yPos + 4, barW, 4, 1, 1, 'FD');
        pdf.setFillColor(...color); pdf.roundedRect(barX, yPos + 4, barW * Math.min(100, pct) / 100, 4, 1, 1, 'F');
        pdf.setFontSize(8); pdf.setTextColor(100, 100, 100); pdf.text(`${pct.toFixed(1)}%`, barX + barW + 2, yPos + 8);
        yPos += 22;
      });
      yPos += 5; addLine();

      if (summary) {
        if (yPos > pageHeight - 40) { pdf.addPage(); yPos = margin; }
        addSectionHeader("SUMMARY");
        pdf.setFontSize(10); pdf.setTextColor(60, 60, 60);
        const summaryLines = pdf.splitTextToSize(summary, pageWidth - margin * 2 - 10);
        const summaryHeight = summaryLines.length * 5 + 10;
        pdf.setDrawColor(200, 200, 200); pdf.setFillColor(248, 248, 248); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, summaryHeight, 3, 3, 'FD');
        pdf.setTextColor(60, 60, 60); pdf.text(summaryLines, margin + 5, yPos + 6);
        yPos += summaryHeight + 10;
      }

      pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform`, pageWidth / 2, pageHeight - 10, { align: "center" });

      const date = new Date().toISOString().split('T')[0];
      const safeName = (user?.name || "patient").replace(/[^a-z0-9]+/gi, "_").toLowerCase().substring(0, 30);
      pdf.save(`MPQ_Report_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF. Please check console for details.");
    } finally { setDownloading(false); }
  };

  return (
    <ReportCardWrapper
      icon={<Activity size={17} className="text-[#2F4479]" />}
      iconBg="bg-[#2F4479]/10"
      title="MPQ Personality Report"
      subtitle="Multiphasic Personality Questionnaire result"
      onDownload={handleDownload}
      downloading={downloading}
      downloadError={downloadError}
      setDownloadError={setDownloadError}
      printRef={printRef}
    >
      <div ref={printRef} className="p-8 space-y-6 bg-white">
        <ReportHeader title="MPQ Personality Assessment Report" user={user} savedReport={saved_report} />
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Scale Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 font-semibold text-slate-500">Scale</th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-500">Name</th>
                  <th className="text-center py-2 px-2 font-semibold text-slate-500">Score</th>
                  <th className="text-center py-2 px-2 font-semibold text-slate-500">Questions</th>
                  <th className="text-center py-2 px-2 font-semibold text-slate-500">Percentage</th>
                  <th className="text-center py-2 px-2 font-semibold text-slate-500">Cutoff</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(scores).map(([key, score]) => {
                  const config = MPQ_SCALE_CONFIG[key] || { name: key, totalQuestions: 24 };
                  const interp = interpretation?.[key];
                  const pct = ((score / config.totalQuestions) * 100).toFixed(1);
                  return (
                    <tr key={key} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 px-2"><span className="w-8 h-8 rounded-lg bg-[#2F4479]/5 flex items-center justify-center text-[12px] font-bold text-[#2F4479]">{key}</span></td>
                      <td className="py-2.5 px-2"><p className="font-medium text-slate-800">{config.name}</p></td>
                      <td className="py-2.5 px-2 text-center"><span className="font-bold text-slate-800">{score}</span></td>
                      <td className="py-2.5 px-2 text-center text-slate-500">{config.totalQuestions}</td>
                      <td className="py-2.5 px-2 text-center"><span className="font-medium text-slate-700">{pct}%</span></td>
                      <td className="py-2.5 px-2 text-center">
                        <CutoffBadge score={score} cutoff={interp?.cutoff} isAboveCutoff={interp?.is_above_cutoff} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-4">Scale Details</h2>
          <div className="space-y-3">
            {Object.entries(scores).map(([key, score]) => {
              const config = MPQ_SCALE_CONFIG[key] || { name: key, totalQuestions: 24, description: "" };
              const interp = interpretation?.[key];
              const pct = ((score / config.totalQuestions) * 100);
              const isAbove = !!interp?.is_above_cutoff;
              const colorHex = isAbove ? "#E85720" : "#1F6D48";
              return (
                <div key={key} className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-lg bg-[#2F4479]/5 flex items-center justify-center text-[13px] font-bold text-[#2F4479]">{key}</span>
                      <div><p className="text-[13px] font-semibold text-slate-800">{config.name}</p><p className="text-[11px] text-slate-500">{config.description}</p></div>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-bold text-slate-800">{score}<span className="text-slate-400 text-[12px]">/{config.totalQuestions}</span></p>
                      <CutoffBadge score={score} cutoff={interp?.cutoff} isAboveCutoff={interp?.is_above_cutoff} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: colorHex }} /></div>
                    <span className="text-[11px] font-medium text-slate-500 w-12 text-right">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-400">{score} of {config.totalQuestions} questions</p>
                    <p className="text-[10px] text-slate-400">Cutoff: {interp?.cutoff ?? "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {summary && <SummaryBox summary={summary} />}
        <ReportInfo savedReport={saved_report} />
        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}

// ============================================================================
// PHQ-9 Report Card
// ============================================================================
function PHQ9ReportCard({ loading, error, report, onRetry }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (loading) return <LoadingState label="Loading PHQ-9 report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  const { user, phq9_report, saved_report } = report;
  if (!phq9_report) return null;
  const { total_score, max_score, severity, question_details, summary } = phq9_report;
  const severityColor = getPHQ9SeverityColor(severity?.label);

  const handleDownload = async () => {
    setDownloading(true); setDownloadError(null);
    try {
      await loadPdfLibs();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; let yPos = margin;

      const addSectionHeader = (text) => { yPos += 3; pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text(text, margin, yPos); yPos += 8; };
      const addLine = () => { yPos += 2; pdf.setDrawColor(200, 200, 200); pdf.line(margin, yPos, pageWidth - margin, yPos); yPos += 5; };

      pdf.setFontSize(20); pdf.setTextColor(47, 68, 121); pdf.text("PHQ-9 Depression Assessment Report", margin, yPos); yPos += 12;
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text("Patient Health Questionnaire Results", margin, yPos); yPos += 8;
      addLine();
      addSectionHeader("PATIENT INFORMATION");
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0);
      pdf.text("Patient Name:", margin, yPos); pdf.setFontSize(12); pdf.setTextColor(47, 68, 121); pdf.text(user?.name || "N/A", margin + 25, yPos);
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text(`Patient ID: #${user?.id || "N/A"}`, pageWidth / 2, yPos); yPos += 8;
      if (saved_report?.completed_at) { pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Assessment Date:", margin, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(new Date(saved_report.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), margin + 30, yPos); }
      yPos += 10; addLine();
      addSectionHeader("ASSESSMENT RESULT");

      const scoreColorHex = severityColor.replace("#", "");
      const scoreColor = [parseInt(scoreColorHex.substring(0, 2), 16), parseInt(scoreColorHex.substring(2, 4), 16), parseInt(scoreColorHex.substring(4, 6), 16)];

      pdf.setDrawColor(200, 200, 200); pdf.setFillColor(248, 248, 248); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 3, 3, 'FD');
      pdf.setFontSize(24); pdf.setTextColor(...scoreColor); pdf.text(`${total_score} / ${max_score}`, margin + 5, yPos + 18);
      pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text("Total Score", margin + 5, yPos + 32);
      if (severity) {
        pdf.setFontSize(14); pdf.setTextColor(...scoreColor); pdf.text(`Severity: ${severity.label}`, margin + 80, yPos + 18);
        pdf.setFontSize(9); pdf.setTextColor(100, 100, 100); pdf.text(severity.description, margin + 80, yPos + 28);
      }
      yPos += 50; addLine();
      addSectionHeader("QUESTION RESPONSES"); yPos += 2;

      if (question_details) {
        Object.entries(question_details).forEach(([qId, detail]) => {
          const qScore = detail.score || 0;
          const qColor = getPHQ9ScoreColor(qScore).replace("#", "");
          const qr = parseInt(qColor.substring(0, 2), 16);
          const qg = parseInt(qColor.substring(2, 4), 16);
          const qb = parseInt(qColor.substring(4, 6), 16);

          if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
          pdf.setDrawColor(220, 220, 220); pdf.setFillColor(252, 252, 252); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 1, 1, 'FD');
          pdf.setFontSize(8); pdf.setTextColor(qr, qg, qb); pdf.text(`[${qScore}]`, margin + 2, yPos + 7);
          pdf.setFontSize(8); pdf.setTextColor(80, 80, 80); pdf.text(detail.question_text || "", margin + 12, yPos + 7);
          yPos += 12;
        });
      }

      pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform`, pageWidth / 2, pageHeight - 10, { align: "center" });

      const date = new Date().toISOString().split('T')[0];
      const safeName = (user?.name || "patient").replace(/[^a-z0-9]+/gi, "_").toLowerCase().substring(0, 30);
      pdf.save(`PHQ9_Report_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF. Please check console for details.");
    } finally { setDownloading(false); }
  };

  return (
    <ReportCardWrapper
      icon={<Heart size={17} className="text-[#1F6D48]" />}
      iconBg="bg-[#1F6D48]/10"
      title="PHQ-9 Depression Assessment"
      subtitle="Patient Health Questionnaire result"
      badge={severity ? { text: severity.label, className: `bg-[${severityColor}]/10 text-[${severityColor}] border-[${severityColor}]/30` } : null}
      onDownload={handleDownload}
      downloading={downloading}
      downloadError={downloadError}
      setDownloadError={setDownloadError}
      printRef={printRef}
    >
      <div ref={printRef} className="p-8 space-y-6 bg-white">
        <ReportHeader title="PHQ-9 Depression Assessment Report" user={user} savedReport={saved_report} />
        <div className="rounded-2xl border-2 p-6" style={{ borderColor: `${severityColor}40`, backgroundColor: `${severityColor}08` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-1">Total Score</p>
              <p className="text-[48px] font-bold" style={{ color: severityColor }}>{total_score}<span className="text-[20px] font-normal text-slate-400">/{max_score}</span></p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-bold border-2" style={{ backgroundColor: `${severityColor}15`, color: severityColor, borderColor: `${severityColor}40` }}>{severity?.label}</span>
              <p className="text-[12px] text-slate-500 mt-2 max-w-[200px]">{severity?.description}</p>
            </div>
          </div>
          <div className="mt-4"><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${(total_score / max_score) * 100}%`, backgroundColor: severityColor }} /></div><div className="flex justify-between mt-1"><span className="text-[10px] text-slate-400">0</span><span className="text-[10px] text-slate-400">{max_score}</span></div></div>
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Severity Scale Reference</h2>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(PHQ9_SEVERITY_CONFIG).map(([label, config]) => (
              <div key={label} className="text-center p-2 rounded-lg" style={{ backgroundColor: `${config.color}10` }}>
                <div className="w-full h-2 rounded-full mb-1" style={{ backgroundColor: config.color }} />
                <p className="text-[10px] font-medium" style={{ color: config.color }}>{label}</p>
                <p className="text-[9px] text-slate-500">{config.range[0]}-{config.range[1]}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Question Responses</h2>
          <div className="space-y-2">
            {question_details && Object.entries(question_details).map(([qId, detail]) => {
              const score = detail.score || 0; const scoreColor = getPHQ9ScoreColor(score);
              return (
                <div key={qId} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>{score}</div>
                  <div className="flex-1 min-w-0"><p className="text-[13px] text-slate-800">{detail.question_text}</p><p className="text-[11px] text-slate-500 mt-0.5">{detail.answer_text}</p></div>
                </div>
              );
            })}
          </div>
        </div>
        {summary && <SummaryBox summary={summary} />}
        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}

// ============================================================================
// GHQ-28 Report Card
// ============================================================================
function GHQ28ReportCard({ loading, error, report, onRetry }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (loading) return <LoadingState label="Loading GHQ-28 report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  const { user, ghq28_report, saved_report } = report;
  if (!ghq28_report) return null;
  const { 
    total_score, 
    max_score, 
    scale_scores, 
    overall_status, 
    answered, 
    total, 
    completion_percentage, 
    is_completed, 
    answers 
  } = ghq28_report;

  const handleDownload = async () => {
    setDownloading(true); setDownloadError(null);
    try {
      await loadPdfLibs();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; let yPos = margin;

      const addSectionHeader = (text) => { yPos += 3; pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text(text, margin, yPos); yPos += 8; };
      const addLine = () => { yPos += 2; pdf.setDrawColor(200, 200, 200); pdf.line(margin, yPos, pageWidth - margin, yPos); yPos += 5; };

      pdf.setFontSize(20); pdf.setTextColor(180, 83, 9); pdf.text("GHQ-28 Health Assessment Report", margin, yPos); yPos += 12;
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text("General Health Questionnaire (GHQ-28) Results", margin, yPos); yPos += 8;
      addLine();
      addSectionHeader("PATIENT INFORMATION");
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0);
      pdf.text("Patient Name:", margin, yPos); pdf.setFontSize(12); pdf.setTextColor(47, 68, 121); pdf.text(user?.name || "N/A", margin + 25, yPos);
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text(`Patient ID: #${user?.id || "N/A"}`, pageWidth / 2, yPos); yPos += 8;
      pdf.text(`Completion: ${answered}/${total} (${completion_percentage}%)`, margin, yPos); yPos += 10;
      addLine();
      addSectionHeader("ASSESSMENT RESULT");

      const scoreBoxWidth = pageWidth - margin * 2; const scoreBoxHeight = 40;
      pdf.setDrawColor(200, 200, 200); pdf.setFillColor(248, 248, 248); pdf.roundedRect(margin, yPos, scoreBoxWidth, scoreBoxHeight, 3, 3, 'FD');
      pdf.setFontSize(24); pdf.setTextColor(180, 83, 9); pdf.text(`${total_score} / ${max_score}`, margin + 5, yPos + 18);
      pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text("Total Score", margin + 5, yPos + 32);
      if (overall_status) {
        const statusColor = overall_status.color === "green" ? [31, 109, 72] : overall_status.color === "yellow" ? [180, 83, 9] : [220, 38, 38];
        pdf.setFontSize(14); pdf.setTextColor(...statusColor); pdf.text(`Status: ${overall_status.label}`, margin + 80, yPos + 18);
        pdf.setFontSize(9); pdf.setTextColor(100, 100, 100); pdf.text(overall_status.description || "", margin + 80, yPos + 28);
      }
      yPos += scoreBoxHeight + 10; addLine();
      addSectionHeader("SCALE SCORES"); yPos += 2;

      if (scale_scores) {
        Object.entries(scale_scores).forEach(([key, score]) => {
          const config = GHQ28_SCALE_CONFIG[key] || { name: key, color: "#64748B", maxScore: 21 };
          const pct = (score / config.maxScore) * 100;
          const colorHex = config.color.replace("#", "");
          const r = parseInt(colorHex.substring(0, 2), 16);
          const g = parseInt(colorHex.substring(2, 4), 16);
          const b = parseInt(colorHex.substring(4, 6), 16);
          pdf.setDrawColor(200, 200, 200); pdf.setFillColor(248, 248, 248); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 14, 2, 2, 'FD');
          pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text(`${key}: ${config.name}`, margin + 3, yPos + 6);
          pdf.setFontSize(10); pdf.setTextColor(r, g, b); pdf.text(`${score}/${config.maxScore}`, margin + 80, yPos + 6);
          const barX = margin + 110; const barW = pageWidth - margin * 2 - 115;
          pdf.setDrawColor(220, 220, 220); pdf.setFillColor(240, 240, 240); pdf.roundedRect(barX, yPos + 2, barW, 4, 1, 1, 'FD');
          pdf.setFillColor(r, g, b); pdf.roundedRect(barX, yPos + 2, barW * Math.min(100, pct) / 100, 4, 1, 1, 'F');
          pdf.setFontSize(8); pdf.setTextColor(100, 100, 100); pdf.text(`${pct.toFixed(1)}%`, barX + barW + 2, yPos + 6);
          yPos += 16;
        });
      }
      addLine();
      addSectionHeader("QUESTION RESPONSES");

      if (Array.isArray(answers)) {
        let currentScale = "";
        answers.forEach((answer) => {
          if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
          if (answer.scale !== currentScale) {
            currentScale = answer.scale; yPos += 3;
            const config = GHQ28_SCALE_CONFIG[currentScale] || { name: currentScale, color: "#64748B" };
            const colorHex = config.color.replace("#", "");
            const r = parseInt(colorHex.substring(0, 2), 16);
            const g = parseInt(colorHex.substring(2, 4), 16);
            const b = parseInt(colorHex.substring(4, 6), 16);
            pdf.setFontSize(9); pdf.setTextColor(r, g, b); pdf.text(`${currentScale}: ${config.name}`, margin, yPos); yPos += 5;
          }
          const scoreValue = answer.score !== undefined ? answer.score : answer.answer_value;
          const answerColor = getGHQ28AnswerColor(scoreValue);
          const acHex = answerColor.replace("#", "");
          const ar = parseInt(acHex.substring(0, 2), 16);
          const ag = parseInt(acHex.substring(2, 4), 16);
          const ab = parseInt(acHex.substring(4, 6), 16);
          pdf.setDrawColor(220, 220, 220); pdf.setFillColor(252, 252, 252); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 1, 1, 'FD');
          pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
          const qText = pdf.splitTextToSize(answer.question_text || "", pageWidth - margin * 2 - 70);
          pdf.text(qText, margin + 3, yPos + 5);
          pdf.setFontSize(8); pdf.setTextColor(ar, ag, ab);
          pdf.text(`Score: ${scoreValue}`, margin + 155, yPos + 5);
          pdf.setFontSize(7); pdf.setTextColor(100, 100, 100);
          pdf.text(answer.answer_text || "", margin + 155, yPos + 10);
          yPos += 14;
        });
      }

      pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform`, pageWidth / 2, pageHeight - 10, { align: "center" });

      const date = new Date().toISOString().split('T')[0];
      const safeName = (user?.name || "patient").replace(/[^a-z0-9]+/gi, "_").toLowerCase().substring(0, 30);
      pdf.save(`GHQ28_Report_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF. Please check console for details.");
    } finally { setDownloading(false); }
  };

  const statusColor = overall_status?.color === "green" ? "#1F6D48" : overall_status?.color === "yellow" ? "#B45309" : "#DC2626";

  return (
    <ReportCardWrapper
      icon={<Stethoscope size={17} className="text-amber-700" />}
      iconBg="bg-amber-100"
      title="GHQ-28 Health Assessment"
      subtitle="General Health Questionnaire result"
      badge={overall_status ? { 
        text: overall_status.label, 
        className: overall_status.color === "green" 
          ? "bg-[#1F6D48]/10 text-[#1F6D48] border-[#1F6D48]/20" 
          : overall_status.color === "yellow" 
            ? "bg-amber-100 text-amber-700 border-amber-200" 
            : "bg-red-100 text-red-700 border-red-200" 
      } : null}
      onDownload={handleDownload}
      downloading={downloading}
      downloadError={downloadError}
      setDownloadError={setDownloadError}
      printRef={printRef}
    >
      <div ref={printRef} className="p-8 space-y-6 bg-white">
        <ReportHeader title="GHQ-28 Health Assessment Report" user={user} savedReport={saved_report} />
        
        {/* Total Score Card */}
        <div className="rounded-2xl border-2 p-6" style={{ borderColor: `${statusColor}30`, backgroundColor: `${statusColor}05` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-1">Total Score</p>
              <p className="text-[48px] font-bold" style={{ color: statusColor }}>
                {total_score}<span className="text-[20px] font-normal text-slate-400">/{max_score}</span>
              </p>
            </div>
            <div className="text-right">
              {overall_status && (
                <>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-bold border-2" 
                    style={{ backgroundColor: `${statusColor}15`, color: statusColor, borderColor: `${statusColor}30` }}>
                    {overall_status.label}
                  </span>
                  <p className="text-[12px] text-slate-500 mt-2 max-w-[200px]">{overall_status.description}</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(total_score / max_score) * 100}%`, backgroundColor: statusColor }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">0</span>
              <span className="text-[10px] text-slate-400">{max_score}</span>
            </div>
          </div>
        </div>

        {/* Completion Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Completion Status</p>
              <p className="text-[24px] font-bold text-slate-800 mt-1">
                {answered}/{total}<span className="text-[14px] font-normal text-slate-500 ml-1">questions answered</span>
              </p>
            </div>
            <StatusBadge status={is_completed ? "completed" : "in_progress"} />
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full rounded-full bg-amber-600 transition-all" style={{ width: `${completion_percentage}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{completion_percentage}% complete</p>
        </div>

        {/* Scale Scores */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Scale Scores</h2>
          <div className="grid grid-cols-2 gap-3">
            {scale_scores && Object.entries(scale_scores).map(([key, score]) => {
              const config = GHQ28_SCALE_CONFIG[key] || { name: key, color: "#64748B", maxScore: 21 };
              const pct = (score / config.maxScore) * 100;
              return (
                <div key={key} className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">{config.name}</p>
                      <p className="text-[20px] font-bold" style={{ color: config.color }}>
                        {score}<span className="text-[13px] font-normal text-slate-400">/{config.maxScore}</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: config.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Responses */}
        <div>
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Question Responses</h2>
          <div className="space-y-2">
            {Array.isArray(answers) && answers.map((answer, index) => {
              const config = GHQ28_SCALE_CONFIG[answer.scale] || { color: "#64748B" };
              const scoreValue = answer.score !== undefined ? answer.score : answer.answer_value;
              const answerColor = getGHQ28AnswerColor(scoreValue);
              return (
                <div key={answer.question_id || index} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: answerColor }}>
                      {scoreValue}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                      {answer.scale}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-slate-800">{answer.question_text}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-slate-500">{answer.answer_text}</p>
                      <span className="text-[10px] font-medium text-slate-400">· Score: {scoreValue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}

// ============================================================================
// Reusable Components
// ============================================================================
function ReportCardWrapper({ icon, iconBg, title, subtitle, badge, onDownload, downloading, downloadError, setDownloadError, printRef, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
          <div className="min-w-0"><p className="text-[14px] font-semibold text-slate-800">{title}</p><p className="text-[12px] text-slate-500">{subtitle}</p></div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge && <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold border ${badge.className}`}>{badge.icon}{badge.text}</span>}
          <button onClick={onDownload} disabled={downloading} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2F4479] text-white text-[12.5px] font-medium hover:bg-[#263a68] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {downloading ? <><Loader2 size={14} className="animate-spin" /> Generating PDF...</> : <><Download size={14} /> Download Report</>}
          </button>
        </div>
      </div>
      {downloadError && (
        <div className="px-5 py-3 mx-5 mb-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div><p className="text-[13px] font-medium text-red-700">Download Failed</p><p className="text-[12px] text-red-600 mt-0.5">{downloadError}</p>
              <button onClick={() => setDownloadError(null)} className="mt-2 text-[11px] text-red-600 hover:text-red-700 underline">Dismiss</button>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function ReportHeader({ title, user, savedReport }) {
  return (
    <div className="border-b border-slate-200 pb-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">{title}</h1>
          <div className="flex items-center gap-4 mt-3">
            <div><p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Patient Name</p><p className="text-[15px] font-semibold text-slate-800">{user?.name || "N/A"}</p></div>
            <div className="w-px h-8 bg-slate-200" />
            <div><p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Email</p><p className="text-[14px] text-slate-700">{user?.email || "N/A"}</p></div>
            {user?.id && <><div className="w-px h-8 bg-slate-200" /><div><p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Patient ID</p><p className="text-[14px] text-slate-700">#{user.id}</p></div></>}
          </div>
        </div>
        <div className="text-right shrink-0">
          {savedReport?.completed_at && <div><p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Assessment Date</p><p className="text-[14px] font-semibold text-slate-700">{new Date(savedReport.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div>}
          {savedReport?.status && <div className="mt-2"><StatusBadge status={savedReport.status} /></div>}
        </div>
      </div>
    </div>
  );
}

function ReportInfo({ savedReport }) {
  if (!savedReport) return null;
  return (
    <div className="border-t border-slate-200 pt-6">
      <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Report Information</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {savedReport.id && <InfoItem label="Report ID" value={`#${savedReport.id}`} />}
        {savedReport.user_id && <InfoItem label="User ID" value={`#${savedReport.user_id}`} />}
        {savedReport.package_id && <InfoItem label="Package ID" value={`#${savedReport.package_id}`} />}
        {savedReport.subheading_id && <InfoItem label="Section ID" value={`#${savedReport.subheading_id}`} />}
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3">
        {savedReport.created_at && <InfoItem label="Created At" value={new Date(savedReport.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />}
        {savedReport.updated_at && <InfoItem label="Last Updated" value={new Date(savedReport.updated_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />}
      </div>
    </div>
  );
}

function ReportFooter() {
  return (
    <div className="border-t border-slate-200 pt-4 text-center">
      <p className="text-[11px] text-slate-400">Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform</p>
    </div>
  );
}

function AssessmentBadge({ label, color }) {
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${color}`}>{label}</span>;
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border shrink-0 ${status === "completed" ? "bg-[#1F6D48]/10 text-[#1F6D48] border-[#1F6D48]/20" : "bg-[#E85720]/10 text-[#E85720] border-[#E85720]/20"}`}>
      {status === "completed" ? <CheckCircle2 size={13} /> : <Clock size={13} />}
      {status === "completed" ? "Completed" : "In progress"}
    </span>
  );
}

function CutoffBadge({ score, cutoff, isAboveCutoff }) {
  if (cutoff === undefined || cutoff === null) {
    return <span className="text-[10px] text-slate-400">—</span>;
  }
  const isHigh = !!isAboveCutoff;
  const diff = score - cutoff;
  const diffLabel =
    diff > 0 ? `${diff} above` :
    diff < 0 ? `${Math.abs(diff)} below` :
    "at cutoff";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
        isHigh ? "bg-[#E85720]/10 text-[#E85720]" : "bg-[#1F6D48]/10 text-[#1F6D48]"
      }`}
      title={`Score ${score}, cutoff ${cutoff}`}
    >
      {score}/{cutoff} · {diffLabel}
    </span>
  );
}

function InfoCard({ label, value, color }) {
  return (
    <div className={`rounded-xl bg-gradient-to-br from-${color}/10 to-${color}/5 border border-${color}/20 px-5 py-4`}>
      <p className={`text-[11px] font-medium text-${color}/70 uppercase tracking-wide mb-1`}>{label}</p>
      <p className={`text-[24px] font-bold text-${color}`}>{value}</p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-[13px] font-semibold text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}

function TraitsList({ traits }) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Personality Traits</h2>
      <div className="flex flex-wrap gap-2">
        {traits.map((trait) => (
          <span key={trait} className="inline-flex items-center px-3 py-1.5 rounded-full text-[12.5px] font-medium bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 text-slate-700 capitalize shadow-sm">{trait}</span>
        ))}
      </div>
    </div>
  );
}

function SummaryBox({ summary }) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Summary</h2>
      <div className="rounded-xl bg-gradient-to-r from-slate-50 to-[#E85720]/5 border border-slate-200 px-5 py-4">
        <p className="text-[14px] text-slate-700 leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}

// ============================================================================
// EPI Quadrant Wheel
// ============================================================================
function EpiQuadrantWheel({ eScore, nScore, maxScore = 24, personalityType }) {
  const size = 640;
  const center = size / 2;
  const outerR = 250;

  const clamp = (v) => Math.min(maxScore, Math.max(0, v ?? 0));
  const eVal = clamp(eScore);
  const nVal = clamp(nScore);

  const half = outerR * 0.92;
  const dotX = center + ((nVal - maxScore / 2) / (maxScore / 2)) * half;
  const dotY = center - ((eVal - maxScore / 2) / (maxScore / 2)) * half;

  const type = (personalityType || "").toUpperCase();
  const quadrantMap = { SANGUINE: "tl", CHOLERIC: "tr", PHLEGMATIC: "bl", MELANCHOLIC: "br" };
  const activeQuad = quadrantMap[type];

  const textColor = "#1F2E28";
  const mutedText = "#44544D";
  const accent = "#E85720";
  const ringColor = "#D9E3DC";
  const dividerColor = "#FFFFFF";

  const polar = (r, deg) => { const rad = ((deg - 90) * Math.PI) / 180; return [center + r * Math.cos(rad), center + r * Math.sin(rad)]; };
  const wedgePath = (r, startDeg, endDeg) => { const [x1, y1] = polar(r, startDeg); const [x2, y2] = polar(r, endDeg); const large = endDeg - startDeg > 180 ? 1 : 0; return `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`; };
  const arcPathTop = (r, startDeg, endDeg) => { const [x1, y1] = polar(r, startDeg); const [x2, y2] = polar(r, endDeg); const large = endDeg - startDeg > 180 ? 1 : 0; return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`; };
  const arcPathBottom = (r, startDeg, endDeg) => { const [x1, y1] = polar(r, endDeg); const [x2, y2] = polar(r, startDeg); const large = endDeg - startDeg > 180 ? 1 : 0; return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`; };

  const labelR = outerR - 34;
  const quadrants = [
    { key: "tl", label: "(SANGUINE)", words: ["sociable", "outgoing", "talkative", "responsive", "easygoing", "lively", "carefree", "leadership"], wedgeStart: 270, wedgeEnd: 360, side: "left", arc: "top", arcStart: 270 + 4, arcEnd: 360 - 32 },
    { key: "tr", label: "(CHOLERIC)", words: ["active", "optimistic", "impulsive", "changeable", "exciteable", "aggressive", "restless", "touchy"], wedgeStart: 0, wedgeEnd: 90, side: "right", arc: "top", arcStart: 0 + 32, arcEnd: 90 - 4 },
    { key: "bl", label: "(PHLEGMATIC)", words: ["calm", "even-tempered", "reliable", "controlled", "peaceful", "thoughtful", "careful", "passive"], wedgeStart: 180, wedgeEnd: 270, side: "left", arc: "bottom", arcStart: 180 + 4, arcEnd: 270 - 32 },
    { key: "br", label: "(MELANCHOLIC)", words: ["moody", "anxious", "rigid", "sober", "pessimistic", "reserved", "unsociable", "quiet"], wedgeStart: 90, wedgeEnd: 180, side: "right", arc: "bottom", arcStart: 90 + 32, arcEnd: 180 - 4 },
  ];

  const rowHeight = 22;
  const topListStartY = center - outerR + 62;
  const bottomListStartY = center + 42;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 620, margin: "0 auto" }}>
      <svg viewBox={`0 0 ${size} ${size + 20}`} width="100%" height="auto" style={{ display: "block" }}>
        <defs>{quadrants.map((q) => (<path key={`arc-${q.key}`} id={`arc-${q.key}`} d={q.arc === "top" ? arcPathTop(labelR, q.arcStart, q.arcEnd) : arcPathBottom(labelR, q.arcStart, q.arcEnd)} fill="none" />))}</defs>
        <g transform="translate(0,10)">
          {quadrants.map((q) => (<path key={q.key} d={wedgePath(outerR, q.wedgeStart, q.wedgeEnd)} fill={activeQuad === q.key ? "#F3D9CC" : "#E9F0EA"} />))}
          <line x1={center} y1={center - outerR} x2={center} y2={center + outerR} stroke={dividerColor} strokeWidth="5" />
          <line x1={center - outerR} y1={center} x2={center + outerR} y2={center} stroke={dividerColor} strokeWidth="5" />
          <circle cx={center} cy={center} r={outerR} fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx={center} cy={center} r={outerR} fill="none" stroke={ringColor} strokeWidth="1" />
          {quadrants.map((q) => (<text key={`lbl-${q.key}`} fontSize="14" fontWeight="700" fill={textColor} letterSpacing="0.5"><textPath href={`#arc-${q.key}`} startOffset="50%" textAnchor="middle">{q.label}</textPath></text>))}
          {quadrants.map((q) => { const isActive = activeQuad === q.key; const x = q.side === "left" ? center - 14 : center + 14; const anchor = q.side === "left" ? "end" : "start"; const startY = q.key === "tl" || q.key === "tr" ? topListStartY : bottomListStartY; return q.words.map((w, i) => (<text key={`${q.key}-${w}`} x={x} y={startY + i * rowHeight} textAnchor={anchor} fontSize="13.5" fontWeight={isActive ? "700" : "400"} fill={isActive ? accent : mutedText}>{w}</text>)); })}
          <circle cx={center} cy={center} r="15" fill="#FFFFFF" />
          <text x={center} y={center + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill={textColor}>{maxScore / 2}</text>
          <text x={center} y={center - outerR - 34} textAnchor="middle" fontSize="15" fontWeight="700" fill={textColor}>{maxScore}</text>
          <text x={center} y={center - outerR - 14} textAnchor="middle" fontSize="14" fontWeight="700" fill={textColor} letterSpacing="1">EXTROVERT</text>
          <text x={center} y={center + outerR + 24} textAnchor="middle" fontSize="14" fontWeight="700" fill={textColor} letterSpacing="1">INTROVERT</text>
          <text x={center} y={center + outerR + 44} textAnchor="middle" fontSize="15" fontWeight="700" fill={textColor}>0</text>
          <text x={center - outerR - 8} y={center + 5} textAnchor="end" fontSize="15" fontWeight="700" fill={textColor}>0</text>
          <text x={center - outerR + 22} y={center + 5} textAnchor="start" fontSize="14" fontWeight="700" fill={textColor} letterSpacing="1">STABLE</text>
          <text x={center + outerR - 22} y={center + 5} textAnchor="end" fontSize="14" fontWeight="700" fill={textColor} letterSpacing="1">NEUROTIC</text>
          <text x={center + outerR + 8} y={center + 5} textAnchor="start" fontSize="15" fontWeight="700" fill={textColor}>{maxScore}</text>
          <circle cx={dotX} cy={dotY} r="20" fill={accent} opacity="0.15" />
          <circle cx={dotX} cy={dotY} r="9" fill={accent} stroke="#fff" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
}

function EpiScoreBar({ label, score, max, percentage, color }) {
  const pct = percentage !== undefined && percentage !== null ? percentage : 0;
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11.5px] font-medium text-slate-500">{label}</span>
        <span className="text-[13px] font-semibold text-slate-800">{score ?? "—"}{max !== undefined && max !== null && <span className="text-slate-400 font-normal">/{max}</span>}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }} /></div>
      {percentage !== undefined && percentage !== null && <p className="text-[10.5px] text-slate-400 mt-1 text-right">{pct}%</p>}
    </div>
  );
}

// ============================================================================
// Shared Small Components
// ============================================================================
function ProgressPill({ percentage, wide }) {
  const pct = Math.min(100, Math.max(0, percentage || 0));
  const color = pct >= 100 ? "#1F6D48" : pct > 0 ? "#E85720" : "#CBD5E1";
  return (
    <div className={wide ? "w-full" : "w-full"}>
      <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-medium text-slate-500">{pct.toFixed(0)}%</span></div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} /></div>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "completed") return <span className="w-8 h-8 rounded-lg bg-[#1F6D48]/10 flex items-center justify-center shrink-0"><CheckCircle2 size={16} className="text-[#1F6D48]" /></span>;
  if (status === "in_progress") return <span className="w-8 h-8 rounded-lg bg-[#E85720]/10 flex items-center justify-center shrink-0"><Clock size={16} className="text-[#E85720]" /></span>;
  return <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Circle size={16} className="text-slate-400" /></span>;
}

function MiniStat({ label, value }) {
  return <div className="text-right"><p className="text-[13px] font-semibold text-slate-800">{value}</p><p className="text-[11px] text-slate-400">{label}</p></div>;
}

function SummaryStat({ label, value, valueClass = "text-slate-800" }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center"><p className={`text-[16px] font-semibold ${valueClass}`}>{value}</p><p className="text-[11px] text-slate-500 mt-0.5">{label}</p></div>;
}

function AnswerChip({ label, value, tone }) {
  const toneClass = { success: "bg-[#1F6D48]/10 text-[#1F6D48] border-[#1F6D48]/20", wrong: "bg-rose-50 text-rose-600 border-rose-200", neutral: "bg-slate-100 text-slate-500 border-slate-200", muted: "bg-slate-50 text-slate-500 border-slate-200" }[tone];
  const displayValue = formatEpiValue(value);
  return <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-md border ${toneClass}`}><span className="opacity-70">{label}:</span> {displayValue}</span>;
}

function LoadingState({ label }) {
  return <div className="flex items-center justify-center py-20"><div className="flex flex-col items-center gap-3"><div className="w-9 h-9 border-[3px] border-[#2F4479]/15 border-t-[#2F4479] rounded-full animate-spin" /><p className="text-slate-500 text-[13px] font-medium">{label}</p></div></div>;
}

function ErrorState({ message, onRetry }) {
  return <div className="flex items-center justify-center py-20"><div className="flex flex-col items-center gap-3"><div className="p-3.5 rounded-full bg-rose-50"><XCircle size={28} className="text-rose-500" /></div><p className="text-slate-700 font-medium text-[14px]">Something went wrong</p><p className="text-slate-500 text-[13px]">{message}</p>{onRetry && <button onClick={onRetry} className="mt-1 px-4 py-2 bg-[#2F4479] text-white rounded-xl hover:bg-[#263a68] transition-colors text-[13px] font-medium">Try Again</button>}</div></div>;
}

function EmptyState({ icon, title, subtitle }) {
  return <div className="flex items-center justify-center py-20"><div className="flex flex-col items-center gap-3"><div className="p-3.5 rounded-full bg-slate-50">{icon}</div><p className="text-slate-700 font-medium text-[14px]">{title}</p><p className="text-slate-500 text-[13px]">{subtitle}</p></div></div>;
}