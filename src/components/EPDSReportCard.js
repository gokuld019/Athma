"use client";

import { useState, useMemo } from "react";
import { Brain, Download, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  ReportCardWrapper,
  ReportHeader,
  ReportFooter,
  LoadingState,
  ErrorState,
  loadPdfLibs,
} from "./AssessmentComponents";

// ---- EPDS Severity Config ----
const EPDS_SEVERITY_CONFIG = {
  "None": { color: "#1F6D48", description: "No significant depressive symptoms" },
  "Mild": { color: "#84CC16", description: "Mild depressive symptoms - Monitor and reassess" },
  "Moderate": { color: "#E85720", description: "Moderate depressive symptoms - Clinical assessment recommended" },
  "Severe": { color: "#DC2626", description: "Severe depressive symptoms - Immediate professional help needed" },
};

// ---- EPDS Score to Label Mapping ----
const EPDS_SCORE_TO_LABEL = {
  0: { label: "As much as I always could / No, not at all", normal: "0", reverse: "3" },
  1: { label: "Rather less than I used to / Not very often", normal: "1", reverse: "2" },
  2: { label: "Definitely less than I used to / Hardly ever", normal: "2", reverse: "1" },
  3: { label: "Hardly at all / Yes, very often", normal: "3", reverse: "0" },
};

// ---- EPDS Report Card Component ----
export default function EPDSReportCard({ loading, error, report, onRetry, subheadingId }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  // Process the report data
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
    // Case 3: Report itself is an assessment object
    else if (report.summary && report.answered_questions) {
      return {
        user: report.user || {},
        subheading: report.subheading || { name: "EPDS Assessment", description: "" },
        summary: report.summary || {},
        answered_questions: report.answered_questions || [],
        critical_alerts: report.critical_alerts || [],
        isSingle: true,
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
        return {
          user: user,
          subheading: selectedAssessment.subheading || { name: "EPDS Assessment", description: "" },
          summary: selectedAssessment.summary || {},
          answered_questions: selectedAssessment.answered_questions || [],
          critical_alerts: selectedAssessment.critical_alerts || [],
        };
      }
    }

    return null;
  }, [report, subheadingId]);

  // Early returns
  if (loading) return <LoadingState label="Loading EPDS report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  if (!processedData) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">No EPDS data available for this assessment</p>
      </div>
    );
  }

  const { user, subheading, summary, answered_questions, critical_alerts } = processedData;

  const getSeverityColor = (level) => {
    const config = EPDS_SEVERITY_CONFIG[level];
    return config ? config.color : "#64748B";
  };

  const getSeverityBg = (level) => {
    if (level === "None") return "bg-emerald-50 border-emerald-200";
    if (level === "Mild") return "bg-green-50 border-green-200";
    if (level === "Moderate") return "bg-amber-50 border-amber-200";
    if (level === "Severe") return "bg-red-50 border-red-200";
    return "bg-slate-50 border-slate-200";
  };

  const getScoreColor = (score) => {
    if (score >= 2) return "text-red-600";
    if (score >= 1) return "text-amber-600";
    return "text-green-600";
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
      pdf.text("EPDS Report", margin, yPos);
      yPos += 12;
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Edinburgh Postnatal Depression Scale Results", margin, yPos);
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
      pdf.text(`Total Score: ${summary.total_score || 0}/${summary.max_score || 30}`, margin + 120, yPos);
      yPos += 8;
      pdf.text(`Interpretation: ${summary.interpretation || "N/A"}`, margin, yPos);
      yPos += 8;
      pdf.text(`Depression Risk: ${summary.depression_risk?.level || "N/A"}`, margin, yPos);
      yPos += 8;
      if (summary.depression_risk?.recommendation) {
        pdf.text(`Recommendation: ${summary.depression_risk.recommendation}`, margin, yPos);
        yPos += 8;
      }
      addLine();

      // Critical Alerts
      if (critical_alerts && critical_alerts.length > 0) {
        addSectionHeader("⚠️ CRITICAL ALERTS");
        critical_alerts.forEach((alert) => {
          ensureSpace(8);
          pdf.setFontSize(8);
          pdf.setTextColor(220, 38, 38);
          pdf.text(alert.message, margin, yPos);
          yPos += 6;
          pdf.setTextColor(80, 80, 80);
          pdf.text(`Action: ${alert.action}`, margin + 5, yPos);
          yPos += 8;
        });
        addLine();
      }

      // Questions
      addSectionHeader("QUESTION RESPONSES");
      if (answered_questions && answered_questions.length > 0) {
        answered_questions.forEach((q) => {
          ensureSpace(6);
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          const score = q.score || 0;
          const scoreColor = getScoreColor(score);
          pdf.text(`Q${q.question_number}: ${q.question_text.substring(0, 50)}...`, margin, yPos);
          pdf.setTextColor(80, 80, 80);
          pdf.text(`→ ${q.answer_text || "N/A"} (Score: ${score})`, margin + 10, yPos + 4);
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
      pdf.save(`EPDS_${subheading?.name || "Assessment"}_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const totalQuestions = summary.total_questions || 0;
  const answeredQuestions = summary.answered_questions || 0;
  const totalScore = summary.total_score || 0;
  const maxScore = summary.max_score || 30;
  const interpretation = summary.interpretation || "N/A";
  const depressionRisk = summary.depression_risk || {};
  const riskLevel = depressionRisk.level || "None";

  return (
    <ReportCardWrapper
      icon={<Brain size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-indigo-700" />}
      iconBg="bg-indigo-100"
      title={`EPDS - ${subheading?.name || "Assessment"}`}
      subtitle={subheading?.description || "Edinburgh Postnatal Depression Scale"}
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
          title={`EPDS Assessment - ${subheading?.name || "EPDS"}`}
          user={user}
          savedReport={null}
        />

        {/* Critical Alerts */}
        {critical_alerts && critical_alerts.length > 0 && (
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
            <h3 className="text-[11px] sm:text-[12px] font-bold text-red-700 uppercase tracking-wide mb-2">
              ⚠️ Critical Alerts
            </h3>
            <div className="space-y-2">
              {critical_alerts.map((alert, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-[12px] sm:text-[13px] font-semibold text-red-700">{alert.message}</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-600 mt-1">{alert.details}</p>
                  <p className="text-[10px] sm:text-[11px] font-medium text-red-600 mt-1">Action: {alert.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <p className="text-[9px] sm:text-[10px] font-medium text-amber-600 uppercase">Total Score</p>
            <p className={`text-[18px] sm:text-[22px] font-bold ${getScoreColor(totalScore)} mt-1`}>
              {totalScore}/{maxScore}
            </p>
          </div>
          <div className={`rounded-lg border p-3 ${getSeverityBg(riskLevel)}`}>
            <p className="text-[9px] sm:text-[10px] font-medium text-slate-600 uppercase">Risk Level</p>
            <p className="text-[14px] sm:text-[16px] font-bold mt-1" style={{ color: getSeverityColor(riskLevel) }}>
              {riskLevel}
            </p>
          </div>
        </div>

        {/* Interpretation */}
        <div className={`rounded-lg border-2 p-4 ${getSeverityBg(riskLevel)}`}>
          <h3 className="text-[11px] sm:text-[12px] font-bold text-slate-700 mb-2">
            📋 Interpretation
          </h3>
          <p className="text-[12px] sm:text-[13px] text-slate-800 font-medium">
            {interpretation}
          </p>
          {depressionRisk.description && (
            <p className="text-[11px] sm:text-[12px] text-slate-600 mt-1">
              {depressionRisk.description}
            </p>
          )}
          {depressionRisk.recommendation && (
            <p className="text-[11px] sm:text-[12px] font-medium text-amber-700 mt-2">
              Recommendation: {depressionRisk.recommendation}
            </p>
          )}
          {depressionRisk.suicidal_risk && (
            <p className="text-[11px] sm:text-[12px] font-bold text-red-600 mt-2">
              {depressionRisk.suicidal_risk}
            </p>
          )}
        </div>

        {/* All Questions */}
        {answered_questions && answered_questions.length > 0 && (
          <div>
            <h3 className="text-[11px] sm:text-[12px] font-bold text-slate-700 mb-3">
              📝 All Questions & Responses
            </h3>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] sm:text-[12px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600">#</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600">Question</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600">Answer</th>
                      <th className="text-center py-2 px-3 font-semibold text-slate-600">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answered_questions.map((q) => {
                      const score = q.score || 0;
                      return (
                        <tr key={q.question_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-medium text-slate-700">
                            {q.question_number}
                          </td>
                          <td className="py-2 px-3 text-slate-700 max-w-[300px]">
                            {q.question_text}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-slate-600">
                              {q.answer_text || "N/A"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`font-bold ${getScoreColor(score)}`}>
                              {score}
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
          </div>
        )}

        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}