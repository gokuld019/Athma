"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, FileQuestion, AlertCircle, CheckCircle2, ChevronRight, Send, Edit3, PartyPopper, ArrowRight, X } from "lucide-react";

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Tamil translations for common answer options
const TAMIL_TRANSLATIONS = {
  // EPI/MPQ Yes/No options
  "YES": "ஆம்",
  "NO": "இல்லை",
  "Yes": "ஆம்",
  "No": "இல்லை",
  "yes": "ஆம்",
  "no": "இல்லை",

  // Likert scale options (GHQ/PHQ)
  "Not at all": "நிச்சயமாக இல்லை",
  "No more than usual": "நான் அப்படி நினைக்கவில்லை",
  "Rather more than usual": "என் மனதில் தோன்றிச் சென்றது",
  "Much more than usual": "நிச்சயமாகத் தோன்றியது",

  // Alternative Likert options
  "Better than usual": "வழக்கத்தை விட சிறப்பாக",
  "Same as usual": "வழக்கம் போல்",
  "Less than usual": "வழக்கத்தை விட குறைவாக",
  "Much less than usual": "வழக்கத்தை விட மிகக் குறைவாக",

  // GHQ specific options
  "Worse than usual": "வழக்கத்தை விட மோசமாக",
  "Much worse than usual": "வழக்கத்தை விட மிக மோசமாக",

  // PHQ-9 frequency options
  "Not at all": "இல்லவே இல்லை",
  "Several days": "சில நாட்கள்",
  "More than half the days": "பாதிக்கு மேற்பட்ட நாட்கள்",
  "Nearly every day": "கிட்டத்தட்ட தினமும்",

  // Additional common options
  "Never": "ஒருபோதும் இல்லை",
  "Rarely": "அரிதாக",
  "Sometimes": "சில சமயம்",
  "Often": "அடிக்கடி",
  "Always": "எப்போதும்",

  "Strongly Disagree": "முற்றிலும் மறுக்கிறேன்",
  "Disagree": "மறுக்கிறேன்",
  "Neutral": "நடுநிலை",
  "Agree": "ஏற்கிறேன்",
  "Strongly Agree": "முற்றிலும் ஏற்கிறேன்",

  "Very Difficult": "மிகவும் கடினம்",
  "Difficult": "கடினம்",
  "Easy": "எளிது",
  "Very Easy": "மிகவும் எளிது",

  // EPDS specific translations
  "As much as I ever did": "முன்பு இருந்ததைப் போலவே",
  "Rather less than I used to": "முன்பை விட குறைவாக",
  "Definitely less than I used to": "முன்பை விட நிச்சயமாக குறைவாக",
  "Hardly at all": "அரிதாகவே",
  "Yes, most of the time": "ஆம், பெரும்பாலும்",
  "Yes, some of the time": "ஆம், சில நேரங்களில்",
  "Not very often": "அடிக்கடி இல்லை",
  "No, never": "இல்லை, ஒருபோதும்",
  "No, not at all": "இல்லை, நிச்சயமாக இல்லை",
  "Hardly ever": "அரிதாகவே",
};

// Function to get Tamil translation for an option
const getTamilTranslation = (optionText) => {
  if (!optionText) return "";
  const trimmed = optionText.trim();

  if (TAMIL_TRANSLATIONS[trimmed]) {
    return TAMIL_TRANSLATIONS[trimmed];
  }

  const lowerTrimmed = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(TAMIL_TRANSLATIONS)) {
    if (key.toLowerCase() === lowerTrimmed) {
      return value;
    }
  }

  return "";
};

// ============================================================
// Category Complete Modal
// ============================================================
function CategoryCompleteModal({ completedName, completedIndex, totalCategories, nextName, onContinue, onViewResults, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
      <div className="bg-white rounded-2xl w-full max-w-[420px] p-6 text-center">
        <span className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 mx-auto">
          <PartyPopper size={28} className="text-emerald-500" />
        </span>
        <h3 className="font-brand text-lg font-bold text-teal-900">{completedName} completed!</h3>
        <p className="text-[13.5px] text-ink-soft mt-2">
          You've completed{" "}
          <span className="font-semibold text-teal-800">
            {completedIndex}/{totalCategories}
          </span>{" "}
          {totalCategories === 1 ? "category" : "categories"}.
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-4 mb-5">
          {Array.from({ length: totalCategories }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i < completedIndex ? "w-6 bg-emerald-500" : "w-6 bg-[#EFF1EE]"}`} />
          ))}
        </div>
        {nextName ? (
          <>
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 mb-5">
              <p className="text-[10.5px] font-semibold text-teal-700 uppercase tracking-wide mb-1">Up Next</p>
              <p className="text-[14.5px] font-bold text-teal-900">{nextName}</p>
            </div>
            <button onClick={onContinue} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14px] transition-colors disabled:opacity-70">
              {loading ? "Loading..." : `Continue to ${nextName}`}
              {!loading && <ArrowRight size={16} />}
            </button>
          </>
        ) : (
          <>
            <p className="text-[13px] text-ink-soft mb-5">That's everything — great job! You can view your results now.</p>
            <button onClick={onViewResults} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] bg-teal-900 hover:bg-teal-800 text-white font-semibold text-[14px] transition-colors disabled:opacity-70">
              {loading ? "Loading..." : "View Results"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Thank You Modal
// ============================================================
function ThankYouModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center relative animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-teal-900 mb-3">Thank You! 🙏</h2>
        <div className="space-y-3 text-gray-600">
          <p className="text-[15px] leading-relaxed">Our team will verify all your responses and contact you soon.</p>
          <p className="text-[14px] font-medium text-teal-700 bg-teal-50 rounded-lg py-3 px-4">We appreciate your time and trust in us! 💙</p>
        </div>
        <button onClick={onClose} className="w-full mt-6 py-3 rounded-xl bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14px] transition-all shadow-md hover:shadow-lg">
          Back to Categories
        </button>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const subheadingIdParam = searchParams.get("subheading_id");
  const packageIdParam = searchParams.get("package_id");

  const [packageId, setPackageId] = useState(null);
  const [subheadingId, setSubheadingId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [subheadingInfo, setSubheadingInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [saveStatus, setSaveStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [assessmentType, setAssessmentType] = useState("epi");
  const [isEPDS, setIsEPDS] = useState(false);

  const [packageSubheadings, setPackageSubheadings] = useState([]);
  const [subheadingsLoaded, setSubheadingsLoaded] = useState(false);

  const [completionInfo, setCompletionInfo] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const [activeCategory, setActiveCategory] = useState(0);
  const categoryRefs = useRef([]);
  const sidebarRefs = useRef([]);
  const scrollContainerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const textareaRefs = useRef({});

  // ------------------------------------------------------------------
  // EPDS: Determine if a question is reverse scored using the API's
  // own `scale` field ("star" = reverse scored, "un-star" = normal).
  // This replaces the old hardcoded "question 3, 5-10" guesswork.
  // ------------------------------------------------------------------
  const isEPDSReverseScored = useCallback((question) => {
    if (!question) return false;
    if (question.scale) {
      return question.scale === "star";
    }
    // Fallback for older payloads without a scale field
    const questionNumber = question.display_order;
    return questionNumber === 3 || questionNumber >= 5;
  }, []);

  // ------------------------------------------------------------------
  // EPDS: Get the score for a given option index.
  // Always prefers the API-provided `scores` array (source of truth),
  // and only falls back to manual math if `scores` is missing.
  // ------------------------------------------------------------------
  const getEPDSScoreForOption = useCallback((question, optionIndex) => {
    if (question?.scores && question.scores[optionIndex] !== undefined) {
      return question.scores[optionIndex];
    }
    // Fallback if the API didn't send a scores array
    const isReverse = isEPDSReverseScored(question);
    return isReverse ? 3 - optionIndex : optionIndex;
  }, [isEPDSReverseScored]);

  // Resolve IDs from URL params or localStorage
  useEffect(() => {
    let pkgId = packageIdParam;
    let subId = subheadingIdParam;

    if (!pkgId) {
      pkgId = localStorage.getItem("athma_current_assessment_package") ||
              localStorage.getItem("athma_selected_package_id");
    }
    if (!subId) {
      subId = localStorage.getItem("athma_current_assessment_subheading") ||
             searchParams.get("category");
    }

    if (pkgId && subId) {
      setPackageId(pkgId);
      setSubheadingId(subId);
      localStorage.setItem("athma_current_assessment_package", String(pkgId));
      localStorage.setItem("athma_current_assessment_subheading", String(subId));

      setCompletionInfo(null);
      setPopupLoading(false);
      setSubmitting(false);
      setShowThankYou(false);
      setSaveStatus({});
    } else {
      router.push("/patient/category");
    }
  }, [subheadingIdParam, packageIdParam, searchParams, router]);

  // Auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("athma_token");
    const tokenType = localStorage.getItem("athma_token_type");
    const role = localStorage.getItem("athma_role");

    if (!token) {
      router.push("/patient/login");
      return null;
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": tokenType ? `${tokenType} ${token}` : `Bearer ${token}`,
    };
    if (role) headers["X-User-Role"] = role;

    return headers;
  }, [router]);

  // Determine assessment type
  const determineAssessmentType = useCallback((subheadingName, packageName, fetchedQuestions) => {
    const firstQType = fetchedQuestions?.[0]?.question_type;
    if (firstQType === "likert") return "likert";
    if (firstQType === "mpq") return "mpq";

    const name = (subheadingName || "").toLowerCase();
    const pkgName = (packageName || "").toLowerCase();

    if (name.includes("epds") || name.includes("edinburgh") || name.includes("postnatal")) {
      setIsEPDS(true);
      return "likert";
    }

    if (
      name.includes("sct") ||
      name.includes("sentence completion") ||
      name.includes("sentence") ||
      pkgName.includes("sct")
    ) {
      return "sct";
    }

    return "epi";
  }, []);

  // Fetch the ordered list of subheadings for this package
  const fetchPackageSubheadings = useCallback(async () => {
    if (!packageId) return null;
    try {
      const headers = getAuthHeaders();
      if (!headers) return null;

      const res = await fetch(
        `https://api.crazystory.in/api/patient/packages/${packageId}/subheadings`,
        { headers }
      );
      const data = await res.json();

      if (res.ok && data.status !== "error") {
        const list = data.data?.subheadings || [];
        setPackageSubheadings(list);
        return list;
      }
      return null;
    } catch (err) {
      console.error("Error fetching package subheadings list:", err);
      return null;
    } finally {
      setSubheadingsLoaded(true);
    }
  }, [packageId, getAuthHeaders]);

  useEffect(() => {
    fetchPackageSubheadings();
  }, [fetchPackageSubheadings]);

  // Fetch questions and progress
  const fetchAssessmentData = useCallback(async () => {
    if (!packageId || !subheadingId) return;

    try {
      setLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      if (!headers) return;

      const questionsRes = await fetch(
        `https://api.crazystory.in/api/patient/questions/subheading/${subheadingId}`,
        { headers }
      );
      const questionsData = await questionsRes.json();

      if (!questionsRes.ok || questionsData.status === "error") {
        if (questionsRes.status === 401) {
          localStorage.clear();
          router.push("/patient/login");
          return;
        }
        throw new Error(questionsData.message || "Failed to load questions");
      }

      const fetchedQuestions = questionsData.data?.questions || [];

      setQuestions(fetchedQuestions);
      setSubheadingInfo(questionsData.data?.subheading || null);

      const subheadingName = questionsData.data?.subheading?.name || "";
      const packageName = questionsData.data?.subheading?.package_name || "";
      const type = determineAssessmentType(subheadingName, packageName, fetchedQuestions);
      setAssessmentType(type);

      // Initialize answers from previously answered questions
      const initialAnswers = {};
      fetchedQuestions.forEach(question => {
        if (question.answered && question.user_answer !== undefined && question.user_answer !== null) {
          let answerValue = question.user_answer;

          // For EPDS, if user_answer is text (option label) rather than a score, convert to score
          if (isEPDS && typeof answerValue === 'string' && isNaN(answerValue)) {
            const options = question.options || [];
            const optionIndex = options.findIndex(opt =>
              String(opt).trim().toLowerCase() === String(answerValue).trim().toLowerCase()
            );
            if (optionIndex !== -1) {
              answerValue = String(getEPDSScoreForOption(question, optionIndex));
            }
          }

          initialAnswers[question.id] = answerValue;
        }
      });
      setAnswers(initialAnswers);

      if (questionsData.data?.progress) {
        setProgress(questionsData.data.progress);
        setIsComplete(questionsData.data.progress.is_complete);
      }

      try {
        const progressRes = await fetch(
          `https://api.crazystory.in/api/patient/answers/progress?subheading_id=${subheadingId}`,
          { headers }
        );
        const progressData = await progressRes.json();

        if (progressRes.ok && progressData.status === "success") {
          setProgress(progressData.data);
          setIsComplete(progressData.data.is_complete);
        }
      } catch (err) {
        console.log("Additional progress fetch failed, using questions data");
      }
    } catch (err) {
      console.error("Error fetching assessment:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [packageId, subheadingId, getAuthHeaders, router, determineAssessmentType, isEPDS, getEPDSScoreForOption]);

  useEffect(() => {
    fetchAssessmentData();
  }, [fetchAssessmentData]);

  // Save answer to API
  const saveAnswer = async (questionId, answer) => {
    try {
      setSaveStatus(prev => ({ ...prev, [questionId]: 'saving' }));

      const headers = getAuthHeaders();
      if (!headers) {
        setSaveStatus(prev => ({ ...prev, [questionId]: 'error' }));
        return false;
      }

      const response = await fetch(
        "https://api.crazystory.in/api/patient/answers/save",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ question_id: questionId, answer })
        }
      );

      const result = await response.json();

      if (!response.ok || result.status === "error") {
        if (response.status === 401) {
          localStorage.clear();
          router.push("/patient/login");
          return false;
        }
        console.error("Save failed:", result.message);
        setSaveStatus(prev => ({ ...prev, [questionId]: 'error' }));
        return false;
      }

      if (result.data?.progress) {
        setProgress(result.data.progress);
        setIsComplete(result.data.progress.is_complete);
      }

      setSaveStatus(prev => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });

      return true;
    } catch (err) {
      console.error("Error saving answer:", err);
      setSaveStatus(prev => ({ ...prev, [questionId]: 'error' }));
      return false;
    }
  };

  // Debounced save for text input (SCT)
  const handleTextAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveAnswer(questionId, answer);
    }, 1000);
  };

  // Immediate save for Yes/No (EPI) and MPQ
  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveAnswer(questionId, answer);
    }, 300);
  };

  // EPDS: Handle Likert answer using the question's own scores/scale data
  const handleEPDSLikertAnswer = (questionId, question, optionIndex) => {
    const scoreValue = getEPDSScoreForOption(question, optionIndex);

    setAnswers(prev => ({ ...prev, [questionId]: String(scoreValue) }));

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveAnswer(questionId, String(scoreValue));
    }, 300);
  };

  // Standard Likert answer (non-EPDS)
  const handleLikertAnswer = (questionId, optionLabel, optionIndex, scores) => {
    const scoreValue = scores && scores[optionIndex] !== undefined ? scores[optionIndex] : optionIndex + 1;
    setAnswers(prev => ({ ...prev, [questionId]: String(scoreValue) }));

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveAnswer(questionId, String(scoreValue));
    }, 300);
  };

  // Find the next subheading in the package
  const getNextSubheading = useCallback(() => {
    if (!packageSubheadings || packageSubheadings.length === 0) return null;
    const currentIdx = packageSubheadings.findIndex((s) => String(s.id) === String(subheadingId));
    if (currentIdx === -1) return null;
    return packageSubheadings[currentIdx + 1] || null;
  }, [packageSubheadings, subheadingId]);

  // Submit assessment
  const handleSubmit = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const savingQuestions = Object.keys(saveStatus).filter(
      id => saveStatus[id] === 'saving'
    );

    if (savingQuestions.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const stillSaving = Object.keys(saveStatus).filter(
        id => saveStatus[id] === 'saving'
      );
      if (stillSaving.length > 0) {
        alert("Please wait for all answers to be saved before submitting.");
        return;
      }
    }

    const errorQuestions = Object.keys(saveStatus).filter(
      id => saveStatus[id] === 'error'
    );

    if (errorQuestions.length > 0) {
      alert("Some answers failed to save. Please try again.");
      return;
    }

    setSaveStatus({});
    setSubmitting(true);

    let list = packageSubheadings;
    if (!subheadingsLoaded || list.length === 0) {
      const fetched = await fetchPackageSubheadings();
      if (fetched) list = fetched;
    }

    if (list.length === 0 && packageId) {
      try {
        const headers = getAuthHeaders();
        if (headers) {
          const res = await fetch(
            `https://api.crazystory.in/api/patient/packages/${packageId}/subheadings`,
            { headers }
          );
          const data = await res.json();
          if (res.ok && data.status !== "error") {
            list = data.data?.subheadings || [];
            setPackageSubheadings(list);
          }
        }
      } catch (err) {
        console.error("Error fetching subheadings:", err);
      }
    }

    const currentIdx = list.findIndex((s) => String(s.id) === String(subheadingId));
    const next = currentIdx !== -1 && currentIdx < list.length - 1 ? list[currentIdx + 1] : null;
    const completedCount = currentIdx !== -1 ? currentIdx + 1 : 1;
    const totalCategories = list.length || 1;
    const completedName = subheadingInfo?.name || list[currentIdx]?.name || "This section";

    if (!next) {
      setShowThankYou(true);
      setSubmitting(false);
      return;
    }

    setCompletionInfo({
      completedName,
      completedIndex: completedCount,
      totalCategories,
      next,
    });

    setSubmitting(false);
  };

  const handleContinueToNext = () => {
    const next = completionInfo?.next;
    if (!next) return;

    setPopupLoading(true);
    localStorage.setItem("athma_current_assessment_subheading", String(next.id));
    localStorage.setItem("athma_current_assessment_name", next.name || next.title || "");

    setCompletionInfo(null);

    router.push(`/patient/assessment?subheading_id=${next.id}&package_id=${packageId}`);
  };

  const handleViewResultsFromPopup = () => {
    setPopupLoading(true);
    setCompletionInfo(null);
    router.push(`/patient/result?subheading_id=${subheadingId}&package_id=${packageId}`);
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
    router.push("/patient/category");
  };

  // Split questions into blocks of 20 for display
  const questionBlocks = chunk(questions, 20);
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter(key => answers[key] !== undefined && answers[key] !== null && String(answers[key]).trim() !== "").length;
  const progressPct = progress?.percentage ||
    (totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0);

  const nextSubheadingPreview = getNextSubheading();

  // Theme accents per assessment type
  const themeAccent = {
    sct: { text: "text-purple-900", textLight: "text-purple-500", bg: "bg-purple-600", bgLight: "bg-purple-50", border: "border-purple-200", ring: "border-purple-200 bg-purple-50/30", chipBg: "bg-purple-100 text-purple-700" },
    likert: { text: "text-sky-900", textLight: "text-sky-500", bg: "bg-sky-600", bgLight: "bg-sky-50", border: "border-sky-200", ring: "border-sky-200 bg-sky-50/30", chipBg: "bg-sky-100 text-sky-700" },
    mpq: { text: "text-amber-900", textLight: "text-amber-600", bg: "bg-amber-600", bgLight: "bg-amber-50", border: "border-amber-200", ring: "border-amber-200 bg-amber-50/30", chipBg: "bg-amber-100 text-amber-700" },
    epi: { text: "text-teal-900", textLight: "text-teal-500", bg: "bg-coral-600", bgLight: "bg-teal-50", border: "border-teal-200", ring: "border-teal-200 bg-teal-50/30", chipBg: "bg-teal-100 text-teal-700" },
  }[assessmentType] || {};

  // Scroll tracking for navigation
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;

        const mostVisible = visible.reduce((best, entry) =>
          entry.intersectionRatio > best.intersectionRatio ? entry : best
        );

        const idx = Number(mostVisible.target.dataset.index);
        setActiveCategory(idx);
      },
      {
        root: container,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5]
      }
    );

    categoryRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [questions]);

  const scrollToCategory = (idx) => {
    categoryRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F8F6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F8F6]">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/patient/category")}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F8F6]">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-gray-600">No questions available for this assessment.</p>
          <button
            onClick={() => router.push("/patient/category")}
            className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  let runningIndex = 0;

  const typeLabel = {
    sct: "Text Response",
    likert: "Rating Scale",
    mpq: "Yes/No",
    epi: "Yes/No",
  }[assessmentType];

  const durationLabel = {
    sct: "30-45 mins",
    likert: "10-15 mins",
    mpq: "25-30 mins",
    epi: "20-25 mins",
  }[assessmentType];

  return (
    <div className="h-screen flex flex-col bg-[#F7F8F6]">
      {/* Header */}
      <div className="border-b border-line bg-white px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between">
        <div className="flex-1">
          <button
            onClick={() => router.push("/patient/category")}
            className="text-sm text-gray-500 hover:text-teal-600 transition-colors"
          >
            ← Back to Categories
          </button>
        </div>
        <Image
          src="/Athmalogo.webp"
          alt="Athma Mind Care Hospital"
          width={238}
          height={61}
          className="w-[100px] h-auto md:w-[238px] md:h-auto object-contain"
          priority
        />
        <div className="flex-1 text-right">
          <p className="text-[10px] md:text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide">
            {subheadingInfo?.name || "Assessment"}
          </p>
          <span className={`text-[9px] md:text-[10.5px] font-medium px-2 py-0.5 rounded-full ${themeAccent.chipBg}`}>
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#E9ECE9] w-full">
        <div
          className={`h-1 transition-all duration-500 ${themeAccent.bg}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Assessment Info (desktop) */}
        <div className="hidden md:block w-[400px] shrink-0 border-r border-line bg-white overflow-y-auto p-6">
          <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-4">
            Assessment Info
          </p>

          <div className={`rounded-2xl border p-5 ${themeAccent.ring}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${themeAccent.chipBg}`}>
              {assessmentType === "sct" ? (
                <Edit3 size={22} strokeWidth={2} />
              ) : (
                <FileQuestion size={22} strokeWidth={2} />
              )}
            </div>

            <h2 className={`text-lg font-bold ${themeAccent.text}`}>
              {subheadingInfo?.name || "Assessment"}
            </h2>

            {subheadingInfo?.description && (
              <p className="text-sm text-gray-600 mt-2">
                {subheadingInfo.description}
              </p>
            )}

            <div className="mt-4 p-3 rounded-lg bg-white border border-gray-100">
              <p className="text-[11.5px] text-gray-700 font-medium">
                {assessmentType === "sct"
                  ? "📝 Please complete the sentences with your thoughts and feelings. There are no right or wrong answers."
                  : assessmentType === "likert"
                  ? isEPDS
                    ? "📊 Please choose the option that best describes how you've been feeling recently. (EPDS - Edinburgh Postnatal Depression Scale)"
                    : "📊 Please choose the option that best describes how you've been feeling recently."
                  : assessmentType === "mpq"
                  ? "✅ Please answer each statement with Yes or No based on how it applies to you."
                  : "✅ Please answer each question with Yes or No based on your experience."
                }
              </p>
            </div>

            {isEPDS && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-[10px] text-amber-700 font-medium">
                  ⚠️ Questions marked with * are reverse scored. Question 10 screens for suicidal thoughts.
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px]">
              <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                <FileQuestion size={14} className={themeAccent.textLight} />
                <span className="font-semibold text-gray-700">{totalQuestions} Questions</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                <Clock size={14} className={themeAccent.textLight} />
                <span className="font-semibold text-gray-700">{durationLabel}</span>
              </div>
            </div>
          </div>

          {/* Progress stats */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-[12px] text-ink-soft">
              <span>Overall progress</span>
              <span className={`font-semibold ${themeAccent.text}`}>
                {progressPct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#EFF1EE] overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${themeAccent.bg}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex justify-between text-[12px]">
              <span className="text-gray-500">Answered</span>
              <span className="font-semibold">{answeredCount} / {totalQuestions}</span>
            </div>

            {progress && (
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500">Remaining</span>
                <span className="font-semibold text-coral-600">
                  {progress.remaining || (totalQuestions - answeredCount)}
                </span>
              </div>
            )}
          </div>

          {/* Next assessment preview */}
          {nextSubheadingPreview && (
            <div className={`mt-4 p-3 rounded-lg border ${themeAccent.ring}`}>
              <p className="text-[10.5px] font-semibold text-teal-700 uppercase tracking-wide mb-1">
                Up Next
              </p>
              <p className={`text-[12.5px] font-medium ${themeAccent.text}`}>
                {nextSubheadingPreview.name || nextSubheadingPreview.title}
              </p>
            </div>
          )}

          {/* Auto-save indicator */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-green-500" />
              {assessmentType === "sct"
                ? "Answers are saved automatically as you type"
                : "Answers are saved automatically"
              }
            </p>
          </div>

          {/* Mascot */}
          <div className="mt-12 flex flex-col items-center text-center">
            <Image
              src="/unnamed.gif"
              alt="Athma mascot"
              width={200}
              height={280}
              unoptimized
              className="object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
            />
            <p className={`mt-2 text-[12.5px] font-semibold ${themeAccent.text}`}>
              {assessmentType === "sct"
                ? "Express yourself freely, there are no wrong answers"
                : "Take your time, we're here with you"
              }
            </p>
          </div>
        </div>

        {/* Center - Questions */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
          <div className="max-w-[640px] mx-auto">
            {questionBlocks.map((block, blockIdx) => (
              <div
                key={`block-${blockIdx}`}
                ref={(el) => (categoryRefs.current[blockIdx] = el)}
                data-index={blockIdx}
                className="mb-10 md:mb-14 scroll-mt-4 md:scroll-mt-6"
              >
                <div className="space-y-5 md:space-y-6">
                  {block.map((question) => {
                    const selected = answers[question.id];
                    const saveState = saveStatus[question.id];
                    const hasAnswer = selected !== undefined && selected !== null && String(selected).trim() !== "";
                    runningIndex += 1;
                    const isReverse = isEPDS && isEPDSReverseScored(question);

                    return (
                      <div
                        key={question.id}
                        className={`relative bg-white border rounded-xl md:rounded-card pt-7 md:pt-8 pb-4 md:pb-5 px-4 md:px-5 transition-all ${
                          hasAnswer ? `${themeAccent.border} shadow-sm` : "border-line"
                        }`}
                      >
                        {/* Question number badge */}
                        <div
                          className={`absolute -top-4 md:-top-4.5 left-1/2 -translate-x-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[12px] md:text-[13px] font-bold text-white shadow-[0_4px_10px_rgba(240,120,40,0.35)] ring-4 ring-[#F7F8F6] transition-all ${
                            hasAnswer
                              ? `${themeAccent.bg} scale-105`
                              : assessmentType === "sct"
                                ? "bg-gradient-to-br from-purple-400 to-purple-600"
                                : assessmentType === "likert"
                                ? "bg-gradient-to-br from-sky-400 to-sky-600"
                                : assessmentType === "mpq"
                                ? "bg-gradient-to-br from-amber-400 to-amber-600"
                                : "bg-gradient-to-br from-orange-400 to-orange-600"
                          }`}
                        >
                          {runningIndex}
                          {isEPDS && isReverse && (
                            <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                              *
                            </span>
                          )}
                        </div>

                        {/* Question text - English */}
                        <p className="text-[12px] md:text-[14.5px] font-medium text-ink mb-1 md:mb-1.5 text-center px-2">
                          {question.question_text}
                          {isEPDS && isReverse && (
                            <span className="text-amber-500 ml-1 text-[13px]">*</span>
                          )}
                        </p>

                        {/* Question text - Tamil */}
                        {question.question_text_ta && question.question_text_ta.trim() !== "" && (
                          <p className="text-[11px] md:text-[13px] text-ink-soft mb-3 md:mb-4 text-center px-2 font-bold leading-relaxed border-t border-gray-100 pt-2 mt-2">
                            {question.question_text_ta}
                          </p>
                        )}

                        {/* EPDS reverse score indicator */}
                        {isEPDS && isReverse && (
                          <p className="text-[9px] text-amber-600 text-center mb-2">
                            ⚡ Reverse scored (higher score = more negative)
                          </p>
                        )}

                        {/* Conditional answer UI based on assessment type */}
                        {assessmentType === "sct" ? (
                          <div className="px-2">
                            <div className="relative">
                              <textarea
                                ref={(el) => (textareaRefs.current[question.id] = el)}
                                value={selected || ""}
                                onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                                placeholder="Type your response here..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-[12px] md:text-[13px] resize-none bg-gray-50 hover:bg-white focus:bg-white"
                              />
                              <div className="absolute bottom-2 right-3 flex items-center gap-2">
                                {hasAnswer && (
                                  <span className="text-[10px] text-gray-400">
                                    {String(selected).length} characters
                                  </span>
                                )}
                              </div>
                            </div>
                            {hasAnswer && (
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                                <Send size={12} className="text-purple-500" />
                                <span>Your response will be saved automatically</span>
                              </div>
                            )}
                          </div>
                        ) : assessmentType === "likert" ? (
                          <div className="flex flex-col gap-2 px-2">
                            {(question.options || []).map((option, optIdx) => {
                              let isSelected = false;
                              let displayScore = optIdx;

                              if (isEPDS) {
                                // Always derive from the API's own scores array
                                displayScore = getEPDSScoreForOption(question, optIdx);
                                isSelected = String(selected) === String(displayScore);
                              } else {
                                const scoreValue = question.scores && question.scores[optIdx] !== undefined
                                  ? question.scores[optIdx]
                                  : optIdx + 1;
                                displayScore = scoreValue;
                                isSelected = String(selected) === String(scoreValue);
                              }

                              const tamilText = getTamilTranslation(option);

                              return (
                                <button
                                  key={option}
                                  onClick={() => {
                                    if (isEPDS) {
                                      handleEPDSLikertAnswer(question.id, question, optIdx);
                                    } else {
                                      handleLikertAnswer(question.id, option, optIdx, question.scores);
                                    }
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[11.5px] md:text-[13px] font-medium border transition-all text-left ${
                                    isSelected
                                      ? "bg-sky-600 border-sky-600 text-white shadow-md"
                                      : "bg-[#FCFDFC] border-line text-ink hover:border-sky-300 hover:bg-sky-50"
                                  } ${saveState === 'saving' && isSelected ? "opacity-70" : ""}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 border-gray-300 text-gray-400">
                                      {optIdx + 1}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span>{option}</span>
                                      {tamilText && (
                                        <span className={`text-[10px] md:text-[11px] ${isSelected ? "text-sky-100" : "text-gray-500"} border-l ${isSelected ? "border-sky-300" : "border-gray-300"} pl-2`}>
                                          {tamilText}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle2 size={16} className="text-white/80" />
                                  )}
                                  {isEPDS && (
                                    <span className={`text-[9px] font-mono ${isSelected ? "text-sky-100" : "text-slate-400"}`}>
                                      Score: {displayScore}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-center gap-3">
                            {(question.options || ["YES", "NO"]).map((option) => {
                              const tamilText = getTamilTranslation(option);

                              return (
                                <button
                                  key={option}
                                  onClick={() => handleAnswer(question.id, option)}
                                  className={`px-5 md:px-7 py-2 md:py-2.5 rounded-full text-[11px] md:text-[13px] font-bold border transition-all capitalize inline-flex items-center gap-2 ${
                                    selected === option
                                      ? `${themeAccent.bg} border-transparent text-white shadow-md scale-105`
                                      : "bg-[#FCFDFC] border-line text-ink hover:border-coral-300 hover:bg-coral-50"
                                  } ${saveState === 'saving' && selected === option ? "opacity-70" : ""}`}
                                >
                                  <span>{option.toLowerCase() === "yes" ? "Yes" : option.toLowerCase() === "no" ? "No" : option}</span>
                                  {tamilText && (
                                    <span className={`text-[10px] md:text-[11px] ${selected === option ? "text-white/80" : "text-gray-500"} border-l ${selected === option ? "border-white/30" : "border-gray-300"} pl-2`}>
                                      {tamilText}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Save status indicator */}
                        {saveState && (
                          <div className="absolute top-2 right-3">
                            {saveState === 'saving' && (
                              <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${themeAccent.border}`}></div>
                            )}
                            {saveState === 'saved' && (
                              <CheckCircle2 size={16} className="text-green-500" />
                            )}
                            {saveState === 'error' && (
                              <AlertCircle size={16} className="text-red-500" />
                            )}
                          </div>
                        )}

                        {/* Previously answered indicator */}
                        {question.answered && !saveState && hasAnswer && (
                          <div className="absolute top-2 right-3">
                            <CheckCircle2 size={16} className="text-green-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Submit button */}
            <div className="pb-8 md:pb-10">
              <button
                onClick={handleSubmit}
                disabled={answeredCount < totalQuestions || submitting}
                className={`w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] text-white font-semibold text-[13px] md:text-[14.5px] transition-all disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:bg-gray-300 ${themeAccent.bg}`}
              >
                {submitting
                  ? "Please wait..."
                  : answeredCount < totalQuestions
                  ? `Answer all questions (${answeredCount}/${totalQuestions})`
                  : "Submit Assessment"}
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar - Block navigation (desktop) */}
        <div className="hidden md:block w-[400px] shrink-0 border-l border-line bg-white overflow-y-auto py-6 px-3">
          <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-4 px-3">
            Question Blocks
          </p>

          {questionBlocks.map((block, idx) => {
            const blockAnswered = block.filter(q => {
              const val = answers[q.id];
              return val !== undefined && val !== null && String(val).trim() !== "";
            }).length;
            const blockComplete = blockAnswered === block.length;
            const active = activeCategory === idx;

            return (
              <button
                key={`nav-${idx}`}
                ref={(el) => (sidebarRefs.current[idx] = el)}
                onClick={() => scrollToCategory(idx)}
                className={`w-full text-left px-3 py-3 rounded-[10px] mb-1.5 transition-colors flex items-center gap-3 ${
                  active
                    ? `${themeAccent.bgLight} border ${themeAccent.border}`
                    : "hover:bg-[#F7F8F6] border border-transparent"
                }`}
              >
                <div
                  className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                    blockComplete
                      ? `${themeAccent.bg} text-white`
                      : active
                      ? `${themeAccent.bgLight} ${themeAccent.text}`
                      : "bg-[#EFF1EE] text-ink-soft"
                  }`}
                >
                  {blockComplete ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13.5px] font-medium truncate ${active ? themeAccent.text : "text-ink"}`}>
                    Q {idx * 20 + 1} - {idx * 20 + block.length}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-[11.5px] text-ink-soft">{block.length} questions</p>
                    <span className={`text-[10px] font-medium ${blockComplete ? themeAccent.textLight : "text-gray-400"}`}>
                      {blockAnswered}/{block.length}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className={`text-ink-soft transition-transform ${active ? "rotate-90" : ""}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion popup */}
      {completionInfo && (
        <CategoryCompleteModal
          completedName={completionInfo.completedName}
          completedIndex={completionInfo.completedIndex}
          totalCategories={completionInfo.totalCategories}
          nextName={completionInfo.next?.name || completionInfo.next?.title || null}
          onContinue={handleContinueToNext}
          onViewResults={handleViewResultsFromPopup}
          loading={popupLoading}
        />
      )}

      {/* Thank You Modal */}
      {showThankYou && (
        <ThankYouModal onClose={handleThankYouClose} />
      )}
    </div>
  );
}