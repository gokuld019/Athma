// components/SCTReportCard.js
"use client";

import { useRef, useState } from "react";
import {
  XCircle,
  Brain,
  Check,
  Download,
  Loader2,
  Square,
  CheckSquare,
} from "lucide-react";
import {
  ReportCardWrapper,
  ReportHeader,
  ReportFooter,
  LoadingState,
  ErrorState,
  SummaryBox,
  StatusBadge,
  loadPdfLibs,
} from "./AssessmentComponents";

// ---- SCT Report Card Component ----
export default function SCTReportCard({ 
  loading, 
  error, 
  report, 
  onRetry, 
  questionsAnswers, 
  qaLoading, 
  qaError,
  onToggle,
  updatingAnswerIds 
}) {
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

  const EXCLUDED_SCALE_KEYS = ['repressor_sensitiser', 'repressor_sensitizer'];

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
        const validScaleKeys = Object.keys(scale_scores).filter(key => 
          !EXCLUDED_SCALE_KEYS.includes(key.toLowerCase()) && scaleConfigs[key] !== undefined
        );
        
        validScaleKeys.forEach((key) => {
          if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
          const score = scale_scores[key];
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

  const filteredScaleScores = scale_scores ? 
    Object.fromEntries(
      Object.entries(scale_scores).filter(([key]) => 
        !EXCLUDED_SCALE_KEYS.includes(key.toLowerCase()) && scaleConfigs[key] !== undefined
      )
    ) : 
    null;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
      <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <Brain size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-purple-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] sm:text-[13px] md:text-[14px] font-semibold text-slate-800">SCT Sentence Completion Test</p>
            <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-500">Sentence completion responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="hidden sm:inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] md:text-[12.5px] font-semibold border bg-purple-100 text-purple-700 border-purple-200">
            {scoredCount > 0 ? `${scoredCount}/${answered} scored` : `${answered}/${total} completed`}
          </span>
          <button 
            onClick={() => setShowReport(!showReport)} 
            className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-purple-600 text-white text-[11px] sm:text-[12px] md:text-[12.5px] font-medium hover:bg-purple-700 transition-colors"
          >
            {showReport ? 'Hide Report' : 'Go Report'}
          </button>
        </div>
      </div>
      {downloadError && (
        <div className="px-3 sm:px-4 md:px-5 py-2 sm:py-3 mx-3 sm:mx-4 md:mx-5 mb-2 sm:mb-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-1.5 sm:gap-2">
            <XCircle size={14} className="sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px] text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] sm:text-[12px] md:text-[13px] font-medium text-red-700">Download Failed</p>
              <p className="text-[10px] sm:text-[11px] md:text-[12px] text-red-600 mt-0.5">{downloadError}</p>
              <button onClick={() => setDownloadError(null)} className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] md:text-[11px] text-red-600 hover:text-red-700 underline">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <div ref={printRef} className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-white">
          <div className="border-b border-slate-200 pb-4 sm:pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-1">SCT Assessment Report</h1>
                <p className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-500">Sentence Completion Test Results</p>
              </div>
              <div className="text-left sm:text-right">
                <StatusBadge status={is_completed ? "completed" : "in_progress"} />
              </div>
            </div>
            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 sm:gap-4 mt-3 sm:mt-4">
              <div>
                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-slate-500 uppercase tracking-wide">Patient</p>
                <p className="text-[12px] sm:text-[13px] md:text-[14px] font-semibold text-slate-800">{user?.name || "N/A"}</p>
              </div>
              <div className="hidden xs:block w-px h-6 sm:h-8 bg-slate-200" />
              <div>
                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-slate-500 uppercase tracking-wide">Email</p>
                <p className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-700">{user?.email || "N/A"}</p>
              </div>
              {user?.id && (
                <>
                  <div className="hidden xs:block w-px h-6 sm:h-8 bg-slate-200" />
                  <div>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-slate-500 uppercase tracking-wide">Patient ID</p>
                    <p className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-700">#{user.id}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-3 sm:p-4">
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-purple-600 uppercase tracking-wide">Completion</p>
              <p className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-purple-700 mt-0.5 sm:mt-1">{completion_percentage?.toFixed(1)}%</p>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-purple-500">{answered}/{total} answers</p>
            </div>
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 p-3 sm:p-4">
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-green-600 uppercase tracking-wide">Positive</p>
              <p className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-green-700 mt-0.5 sm:mt-1">{positive || 0}</p>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-green-500">Responses</p>
            </div>
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-red-50 to-rose-100 border border-red-200 p-3 sm:p-4">
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-red-600 uppercase tracking-wide">Negative</p>
              <p className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-red-700 mt-0.5 sm:mt-1">{negative || 0}</p>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-red-500">Responses</p>
            </div>
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 p-3 sm:p-4">
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-amber-600 uppercase tracking-wide">Scored</p>
              <p className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-amber-700 mt-0.5 sm:mt-1">{scoredCount}</p>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-amber-500">Marked negative</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-slate-500">Response Distribution</p>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-400">{positive || 0} positive · {negative || 0} negative</p>
            </div>
            <div className="h-2.5 sm:h-3 rounded-full bg-slate-100 overflow-hidden flex">
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

          <div>
            <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3 sm:mb-4">Attitude Scale Scores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
              {filteredScaleScores && Object.entries(filteredScaleScores).map(([key, score]) => {
                const config = scaleConfigs[key] || { 
                  label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
                  icon: "📊", 
                  color: "#64748B", 
                  description: "" 
                };
                const { level, color, bgColor } = getScoreLevel(score);
                const percentage = (score / 4) * 100;
                
                return (
                  <div 
                    key={key} 
                    className="rounded-lg sm:rounded-xl border border-slate-200 bg-white p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-base sm:text-lg">{config.icon}</span>
                        <div>
                          <p className="text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-slate-800">{config.label}</p>
                          <p className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 hidden sm:block">{config.description}</p>
                        </div>
                      </div>
                      <span 
                        className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-bold"
                        style={{ backgroundColor: bgColor, color: color }}
                      >
                        {score}/4
                      </span>
                    </div>
                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="h-1.5 sm:h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: color }} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 line-clamp-1">{config.description}</span>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold" style={{ color: color }}>{level}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
              <span className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-600">Positive (4-5)</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
              <span className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-600">Neutral (3)</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
              <span className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-600">Negative (0-2)</span>
            </div>
          </div>

          <div className="flex justify-end pt-1 sm:pt-2">
            <button 
              onClick={handleDownload} 
              disabled={downloading}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#2F4479] text-white text-[11px] sm:text-[12px] md:text-[12.5px] font-medium hover:bg-[#263a68] transition-colors disabled:opacity-60"
            >
              {downloading ? (
                <><Loader2 size={12} className="sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px] animate-spin" /> Generating...</>
              ) : (
                <><Download size={12} className="sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px]" /> Download PDF Report</>
              )}
            </button>
          </div>

          <div className="border-t border-slate-200 pt-3 sm:pt-4 text-center">
            <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-400">
              Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- SCT Scoring Section Component ----
export function SCTScoringSection({ questionsAnswers, loading, error, onToggle, updatingAnswerIds }) {
  if (loading) return <LoadingState label="Loading SCT questions..." />;
  if (error) return <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 p-4 sm:p-6"><ErrorState message={error} /></div>;
  if (!questionsAnswers) return null;

  const { questions_answers } = questionsAnswers;
  const scoredCount = questions_answers.filter(qa => qa.score_value !== null).length;
  const totalCount = questions_answers.length;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50 overflow-hidden">
      <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-b border-slate-100">
        <div>
          <p className="text-[12px] sm:text-[13px] md:text-[14px] font-semibold text-slate-800">SCT Question Scoring</p>
          <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-500 mt-0.5">
            {scoredCount} of {totalCount} questions scored · Click checkbox to toggle scoring (instant)
          </p>
        </div>
      </div>
      <div className="divide-y divide-slate-50 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto">
        {questions_answers.map((qa) => {
          const isScored = qa.score_value !== null;
          const isUpdating = updatingAnswerIds.has(qa.answer_id);
          
          return (
            <div 
              key={qa.question_id} 
              className={`flex items-start gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-5 py-3 sm:py-4 transition-colors ${
                isScored ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'
              }`}
            >
              <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-purple-100 flex items-center justify-center text-[9px] sm:text-[10px] md:text-[11px] font-bold text-purple-700 shrink-0 mt-0.5">
                {qa.display_order}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-[12px] md:text-[13.5px] text-slate-800 font-medium leading-snug">{qa.question_text}</p>
                <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
                  <p className="text-[10px] sm:text-[11px] md:text-[12px] text-[#2F4479] italic line-clamp-2">
                    "{qa.patient_answer || "No response"}"
                  </p>
                  {isScored && (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] md:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                      <Check size={9} className="sm:w-[10px] sm:h-[10px]" />
                      Negative
                    </span>
                  )}
                </div>
                {qa.answered_at && (
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 mt-0.5 sm:mt-1">
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
              <button
                onClick={() => onToggle(qa)}
                className="shrink-0 mt-0.5"
                title={isScored ? "Click to unscore" : "Click to score as negative"}
              >
                {isUpdating ? (
                  <div className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px] md:w-[18px] md:h-[18px] rounded border-2 border-purple-400 border-t-transparent animate-spin" />
                ) : isScored ? (
                  <CheckSquare size={16} className="sm:w-[17px] sm:h-[17px] md:w-[18px] md:h-[18px] text-red-500" />
                ) : (
                  <Square size={16} className="sm:w-[17px] sm:h-[17px] md:w-[18px] md:h-[18px] text-slate-300 hover:text-red-400 transition-colors" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}