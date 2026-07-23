"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  RefreshCw,
  ChevronRight,
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  Circle,
  XCircle,
  ArrowLeft,
  ListChecks,
  BadgeCheck,
  X,
  Check,
} from "lucide-react";

// Import BSI Report Card
import BSIReportCard, { getBSITamilTranslation } from "./BSIReportCard";

// Import PSS Report Card
import PSSReportCard from "./PSSReportCard";

// Import BAI Report Card
import BAIReportCard from "./BAIReportCard";

// Import BDI Report Card
import BDIReportCard from "./BDIReportCard";

// Import GHQ-28 Report Card
import GHQ28ReportCard from "./GHQ28ReportCard";

// Import MPQ Report Card
import MPQReportCard from "./MPQReportCard";

// Import PHQ-9 Report Card
import PHQ9ReportCard from "./PHQ9ReportCard";

// Import SCT Report Card and Scoring Section
import SCTReportCard, { SCTScoringSection } from "./SCTReportCard";

// Import EPI Report Card
import EpiReportCard from "./EpiReportCard";

// Import IPDE Report Card
import IPDEReportCard from "./IPDEReportCard";

// Import JOBS Report Card
import JOBSReportCard from "./JOBSReportCard";

// Import EPDS Report Card
import EPDSReportCard from "./EPDSReportCard";

// Import shared components
import {
  LoadingState,
  ErrorState,
  detectAssessmentType,
  AssessmentBadge,
  StatusBadge,
  ProgressPill,
  StatusIcon,
  MiniStat,
  SummaryStat,
  AnswerChip,
  EmptyState,
  formatEpiValue,
} from "./AssessmentComponents";

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

function AdminAssessmentsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---- URL-driven navigation state (survives refresh) ----
  const view = searchParams.get("aview") || "list";
  const selectedUserId = searchParams.get("auserId") ? Number(searchParams.get("auserId")) : null;
  const selectedSubheadingId = searchParams.get("asubId") ? Number(searchParams.get("asubId")) : null;
  const selectedPackageId = searchParams.get("apkgId") ? Number(searchParams.get("apkgId")) : null;

  const updateUrl = useCallback((params) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || v === undefined) sp.delete(k);
      else sp.set(k, String(v));
    });
    router.push(`?${sp.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  const [bdiReport, setBdiReport] = useState(null);
  const [bdiLoading, setBdiLoading] = useState(false);
  const [bdiError, setBdiError] = useState(null);

  const [baiReport, setBaiReport] = useState(null);
  const [baiLoading, setBaiLoading] = useState(false);
  const [baiError, setBaiError] = useState(null);

  const [pssReport, setPssReport] = useState(null);
  const [pssLoading, setPssLoading] = useState(false);
  const [pssError, setPssError] = useState(null);

  const [bsiReport, setBsiReport] = useState(null);
  const [bsiLoading, setBsiLoading] = useState(false);
  const [bsiError, setBsiError] = useState(null);

  const [ipdeReport, setIpdeReport] = useState(null);
  const [ipdeLoading, setIpdeLoading] = useState(false);
  const [ipdeError, setIpdeError] = useState(null);

  const [jobsReport, setJobsReport] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);

  const [epdsReport, setEpdsReport] = useState(null);
  const [epdsLoading, setEpdsLoading] = useState(false);
  const [epdsError, setEpdsError] = useState(null);

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

  const refreshSctReportSilently = useCallback(async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/sct-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
      const result = await response.json();
      if (result.status === "success") {
        setSctReport(result.data);
      }
    } catch (err) {
      console.error("Error refreshing SCT report:", err);
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

  const fetchBdiReport = useCallback(async (userId) => {
    setBdiLoading(true);
    setBdiError(null);
    setBdiReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/bdi-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch BDI report");
      const result = await response.json();
      if (result.status === "success") {
        setBdiReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load BDI report");
      }
    } catch (err) {
      setBdiError(err.message);
      console.error("Error fetching BDI report:", err);
    } finally {
      setBdiLoading(false);
    }
  }, []);

  const fetchBaiReport = useCallback(async (userId) => {
    setBaiLoading(true);
    setBaiError(null);
    setBaiReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/bai-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch BAI report");
      const result = await response.json();
      if (result.status === "success") {
        setBaiReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load BAI report");
      }
    } catch (err) {
      setBaiError(err.message);
      console.error("Error fetching BAI report:", err);
    } finally {
      setBaiLoading(false);
    }
  }, []);

  const fetchPssReport = useCallback(async (userId) => {
    setPssLoading(true);
    setPssError(null);
    setPssReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/pss-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch PSS report");
      const result = await response.json();
      if (result.status === "success") {
        setPssReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load PSS report");
      }
    } catch (err) {
      setPssError(err.message);
      console.error("Error fetching PSS report:", err);
    } finally {
      setPssLoading(false);
    }
  }, []);

  const fetchBsiReport = useCallback(async (userId) => {
    setBsiLoading(true);
    setBsiError(null);
    setBsiReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/bsi-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch BSI report");
      const result = await response.json();
      if (result.status === "success") {
        setBsiReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load BSI report");
      }
    } catch (err) {
      setBsiError(err.message);
      console.error("Error fetching BSI report:", err);
    } finally {
      setBsiLoading(false);
    }
  }, []);

  const fetchIpdeReport = useCallback(async (userId) => {
    setIpdeLoading(true);
    setIpdeError(null);
    setIpdeReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/ipde-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch IPDE report");
      const result = await response.json();
      console.log("IPDE raw response:", result);

      const isSuccess =
        result.status === "success" ||
        result.status === true ||
        result.success === true;

      if (isSuccess && result.data) {
        setIpdeReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load IPDE report");
      }
    } catch (err) {
      setIpdeError(err.message);
      console.error("Error fetching IPDE report:", err);
    } finally {
      setIpdeLoading(false);
    }
  }, []);

  const fetchJobsReport = useCallback(async (userId) => {
    setJobsLoading(true);
    setJobsError(null);
    setJobsReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/jobs-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch JOBS report");
      const result = await response.json();
      console.log("JOBS raw response:", result);
      
      if (result.success && result.data) {
        setJobsReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load JOBS report");
      }
    } catch (err) {
      setJobsError(err.message);
      console.error("Error fetching JOBS report:", err);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const fetchEpdsReport = useCallback(async (userId) => {
    console.log("fetchEpdsReport called for userId:", userId);
    setEpdsLoading(true);
    setEpdsError(null);
    setEpdsReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/epds-report/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch EPDS report");
      const result = await response.json();
      console.log("EPDS raw response:", result);
      
      if (result.success && result.data) {
        setEpdsReport(result.data);
      } else {
        throw new Error(result.message || "Failed to load EPDS report");
      }
    } catch (err) {
      setEpdsError(err.message);
      console.error("Error fetching EPDS report:", err);
    } finally {
      setEpdsLoading(false);
    }
  }, []);

  const updateSctAnswer = async (answerId, questionId) => {
    setUpdatingAnswerIds(prev => {
      const next = new Set(prev);
      next.add(answerId);
      return next;
    });

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

    setSctReport(prev => {
      if (!prev?.sct_report) return prev;
      const wasNull = prev.sct_report.answers?.find(a => a.answer_id === answerId)?.score_value === null;
      const newScoreValue = wasNull ? 1 : null;
      const updatedAnswers = (prev.sct_report.answers || []).map(a =>
        a.answer_id === answerId ? { ...a, score_value: newScoreValue } : a
      );
      const delta = wasNull ? 1 : -1;
      return {
        ...prev,
        sct_report: {
          ...prev.sct_report,
          answers: updatedAnswers,
          negative: Math.max(0, (prev.sct_report.negative || 0) + delta),
          positive: Math.max(0, (prev.sct_report.positive || 0) - delta),
        },
      };
    });

    try {
      const response = await fetch(`${API_BASE_URL}/assessments/sct/update-answer/${answerId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to update answer");

      if (selectedUserId) {
        refreshSctReportSilently(selectedUserId);
      }
    } catch (err) {
      console.error("Error updating SCT answer:", err);
      await fetchSctQuestionsAnswers(selectedUserId);
      await refreshSctReportSilently(selectedUserId);
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

  useEffect(() => {
    if (view === "patient" && selectedUserId) {
      fetchPatientDetail(selectedUserId);
    }

    if (view === "subheading" && selectedUserId && selectedSubheadingId) {
      fetchSubheadingDetail(selectedSubheadingId, selectedUserId);

      setEpiReport(null); setEpiError(null); setFullReport(null);
      setMpqReport(null); setMpqError(null);
      setPhq9Report(null); setPhq9Error(null);
      setSctReport(null); setSctError(null);
      setGhq28Report(null); setGhq28Error(null);
      setBdiReport(null); setBdiError(null);
      setBaiReport(null); setBaiError(null);
      setPssReport(null); setPssError(null);
      setBsiReport(null); setBsiError(null);
      setIpdeReport(null); setIpdeError(null);
      setJobsReport(null); setJobsError(null);
      setEpdsReport(null); setEpdsError(null);
      setSctQuestionsAnswers(null);
      setUpdatingAnswerIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedUserId, selectedSubheadingId]);

  useEffect(() => {
    if (view !== "subheading" || !subheadingData || !selectedUserId) return;
    const { subheading, is_epi } = subheadingData;
    const assessmentTypes = detectAssessmentType(subheading?.name);

    console.log("Assessment types detected:", assessmentTypes);
    console.log("Subheading name:", subheading?.name);

    if (is_epi) {
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
    } else if (assessmentTypes.isBdi) {
      fetchBdiReport(selectedUserId);
    } else if (assessmentTypes.isBai) {
      fetchBaiReport(selectedUserId);
    } else if (assessmentTypes.isPss) {
      fetchPssReport(selectedUserId);
    } else if (assessmentTypes.isBsi) {
      fetchBsiReport(selectedUserId);
    } else if (assessmentTypes.isIpde) {
      fetchIpdeReport(selectedUserId);
    } else if (assessmentTypes.isJobs) {
      fetchJobsReport(selectedUserId);
    } else if (assessmentTypes.isEpds) {
      console.log("Fetching EPDS report for user:", selectedUserId);
      fetchEpdsReport(selectedUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, subheadingData, selectedUserId]);

  // ---- Navigation Functions ----
  const openPatient = (userId) => {
    updateUrl({ aview: "patient", auserId: userId, asubId: null, apkgId: null });
  };

  const openSubheading = (subheadingId, packageId) => {
    updateUrl({ aview: "subheading", asubId: subheadingId, apkgId: packageId });
  };

  const backToList = () => {
    updateUrl({ aview: "list", auserId: null, asubId: null, apkgId: null });
    setPatientData(null);
    setEpiReport(null); setFullReport(null);
    setMpqReport(null); setPhq9Report(null);
    setSctReport(null); setGhq28Report(null);
    setBdiReport(null); setBaiReport(null);
    setPssReport(null); setBsiReport(null);
    setIpdeReport(null);
    setJobsReport(null);
    setEpdsReport(null);
    setSctQuestionsAnswers(null);
    setUpdatingAnswerIds(new Set());
  };

  const backToPatient = () => {
    updateUrl({ aview: "patient", asubId: null, apkgId: null });
    setSubheadingData(null);
    setEpiReport(null); setFullReport(null);
    setMpqReport(null); setPhq9Report(null);
    setSctReport(null); setGhq28Report(null);
    setBdiReport(null); setBaiReport(null);
    setPssReport(null); setBsiReport(null);
    setIpdeReport(null);
    setJobsReport(null);
    setEpdsReport(null);
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
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 md:py-5">
          <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {view !== "list" && (
                <button
                  onClick={view === "subheading" ? backToPatient : backToList}
                  className="p-1.5 sm:p-2 rounded-lg border border-slate-200 hover:border-[#2F4479]/30 hover:bg-[#2F4479]/5 transition-colors shrink-0"
                >
                  <ArrowLeft size={14} className="sm:w-4 sm:h-4 text-slate-600" />
                </button>
              )}
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg bg-[#2F4479] flex items-center justify-center shrink-0">
                <ListChecks size={14} className="sm:w-[15px] sm:h-[15px] md:w-[18px] md:h-[18px] text-white" strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <Breadcrumb
                  view={view}
                  patientName={patientData?.user?.name}
                  subheadingName={subheadingData?.subheading?.name}
                  onList={backToList}
                  onPatient={backToPatient}
                />
                <p className="text-slate-500 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] mt-0.5 line-clamp-1">
                  {view === "list" && (
                    <>
                      Track patient progress across assessments
                      {totalPaid > 0 && <span className="text-slate-400 hidden sm:inline"> · {totalPaid} paid patients</span>}
                    </>
                  )}
                  {view === "patient" && "Package completion by section"}
                  {view === "subheading" && "Question-by-question responses"}
                </p>
              </div>
            </div>
            {view === "list" && (
              <button
                type="button"
                onClick={fetchPatientList}
                className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-[#2F4479]/30 hover:bg-[#2F4479]/5 transition-colors group shrink-0"
                title="Refresh"
              >
                <RefreshCw
                  size={15}
                  className={`sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-slate-500 group-hover:text-[#2F4479] transition-colors ${
                    listLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-6 md:py-8">
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
            onRetry={() => fetchSubheadingDetail(selectedSubheadingId, selectedUserId)}
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
            bdiReport={bdiReport}
            bdiLoading={bdiLoading}
            bdiError={bdiError}
            onRetryBdi={() => fetchBdiReport(selectedUserId)}
            baiReport={baiReport}
            baiLoading={baiLoading}
            baiError={baiError}
            onRetryBai={() => fetchBaiReport(selectedUserId)}
            pssReport={pssReport}
            pssLoading={pssLoading}
            pssError={pssError}
            onRetryPss={() => fetchPssReport(selectedUserId)}
            bsiReport={bsiReport}
            bsiLoading={bsiLoading}
            bsiError={bsiError}
            onRetryBsi={() => fetchBsiReport(selectedUserId)}
            ipdeReport={ipdeReport}
            ipdeLoading={ipdeLoading}
            ipdeError={ipdeError}
            onRetryIpde={() => fetchIpdeReport(selectedUserId)}
            jobsReport={jobsReport}
            jobsLoading={jobsLoading}
            jobsError={jobsError}
            onRetryJobs={() => fetchJobsReport(selectedUserId)}
            epdsReport={epdsReport}
            epdsLoading={epdsLoading}
            epdsError={epdsError}
            onRetryEpds={() => fetchEpdsReport(selectedUserId)}
            sctQuestionsAnswers={sctQuestionsAnswers}
            sctQALoading={sctQALoading}
            sctQAError={sctQAError}
            onSctToggle={handleSctCheckboxToggle}
            updatingAnswerIds={updatingAnswerIds}
            selectedSubheadingId={selectedSubheadingId}
          />
        )}
      </div>
    </div>
  );
}

export default function AdminAssessments() {
  return (
    <Suspense fallback={<LoadingState label="Loading assessments..." />}>
      <AdminAssessmentsInner />
    </Suspense>
  );
}

// ============================================================================
// Breadcrumb Component
// ============================================================================
function Breadcrumb({ view, patientName, subheadingName, onList, onPatient }) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] font-semibold text-[#1E2A47] tracking-tight flex-wrap">
      <button
        onClick={onList}
        className={view === "list" ? "text-[#1E2A47]" : "text-slate-400 hover:text-[#2F4479] transition-colors truncate max-w-[150px] sm:max-w-[200px] md:max-w-none"}
      >
        Assessments
      </button>
      {view !== "list" && (
        <>
          <ChevronRight size={12} className="sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px] text-slate-300 shrink-0" />
          <button
            onClick={onPatient}
            className={view === "patient" ? "text-[#1E2A47]" : "text-slate-400 hover:text-[#2F4479] transition-colors truncate max-w-[120px] sm:max-w-[150px] md:max-w-none"}
          >
            {patientName || "Patient"}
          </button>
        </>
      )}
      {view === "subheading" && (
        <>
          <ChevronRight size={12} className="sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px] text-slate-300 shrink-0" />
          <span className="text-[#1E2A47] truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">{subheadingName || "Section"}</span>
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
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-[15px] h-[15px] sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px]" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:border-[#2F4479] focus:ring-2 focus:ring-[#2F4479]/10 outline-none transition-all text-[12px] sm:text-[13px] md:text-[13.5px] placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <LoadingState label="Loading patients..." />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : patients.length === 0 ? (
          <EmptyState icon={<Users size={22} className="sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] text-slate-400" />} title="No patients found" subtitle="Try adjusting your search" />
        ) : (
          <div className="divide-y divide-slate-50">
            {patients.map((p) => (
              <button
                key={p.user_id}
                onClick={() => onOpen(p.user_id)}
                className="w-full flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 hover:bg-[#2F4479]/[0.03] transition-colors text-left"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-[#2F4479] flex items-center justify-center shrink-0">
                  <User size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <p className="text-[12px] sm:text-[13px] md:text-[14px] font-medium text-slate-800 truncate">{p.name}</p>
                    {!p.has_progress && (
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                        Not started
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 sm:gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] sm:text-[11px] md:text-[12px] text-slate-500 truncate">
                      <Mail size={10} className="sm:w-[11px] sm:h-[11px] shrink-0" /> {p.email}
                    </span>
                    <span className="hidden xs:flex items-center gap-1 text-[10px] sm:text-[11px] md:text-[12px] text-slate-500 shrink-0">
                      <Phone size={10} className="sm:w-[11px] sm:h-[11px]" /> {p.phone}
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 shrink-0">
                  {(p.packages || []).map((pkg) => (
                    <span key={pkg.package_id} className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] md:text-[12px] font-medium px-2 sm:px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                      <Package size={10} className="sm:w-[11px] sm:h-[11px] text-[#2F4479]" /> {pkg.package_name}
                    </span>
                  ))}
                </div>
                <div className="w-20 sm:w-24 md:w-28 shrink-0">
                  <ProgressPill percentage={p.packages?.[0]?.completion_percentage ?? 0} />
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 mt-0.5 text-right">
                    {p.packages?.[0]?.answered ?? 0}/{p.packages?.[0]?.total_questions ?? 0}
                  </p>
                </div>
                <ChevronRight size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-slate-300 shrink-0" />
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
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 p-3 sm:p-4 md:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#2F4479] flex items-center justify-center shrink-0">
            <User size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px] text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] sm:text-[15px] md:text-[16px] font-semibold text-slate-800">{user.name}</p>
            <div className="flex flex-col xs:flex-row xs:flex-wrap items-start xs:items-center gap-x-3 sm:gap-x-4 gap-y-0.5 sm:gap-y-1 mt-0.5 sm:mt-1">
              <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] md:text-[12.5px] text-slate-500"><Mail size={11} className="sm:w-[12px] sm:h-[12px]" /> {user.email}</span>
              <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] md:text-[12.5px] text-slate-500"><Phone size={11} className="sm:w-[12px] sm:h-[12px]" /> {user.phone}</span>
              <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] md:text-[12.5px] text-slate-500"><Calendar size={11} className="sm:w-[12px] sm:h-[12px]" /> Registered {formatDate(user.registered_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {(packages || []).map((pkg) => (
        <div key={pkg.package_id} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
          <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg bg-[#2F4479]/10 flex items-center justify-center shrink-0">
                <Package size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-[#2F4479]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <p className="text-[12px] sm:text-[13px] md:text-[14px] font-semibold text-slate-800">{pkg.package_name}</p>
                  {pkg.overall?.is_completed && (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] md:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded bg-[#1F6D48]/10 text-[#1F6D48]">
                      <BadgeCheck size={10} className="sm:w-[11px] sm:h-[11px]" /> Complete
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-500">₹{formatCurrency(pkg.package_price)} · Paid {formatDate(pkg.paid_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
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
                  onClick={() => onOpenSubheading(sh.subheading_id, pkg.package_id)}
                  className="w-full flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 hover:bg-[#2F4479]/[0.03] transition-colors text-left"
                >
                  <StatusIcon status={sh.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <p className="text-[11px] sm:text-[12px] md:text-[13.5px] font-medium text-slate-800">{sh.subheading_name}</p>
                      {sh.is_epi && <AssessmentBadge label="EPI" color="bg-[#E85720]/10 text-[#E85720]" />}
                      {assessmentTypes.isMpq && <AssessmentBadge label="MPQ" color="bg-[#2F4479]/10 text-[#2F4479]" />}
                      {assessmentTypes.isPhq9 && <AssessmentBadge label="PHQ-9" color="bg-[#1F6D48]/10 text-[#1F6D48]" />}
                      {assessmentTypes.isSct && <AssessmentBadge label="SCT" color="bg-purple-100 text-purple-700" />}
                      {assessmentTypes.isGhq28 && <AssessmentBadge label="GHQ-28" color="bg-amber-100 text-amber-700" />}
                      {assessmentTypes.isBdi && <AssessmentBadge label="BDI" color="bg-blue-100 text-blue-700" />}
                      {assessmentTypes.isBai && <AssessmentBadge label="BAI" color="bg-cyan-100 text-cyan-700" />}
                      {assessmentTypes.isPss && <AssessmentBadge label="PSS" color="bg-orange-100 text-orange-700" />}
                      {assessmentTypes.isBsi && <AssessmentBadge label="BSI" color="bg-red-100 text-red-700" />}
                      {assessmentTypes.isIpde && <AssessmentBadge label="IPDE" color="bg-indigo-100 text-indigo-700" />}
                      {assessmentTypes.isJobs && <AssessmentBadge label="JOBS" color="bg-emerald-100 text-emerald-700" />}
                      {assessmentTypes.isEpds && <AssessmentBadge label="EPDS" color="bg-pink-100 text-pink-700" />}
                    </div>
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-500 mt-0.5 line-clamp-1">
                      {sh.answered}/{sh.total_questions} answered
                      {sh.pending > 0 && ` · ${sh.pending} pending`}
                      {sh.answered > 0 && ` · ${sh.correct} correct / ${sh.wrong} wrong`}
                    </p>
                  </div>
                  <div className="hidden sm:block w-24 md:w-28 lg:w-32 shrink-0">
                    <ProgressPill percentage={sh.completion_percentage} />
                  </div>
                  <ChevronRight size={14} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px] text-slate-300 shrink-0" />
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
  bdiReport, bdiLoading, bdiError, onRetryBdi,
  baiReport, baiLoading, baiError, onRetryBai,
  pssReport, pssLoading, pssError, onRetryPss,
  bsiReport, bsiLoading, bsiError, onRetryBsi,
  ipdeReport, ipdeLoading, ipdeError, onRetryIpde,
  jobsReport, jobsLoading, jobsError, onRetryJobs,
  epdsReport, epdsLoading, epdsError, onRetryEpds,
  sctQuestionsAnswers, sctQALoading, sctQAError, onSctToggle, updatingAnswerIds,
  selectedSubheadingId,
}) {
  if (loading) return <LoadingState label="Loading responses..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data) return null;

  const { subheading, summary, questions, is_epi } = data;
  const assessmentTypes = detectAssessmentType(subheading.name);

  // Debug logging
  console.log("Subheading Detail - assessmentTypes:", assessmentTypes);
  console.log("Subheading Detail - isEpds:", assessmentTypes.isEpds);
  console.log("Subheading Detail - subheading name:", subheading.name);

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Subheading Summary */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 p-3 sm:p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <p className="text-[13px] sm:text-[14px] md:text-[16px] font-semibold text-slate-800">{subheading.name}</p>
              {is_epi && <AssessmentBadge label="EPI" color="bg-[#E85720]/10 text-[#E85720]" />}
              {assessmentTypes.isMpq && <AssessmentBadge label="MPQ" color="bg-[#2F4479]/10 text-[#2F4479]" />}
              {assessmentTypes.isPhq9 && <AssessmentBadge label="PHQ-9" color="bg-[#1F6D48]/10 text-[#1F6D48]" />}
              {assessmentTypes.isSct && <AssessmentBadge label="SCT" color="bg-purple-100 text-purple-700" />}
              {assessmentTypes.isGhq28 && <AssessmentBadge label="GHQ-28" color="bg-amber-100 text-amber-700" />}
              {assessmentTypes.isBdi && <AssessmentBadge label="BDI" color="bg-blue-100 text-blue-700" />}
              {assessmentTypes.isBai && <AssessmentBadge label="BAI" color="bg-cyan-100 text-cyan-700" />}
              {assessmentTypes.isPss && <AssessmentBadge label="PSS" color="bg-orange-100 text-orange-700" />}
              {assessmentTypes.isBsi && <AssessmentBadge label="BSI" color="bg-red-100 text-red-700" />}
              {assessmentTypes.isIpde && <AssessmentBadge label="IPDE" color="bg-indigo-100 text-indigo-700" />}
              {assessmentTypes.isJobs && <AssessmentBadge label="JOBS" color="bg-emerald-100 text-emerald-700" />}
              {assessmentTypes.isEpds && <AssessmentBadge label="EPDS" color="bg-pink-100 text-pink-700" />}
            </div>
            <p className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-500 mt-0.5">{subheading.description}</p>
          </div>
          <StatusBadge status={summary.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mt-3 sm:mt-4 md:mt-5">
          <SummaryStat label="Total" value={summary.total_questions} />
          <SummaryStat label="Answered" value={summary.answered} valueClass="text-[#2F4479]" />
          <SummaryStat label="Pending" value={summary.pending} valueClass="text-[#E85720]" />
          <SummaryStat label="Correct" value={summary.correct} valueClass="text-[#1F6D48]" />
          <SummaryStat label="Accuracy" value={`${summary.accuracy}%`} valueClass="text-slate-800" />
        </div>
        <div className="mt-3 sm:mt-4">
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
      {assessmentTypes.isBdi && <BDIReportCard loading={bdiLoading} error={bdiError} report={bdiReport} onRetry={onRetryBdi} />}
      {assessmentTypes.isBai && <BAIReportCard loading={baiLoading} error={baiError} report={baiReport} onRetry={onRetryBai} />}
      {assessmentTypes.isPss && <PSSReportCard loading={pssLoading} error={pssError} report={pssReport} onRetry={onRetryPss} />}
      {assessmentTypes.isBsi && <BSIReportCard loading={bsiLoading} error={bsiError} report={bsiReport} onRetry={onRetryBsi} />}
      {assessmentTypes.isIpde && (
        <IPDEReportCard 
          loading={ipdeLoading} 
          error={ipdeError} 
          report={ipdeReport} 
          onRetry={onRetryIpde} 
          subheadingId={selectedSubheadingId}
        />
      )}
      {assessmentTypes.isJobs && (
        <JOBSReportCard 
          loading={jobsLoading} 
          error={jobsError} 
          report={jobsReport} 
          onRetry={onRetryJobs} 
          subheadingId={selectedSubheadingId}
        />
      )}
      {assessmentTypes.isEpds && (
        <EPDSReportCard 
          loading={epdsLoading} 
          error={epdsError} 
          report={epdsReport} 
          onRetry={onRetryEpds} 
          subheadingId={selectedSubheadingId}
        />
      )}

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

      {/* Questions List - Show for non-SCT, non-IPDE, non-JOBS, and non-EPDS assessments */}
      {!assessmentTypes.isSct && !assessmentTypes.isIpde && !assessmentTypes.isJobs && !assessmentTypes.isEpds && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
          <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 border-b border-slate-100">
            <p className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-700">Question Responses</p>
          </div>
          <div className="divide-y divide-slate-50">
            {(questions || []).map((q) => (
              <div key={q.question_id} className="flex items-start gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-5 py-3 sm:py-4">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-slate-500 shrink-0 mt-0.5">
                  {q.display_order}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-[12px] md:text-[13.5px] text-slate-800 leading-snug">{q.question_text}</p>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                    <AnswerChip
                      label="Answer"
                      value={formatEpiValue(q.user_answer) || formatEpiValue(q.answer_text) || "—"}
                      tone={q.status !== "answered" ? "neutral" : q.is_correct ? "success" : "wrong"}
                    />
                    {q.correct_answer && <AnswerChip label="Expected" value={formatEpiValue(q.correct_answer)} tone="muted" />}
                    {q.answered_at && <span className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-400">{formatDate(q.answered_at)}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  {q.status !== "answered" ? <Circle size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-slate-300" /> :
                   q.is_correct ? <Check size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-[#1F6D48]" strokeWidth={2.5} /> :
                   <X size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-rose-400" strokeWidth={2.5} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}