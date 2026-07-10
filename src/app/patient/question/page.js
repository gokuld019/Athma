"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PulseProgress from "@/components/ui/PulseProgress";

// DUMMY VERSION — static yes/no questions, no API calls yet.
// Answers are kept in local state only.

const QUESTIONS = [
  { id: "q1", text: "Have you had this symptom for more than 3 days?" },
  { id: "q2", text: "Is the pain or discomfort severe?" },
  { id: "q3", text: "Do you have any known medical conditions?" },
  { id: "q4", text: "Are you currently taking any medication?" },
  { id: "q5", text: "Have you had a fever in the last 24 hours?" },
];

export default function QuestionnairePage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});

  const question = QUESTIONS[current];
  const isLast = current === QUESTIONS.length - 1;

  const selectOption = (option) => {
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  };

  const handleNext = () => {
    if (!answers[question.id]) return;

    if (isLast) {
      // Dummy submit — later this becomes a POST to /api/questionnaire
      router.push("/patient/thank-you");
    } else {
      setCurrent((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (current > 0) setCurrent((i) => i - 1);
  };

  return (
    <div className="max-w-[520px] mx-auto px-5 py-10">
      <PulseProgress current={3} />

      <div className="bg-card border border-line rounded-card p-7">
        <p className="text-[11px] text-ink-soft mb-2.5">
          Question {current + 1} of {QUESTIONS.length}
        </p>
        <h1 className="font-brand text-xl font-semibold text-teal-900 mb-7 leading-snug">
          {question.text}
        </h1>

        <div className="flex gap-3 mb-8">
          {["Yes", "No"].map((option) => {
            const selected = answers[question.id] === option;
            return (
              <button
                key={option}
                onClick={() => selectOption(option)}
                className={`flex-1 py-3.5 rounded-[10px] text-[14px] font-semibold border transition-colors ${
                  selected
                    ? "border-teal-900 bg-teal-100 text-teal-900"
                    : "border-line bg-[#FCFDFC] text-ink-soft hover:border-teal-500"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={current === 0}
            className="text-[13px] text-ink-soft disabled:opacity-0"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[question.id]}
            className="px-6 py-2.5 rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] transition-colors disabled:opacity-40"
          >
            {isLast ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}