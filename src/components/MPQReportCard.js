// components/MPQReportCard.js
"use client";

import { useRef, useState } from "react";
import {
  XCircle,
  Activity,
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
} from "./AssessmentComponents";

// ---- MPQ Scale Config (only MPQ-specific config) ----
const MPQ_SCALE_CONFIG = {
  K: {
    name: "Defensiveness",
    totalQuestions: 12,
    description: "Measures test-taking attitude and defensiveness",
  },
  SC: {
    name: "Schizophrenia",
    totalQuestions: 18,
    description: "Measures unusual thinking and detachment from reality",
  },
  PA: {
    name: "Paranoia",
    totalQuestions: 18,
    description: "Measures suspiciousness and paranoid thoughts",
  },
  MA: {
    name: "Hypomania",
    totalQuestions: 17,
    description: "Measures energy, activity level, and impulsivity",
  },
  D: {
    name: "Depression",
    totalQuestions: 15,
    description: "Measures depressive symptoms",
  },
  A: {
    name: "Anxiety",
    totalQuestions: 26,
    description: "Measures anxiety symptoms",
  },
  HY: {
    name: "Hysteria",
    totalQuestions: 8,
    description: "Measures somatic complaints and conversion symptoms",
  },
  PD: {
    name: "Psychopathic Deviate",
    totalQuestions: 34,
    description: "Measures antisocial tendencies and rule-breaking",
  },
  REPRESSOR_SENSITISER: {
    name: "Repressor-Sensitiser",
    totalQuestions: 41,
    description: "Measures coping style (repressor vs sensitiser)",
  },
};

// ---- MPQ Helper Functions ----
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

// ---- MPQ Report Card Component ----
export default function MPQReportCard({ loading, error, report, onRetry }) {
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
        pdf.setFontSize(11); pdf.setTextColor(0, 0, 0); pdf.text(`${key === "REPRESSOR_SENSITISER" ? "RS" : key}`, margin + 3, yPos + 6);
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
      icon={<Activity size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-[#2F4479]" />}
      iconBg="bg-[#2F4479]/10"
      title="MPQ Personality Report"
      subtitle="Multiphasic Personality Questionnaire result"
      onDownload={handleDownload}
      downloading={downloading}
      downloadError={downloadError}
      setDownloadError={setDownloadError}
      printRef={printRef}
    >
      <div ref={printRef} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 bg-white">
        <ReportHeader title="MPQ Personality Assessment Report" user={user} savedReport={saved_report} />
        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Scale Summary</h2>
          <div className="overflow-x-auto -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
            <div className="min-w-[600px] md:min-w-[700px] lg:min-w-full">
              <table className="w-full text-[10px] sm:text-[11px] md:text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Scale</th>
                    <th className="text-left py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Name</th>
                    <th className="text-center py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Score</th>
                    <th className="text-center py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Questions</th>
                    <th className="text-center py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Percentage</th>
                    <th className="text-center py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Cutoff</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(scores).map(([key, score]) => {
                    const config = MPQ_SCALE_CONFIG[key] || { name: key, totalQuestions: 24 };
                    const interp = interpretation?.[key];
                    const pct = ((score / config.totalQuestions) * 100).toFixed(1);
                    return (
                      <tr key={key === "REPRESSOR_SENSITISER" ? "RS" : key} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 sm:py-2.5 px-1.5 sm:px-2"><span className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-[#2F4479]/5 flex items-center justify-center text-[10px] sm:text-[11px] md:text-[12px] font-bold text-[#2F4479]">{key === "REPRESSOR_SENSITISER" ? "RS" : key}</span></td>
                        <td className="py-2 sm:py-2.5 px-1.5 sm:px-2"><p className="font-medium text-slate-800">{config.name}</p></td>
                        <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 text-center"><span className="font-bold text-slate-800">{score}</span></td>
                        <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 text-center text-slate-500">{config.totalQuestions}</td>
                        <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 text-center"><span className="font-medium text-slate-700">{pct}%</span></td>
                        <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 text-center">
                          <CutoffBadge score={score} cutoff={interp?.cutoff} isAboveCutoff={interp?.is_above_cutoff} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3 sm:mb-4">Scale Details</h2>
          <div className="space-y-2 sm:space-y-3">
            {Object.entries(scores).map(([key, score]) => {
              const config = MPQ_SCALE_CONFIG[key] || { name: key, totalQuestions: 24, description: "" };
              const interp = interpretation?.[key];
              const pct = ((score / config.totalQuestions) * 100);
              const isAbove = !!interp?.is_above_cutoff;
              const colorHex = isAbove ? "#E85720" : "#1F6D48";
              return (
                <div key={key === "REPRESSOR_SENSITISER" ? "RS" : key} className="rounded-lg sm:rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-[#2F4479]/5 flex items-center justify-center text-[11px] sm:text-[12px] md:text-[13px] font-bold text-[#2F4479]">{key === "REPRESSOR_SENSITISER" ? "RS" : key}</span>
                      <div><p className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-800">{config.name}</p><p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-500 hidden sm:block">{config.description}</p></div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-slate-800">{score}<span className="text-slate-400 text-[10px] sm:text-[11px] md:text-[12px]">/{config.totalQuestions}</span></p>
                      <CutoffBadge score={score} cutoff={interp?.cutoff} isAboveCutoff={interp?.is_above_cutoff} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 h-1.5 sm:h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: colorHex }} /></div>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-slate-500 w-10 sm:w-12 text-right">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">{score} of {config.totalQuestions} questions</p>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">Cutoff: {interp?.cutoff ?? "—"}</p>
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

// ---- CutoffBadge Component (only used in MPQ) ----
function CutoffBadge({ score, cutoff, isAboveCutoff }) {
  if (cutoff === undefined || cutoff === null) {
    return <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">—</span>;
  }
  const isHigh = !!isAboveCutoff;
  const diff = score - cutoff;
  const diffLabel =
    diff > 0 ? `${diff} above` :
    diff < 0 ? `${Math.abs(diff)} below` :
    "at cutoff";

  return (
    <span
      className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-semibold whitespace-nowrap ${
        isHigh ? "bg-[#E85720]/10 text-[#E85720]" : "bg-[#1F6D48]/10 text-[#1F6D48]"
      }`}
      title={`Score ${score}, cutoff ${cutoff}`}
    >
      {score}/{cutoff} · {diffLabel}
    </span>
  );
}

// ---- ReportInfo Component (only used in MPQ) ----
function ReportInfo({ savedReport }) {
  if (!savedReport) return null;
  return (
    <div className="border-t border-slate-200 pt-4 sm:pt-5 md:pt-6">
      <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Report Information</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {savedReport.id && <InfoItem label="Report ID" value={`#${savedReport.id}`} />}
        {savedReport.user_id && <InfoItem label="User ID" value={`#${savedReport.user_id}`} />}
        {savedReport.package_id && <InfoItem label="Package ID" value={`#${savedReport.package_id}`} />}
        {savedReport.subheading_id && <InfoItem label="Section ID" value={`#${savedReport.subheading_id}`} />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-3">
        {savedReport.created_at && <InfoItem label="Created At" value={new Date(savedReport.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />}
        {savedReport.updated_at && <InfoItem label="Last Updated" value={new Date(savedReport.updated_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />}
      </div>
    </div>
  );
}

// ---- InfoItem Component (only used in MPQ) ----
function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 sm:px-4 py-2.5 sm:py-3">
      <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}