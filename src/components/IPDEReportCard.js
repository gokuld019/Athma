"use client";

import { useState, useMemo } from "react";
import { Brain, Download, ChevronDown, ChevronUp } from "lucide-react";
import {
  ReportCardWrapper,
  ReportHeader,
  ReportFooter,
  LoadingState,
  ErrorState,
  loadPdfLibs,
} from "./AssessmentComponents";

// ---- IPDE Category Configurations with colors ----
const IPDE_CATEGORY_CONFIG = {
  "F60.0": { name: "Paranoid", scale: "PA", color: "#DC2626", icon: "🔍" },
  "F60.1": { name: "Schizoid", scale: "SC", color: "#6366F1", icon: "🧊" },
  "F60.2": { name: "Dissocial", scale: "DI", color: "#F59E0B", icon: "⚡" },
  "F60.30": { name: "Impulsive", scale: "IM", color: "#EF4444", icon: "🔥" },
  "F60.31": { name: "Borderline", scale: "BO", color: "#EC4899", icon: "🌊" },
  "F60.4": { name: "Histrionic", scale: "HI", color: "#8B5CF6", icon: "🎭" },
  "F60.5": { name: "Anankastic", scale: "AN", color: "#10B981", icon: "📏" },
  "F60.6": { name: "Anxious", scale: "AX", color: "#F97316", icon: "😰" },
  "F60.7": { name: "Dependent", scale: "DE", color: "#06B6D4", icon: "🤝" },
};

// ---- Helper functions (defined BEFORE hooks) ----
const getAccuracyColor = (accuracy) => {
  if (accuracy >= 70) return "text-red-600";
  if (accuracy >= 50) return "text-amber-600";
  return "text-green-600";
};

const getAccuracyBg = (accuracy) => {
  if (accuracy >= 70) return "bg-red-50 border-red-200";
  if (accuracy >= 50) return "bg-amber-50 border-amber-200";
  return "bg-green-50 border-green-200";
};

const getDiagnosis = (accuracy) => {
  if (accuracy >= 80) return { label: "High", severity: "Moderate to Severe", color: "#DC2626" };
  if (accuracy >= 70) return { label: "Moderate", severity: "Mild to Moderate", color: "#F59E0B" };
  if (accuracy >= 50) return { label: "Mild", severity: "Borderline", color: "#10B981" };
  return { label: "Low", severity: "Below Threshold", color: "#6B7280" };
};

// Normalize a single question object regardless of key naming
function normalizeQuestion(raw, index) {
  if (!raw || typeof raw !== "object") return null;

  const question_id =
    raw.question_id ?? raw.questionId ?? raw.id ?? `q-${index}`;

  const question_number =
    raw.question_number ?? raw.questionNumber ?? raw.number ?? index + 1;

  const question_text =
    raw.question_text ?? raw.questionText ?? raw.text ?? raw.question ?? "";

  const user_answer =
    raw.user_answer ?? raw.userAnswer ?? raw.answer ?? raw.given_answer ?? raw.givenAnswer ?? null;

  const correct_answer =
    raw.correct_answer ?? raw.correctAnswer ?? raw.expected_answer ?? raw.expectedAnswer ?? null;

  let is_correct = raw.is_correct ?? raw.isCorrect ?? raw.correct;
  if (is_correct === undefined || is_correct === null) {
    if (user_answer != null && correct_answer != null) {
      is_correct = String(user_answer).trim().toUpperCase() === String(correct_answer).trim().toUpperCase();
    } else {
      is_correct = false;
    }
  }

  const answered = raw.answered ?? (user_answer !== null && user_answer !== undefined);

  return {
    question_id,
    question_number,
    question_text,
    scale: raw.scale ?? null,
    user_answer,
    correct_answer,
    is_correct: Boolean(is_correct),
    answered: Boolean(answered),
  };
}

function normalizeCategory(code, rawCategory) {
  if (!rawCategory || typeof rawCategory !== "object") {
    return { code, name: code, scale: "", questions: [], statistics: {} };
  }

  const rawQuestions =
    rawCategory.questions ??
    rawCategory.question_list ??
    rawCategory.questionList ??
    rawCategory.items ??
    [];

  const questions = Array.isArray(rawQuestions)
    ? rawQuestions.map((q, i) => normalizeQuestion(q, i)).filter(Boolean)
    : [];

  const rawStats = rawCategory.statistics ?? rawCategory.stats ?? {};

  let statistics = { ...rawStats };
  if ((!statistics || Object.keys(statistics).length === 0) && questions.length > 0) {
    const total = questions.length;
    const answered = questions.filter((q) => q.answered).length;
    const correct = questions.filter((q) => q.is_correct).length;
    const incorrect = answered - correct;
    statistics = {
      total,
      answered,
      correct,
      incorrect,
      unanswered: total - answered,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
    };
  }

  return {
    code,
    name: rawCategory.name ?? code,
    scale: rawCategory.scale ?? "",
    questions,
    statistics,
  };
}

function normalizeCategories(rawCategories) {
  if (!rawCategories || typeof rawCategories !== "object") return {};
  const out = {};
  Object.entries(rawCategories).forEach(([code, cat]) => {
    out[code] = normalizeCategory(code, cat);
  });
  return out;
}

// ---- IPDE Report Card Component ----
export default function IPDEReportCard({ loading, error, report, onRetry, subheadingId }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Process the report data to extract the correct assessment
  const processedData = useMemo(() => {
    if (!report) return null;

    let assessments = [];
    let user = {};

    // Case 1: Report has data.assessments (full API wrapper)
    if (report.data && report.data.assessments) {
      assessments = report.data.assessments;
      user = report.data.user || {};
    }
    // Case 2: Report has assessments directly
    else if (report.assessments) {
      assessments = report.assessments;
      user = report.user || {};
    }
    // Case 3: Report itself is an assessment object with categories
    else if (report.categories) {
      return {
        user: report.user || {},
        subheading: report.subheading || { name: "IPDE Assessment", description: "" },
        summary: report.summary || {},
        categories: normalizeCategories(report.categories),
      };
    }

    if (assessments.length > 0) {
      let selectedAssessment = null;

      if (subheadingId) {
        selectedAssessment = assessments.find(
          (a) => a.subheading && String(a.subheading.id) === String(subheadingId)
        );
      }

      if (!selectedAssessment && subheadingId) {
        selectedAssessment = assessments.find(
          (a) => a.subheading && a.subheading.name &&
            String(a.subheading.name).toLowerCase().includes(String(subheadingId).toLowerCase())
        );
      }

      if (!selectedAssessment) {
        selectedAssessment = assessments[0];
      }

      if (selectedAssessment) {
        const normalizedCategories = normalizeCategories(selectedAssessment.categories || {});
        return {
          user: user,
          subheading: selectedAssessment.subheading || { name: "IPDE Assessment", description: "" },
          summary: selectedAssessment.summary || {},
          categories: normalizedCategories,
        };
      }
    }

    return null;
  }, [report, subheadingId]);

  // Get all questions from all categories for display below
  const allQuestions = useMemo(() => {
    if (!processedData || !processedData.categories) return [];
    const categories = processedData.categories;
    const questions = [];
    Object.entries(categories).forEach(([code, category]) => {
      if (category.questions) {
        category.questions.forEach((q) => {
          questions.push({
            ...q,
            categoryCode: code,
            categoryName: category.name,
          });
        });
      }
    });
    return questions.sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
  }, [processedData]);

  // Calculate overall accuracy
  const overallStats = useMemo(() => {
    if (!processedData || !processedData.categories) {
      return { overallAccuracy: 0, totalQuestions: 0, answeredQuestions: 0, totalCategories: 0, completionPercentage: 0 };
    }
    
    const { summary, categories } = processedData;
    const totalQuestions = summary.total_questions || 0;
    const answeredQuestions = summary.answered_questions || 0;
    const totalCategories = Object.keys(categories || {}).length;
    const completionPercentage = summary.completion_percentage || 0;

    let overallAccuracy = summary.overall_accuracy || 0;
    if (!overallAccuracy && categories) {
      let totalCorrect = 0;
      let totalQ = 0;
      Object.values(categories).forEach((cat) => {
        if (cat.statistics) {
          totalCorrect += cat.statistics.correct || 0;
          totalQ += cat.statistics.total || 0;
        }
      });
      overallAccuracy = totalQ > 0 ? (totalCorrect / totalQ) * 100 : 0;
    }

    return { overallAccuracy, totalQuestions, answeredQuestions, totalCategories, completionPercentage };
  }, [processedData]);

  // Diagnosed categories - uses getDiagnosis which is now defined above
  const diagnosedCategories = useMemo(() => {
    if (!processedData || !processedData.categories) return [];
    const categories = processedData.categories;
    return Object.entries(categories || {})
      .filter(([_, category]) => (category.statistics?.accuracy || 0) >= 70)
      .map(([code, category]) => ({
        code,
        name: category.name || code,
        accuracy: category.statistics?.accuracy || 0,
        diagnosis: getDiagnosis(category.statistics?.accuracy || 0),
      }));
  }, [processedData]);

  const toggleCategory = (categoryCode) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryCode]: !prev[categoryCode],
    }));
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await loadPdfLibs();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      const addSectionHeader = (text) => {
        yPos += 3;
        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.text(text, margin, yPos);
        yPos += 8;
      };

      const addLine = () => {
        yPos += 2;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
      };

      const ensureSpace = (needed) => {
        if (yPos + needed > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
      };

      const { user, subheading, summary, categories } = processedData || {};

      pdf.setFontSize(20);
      pdf.setTextColor(79, 70, 229);
      pdf.text("IPDE Personality Assessment Report", margin, yPos);
      yPos += 12;
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text("International Personality Disorder Examination Results", margin, yPos);
      yPos += 8;
      addLine();
      
      addSectionHeader("PATIENT INFORMATION");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Patient Name:", margin, yPos);
      pdf.setFontSize(12);
      pdf.setTextColor(47, 68, 121);
      pdf.text(user?.name || "N/A", margin + 25, yPos);
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Patient ID: #${user?.id || "N/A"}`, pageWidth / 2, yPos);
      yPos += 10;
      addLine();

      addSectionHeader("OVERALL SUMMARY");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Questions: ${summary?.total_questions || 0}`, margin, yPos);
      pdf.text(`Answered: ${summary?.answered_questions || 0}`, margin + 60, yPos);
      pdf.text(`Accuracy: ${(overallStats.overallAccuracy || 0).toFixed(1)}%`, margin + 120, yPos);
      yPos += 8;
      addLine();

      // Category Results (Summary only - NO QUESTIONS in PDF)
      addSectionHeader("CATEGORY RESULTS");
      if (categories) {
        Object.entries(categories).forEach(([code, category]) => {
          const config = IPDE_CATEGORY_CONFIG[code] || { 
            name: category.name || code, 
            scale: category.scale || "", 
            color: "#64748B" 
          };
          const colorHex = config.color.replace("#", "");
          const r = parseInt(colorHex.substring(0, 2), 16);
          const g = parseInt(colorHex.substring(2, 4), 16);
          const b = parseInt(colorHex.substring(4, 6), 16);
          const stats = category.statistics || {};
          const accuracy = stats.accuracy || 0;
          const diagnosis = getDiagnosis(accuracy);

          ensureSpace(28);

          pdf.setDrawColor(220, 220, 220);
          pdf.setFillColor(248, 248, 248);
          pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 2, 2, 'FD');
          
          pdf.setFontSize(10);
          pdf.setTextColor(r, g, b);
          pdf.text(`${config.icon || "📊"} ${config.name} (${config.scale})`, margin + 5, yPos + 6);
          
          pdf.setFontSize(8);
          pdf.setTextColor(diagnosis.color);
          pdf.text(`Diagnosis: ${diagnosis.label}`, margin + 80, yPos + 6);
          
          pdf.setFontSize(8);
          pdf.setTextColor(80, 80, 80);
          pdf.text(
            `Accuracy: ${accuracy.toFixed(1)}%   |   ${stats.correct || 0}/${stats.total || 0} correct   |   ${stats.incorrect || 0} incorrect`,
            margin + 5,
            yPos + 16
          );
          
          pdf.setDrawColor(220, 220, 220);
          pdf.setFillColor(240, 240, 240);
          pdf.roundedRect(margin + 5, yPos + 20, pageWidth - margin * 2 - 10, 3, 1.5, 1.5, 'F');
          
          const barWidth = Math.min(100, accuracy);
          pdf.setFillColor(r, g, b);
          pdf.roundedRect(margin + 5, yPos + 20, (barWidth / 100) * (pageWidth - margin * 2 - 10), 3, 1.5, 1.5, 'F');
          
          yPos += 32;
        });
      }

      ensureSpace(15);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      const date = new Date().toISOString().split('T')[0];
      const safeName = (user?.name || "patient").replace(/[^a-z0-9]+/gi, "_").toLowerCase().substring(0, 30);
      pdf.save(`IPDE_${subheading?.name || "Assessment"}_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // Early returns (after all hooks have been called)
  if (loading) return <LoadingState label="Loading IPDE report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  if (!processedData) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">No data available for this assessment</p>
      </div>
    );
  }

  const { user, subheading, summary, categories } = processedData;
  const { overallAccuracy, totalQuestions, answeredQuestions, totalCategories, completionPercentage } = overallStats;

  return (
    <ReportCardWrapper
      icon={<Brain size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-indigo-700" />}
      iconBg="bg-indigo-100"
      title={`IPDE - ${subheading?.name || "Assessment"}`}
      subtitle={subheading?.description || "International Personality Disorder Examination"}
      badge={
        summary?.is_completed !== false
          ? {
              text: `${completionPercentage || 100}% Complete`,
              className: "bg-indigo-100 text-indigo-700 border-indigo-200",
            }
          : null
      }
      onDownload={handleDownload}
      downloading={downloading}
      downloadError={downloadError}
      setDownloadError={setDownloadError}
    >
      <div className="p-4 sm:p-6 space-y-6">
        <ReportHeader
          title={`IPDE Assessment - ${subheading?.name || "IPDE"}`}
          user={user}
          savedReport={null}
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-indigo-600 uppercase">Questions</p>
            <p className="text-[18px] sm:text-[22px] font-bold text-indigo-700 mt-1">
              {totalQuestions}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-100 p-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-green-600 uppercase">Answered</p>
            <p className="text-[18px] sm:text-[22px] font-bold text-green-700 mt-1">
              {answeredQuestions}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-blue-600 uppercase">Categories</p>
            <p className="text-[18px] sm:text-[22px] font-bold text-blue-700 mt-1">
              {totalCategories}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-purple-600 uppercase">Accuracy</p>
            <p className="text-[18px] sm:text-[22px] font-bold text-purple-700 mt-1">
              {overallAccuracy.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Diagnosis Summary */}
        {diagnosedCategories.length > 0 && (
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
            <h3 className="text-[11px] sm:text-[12px] font-bold text-red-700 uppercase tracking-wide mb-2">
              🔴 Diagnosis Indicators
            </h3>
            <div className="space-y-2">
              {diagnosedCategories.map((cat) => (
                <div key={cat.code} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-red-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{IPDE_CATEGORY_CONFIG[cat.code]?.icon || "📊"}</span>
                    <div>
                      <p className="text-[11px] sm:text-[12px] font-bold text-slate-800">{cat.name}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-500">{cat.diagnosis.severity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] sm:text-[16px] font-bold text-red-600">{cat.accuracy.toFixed(1)}%</p>
                    <span
                      className="text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${cat.diagnosis.color}15`, color: cat.diagnosis.color }}
                    >
                      {cat.diagnosis.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div>
          <h2 className="text-[11px] sm:text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Personality Disorder Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {categories && Object.keys(categories).length > 0 ? (
              Object.entries(categories).map(([code, category]) => {
                const config = IPDE_CATEGORY_CONFIG[code] || {
                  name: category.name || code,
                  scale: category.scale || "",
                  color: "#64748B",
                  icon: "📊",
                };
                const stats = category.statistics || {};
                const accuracy = stats.accuracy || 0;
                const diagnosis = getDiagnosis(accuracy);
                const isExpanded = expandedCategories[code];
                const questions = category.questions || [];

                return (
                  <div
                    key={code}
                    className={`rounded-lg border-2 p-3 sm:p-4 transition-all ${getAccuracyBg(accuracy)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <div>
                          <p className="text-[11px] sm:text-[12px] font-bold text-slate-800">
                            {config.name}
                          </p>
                          <p className="text-[9px] sm:text-[10px] font-medium" style={{ color: config.color }}>
                            {config.scale}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${diagnosis.color}15`,
                          color: diagnosis.color,
                        }}
                      >
                        {diagnosis.label}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] sm:text-[10px] text-slate-600">Accuracy</span>
                          <span className={`text-[11px] sm:text-[12px] font-bold ${getAccuracyColor(accuracy)}`}>
                            {accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, accuracy)}%`,
                              backgroundColor: config.color,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500">
                        <span>{stats.correct || 0}/{stats.total || 0} correct</span>
                        <span>{stats.incorrect || 0} incorrect</span>
                      </div>

                      <button
                        onClick={() => toggleCategory(code)}
                        className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-slate-600 hover:text-indigo-600 transition-colors pt-1 border-t border-slate-200"
                      >
                        <span>{isExpanded ? "Hide Questions" : `Show ${questions.length} Questions`}</span>
                        {isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
                        {questions && questions.length > 0 ? (
                          questions.map((q) => (
                            <div
                              key={q.question_id}
                              className={`text-[9px] sm:text-[10px] p-1.5 rounded flex items-start gap-1.5 ${
                                q.is_correct ? "bg-green-50" : "bg-red-50"
                              }`}
                            >
                              <span className={`font-bold mt-0.5 ${q.is_correct ? "text-green-600" : "text-red-600"}`}>
                                {q.is_correct ? "✓" : "✗"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-700 line-clamp-2">
                                  Q{q.question_number}: {q.question_text}
                                </p>
                                <p className="text-slate-500 mt-0.5">
                                  Your Answer: {q.user_answer} {q.correct_answer && `| Expected: ${q.correct_answer}`}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[9px] text-slate-400">No questions in this category</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-8 text-slate-500">
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* ALL QUESTIONS - Displayed below the report */}
        {/* ============================================================ */}
        <div className="mt-8 border-t-2 border-slate-200 pt-6">
          <h2 className="text-[13px] sm:text-[14px] font-bold text-slate-800 mb-4">
            📝 All Questions & Responses
          </h2>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] sm:text-[12px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">#</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Category</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Question</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Your Answer</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Expected</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allQuestions.length > 0 ? (
                    allQuestions.map((q, index) => (
                      <tr 
                        key={q.question_id || index} 
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          q.is_correct ? "bg-green-50/30" : "bg-red-50/30"
                        }`}
                      >
                        <td className="py-2 px-3 font-medium text-slate-700">
                          {q.question_number || index + 1}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            q.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {q.categoryName || q.categoryCode || "Unknown"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700 max-w-[250px] truncate">
                          {q.question_text}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          <span className={`${q.is_correct ? "text-green-600" : "text-red-600"}`}>
                            {q.user_answer || "N/A"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {q.correct_answer || "N/A"}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            q.is_correct 
                              ? "bg-green-100 text-green-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {q.is_correct ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-500">
                        No questions available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 text-right">
            Showing {allQuestions.length} questions
          </div>
        </div>

        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}