// components/BAIReportCard.js
"use client";

import { useRef, useState } from "react";
import {
  XCircle,
  Wind,
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
  getBAISeverityColor,
  getBAIScoreColor,
  BAI_SEVERITY_CONFIG,
} from "./AssessmentComponents";

// ---- BAI Report Card Component ----
export default function BAIReportCard({ loading, error, report, onRetry }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (loading) return <LoadingState label="Loading BAI report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  const { user, bai_report, saved_report } = report;
  if (!bai_report) return null;
  const { total_score, max_score, level, question_details, summary } = bai_report;
  const severityColor = getBAISeverityColor(level?.label);

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

      pdf.setFontSize(20); pdf.setTextColor(180, 83, 9); pdf.text("BAI Anxiety Assessment Report", margin, yPos); yPos += 12;
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text("Beck Anxiety Inventory Results", margin, yPos); yPos += 8;
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
      if (level) {
        pdf.setFontSize(14); pdf.setTextColor(...scoreColor); pdf.text(`Severity: ${level.label}`, margin + 80, yPos + 18);
        pdf.setFontSize(9); pdf.setTextColor(100, 100, 100); pdf.text(level.description, margin + 80, yPos + 28);
      }
      yPos += 50; addLine();
      addSectionHeader("QUESTION RESPONSES"); yPos += 2;

      if (question_details) {
        Object.entries(question_details).forEach(([qId, detail]) => {
          const qScore = detail.score || 0;
          const qColor = getBAIScoreColor(qScore).replace("#", "");
          const qr = parseInt(qColor.substring(0, 2), 16);
          const qg = parseInt(qColor.substring(2, 4), 16);
          const qb = parseInt(qColor.substring(4, 6), 16);

          if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
          pdf.setDrawColor(220, 220, 220); pdf.setFillColor(252, 252, 252); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 1, 1, 'FD');
          pdf.setFontSize(8); pdf.setTextColor(qr, qg, qb); pdf.text(`[${qScore}]`, margin + 2, yPos + 7);
          pdf.setFontSize(8); pdf.setTextColor(80, 80, 80); pdf.text(detail.answer_text || detail.question_text || "", margin + 12, yPos + 7);
          yPos += 12;
        });
      }

      if (summary) {
        if (yPos > pageHeight - 40) { pdf.addPage(); yPos = margin; }
        addLine();
        addSectionHeader("SUMMARY");
        pdf.setFontSize(10); pdf.setTextColor(60, 60, 60);
        pdf.text(summary, margin, yPos);
        yPos += 10;
      }

      pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Athma Assessment Platform`, pageWidth / 2, pageHeight - 10, { align: "center" });

      const date = new Date().toISOString().split('T')[0];
      const safeName = (user?.name || "patient").replace(/[^a-z0-9]+/gi, "_").toLowerCase().substring(0, 30);
      pdf.save(`BAI_Report_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF. Please check console for details.");
    } finally { setDownloading(false); }
  };

  return (
    <ReportCardWrapper
      icon={<Wind size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-cyan-700" />}
      iconBg="bg-cyan-100"
      title="BAI Anxiety Assessment"
      subtitle="Beck Anxiety Inventory result"
      badge={level ? { 
        text: level.label, 
        className: `bg-[${severityColor}]/10 text-[${severityColor}] border-[${severityColor}]/30` 
      } : null}
      onDownload={handleDownload}
      downloading={downloading}
      downloadError={downloadError}
      setDownloadError={setDownloadError}
      printRef={printRef}
    >
      <div ref={printRef} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 bg-white">
        <ReportHeader title="BAI Anxiety Assessment Report" user={user} savedReport={saved_report} />
        
        <div className="rounded-xl sm:rounded-2xl border-2 p-4 sm:p-5 md:p-6" style={{ borderColor: `${severityColor}40`, backgroundColor: `${severityColor}08` }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-[10px] sm:text-[11px] md:text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-0.5 sm:mb-1">Total Score</p>
              <p className="text-[32px] sm:text-[40px] md:text-[48px] font-bold" style={{ color: severityColor }}>
                {total_score}<span className="text-[16px] sm:text-[18px] md:text-[20px] font-normal text-slate-400">/{max_score}</span>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] md:text-[14px] font-bold border-2" 
                style={{ backgroundColor: `${severityColor}15`, color: severityColor, borderColor: `${severityColor}40` }}>
                {level?.label}
              </span>
              <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-500 mt-1.5 sm:mt-2 max-w-[200px] sm:max-w-[250px]">{level?.description}</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="h-2.5 sm:h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(total_score / max_score) * 100}%`, backgroundColor: severityColor }} />
            </div>
            <div className="flex justify-between mt-0.5 sm:mt-1">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">0</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">{max_score}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Severity Scale Reference</h2>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {Object.entries(BAI_SEVERITY_CONFIG).map(([label, config]) => (
              <div key={label} className="text-center p-2 sm:p-2.5 rounded-lg" style={{ backgroundColor: `${config.color}10` }}>
                <div className="w-full h-1.5 sm:h-2 rounded-full mb-0.5 sm:mb-1" style={{ backgroundColor: config.color }} />
                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium" style={{ color: config.color }}>{label}</p>
                <p className="text-[7px] sm:text-[8px] md:text-[9px] text-slate-500">{config.range[0]}-{config.range[1]}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Question Responses</h2>
          <div className="space-y-1.5 sm:space-y-2">
            {question_details && Object.entries(question_details).map(([qId, detail]) => {
              const score = detail.score || 0;
              const scoreColor = getBAIScoreColor(score);
              return (
                <div key={qId} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-[11px] md:text-[12px] font-bold shrink-0" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
                    {score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-800">{detail.question_text}</p>
                    <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-500 mt-0.5">{detail.answer_text}</p>
                  </div>
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