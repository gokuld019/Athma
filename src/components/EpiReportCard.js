"use client";

import { useRef, useState } from "react";
import { Sparkles, BadgeCheck } from "lucide-react";
import {
  ReportCardWrapper,
  ReportHeader,
  ReportFooter,
  LoadingState,
  ErrorState,
  SummaryBox,
  loadPdfLibs,
} from "./AssessmentComponents";

// ---- EPI Report Card Component ----
export default function EpiReportCard({ loading, error, report, onRetry }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (loading) return <LoadingState label="Loading EPI report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  const { user, epi_report, saved_report } = report;
  if (!epi_report) return null;
  const { e_score, n_score, l_score, personality_type, traits, summary, graph_data } = epi_report;

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

      pdf.setFontSize(20); pdf.setTextColor(47, 68, 121);
      pdf.text("EPI Personality Assessment Report", margin, yPos); yPos += 12;
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100);
      pdf.text("Eysenck Personality Inventory Results", margin, yPos); yPos += 8;
      addLine();
      addSectionHeader("PATIENT INFORMATION");

      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0);
      const leftCol = margin; const rightCol = pageWidth / 2 + 5;
      pdf.text("Patient Name:", leftCol, yPos); pdf.setFontSize(12); pdf.setTextColor(47, 68, 121); pdf.text(user?.name || "N/A", leftCol + 25, yPos);
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Patient ID:", rightCol, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(`#${user?.id || "N/A"}`, rightCol + 20, yPos); yPos += 8;
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Email:", leftCol, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(user?.email || "N/A", leftCol + 25, yPos);
      if (saved_report?.completed_at) { pdf.setFontSize(10); pdf.setTextColor(0, 0, 0); pdf.text("Assessment Date:", rightCol, yPos); pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.text(new Date(saved_report.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), rightCol + 30, yPos); }
      yPos += 10; addLine();
      addSectionHeader("DIMENSION SCORES"); yPos += 2;

      const scoreBoxWidth = (pageWidth - margin * 2 - 10) / 3; const scoreBoxHeight = 30; const scoreBoxY = yPos;
      const scores = [
        { label: "Extraversion (E)", score: e_score, max: graph_data?.max_score || 24, color: [232, 87, 32] },
        { label: "Neuroticism (N)", score: n_score, max: graph_data?.max_score || 24, color: [47, 68, 121] },
        { label: "Lie Scale (L)", score: l_score, max: 9, color: [31, 109, 72] },
      ];
      scores.forEach((score, index) => {
        const boxX = margin + (scoreBoxWidth + 5) * index;
        pdf.setDrawColor(200, 200, 200); pdf.setFillColor(245, 245, 245); pdf.roundedRect(boxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 2, 2, 'FD');
        pdf.setFontSize(8); pdf.setTextColor(100, 100, 100); pdf.text(score.label, boxX + 3, scoreBoxY + 6);
        pdf.setFontSize(16); pdf.setTextColor(...score.color); pdf.text(`${score.score || 0}/${score.max}`, boxX + 3, scoreBoxY + 20);
        const barY = scoreBoxY + scoreBoxHeight - 5;
        pdf.setDrawColor(220, 220, 220); pdf.setFillColor(240, 240, 240); pdf.roundedRect(boxX + 3, barY, scoreBoxWidth - 6, 3, 1, 1, 'FD');
        const pct = Math.min(100, Math.max(0, score.score / score.max * 100));
        pdf.setFillColor(...score.color); pdf.roundedRect(boxX + 3, barY, (scoreBoxWidth - 6) * pct / 100, 3, 1, 1, 'F');
      });
      yPos = scoreBoxY + scoreBoxHeight + 10; addLine();
      addSectionHeader("PERSONALITY PROFILE"); yPos += 2;

      if (personality_type || graph_data?.quadrant) {
        const profileWidth = (pageWidth - margin * 2 - 10) / 2; const profileHeight = 35; const profileY = yPos;
        if (personality_type) {
          pdf.setDrawColor(31, 109, 72); pdf.setFillColor(241, 250, 245); pdf.roundedRect(margin, profileY, profileWidth, profileHeight, 3, 3, 'FD');
          pdf.setFontSize(9); pdf.setTextColor(100, 100, 100); pdf.text("Personality Type", margin + 4, profileY + 8);
          pdf.setFontSize(18); pdf.setTextColor(31, 109, 72); pdf.text(personality_type, margin + 4, profileY + 25);
        }
        if (graph_data?.quadrant) {
          pdf.setDrawColor(47, 68, 121); pdf.setFillColor(245, 247, 250); pdf.roundedRect(margin + profileWidth + 10, profileY, profileWidth, profileHeight, 3, 3, 'FD');
          pdf.setFontSize(9); pdf.setTextColor(100, 100, 100); pdf.text("Quadrant", margin + profileWidth + 14, profileY + 8);
          pdf.setFontSize(16); pdf.setTextColor(47, 68, 121); pdf.text(graph_data.quadrant.replace("-", " ").toUpperCase(), margin + profileWidth + 14, profileY + 25);
        }
        yPos = profileY + profileHeight + 10;
      }
      addLine();

      if (Array.isArray(traits) && traits.length > 0) {
        addSectionHeader("PERSONALITY TRAITS");
        pdf.setFontSize(10); pdf.setTextColor(80, 80, 80);
        const traitsPerLine = 4; const traitWidth = (pageWidth - margin * 2) / traitsPerLine;
        traits.forEach((trait, index) => {
          const col = index % traitsPerLine; const row = Math.floor(index / traitsPerLine);
          const traitX = margin + col * traitWidth; const traitY = yPos + row * 8;
          pdf.setDrawColor(200, 200, 200); pdf.setFillColor(248, 248, 248); pdf.roundedRect(traitX + 2, traitY - 5, traitWidth - 4, 6, 2, 2, 'FD');
          pdf.text(`• ${trait}`, traitX + 4, traitY);
        });
        yPos += Math.ceil(traits.length / traitsPerLine) * 8 + 8;
      }
      addLine();

      if (summary) {
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
      pdf.save(`EPI_Report_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF. Please check console for details.");
    } finally { setDownloading(false); }
  };

  return (
    <ReportCardWrapper
      icon={<Sparkles size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-[#E85720]" />}
      iconBg="bg-[#E85720]/10"
      title="EPI Personality Report"
      subtitle="Eysenck Personality Inventory result"
      badge={personality_type ? { icon: <BadgeCheck size={11} className="sm:w-[12px] sm:h-[12px] md:w-[13px] md:h-[13px]" />, text: personality_type, className: "bg-[#1F6D48]/10 text-[#1F6D48] border-[#1F6D48]/20" } : null}
      onDownload={handleDownload}
      downloading={downloading}
      downloadError={downloadError}
      setDownloadError={setDownloadError}
      printRef={printRef}
    >
      <div ref={printRef} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-white">
        <ReportHeader title="EPI Personality Assessment Report" user={user} savedReport={saved_report} />
        <div className="flex justify-center py-2 sm:py-3 md:py-4 overflow-x-auto">
          <div className="min-w-[300px] sm:min-w-[400px] md:min-w-[500px]">
            <EpiQuadrantWheel eScore={e_score} nScore={n_score} maxScore={graph_data?.max_score ?? 24} personalityType={personality_type} />
          </div>
        </div>
        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Dimension Scores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <EpiScoreBar label="Extraversion (E)" score={e_score} max={graph_data?.max_score || 24} percentage={graph_data?.e_percentage} color="#E85720" />
            <EpiScoreBar label="Neuroticism (N)" score={n_score} max={graph_data?.max_score || 24} percentage={graph_data?.n_percentage} color="#2F4479" />
            <EpiScoreBar label="Lie Scale (L)" score={l_score} max={9} percentage={l_score ? (l_score / 9) * 100 : 0} color="#1F6D48" />
          </div>
        </div>
        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Personality Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {personality_type && <InfoCard label="Personality Type" value={personality_type} color="[#1F6D48]" />}
            {graph_data?.quadrant && <InfoCard label="Quadrant" value={graph_data.quadrant.replace("-", " ")} color="[#2F4479]" />}
          </div>
        </div>
        {Array.isArray(traits) && traits.length > 0 && <TraitsList traits={traits} />}
        {summary && <SummaryBox summary={summary} />}
        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}

// ---- Info Card Component ----
function InfoCard({ label, value, color }) {
  return (
    <div className={`rounded-lg sm:rounded-xl bg-gradient-to-br from-${color}/10 to-${color}/5 border border-${color}/20 px-4 sm:px-5 py-3 sm:py-4`}>
      <p className={`text-[9px] sm:text-[10px] md:text-[11px] font-medium text-${color}/70 uppercase tracking-wide mb-0.5 sm:mb-1`}>{label}</p>
      <p className={`text-[18px] sm:text-[22px] md:text-[24px] font-bold text-${color}`}>{value}</p>
    </div>
  );
}

// ---- Traits List Component ----
function TraitsList({ traits }) {
  return (
    <div>
      <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Personality Traits</h2>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {traits.map((trait) => (
          <span key={trait} className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] md:text-[12.5px] font-medium bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 text-slate-700 capitalize shadow-sm">{trait}</span>
        ))}
      </div>
    </div>
  );
}

// ---- EPI Quadrant Wheel Component ----
function EpiQuadrantWheel({ eScore, nScore, maxScore = 24, personalityType }) {
  const size = 640;
  const center = size / 2;
  const outerR = 250;

  const clamp = (v) => Math.min(maxScore, Math.max(0, v ?? 0));
  const eVal = clamp(eScore);
  const nVal = clamp(nScore);

  const half = outerR * 0.92;
  const dotX = center + ((nVal - maxScore / 2) / (maxScore / 2)) * half;
  const dotY = center - ((eVal - maxScore / 2) / (maxScore / 2)) * half;

  const type = (personalityType || "").toUpperCase();
  const quadrantMap = { SANGUINE: "tl", CHOLERIC: "tr", PHLEGMATIC: "bl", MELANCHOLIC: "br" };
  const activeQuad = quadrantMap[type];

  const textColor = "#1F2E28";
  const mutedText = "#44544D";
  const accent = "#E85720";
  const ringColor = "#D9E3DC";
  const dividerColor = "#FFFFFF";

  const polar = (r, deg) => { const rad = ((deg - 90) * Math.PI) / 180; return [center + r * Math.cos(rad), center + r * Math.sin(rad)]; };
  const wedgePath = (r, startDeg, endDeg) => { const [x1, y1] = polar(r, startDeg); const [x2, y2] = polar(r, endDeg); const large = endDeg - startDeg > 180 ? 1 : 0; return `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`; };
  const arcPathTop = (r, startDeg, endDeg) => { const [x1, y1] = polar(r, startDeg); const [x2, y2] = polar(r, endDeg); const large = endDeg - startDeg > 180 ? 1 : 0; return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`; };
  const arcPathBottom = (r, startDeg, endDeg) => { const [x1, y1] = polar(r, endDeg); const [x2, y2] = polar(r, startDeg); const large = endDeg - startDeg > 180 ? 1 : 0; return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`; };

  const labelR = outerR - 34;
  const quadrants = [
    { key: "tl", label: "(SANGUINE)", words: ["sociable", "outgoing", "talkative", "responsive", "easygoing", "lively", "carefree", "leadership"], wedgeStart: 270, wedgeEnd: 360, side: "left", arc: "top", arcStart: 270 + 4, arcEnd: 360 - 32 },
    { key: "tr", label: "(CHOLERIC)", words: ["active", "optimistic", "impulsive", "changeable", "exciteable", "aggressive", "restless", "touchy"], wedgeStart: 0, wedgeEnd: 90, side: "right", arc: "top", arcStart: 0 + 32, arcEnd: 90 - 4 },
    { key: "bl", label: "(PHLEGMATIC)", words: ["calm", "even-tempered", "reliable", "controlled", "peaceful", "thoughtful", "careful", "passive"], wedgeStart: 180, wedgeEnd: 270, side: "left", arc: "bottom", arcStart: 180 + 4, arcEnd: 270 - 32 },
    { key: "br", label: "(MELANCHOLIC)", words: ["moody", "anxious", "rigid", "sober", "pessimistic", "reserved", "unsociable", "quiet"], wedgeStart: 90, wedgeEnd: 180, side: "right", arc: "bottom", arcStart: 90 + 32, arcEnd: 180 - 4 },
  ];

  const rowHeight = 22;
  const topListStartY = center - outerR + 62;
  const bottomListStartY = center + 42;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 620, margin: "0 auto" }}>
      <svg viewBox={`0 0 ${size} ${size + 20}`} width="100%" height="auto" style={{ display: "block" }}>
        <defs>{quadrants.map((q) => (<path key={`arc-${q.key}`} id={`arc-${q.key}`} d={q.arc === "top" ? arcPathTop(labelR, q.arcStart, q.arcEnd) : arcPathBottom(labelR, q.arcStart, q.arcEnd)} fill="none" />))}</defs>
        <g transform="translate(0,10)">
          {quadrants.map((q) => (<path key={q.key} d={wedgePath(outerR, q.wedgeStart, q.wedgeEnd)} fill={activeQuad === q.key ? "#F3D9CC" : "#E9F0EA"} />))}
          <line x1={center} y1={center - outerR} x2={center} y2={center + outerR} stroke={dividerColor} strokeWidth="5" />
          <line x1={center - outerR} y1={center} x2={center + outerR} y2={center} stroke={dividerColor} strokeWidth="5" />
          <circle cx={center} cy={center} r={outerR} fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx={center} cy={center} r={outerR} fill="none" stroke={ringColor} strokeWidth="1" />
          {quadrants.map((q) => (<text key={`lbl-${q.key}`} fontSize="14" fontWeight="700" fill={textColor} letterSpacing="0.5"><textPath href={`#arc-${q.key}`} startOffset="50%" textAnchor="middle">{q.label}</textPath></text>))}
          {quadrants.map((q) => { const isActive = activeQuad === q.key; const x = q.side === "left" ? center - 14 : center + 14; const anchor = q.side === "left" ? "end" : "start"; const startY = q.key === "tl" || q.key === "tr" ? topListStartY : bottomListStartY; return q.words.map((w, i) => (<text key={`${q.key}-${w}`} x={x} y={startY + i * rowHeight} textAnchor={anchor} fontSize="13.5" fontWeight={isActive ? "700" : "400"} fill={isActive ? accent : mutedText}>{w}</text>)); })}
          <circle cx={center} cy={center} r="15" fill="#FFFFFF" />
          <text x={center} y={center + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill={textColor}>{maxScore / 2}</text>
          <text x={center} y={center - outerR - 34} textAnchor="middle" fontSize="15" fontWeight="700" fill={textColor}>{maxScore}</text>
          <text x={center} y={center - outerR - 14} textAnchor="middle" fontSize="14" fontWeight="700" fill={textColor} letterSpacing="1">EXTROVERT</text>
          <text x={center} y={center + outerR + 24} textAnchor="middle" fontSize="14" fontWeight="700" fill={textColor} letterSpacing="1">INTROVERT</text>
          <text x={center} y={center + outerR + 44} textAnchor="middle" fontSize="15" fontWeight="700" fill={textColor}>0</text>
          <text x={center - outerR - 8} y={center + 5} textAnchor="end" fontSize="15" fontWeight="700" fill={textColor}>0</text>
          <text x={center - outerR + 22} y={center + 5} textAnchor="start" fontSize="14" fontWeight="700" fill={textColor} letterSpacing="1">STABLE</text>
          <text x={center + outerR - 22} y={center + 5} textAnchor="end" fontSize="14" fontWeight="700" fill={textColor} letterSpacing="1">NEUROTIC</text>
          <text x={center + outerR + 8} y={center + 5} textAnchor="start" fontSize="15" fontWeight="700" fill={textColor}>{maxScore}</text>
          <circle cx={dotX} cy={dotY} r="20" fill={accent} opacity="0.15" />
          <circle cx={dotX} cy={dotY} r="9" fill={accent} stroke="#fff" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
}

// ---- EPI Score Bar Component ----
function EpiScoreBar({ label, score, max, percentage, color }) {
  const pct = percentage !== undefined && percentage !== null ? percentage : 0;
  return (
    <div className="rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
        <span className="text-[9px] sm:text-[10px] md:text-[11.5px] font-medium text-slate-500">{label}</span>
        <span className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-800">{score ?? "—"}{max !== undefined && max !== null && <span className="text-slate-400 font-normal">/{max}</span>}</span>
      </div>
      <div className="h-1 sm:h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }} /></div>
      {percentage !== undefined && percentage !== null && <p className="text-[8px] sm:text-[9px] md:text-[10.5px] text-slate-400 mt-0.5 sm:mt-1 text-right">{pct}%</p>}
    </div>
  );
}