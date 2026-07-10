"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { User, Briefcase, Venus, Baby, HeartPulse, Sparkles, Clock, FileQuestion } from "lucide-react";

// DUMMY VERSION — static data, no API calls yet.
// Later: replace CATEGORIES with data fetched based on the selected package,
// and replace PACKAGES lookup with the actual package fetched by id.

const PACKAGES = {
  "standard-adult": {
    name: "Standard Adult",
    age: "18 - 60 Years",
    price: 399,
    questions: 20,
    duration: "15 - 20 mins",
    icon: User,
    features: ["General Mental Health Screening", "Doctor Review within 24 Hours", "WhatsApp Report"],
  },
  executive: {
    name: "Executive",
    age: "18 - 60 Years",
    price: 499,
    questions: 35,
    duration: "20 - 25 mins",
    icon: Briefcase,
    features: ["Advanced Health Screening", "Priority Doctor Review", "WhatsApp Report + Consultation"],
  },
  "executive-women": {
    name: "Executive Women",
    age: "All Women",
    price: 499,
    questions: 35,
    duration: "20 - 25 mins",
    icon: Venus,
    features: ["Women's Wellness Assessment", "Priority Doctor Review", "WhatsApp Report + Consultation"],
  },
  child: {
    name: "Child",
    age: "0 - 12 Years",
    price: 399,
    questions: 15,
    duration: "10 - 15 mins",
    icon: Baby,
    features: ["Child Behaviour Assessment", "Doctor Review", "WhatsApp Report"],
  },
  elderly: {
    name: "Elderly People",
    age: "Above 60 Years",
    price: 399,
    questions: 20,
    duration: "15 - 20 mins",
    icon: HeartPulse,
    features: ["Senior Wellness Assessment", "Doctor Review", "WhatsApp Report"],
  },
  adolescence: {
    name: "Adolescence",
    age: "13 - 18 Years",
    price: 300,
    questions: 15,
    duration: "10 - 15 mins",
    icon: Sparkles,
    features: ["Teen Mental Health Assessment", "Doctor Review", "WhatsApp Report"],
  },
};

// Eysenck Personality Inventory — full 57 questions from the uploaded PDF,
// grouped into three blocks of 20 / 20 / 17 instead of themed category titles.
const EPI_QUESTIONS = [
  "Do you often long for excitement?",
  "Do you often need understanding friends to cheer you up?",
  "Are you usually carefree?",
  "Do you find it very hard to take no for an answer?",
  "Do you stop and think things over before doing anything?",
  "If you say you will do something do you always keep your promise, no matter how inconvenient it might be to do so?",
  "Do your moods go up and down?",
  "Do you generally do and say things quickly without stopping to think?",
  "Do you ever feel 'just miserable' for no good reason?",
  "Would you do almost anything for a dare?",
  "Do you suddenly feel shy when you want to talk to an attractive stranger?",
  "Once in a while do you lose your temper and get angry?",
  "Do you often do things on the spur of the moment?",
  "Do you often worry about things you should have done or said?",
  "Generally do you prefer reading to meeting people?",
  "Are your feelings rather easily hurt?",
  "Do you like going out a lot?",
  "Do you occasionally have thoughts and ideas that you would not like other people to know about?",
  "Are you sometimes bubbling over with energy and sometimes very sluggish?",
  "Do you prefer to have few but special friends?",
  "Do you daydream a lot?",
  "When people shout at you do you shout back?",
  "Are you often troubled about feelings of guilt?",
  "Are all your habits good and desirable ones?",
  "Can you usually let yourself go and enjoy yourself a lot at a lively party?",
  "Would you call yourself tense or 'highly strung'?",
  "Do other people think of you as being very lively?",
  "After you have done something important, do you come away feeling you could have done better?",
  "Are you mostly quiet when you are with other people?",
  "Do you sometimes gossip?",
  "Do ideas run through your head so that you cannot sleep?",
  "If there is something you want to know about, would you rather look it up in a book than talk to someone about it?",
  "Do you get palpitations or thumping in your heart?",
  "Do you like the kind of work that you need to pay close attention to?",
  "Do you get attacks of shaking or trembling?",
  "Would you always declare everything at customs, even if you knew you could never be found out?",
  "Do you hate being with a crowd who play jokes on one another?",
  "Are you an irritable person?",
  "Do you like doing things in which you have to act quickly?",
  "Do you worry about awful things that might happen?",
  "Are you slow and unhurried in the way you move?",
  "Have you ever been late for an appointment or work?",
  "Do you have many nightmares?",
  "Do you like talking to people so much that you never miss a chance of talking to a stranger?",
  "Are you troubled by aches and pains?",
  "Would you be very unhappy if you could not see lots of people most of the time?",
  "Would you call yourself a nervous person?",
  "Of all the people you know, are there some whom you definitely do not like?",
  "Would you say that you were fairly self-confident?",
  "Are you easily hurt when people find fault with you or your work?",
  "Do you find it hard to really enjoy yourself at a lively party?",
  "Are you troubled by feelings of inferiority?",
  "Can you easily get some life into a dull party?",
  "Do you sometimes talk about things you know nothing about?",
  "Do you worry about your health?",
  "Do you like playing pranks on others?",
  "Do you suffer from sleeplessness?",
];

function chunk(arr, groupSizes) {
  const groups = [];
  let start = 0;
  for (const size of groupSizes) {
    groups.push(arr.slice(start, start + size));
    start += size;
  }
  return groups;
}

const [block1, block2, block3] = chunk(EPI_QUESTIONS, [20, 20, 17]);

const CATEGORIES = [
  { id: "block-1", range: "1 - 20", questions: block1 },
  { id: "block-2", range: "21 - 40", questions: block2 },
  { id: "block-3", range: "41 - 57", questions: block3 },
];

const OPTIONS = ["Yes", "No"];

export default function AssessmentPage({ packageId }) {
  
  const pkg = PACKAGES[packageId] || PACKAGES.executive;
  const PkgIcon = pkg.icon;

  const [answers, setAnswers] = useState({});
  const [activeCategory, setActiveCategory] = useState(0);
  const categoryRefs = useRef([]);
  const sidebarRefs = useRef([]);
  const scrollContainerRef = useRef(null);

  const totalQuestions = CATEGORIES.reduce((sum, c) => sum + c.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  const handleAnswer = (catIdx, qIdx, option) => {
    const key = `${catIdx}-${qIdx}`;
    setAnswers((prev) => ({ ...prev, [key]: option }));
  };

  const isCategoryComplete = (catIdx) =>
    CATEGORIES[catIdx].questions.every((_, qIdx) => answers[`${catIdx}-${qIdx}`]);

  const scrollToCategory = (idx) => {
    categoryRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    sidebarRefs.current[activeCategory]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeCategory]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the greatest visible ratio among those currently
        // intersecting, instead of reacting to the first one that crosses a
        // single fixed threshold — this makes the switch fire right as one
        // block's visibility overtakes the previous one's.
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;

        const mostVisible = visible.reduce((best, entry) =>
          entry.intersectionRatio > best.intersectionRatio ? entry : best
        );

        const idx = Number(mostVisible.target.dataset.index);
        setActiveCategory(idx);
      },
      {
        root: container,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      }
    );

    categoryRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Running question number across all blocks, so "Question 23" reads
  // correctly instead of resetting to 1 in each block.
  let runningIndex = 0;

  return (
    <div className="h-screen flex flex-col bg-[#F7F8F6]">
      <div className="border-b border-line bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex-1"></div>
        <Image src="/Athmalogo.webp" alt="Athma Mind Care Hospital" width={130} height={42} priority />
        <p className="text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide flex-1 text-right">
          Step 3 of 5 &middot; {pkg.name} package
        </p>
      </div>

      <div className="h-1 bg-[#E9ECE9] w-full">
        <div
          className="h-1 bg-coral-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — selected package, full height */}
        <div className="w-[400px] shrink-0 border-r border-line bg-white overflow-y-auto p-6">
          <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-4">
            Your package
          </p>

          <div className="relative rounded-2xl border border-orange-500 bg-white p-5">
            <span className="absolute -top-3 left-4 bg-orange-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
              Selected
            </span>

            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 mb-3">
              <PkgIcon size={22} strokeWidth={2} />
            </div>

            <h2 className="text-lg font-bold text-teal-900">{pkg.name}</h2>

            <div className="mt-2 inline-flex items-center gap-1.5 w-fit bg-teal-50 text-teal-800 text-[12px] font-semibold px-3 py-1.5 rounded-full">
              <User size={12} strokeWidth={2.5} />
              {pkg.age}
            </div>

            <div className="mt-4 flex items-end gap-2 bg-gray-50 rounded-xl px-3.5 py-3">
              <span className="text-[12px] text-gray-400 font-medium mb-1">₹</span>
              <span className="text-[28px] leading-none font-extrabold text-gray-900 -ml-1">
                {pkg.price}
              </span>
              <span className="text-gray-500 text-[11.5px] mb-1">/ Assessment</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px]">
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-2">
                <FileQuestion size={14} className="text-teal-600" />
                <span className="font-semibold text-gray-700">{pkg.questions} Qs</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-2">
                <Clock size={14} className="text-teal-600" />
                <span className="font-semibold text-gray-700">{pkg.duration}</span>
              </div>
            </div>

            <hr className="my-4" />

            <ul className="space-y-2.5">
              {pkg.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[12.5px] text-gray-600">
                  <span className="text-green-600 font-bold mt-[1px]">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-[12px] text-ink-soft mb-1.5">
              <span>Overall progress</span>
              <span className="font-semibold text-teal-700">{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#EFF1EE] overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="mt-21 flex flex-col items-center text-center">
            <Image
              src="/unnamed.gif"
              alt="Athma mascot — Let's talk"
              width={200}
              height={280}
              unoptimized
              className="object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
            />
            <p className="mt-2 text-[12.5px] font-semibold text-teal-800">
              Take your time, we&apos;re here with you
            </p>
          </div>
        </div>

        {/* Center — scrollable questions */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-[640px] mx-auto">
            {CATEGORIES.map((cat, catIdx) => (
              <div
                key={cat.id}
                ref={(el) => (categoryRefs.current[catIdx] = el)}
                data-index={catIdx}
                className="mb-14 scroll-mt-6"
              >
                <p className="text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide mb-1.5">
                  Questions {cat.range}
                </p>
                <h2 className="font-brand text-xl font-semibold text-teal-900 mb-6">
                  Eysenck Personality Inventory
                </h2>

                <div className="space-y-4">
                  {cat.questions.map((question, qIdxInBlock) => {
                    const key = `${catIdx}-${qIdxInBlock}`;
                    const selected = answers[key];
                    runningIndex += 1;
                    return (
                      <div key={key} className="bg-white border border-line rounded-card p-5">
                        <p className="text-[14.5px] font-medium text-ink mb-3.5">
                          {runningIndex}. {question}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {OPTIONS.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleAnswer(catIdx, qIdxInBlock, option)}
                              className={`px-5 py-2 rounded-full text-[13px] font-medium border transition-colors ${
                                selected === option
                                  ? "bg-coral-600 border-coral-600 text-white"
                                  : "bg-[#FCFDFC] border-line text-ink hover:border-coral-300"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pb-10">
              <button
                type="button"
                disabled={answeredCount < totalQuestions}
                className="w-full py-3.5 rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {answeredCount < totalQuestions
                  ? `Answer all questions (${answeredCount}/${totalQuestions})`
                  : "Submit assessment"}
              </button>
            </div>
          </div>
        </div>

        {/* Right — question-range sidebar, full height (heading removed per request) */}
        <div className="w-[400px] shrink-0 border-l border-line bg-white overflow-y-auto py-6 px-3">
          {CATEGORIES.map((cat, idx) => {
            const complete = isCategoryComplete(idx);
            const active = activeCategory === idx;
            return (
              <button
                key={cat.id}
                ref={(el) => (sidebarRefs.current[idx] = el)}
                onClick={() => scrollToCategory(idx)}
                className={`w-full text-left px-3 py-3 rounded-[10px] mb-1.5 transition-colors flex items-center gap-3 ${
                  active ? "bg-teal-50 border border-teal-200" : "hover:bg-[#F7F8F6] border border-transparent"
                }`}
              >
                <div
                  className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[12px] font-semibold ${
                    complete
                      ? "bg-teal-500 text-white"
                      : active
                      ? "bg-teal-100 text-teal-700"
                      : "bg-[#EFF1EE] text-ink-soft"
                  }`}
                >
                  {complete ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-[13.5px] font-medium truncate ${active ? "text-teal-900" : "text-ink"}`}>
                    Questions {cat.range}
                  </p>
                  <p className="text-[11.5px] text-ink-soft">{cat.questions.length} questions</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}