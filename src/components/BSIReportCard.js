// components/BSIReportCard.js
"use client";

import { useRef, useState } from "react";
import {
  XCircle,
  Shield,
  AlertTriangle,
  Clock,
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
  getBSISeverityColor,
  getBSIScoreColor,
  BSI_SEVERITY_CONFIG,
} from "./AssessmentComponents";

// ---- BSI Tamil Question Translations ----
export const BSI_TAMIL_QUESTIONS = {
  "Isolation during the attempt.": {
    tamil_question: "தனிமை",
    tamil_options: {
      "0": "0. அருகில் ஒருவர் உள்ளார்",
      "1": "1. அருகில் ஒருவர் உள்ளார், அல்லது பார்வை அல்லது குரல் வழித் தொடர்பு உள்ளது",
      "2": "2. அருகில் யாரும் இல்லை; பார்வை அல்லது குரல் வழித் தொடர்பும் இல்லை"
    }
  },
  "Timing of the attempt.": {
    tamil_question: "காலம்",
    tamil_options: {
      "0": "0. தலையீடு சாத்தியம்",
      "1": "1. தலையீடு நிகழ மிகக் குறைந்த வாய்ப்பே உள்ளது",
      "2": "2. தலையீடு நிகழ வாய்ப்பில்லை"
    }
  },
  "Precautions taken against discovery or intervention.": {
    tamil_question: "கண்டறியப்படுதல் அல்லது தலையீட்டிற்கு எதிரான முன்னெச்சரிக்கைகள்",
    tamil_options: {
      "0": "0. முன்னெச்சரிக்கை நடவடிக்கைகள் இல்லை",
      "1": "1. செயலற்ற முன்னெச்சரிக்கை நடவடிக்கைகள் (மற்றவர்களைத் தவிர்ப்பது, ஆனால் தலையீட்டைத் தடுக்க எதுவும் செய்யாமல் இருப்பது; பூட்டப்படாத கதவுடன் அறையில் தனியாக இருப்பது)",
      "2": "2. செயல்மிகு முன்னெச்சரிக்கை நடவடிக்கைகள் (பூட்டப்பட்ட கதவு)"
    }
  },
  "Acting to get help during or after the attempt.": {
    tamil_question: "தற்கொலை முயற்சியின் போதோ அல்லது அதற்குப் பின்னரோ உதவி பெறுவதற்கான நடவடிக்கைகள்",
    tamil_options: {
      "0": "0. முயற்சி குறித்து உதவக்கூடிய நபருக்குத் தெரிவிக்கப்பட்டது",
      "1": "1. தொடர்புகொள்ளப்பட்டது, ஆனால் முயற்சி குறித்து அந்த நபருக்குக் குறிப்பாகத் தெரிவிக்கப்படவில்லை",
      "2": "2. உதவக்கூடிய நபரைத் தொடர்புகொள்ளவோ அல்லது அவருக்குத் தெரிவிக்கவோ இல்லை"
    }
  },
  "Final acts in anticipation of death (e.g., will, gifts, insurance).": {
    tamil_question: "இறப்பை முன்னிட்டு மேற்கொள்ளப்படும் இறுதி நடவடிக்கைகள் (எ.கா., உயில், அன்பளிப்புகள், காப்பீடு)",
    tamil_options: {
      "0": "0. எதுவுமில்லை",
      "1": "1. ஏற்பாடுகள் செய்வது குறித்துச் சிந்தித்தல் அல்லது அதற்கான நடவடிக்கைகளை மேற்கொள்ளுதல்",
      "2": "2. திட்டவட்டமான திட்டங்களை வகுத்தல் அல்லது ஏற்பாடுகளை முழுமையாக நிறைவு செய்தல்"
    }
  },
  "Active preparation for the attempt.": {
    tamil_question: "முயற்சிக்கான தீவிரத் தயாரிப்பு",
    tamil_options: {
      "0": "0. இல்லை",
      "1": "1. குறைவானது முதல் மிதமானது வரை",
      "2": "2. அதிக அளவிலான"
    }
  },
  "Suicide note.": {
    tamil_question: "தற்கொலைக் கடிதம்",
    tamil_options: {
      "0": "0. கடிதம் இல்லாமை",
      "1": "1. கடிதம் எழுதப்பட்டு கிழிக்கப்பட்டது; அல்லது கடிதம் எழுதுவது குறித்து சிந்திக்கப்பட்டது",
      "2": "2. கடிதம் இருத்தல்"
    }
  },
  "Overt communication of intent before the attempt.": {
    tamil_question: "முயற்சிக்கு முன்னதாகவே நோக்கத்தை வெளிப்படையாகத் தெரிவித்தல்",
    tamil_options: {
      "0": "0. ஏதுமில்லை",
      "1": "1. தெளிவற்ற தகவல் தொடர்பு",
      "2": "2. தெளிவான தகவல் தொடர்பு"
    }
  },
  "Alleged purpose of the attempt.": {
    tamil_question: "முயற்சியின் கூறப்படும் நோக்கம்",
    tamil_options: {
      "0": "0. சூழ்நிலையைக் கையாள்வது, கவனத்தை ஈர்ப்பது, பழிவாங்குவது",
      "1": "1. \"0\" மற்றும் \"2\" ஆகியவற்றின் கூறுகள்",
      "2": "2. தப்பித்தல், முடிவுகாணல், சிக்கல்களைத் தீர்த்தல்"
    }
  },
  "Expectations of fatality.": {
    tamil_question: "உயிரிழப்பு குறித்த எதிர்பார்ப்புகள்",
    tamil_options: {
      "0": "0. மரணம் நிகழ வாய்ப்பில்லை என்று கருதினேன்",
      "1": "1. மரணம் சாத்தியம், ஆனால் நிகழக்கூடியது அல்ல என்று கருதினேன்",
      "2": "2. மரணம் நிகழக்கூடியது அல்லது நிச்சயம் என்று கருதினேன்"
    }
  },
  "Conception of method's lethality.": {
    tamil_question: "முறையின் உயிரிழப்பை ஏற்படுத்தும் தன்மை குறித்த கருத்துரு",
    tamil_options: {
      "0": "0. உயிரைப் பறிக்கக்கூடியது என்று தான் நினைத்த அளவை விடக் குறைவான பாதிப்பையே தனக்கு ஏற்படுத்திக்கொண்டார்",
      "1": "1. தான் செய்தது உயிரைப் பறிக்கக்கூடியதாக இருக்குமா என்பது குறித்து உறுதியாகத் தெரியவில்லை",
      "2": "2. உயிரைப் பறிக்கக்கூடியது என்று தான் நினைத்த அளவிற்குச் சமமான அல்லது அதைவிட அதிகமான பாதிப்பை ஏற்படுத்திக்கொண்டார்"
    }
  },
  "Seriousness of the attempt.": {
    tamil_question: "முயற்சியின் தீவிரத்தன்மை",
    tamil_options: {
      "0": "0. உயிரை மாய்த்துக்கொள்ள தீவிரமாக முயற்சிக்கவில்லை",
      "1": "1. உயிரை மாய்த்துக்கொள்வதில் உள்ள தீவிரத்தன்மை குறித்து உறுதியற்ற நிலை",
      "2": "2. உயிரை மாய்த்துக்கொள்ள தீவிரமாக முயற்சித்தது"
    }
  },
  "Attitude toward living or dying.": {
    tamil_question: "வாழ்க்கை மற்றும் இறப்பு குறித்த மனப்பான்மை",
    tamil_options: {
      "0": "0. சாக விரும்பவில்லை",
      "1": "1. \"0\" மற்றும் \"2\"-ன் கூறுகள்",
      "2": "2. சாக விரும்பினேன்"
    }
  },
  "Conception of medical rescability.": {
    tamil_question: "மருத்துவ ரீதியாக உயிர்காக்கக்கூடிய தன்மை குறித்த கோட்பாடு",
    tamil_options: {
      "0": "0. மருத்துவ சிகிச்சை பெற்றால் இறப்பு நேரிட வாய்ப்பில்லை என்று கருதினார்",
      "1": "1. மருத்துவ சிகிச்சையால் இறப்பைத் தவிர்க்க முடியுமா என்பதில் உறுதியற்றவராக இருந்தார்",
      "2": "2. மருத்துவ சிகிச்சை பெற்றாலும் இறப்பு நிச்சயம் என்று உறுதியாக நம்பினார்"
    }
  },
  "Degree of premeditation.": {
    tamil_question: "முன்யோசனையின் அளவு",
    tamil_options: {
      "0": "0. இல்லை; திடீர் உந்துதலால் செய்யப்பட்டது",
      "1": "1. தற்கொலை முயற்சிக்கு மூன்று மணிநேரம் அல்லது அதற்கும் குறைவான நேரத்திற்கு முன்பே அது குறித்து சிந்தித்தல்",
      "2": "2. தற்கொலை முயற்சிக்கு மூன்று மணிநேரத்திற்கும் மேலாக அது குறித்து சிந்தித்தல்"
    }
  },
  "Reaction to the attempt.": {
    tamil_question: "முயற்சிக்கான எதிர்வினை",
    tamil_options: {
      "0": "0. முயற்சி செய்தது குறித்து வருத்தம்; முட்டாள்தனமாகவும் அவமானமாகவும் உணர்தல்",
      "1": "1. முயற்சி மற்றும் அதன் தோல்வி ஆகிய இரண்டையும் ஏற்றுக்கொள்கிறார்",
      "2": "2. முயற்சியின் தோல்வி குறித்து வருந்துகிறார்"
    }
  },
  "Visualization of death.": {
    tamil_question: "மரணம் குறித்த காட்சிப்படுத்தல்",
    tamil_options: {
      "0": "0. மரணத்திற்குப் பிந்தைய வாழ்வு, இறந்தவர்களுடன் மீண்டும் இணைதல்",
      "1": "1. முடிவற்ற உறக்கம், இருள், எல்லாவற்றின் முடிவு",
      "2": "2. மரணத்தைப் பற்றிய எந்தவொரு கருத்தோ அல்லது சிந்தனையோ இன்மை"
    }
  },
  "Number of previous attempts.": {
    tamil_question: "முந்தைய முயற்சிகளின் எண்ணிக்கை",
    tamil_options: {
      "0": "0. ஏதுமில்லை",
      "1": "1. ஒன்று அல்லது இரண்டு",
      "2": "2. மூன்று அல்லது அதற்கு மேற்பட்டவை"
    }
  },
  "Relationship between alcohol intake and the attempt.": {
    tamil_question: "மது அருந்துவதற்கும் (தற்கொலை) முயற்சிக்கும் இடையிலான தொடர்பு",
    tamil_options: {
      "0": "0. தற்கொலை முயற்சிக்கு முன்னதாக மது அருந்தியிருந்தாலும், அது அந்த முயற்சியுடன் தொடர்புடையதாகவோ அல்லது முடிவெடுக்கும் திறன் மற்றும் யதார்த்தத்தை உணரும் திறனைப் பாதிக்கும் அளவிலோ இல்லை.",
      "1": "1. முடிவெடுக்கும் திறன் மற்றும் யதார்த்தத்தை உணரும் திறனைப் பாதிக்கும் வகையிலும், பொறுப்புணர்வு அல்லது உந்துதல் மீதான கட்டுப்பாட்டைக் குறைக்கும் வகையிலும் மது அருந்தியிருத்தல்.",
      "2": "2. தற்கொலை முயற்சியை மேற்கொள்வதை எளிதாக்கும் நோக்கத்துடன் வேண்டுமென்றே மது அருந்துதல்."
    }
  },
  "Relationship between drug intake and the attempt.": {
    tamil_question: "போதைப்பொருள் பயன்பாட்டிற்கும் தற்கொலை முயற்சிக்கும் இடையிலான தொடர்பு (போதைப்பொருள், மாயத்தோற்றத்தை உண்டாக்கும் மருந்துகள் போன்றவை; தற்கொலைக்கான வழியாகப் பயன்படுத்தப்படும் முறை அல்ல)",
    tamil_options: {
      "0": "0. தற்கொலை முயற்சிக்கு முன்னதாகவே சில மருந்துகளை உட்கொண்டிருந்தாலும், அது அந்த முயற்சியுடன் தொடர்புடையதாகவோ அல்லது முடிவெடுக்கும் திறன் மற்றும் யதார்த்தத்தை உணரும் திறனைப் பாதிக்கும் அளவிலோ இல்லை.",
      "1": "1. முடிவெடுக்கும் திறன், சுய உணர்வு மற்றும் பொறுப்புணர்வு அல்லது உந்துதலைக் கட்டுப்படுத்தும் திறன் ஆகியவற்றைப் பாதிக்கும் அளவுக்கு மருந்துகளை உட்கொண்டிருத்தல்.",
      "2": "2. தற்கொலை முயற்சியை மேற்கொள்வதை எளிதாக்கும் நோக்கத்துடன் வேண்டுமென்றே மருந்துகளை உட்கொள்ளுதல்."
    }
  }
};

// Helper function to get Tamil translation for BSI question
export function getBSITamilTranslation(englishQuestion) {
  if (!englishQuestion) return null;
  if (BSI_TAMIL_QUESTIONS[englishQuestion]) {
    return BSI_TAMIL_QUESTIONS[englishQuestion];
  }
  const normalized = englishQuestion.trim();
  if (BSI_TAMIL_QUESTIONS[normalized]) {
    return BSI_TAMIL_QUESTIONS[normalized];
  }
  for (const [key, value] of Object.entries(BSI_TAMIL_QUESTIONS)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return value;
    }
  }
  return null;
}

// ---- BSI Report Card Component ----
export default function BSIReportCard({ loading, error, report, onRetry }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (loading) return <LoadingState label="Loading BSI report..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!report) return null;

  const { user, bsi_report, saved_report } = report;
  if (!bsi_report) return null;
  const { total_score, max_score, level, recommendations, question_details, summary } = bsi_report;
  const severityColor = getBSISeverityColor(level?.label);

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

      pdf.setFontSize(20); pdf.setTextColor(180, 83, 9); pdf.text("BSI Suicide Risk Assessment Report", margin, yPos); yPos += 12;
      pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.text("Beck Suicide Intent Scale Results", margin, yPos); yPos += 8;
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
        pdf.setFontSize(14); pdf.setTextColor(...scoreColor); pdf.text(`Risk Level: ${level.label}`, margin + 80, yPos + 18);
        pdf.setFontSize(9); pdf.setTextColor(100, 100, 100); pdf.text(level.description.substring(0, 80) + "...", margin + 80, yPos + 28);
      }
      yPos += 50; addLine();

      if (recommendations) {
        addSectionHeader("RECOMMENDATIONS");
        pdf.setFontSize(9); pdf.setTextColor(80, 80, 80);
        const recLines = [];
        if (recommendations.action) recLines.push(`Action: ${recommendations.action}`);
        if (recommendations.follow_up) recLines.push(`Follow-up: ${recommendations.follow_up}`);
        if (recommendations.admission) recLines.push(`Admission: ${recommendations.admission}`);
        recLines.forEach(line => {
          const lines = pdf.splitTextToSize(line, pageWidth - margin * 2 - 10);
          pdf.text(lines, margin, yPos);
          yPos += lines.length * 4 + 4;
        });
        yPos += 5;
        addLine();
      }
      
      addSectionHeader("QUESTION RESPONSES"); yPos += 2;

      if (question_details) {
        pdf.setFillColor(240, 240, 240);
        pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 1, 1, 'F');
        pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
        pdf.text("#", margin + 2, yPos + 5.5);
        pdf.text("Question", margin + 10, yPos + 5.5);
        pdf.text("Answer", margin + 100, yPos + 5.5);
        pdf.text("Score", margin + 170, yPos + 5.5);
        yPos += 10;

        const sortedQuestions = Object.entries(question_details).sort(([,a], [,b]) => (a.display_order || 0) - (b.display_order || 0));
        
        sortedQuestions.forEach(([qId, detail]) => {
          if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
          const qScore = detail.score || 0;
          const qColor = getBSIScoreColor(qScore).replace("#", "");
          const qr = parseInt(qColor.substring(0, 2), 16);
          const qg = parseInt(qColor.substring(2, 4), 16);
          const qb = parseInt(qColor.substring(4, 6), 16);

          pdf.setDrawColor(220, 220, 220); pdf.setFillColor(252, 252, 252); pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 1, 1, 'FD');
          pdf.setFontSize(7); pdf.setTextColor(80, 80, 80); pdf.text(`${detail.display_order || ""}`, margin + 2, yPos + 7);
          pdf.setFontSize(7); pdf.setTextColor(60, 60, 60); pdf.text((detail.question_text || "").substring(0, 55), margin + 10, yPos + 7);
          pdf.setFontSize(7); pdf.setTextColor(100, 100, 100); pdf.text((detail.answer_text || "").substring(0, 40), margin + 100, yPos + 7);
          pdf.setFontSize(8); pdf.setTextColor(qr, qg, qb); pdf.text(`${qScore}`, margin + 170, yPos + 7);
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
      pdf.save(`BSI_Report_${safeName}_${date}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setDownloadError(err.message || "Could not generate PDF. Please check console for details.");
    } finally { setDownloading(false); }
  };

  return (
    <ReportCardWrapper
      icon={<Shield size={14} className="sm:w-[16px] sm:h-[16px] md:w-[17px] md:h-[17px] text-red-700" />}
      iconBg="bg-red-100"
      title="BSI Suicide Risk Assessment"
      subtitle="Beck Suicide Intent Scale result"
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
        <ReportHeader title="BSI Suicide Risk Assessment Report" user={user} savedReport={saved_report} />
        
        {/* Total Score Card */}
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
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-500 mt-1.5 sm:mt-2 max-w-[250px] sm:max-w-[300px] line-clamp-2">{level?.description}</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="h-2.5 sm:h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(total_score / max_score) * 100}%`, backgroundColor: severityColor }} />
            </div>
            <div className="flex justify-between mt-0.5 sm:mt-1">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">0 (Low Risk)</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">{max_score} (High Risk)</span>
            </div>
          </div>
        </div>

        {/* Risk Level Scale */}
        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Risk Level Scale</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {Object.entries(BSI_SEVERITY_CONFIG).map(([label, config]) => {
              const isActive = level?.label === label;
              return (
                <div 
                  key={label} 
                  className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 transition-all ${
                    isActive 
                      ? 'shadow-md' 
                      : 'opacity-75'
                  }`}
                  style={{ 
                    borderColor: isActive ? config.color : `${config.color}30`, 
                    backgroundColor: isActive ? `${config.color}10` : `${config.color}05` 
                  }}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: config.color }} />
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] font-bold" style={{ color: config.color }}>{label}</p>
                    {isActive && (
                      <span className="text-[8px] sm:text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-500 mb-1.5 sm:mb-2">{config.range[0]}-{config.range[1]}</p>
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-600 leading-relaxed">{config.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && (
          <div className="rounded-xl sm:rounded-2xl border-2 p-4 sm:p-5" style={{ borderColor: `${severityColor}30`, backgroundColor: `${severityColor}05` }}>
            <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3 sm:mb-4">Clinical Recommendations</h2>
            <div className="space-y-3 sm:space-y-4">
              {recommendations.action && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={14} className="sm:w-[15px] sm:h-[15px] text-red-700" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-red-800">Action Required</p>
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] text-red-700 mt-0.5">{recommendations.action}</p>
                  </div>
                </div>
              )}
              {recommendations.follow_up && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={14} className="sm:w-[15px] sm:h-[15px] text-amber-700" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-amber-800">Follow-up</p>
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] text-amber-700 mt-0.5">{recommendations.follow_up}</p>
                  </div>
                </div>
              )}
              {recommendations.admission && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Stethoscope size={14} className="sm:w-[15px] sm:h-[15px] text-blue-700" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-blue-800">Admission Consideration</p>
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] text-blue-700 mt-0.5">{recommendations.admission}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Question Responses Table */}
        <div>
          <h2 className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">Question Responses</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] sm:text-[11px] md:text-[12px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-1.5 sm:px-2 font-semibold text-slate-500 w-10">#</th>
                  <th className="text-left py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Question</th>
                  <th className="text-left py-2 px-1.5 sm:px-2 font-semibold text-slate-500">Response</th>
                  <th className="text-center py-2 px-1.5 sm:px-2 font-semibold text-slate-500 w-16">Score</th>
                </tr>
              </thead>
              <tbody>
                {question_details && Object.entries(question_details)
                  .sort(([,a], [,b]) => (a.display_order || 0) - (b.display_order || 0))
                  .map(([qId, detail]) => {
                  const score = detail.score || 0;
                  const scoreColor = getBSIScoreColor(score);
                  
                  return (
                    <tr key={qId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-1.5 sm:px-2 text-center font-medium text-slate-500">{detail.display_order}</td>
                      <td className="py-2 px-1.5 sm:px-2 text-slate-800 text-[10px] sm:text-[11px]">{detail.question_text}</td>
                      <td className="py-2 px-1.5 sm:px-2 text-slate-600 text-[9px] sm:text-[10px]">{detail.answer_text}</td>
                      <td className="py-2 px-1.5 sm:px-2 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-[10px] sm:text-[11px] font-bold" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
                          {score}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#CBD5E1]" />
            <span className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-600">0 = No risk</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#E85720]" />
            <span className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-600">1 = Moderate risk</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#DC2626]" />
            <span className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-600">2 = High risk</span>
          </div>
        </div>

        {summary && <SummaryBox summary={summary} />}
        <ReportFooter />
      </div>
    </ReportCardWrapper>
  );
}