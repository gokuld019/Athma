// components/GHQ28ReportCard.js
"use client";

import { useRef, useState } from "react";
import {
  XCircle,
  Stethoscope,
  Download,
  Loader2,
} from "lucide-react";
import {
  ReportCardWrapper,
  ReportHeader,
  ReportFooter,
  LoadingState,
  ErrorState,
  SummaryBox,
  loadPdfLibs,
  getGHQ28AnswerColor,
  GHQ28_SCALE_CONFIG,
  StatusBadge,  

} from "./AssessmentComponents";

// ---- GHQ-28 Report Card Component ----
export default function GHQ28ReportCard({ loading, error, report, onRetry }) {
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
      icon={<Stethoscope size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-amber-700" />}
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
      <div ref={printRef} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 bg-white">
        <ReportHeader title="GHQ-28 Health Assessment Report" user={user} savedReport={saved_report} />
        
        <div className="rounded-xl sm:rounded-2xl border-2 p-4 sm:p-5 md:p-6" style={{ borderColor: `${statusColor}30`, backgroundColor: `${statusColor}05` }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-[10px] sm:text-[11px] md:text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-0.5 sm:mb-1">Total Score</p>
              <p className="text-[32px] sm:text-[40px] md:text-[48px] font-bold" style={{ color: statusColor }}>
                {total_score}<span className="text-[16px] sm:text-[18px] md:text-[20px] font-normal text-slate-400">/{max_score}</span>
              </p>
            </div>
            <div className="text-left sm:text-right">
              {overall_status && (
                <>
                  <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] md:text-[14px] font-bold border-2" 
                    style={{ backgroundColor: `${statusColor}15`, color: statusColor, borderColor: `${statusColor}30` }}>
                    {overall_status.label}
                  </span>
                  <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-500 mt-1.5 sm:mt-2 max-w-[200px] sm:max-w-[250px]">{overall_status.description}</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="h-2.5 sm:h-3 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(total_score / max_score) * 100}%`, backgroundColor: statusColor }} />
            </div>
            <div className="flex justify-between mt-0.5 sm:mt-1">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">0</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">{max_score}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div>
              <p className="text-[10px] sm:text-[11px] md:text-[12px] font-medium text-slate-500 uppercase tracking-wide">Completion Status</p>
              <p className="text-[20px] sm:text-[22px] md:text-[24px] font-bold text-slate-800 mt-0.5 sm:mt-1">
                {answered}/{total}<span className="text-[12px] sm:text-[13px] md:text-[14px] font-normal text-slate-500 ml-1">questions answered</span>
              </p>
            </div>
            <StatusBadge status={is_completed ? "completed" : "in_progress"} />
          </div>
          <div className="h-2 sm:h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full rounded-full bg-amber-600 transition-all" style={{ width: `${completion_percentage}%` }} />
          </div>
          <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-500 mt-1.5 sm:mt-2">{completion_percentage}% complete</p>
        </div>

        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Scale Scores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {scale_scores && Object.entries(scale_scores).map(([key, score]) => {
              const config = GHQ28_SCALE_CONFIG[key] || { name: key, color: "#64748B", maxScore: 21 };
              const pct = (score / config.maxScore) * 100;
              return (
                <div key={key} className="rounded-lg sm:rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-slate-500">{config.name}</p>
                      <p className="text-[16px] sm:text-[18px] md:text-[20px] font-bold" style={{ color: config.color }}>
                        {score}<span className="text-[11px] sm:text-[12px] md:text-[13px] font-normal text-slate-400">/{config.maxScore}</span>
                      </p>
                    </div>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-slate-500">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 sm:h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: config.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Question Responses</h2>
          <div className="space-y-1.5 sm:space-y-2">
            {Array.isArray(answers) && answers.map((answer, index) => {
              const config = GHQ28_SCALE_CONFIG[answer.scale] || { color: "#64748B" };
              const scoreValue = answer.score !== undefined ? answer.score : answer.answer_value;
              const answerColor = getGHQ28AnswerColor(scoreValue);
              return (
                <div key={answer.question_id || index} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white" style={{ backgroundColor: answerColor }}>
                      {scoreValue}
                    </span>
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium px-1 sm:px-1.5 py-0.5 rounded" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                      {answer.scale}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] md:text-[12.5px] text-slate-800">{answer.question_text}</p>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-0.5 xs:gap-1.5 sm:gap-2 mt-0.5">
                      <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-500">{answer.answer_text}</p>
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-slate-400">· Score: {scoreValue}</span>
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