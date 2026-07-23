"use client";

import { useState, useMemo } from "react";
import { Briefcase, Download, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle } from "lucide-react";
import {
  ReportCardWrapper,
  ReportHeader,
  ReportFooter,
  LoadingState,
  ErrorState,
  loadPdfLibs,
} from "./AssessmentComponents";

// ---- JOBS Report Card Component ----
export default function JOBSReportCard({ loading, error, report, onRetry, subheadingId }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(false);

  // Process the report data to extract the correct assessment
  const processedData = useMemo(() => {
    if (!report) return null;

    console.log("JOBS Report received:", report);

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
    // Case 3: Report itself is an assessment object
    else if (report.summary && report.answered_questions) {
      return {
        user: report.user || {},
        subheading: report.subheading || { name: "JOBS Assessment", description: "" },
        summary: report.summary || {},
        option_distribution: report.option_distribution || {},
        answered_questions: report.answered_questions || [],
        isSingle: true,
      };
    }

    if (assessments.length > 0) {
      let selectedAssessment = null;

      // Find by subheading id
      if (subheadingId) {
        selectedAssessment = assessments.find(
          (a) => a.subheading && String(a.subheading.id) === String(subheadingId)
        );
      }

      // If not found by id, try by name
      if (!selectedAssessment && subheadingId) {
        selectedAssessment = assessments.find(
          (a) => a.subheading && a.subheading.name &&
            String(a.subheading.name).toLowerCase().includes(String(subheadingId).toLowerCase())
        );
      }

      // If still not found, use the first one
      if (!selectedAssessment) {
        selectedAssessment = assessments[0];
      }

      if (selectedAssessment) {
        console.log("Selected JOBS assessment:", selectedAssessment);
        return {
          user: user,
          subheading: selectedAssessment.subheading || { name: "JOBS Assessment", description: "" },
          summary: selectedAssessment.summary || {},
          option_distribution: selectedAssessment.option_distribution || {},
          answered_questions: selectedAssessment.answered_questions || [],
        };
      }
    }

    console.log("No JOBS assessment found");
    return null;
  }, [report, subheadingId]);

  // Early returns
  if (loading) return <LoadingState label="Loading JOBS report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  if (!processedData) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">No JOBS data available for this assessment</p>
      </div>
    );
  }

  const { user, subheading, summary, option_distribution, answered_questions } = processedData;

  const getInterpretationColor = (interpretation) => {
    if (!interpretation) return "text-slate-600";
    const lower = interpretation.toLowerCase();
    if (lower.includes("high") || lower.includes("very satisfied")) return "text-emerald-600";
    if (lower.includes("moderate")) return "text-amber-600";
    if (lower.includes("low") || lower.includes("dissatisfied")) return "text-red-600";
    return "text-slate-600";
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return "text-emerald-600";
    if (score >= 3.5) return "text-amber-600";
    if (score >= 2.5) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 4.5) return "bg-emerald-50 border-emerald-200";
    if (score >= 3.5) return "bg-amber-50 border-amber-200";
    if (score >= 2.5) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
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

      pdf.setFontSize(20);
      pdf.setTextColor(79, 70, 229);
      pdf.text("JOBS Job Satisfaction Report", margin, yPos);
      yPos += 12;
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Job Satisfaction Survey Results", margin, yPos);
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
      pdf.text(`Total Questions: ${summary.total_questions || 0}`, margin, yPos);
      pdf.text(`Answered: ${summary.answered_questions || 0}`, margin + 60, yPos);
      pdf.text(`Average Score: ${(summary.average_score || 0).toFixed(2)}`, margin + 120, yPos);
      yPos += 8;
      pdf.text(`Interpretation: ${summary.average_interpretation || "N/A"}`, margin, yPos);
      yPos += 8;
      addLine();

      // Option Distribution
      addSectionHeader("RESPONSE DISTRIBUTION");
      if (option_distribution && option_distribution.distribution) {
        option_distribution.distribution.forEach((item) => {
          ensureSpace(8);
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          const label = item.label || `Score ${item.score}`;
          const barWidth = (item.percentage / 100) * (pageWidth - margin * 2 - 50);
          pdf.text(`${label}: ${item.count} (${item.percentage.toFixed(1)}%)`, margin, yPos);
          pdf.setDrawColor(200, 200, 200);
          pdf.setFillColor(230, 230, 230);
          pdf.roundedRect(margin + 80, yPos - 3, pageWidth - margin * 2 - 90, 4, 2, 2, 'F');
          pdf.setFillColor(79, 70, 229);
          pdf.roundedRect(margin + 80, yPos - 3, Math.min(barWidth, pageWidth - margin * 2 - 90), 4, 2, 2, 'F');
          yPos += 8;
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
      pdf.save(`JOBS_${subheading?.name || "Assessment"}_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const totalQuestions = summary.total_questions || 0;
  const answeredQuestions = summary.answered_questions || 0;
  const averageScore = summary.average_score || 0;
  const interpretation = summary.average_interpretation || "N/A";

  // Get most frequent response
  const mostFrequent = option_distribution?.most_frequent || {};

  return (
    <ReportCardWrapper
      icon={<Briefcase size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-indigo-700" />}
      iconBg="bg-indigo-100"
      title={`JOBS - ${subheading?.name || "Assessment"}`}
      subtitle={subheading?.description || "Job Satisfaction Survey"}
      badge={
        summary.is_completed !== false
          ? {
              text: `${summary.completion_percentage || 100}% Complete`,
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
          title={`JOBS Assessment - ${subheading?.name || "JOBS"}`}
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
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-amber-600 uppercase">Avg Score</p>
            <p className={`text-[18px] sm:text-[22px] font-bold ${getScoreColor(averageScore)} mt-1`}>
              {averageScore.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-purple-600 uppercase">Interpretation</p>
            <p className={`text-[13px] sm:text-[15px] font-bold ${getInterpretationColor(interpretation)} mt-1 truncate`}>
              {interpretation}
            </p>
          </div>
        </div>

        {/* Response Distribution */}
        {option_distribution && option_distribution.distribution && option_distribution.distribution.length > 0 && (
          <div className={`rounded-lg border-2 p-4 ${getScoreBg(averageScore)}`}>
            <h3 className="text-[11px] sm:text-[12px] font-bold text-slate-700 mb-3">
              📊 Response Distribution
            </h3>
            <div className="space-y-2">
              {option_distribution.distribution.map((item, idx) => {
                const isMostFrequent = mostFrequent.scores && mostFrequent.scores.includes(item.score);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-32 sm:w-36 md:w-40 shrink-0">
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-600">
                        {item.label || `Score ${item.score}`}
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      <div className="h-5 sm:h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isMostFrequent ? "bg-indigo-600" : "bg-indigo-400"}`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 sm:w-20 shrink-0 text-right">
                      <span className={`text-[10px] sm:text-[11px] font-semibold ${isMostFrequent ? "text-indigo-700" : "text-slate-600"}`}>
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </span>
                      {isMostFrequent && (
                        <span className="block text-[8px] text-indigo-500 font-medium">Most common</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Most Frequent Response */}
        {mostFrequent.labels && mostFrequent.labels.length > 0 && (
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 sm:p-4">
            <p className="text-[10px] sm:text-[11px] text-indigo-600 font-medium">
              Most frequent response: <span className="font-bold text-indigo-800">{mostFrequent.labels.join(", ")}</span>
              {" "}({mostFrequent.count} responses, {mostFrequent.percentage}%)
            </p>
          </div>
        )}

        {/* All Questions - Toggle */}
        {answered_questions && answered_questions.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedQuestions(!expandedQuestions)}
              className="flex items-center gap-2 text-[11px] sm:text-[12px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {expandedQuestions ? "Hide" : "Show"} All Questions & Responses
              <span className="text-[10px] text-slate-400">
                ({answered_questions.length} questions)
              </span>
            </button>

            {expandedQuestions && (
              <div className="mt-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] sm:text-[12px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600">#</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600">Question</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600">Score</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600">Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {answered_questions.map((q, index) => {
                        const score = q.answer_score || 0;
                        return (
                          <tr key={q.question_id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-medium text-slate-700">
                              {q.question_number || index + 1}
                            </td>
                            <td className="py-2 px-3 text-slate-700 max-w-[300px]">
                              {q.question_text}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`font-bold ${getScoreColor(score)}`}>
                                {score}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-slate-600">
                                {q.answer_label || "N/A"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="text-[10px] text-slate-400 px-3 py-2 text-right border-t border-slate-100">
                  Showing {answered_questions.length} questions
                </div>
              </div>
            )}
          </div>
        )}

        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}