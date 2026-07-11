"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, Brain, Heart, Users, Activity, Sparkles, ChevronRight } from "lucide-react";


const categories = [
  { code: "EPI", label: "Emotional & Psychological Index", icon: Brain },
  { code: "SCT", label: "Sentence Completion Test", icon: ClipboardList },
  { code: "MPQ", label: "Mood & Personality Questionnaire", icon: Activity },
  { code: "MRPS", label: "Mental Resilience & Progress Scale", icon: Sparkles },
  { code: "PHQ", label: "Patient Health Questionnaire", icon: Heart },
  { code: "GHQ", label: "General Health Questionnaire", icon: Users },
];

export default function CategoriesPage() {
  const router = useRouter();

  const goToAssessment = (code) => {
    router.push('/patient/assessment');
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-5 py-8 md:py-14">
      <div className="text-center mb-6 md:mb-10">
        <p className="text-[10px] md:text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide mb-1.5 md:mb-2">
          Standard Package
        </p>
        <h1 className="font-brand text-xl md:text-[26px] font-semibold text-teal-900 mb-1.5 md:mb-2">
          Choose an assessment to begin
        </h1>
        <p className="text-ink-soft text-xs md:text-[14.5px] max-w-[480px] mx-auto">
          Your package includes several short assessments. Pick one below to
          start — you can come back and complete the others anytime.
        </p>
      </div>

      <div className="flex flex-col gap-2 md:gap-3">
        {categories.map(({ code, label, icon: Icon }) => (
          <button
            key={code}
            onClick={() => goToAssessment(code)}
            className="group flex items-center gap-3 md:gap-4 bg-card border border-line rounded-xl md:rounded-[14px] px-4 md:px-5 py-3 md:py-4 text-left hover:border-teal-500 hover:shadow-[0_4px_20px_rgba(43,62,99,0.08)] transition-all"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-900 group-hover:text-white transition-colors">
              <Icon size={18} strokeWidth={2} className="md:w-[22px] md:h-[22px]" />
            </div>

            <div className="flex-1">
              <p className="text-[10px] md:text-[11.5px] font-semibold text-coral-600 uppercase tracking-wide">
                {code}
              </p>
              <p className="text-[13px] md:text-[15px] font-semibold text-ink">{label}</p>
            </div>

            <ChevronRight
              size={16}
              className="text-ink-soft group-hover:text-teal-700 group-hover:translate-x-1 transition-all md:w-[20px] md:h-[20px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}