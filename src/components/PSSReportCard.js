// components/PSSReportCard.js
"use client";

import { useRef, useState } from "react";
import {
  XCircle,
  Zap,
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
  getPSSSeverityColor,
  getPSSScoreColor,
  PSS_SEVERITY_CONFIG,
} from "./AssessmentComponents";

// ---- PSS Report Card Component ----
export default function PSSReportCard({ loading, error, report, onRetry }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (loading) return <LoadingState label="Loading PSS report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  const { user, pss_report, saved_report } = report;
  if (!pss_report) return null;
  const { total_score, max_score, level, question_details, summary } = pss_report;
  const severityColor = getPSSSeverityColor(level?.label);

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

      pdf.setFontSize(20); pdf.setTextColor(180, 83, 9); pdf.text("PSS Stress Assessment Report", margin, yPos); yPos += 12;
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text("Perceived Stress Scale Results", margin, yPos); yPos += 8;
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
      
      addSectionHeader("SCORING METHOD");
      pdf.setFontSize(9); pdf.setTextColor(80, 80, 80);
      const scoringLines = pdf.splitTextToSize(
        "PSS scores are calculated using reverse scoring for questions 4, 5, 7, and 8 (0=4, 1=3, 2=2, 3=1, 4=0). Total scores range from 0 to 40, with higher scores indicating higher perceived stress.",
        pageWidth - margin * 2 - 10
      );
      pdf.text(scoringLines, margin, yPos);
      yPos += scoringLines.length * 4 + 8;
      addLine();
      
      addSectionHeader("QUESTION RESPONSES"); yPos += 2;

      if (question_details) {
        pdf.setFillColor(240, 240, 240);
        pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 1, 1, 'F');
        pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
        pdf.text("Q#", margin + 2, yPos + 5.5);
        pdf.text("Original", margin + 15, yPos + 5.5);
        pdf.text("Reverse?", margin + 35, yPos + 5.5);
        pdf.text("Final", margin + 55, yPos + 5.5);
        pdf.text("Answer", margin + 70, yPos + 5.5);
        yPos += 10;

        const sortedQuestions = Object.entries(question_details).sort(([,a], [,b]) => (a.display_order || 0) - (b.display_order || 0));
        
        sortedQuestions.forEach(([qId, detail]) => {
          if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
          const qScore = detail.final_score || 0;
          const originalScore = detail.original_score || 0;
          const isReversed = detail.is_reverse_scored;
          const qColor = getPSSScoreColor(qScore).replace("#", "");
          const qr = parseInt(qColor.substring(0, 2), 16);
          const qg = parseInt(qColor.substring(2, 4), 16);
          const qb = parseInt(qColor.substring(4, 6), 16);

          pdf.setDrawColor(220, 220, 220); pdf.setFillColor(252, 252, 252); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 1, 1, 'FD');
          pdf.setFontSize(8); pdf.setTextColor(80, 80, 80); pdf.text(`${detail.display_order || ""}`, margin + 2, yPos + 7);
          pdf.setFontSize(8); pdf.setTextColor(100, 100, 100); pdf.text(`${originalScore}`, margin + 15, yPos + 7);
          pdf.setFontSize(8); pdf.setTextColor(isReversed ? [220, 38, 38] : [31, 109, 72]); pdf.text(isReversed ? "✓ Yes" : "✗ No", margin + 35, yPos + 7);
          pdf.setFontSize(8); pdf.setTextColor(qr, qg, qb); pdf.text(`${qScore}`, margin + 55, yPos + 7);
          pdf.setFontSize(7); pdf.setTextColor(80, 80, 80); pdf.text((detail.answer_text || "").substring(0, 50), margin + 70, yPos + 7);
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
      pdf.save(`PSS_Report_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF. Please check console for details.");
    } finally { setDownloading(false); }
  };

  const reverseQuestions = saved_report?.details?.reverse_questions || [4, 5, 7, 8];

  return (
    <ReportCardWrapper
      icon={<Zap size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-orange-700" />}
      iconBg="bg-orange-100"
      title="PSS Stress Assessment"
      subtitle="Perceived Stress Scale result"
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
        <ReportHeader title="PSS Stress Assessment Report" user={user} savedReport={saved_report} />
        
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

        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Scoring Method</h2>
          <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
            <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-700 leading-relaxed mb-2">
              PSS scores are calculated using <strong>reverse scoring</strong> for questions {reverseQuestions.join(", ")}. 
              On these questions, scores are inverted: <strong>0 = 4, 1 = 3, 2 = 2, 3 = 1, 4 = 0</strong>.
            </p>
            <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-600">
              Total scores range from <strong>0 to 40</strong>, with higher scores indicating higher perceived stress.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Severity Scale Reference</h2>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {Object.entries(PSS_SEVERITY_CONFIG).map(([label, config]) => (
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
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] sm:text-[11px] md:text-[12px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-1.5 sm:px-2 font-semibold text-slate-500 w-10">Q#</th>
                  <th className="text-left py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Question</th>
                  <th className="text-center py-2 px-1.5 sm:px-2 font-semibold text-slate-500 w-16">Original</th>
                  <th className="text-center py-2 px-1.5 sm:px-2 font-semibold text-slate-500 w-16">Reverse?</th>
                  <th className="text-center py-2 px-1.5 sm:px-2 font-semibold text-slate-500 w-16">Final</th>
                  <th className="text-left py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Answer</th>
                </tr>
              </thead>
              <tbody>
                {question_details && Object.entries(question_details)
                  .sort(([,a], [,b]) => (a.display_order || 0) - (b.display_order || 0))
                  .map(([qId, detail]) => {
                  const score = detail.final_score || 0;
                  const originalScore = detail.original_score || 0;
                  const isReversed = detail.is_reverse_scored;
                  const scoreColor = getPSSScoreColor(score);
                  
                  return (
                    <tr key={qId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-1.5 sm:px-2 text-center font-medium text-slate-500">{detail.display_order}</td>
                      <td className="py-2 px-1.5 sm:px-2 text-slate-800 text-[10px] sm:text-[11px]">{detail.question_text}</td>
                      <td className="py-2 px-1.5 sm:px-2 text-center text-slate-600">{originalScore}</td>
                      <td className="py-2 px-1.5 sm:px-2 text-center">
                        {isReversed ? (
                          <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            ✓ Yes
                          </span>
                        ) : (
                          <span className="text-[8px] sm:text-[9px] text-slate-400">✗ No</span>
                        )}
                      </td>
                      <td className="py-2 px-1.5 sm:px-2 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-[10px] sm:text-[11px] font-bold" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
                          {score}
                        </span>
                      </td>
                      <td className="py-2 px-1.5 sm:px-2 text-slate-600 text-[9px] sm:text-[10px]">{detail.answer_text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg sm:rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-base sm:text-lg">🔄</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-orange-800">Reverse Scoring Applied</p>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-orange-700 mt-0.5">
                Questions {reverseQuestions.join(", ")} were reverse-scored: <strong>0→4, 1→3, 2→2, 3→1, 4→0</strong>
              </p>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] text-orange-600 mt-1">
                Higher scores on these questions indicate lower perceived stress, so they are inverted to align with the overall scale direction.
              </p>
            </div>
          </div>
        </div>

        {summary && <SummaryBox summary={summary} />}
        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}