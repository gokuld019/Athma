"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { User, Briefcase, Venus, Baby, HeartPulse, Sparkles, Clock, FileQuestion } from "lucide-react";

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

// Bilingual EPI Questions - English and Tamil
const EPI_QUESTIONS = [
  { en: "Do you often long for excitement?", ta: "நீங்கள் அடிக்கடி உற்சாகத்தை விரும்புகிறீர்களா?" },
  { en: "Do you often need understanding friends to cheer you up?", ta: "உங்களை உற்சாகப்படுத்த புரிந்துகொள்ளும் நண்பர்கள் உங்களுக்கு அடிக்கடி தேவையா?" },
  { en: "Are you usually carefree?", ta: "நீங்கள் வழக்கமாக கவலையற்றவரா?" },
  { en: "Do you find it very hard to take no for an answer?", ta: "மறுப்பை ஏற்க உங்களுக்கு மிகவும் கடினமாக உள்ளதா?" },
  { en: "Do you stop and think things over before doing anything?", ta: "எதையும் செய்வதற்கு முன் நிறுத்தி யோசிக்கிறீர்களா?" },
  { en: "If you say you will do something do you always keep your promise, no matter how inconvenient it might be to do so?", ta: "ஏதாவது செய்வதாக சொன்னால், எவ்வளவு சிரமமாக இருந்தாலும் உங்கள் வாக்குறுதியை காப்பாற்றுகிறீர்களா?" },
  { en: "Do your moods go up and down?", ta: "உங்கள் மனநிலை ஏற்ற இறக்கமாக உள்ளதா?" },
  { en: "Do you generally do and say things quickly without stopping to think?", ta: "பொதுவாக யோசிக்காமல் விரைவாக செயல்பட்டு பேசுகிறீர்களா?" },
  { en: "Do you ever feel 'just miserable' for no good reason?", ta: "எந்த காரணமுமின்றி 'மிகவும் துயரமாக' உணர்கிறீர்களா?" },
  { en: "Would you do almost anything for a dare?", ta: "சவாலுக்காக எதையும் செய்வீர்களா?" },
  { en: "Do you suddenly feel shy when you want to talk to an attractive stranger?", ta: "அழகான அந்நியரிடம் பேச விரும்பும்போது திடீரென வெட்கப்படுகிறீர்களா?" },
  { en: "Once in a while do you lose your temper and get angry?", ta: "எப்போதாவது கோபத்தை இழந்து கோபப்படுகிறீர்களா?" },
  { en: "Do you often do things on the spur of the moment?", ta: "திடீர் தூண்டுதலில் அடிக்கடி செயல்படுகிறீர்களா?" },
  { en: "Do you often worry about things you should have done or said?", ta: "நீங்கள் செய்திருக்க வேண்டிய அல்லது சொல்லியிருக்க வேண்டிய விஷயங்களைப் பற்றி அடிக்கடி கவலைப்படுகிறீர்களா?" },
  { en: "Generally do you prefer reading to meeting people?", ta: "பொதுவாக மக்களை சந்திப்பதை விட படிப்பதை விரும்புகிறீர்களா?" },
  { en: "Are your feelings rather easily hurt?", ta: "உங்கள் உணர்வுகள் எளிதில் பாதிக்கப்படுகிறதா?" },
  { en: "Do you like going out a lot?", ta: "அதிகமாக வெளியே செல்வதை விரும்புகிறீர்களா?" },
  { en: "Do you occasionally have thoughts and ideas that you would not like other people to know about?", ta: "மற்றவர்கள் அறிய விரும்பாத எண்ணங்களும் யோசனைகளும் எப்போதாவது உங்களுக்கு உண்டா?" },
  { en: "Are you sometimes bubbling over with energy and sometimes very sluggish?", ta: "சில நேரங்களில் ஆற்றலுடனும் சில நேரங்களில் மந்தமாகவும் இருக்கிறீர்களா?" },
  { en: "Do you prefer to have few but special friends?", ta: "குறைவான ஆனால் சிறப்பான நண்பர்களை விரும்புகிறீர்களா?" },
  { en: "Do you daydream a lot?", ta: "நிறைய பகல் கனவு காண்கிறீர்களா?" },
  { en: "When people shout at you do you shout back?", ta: "மக்கள் உங்களைப் பார்த்து கத்தும்போது நீங்களும் திருப்பி கத்துகிறீர்களா?" },
  { en: "Are you often troubled about feelings of guilt?", ta: "குற்ற உணர்வுகளால் அடிக்கடி துன்பப்படுகிறீர்களா?" },
  { en: "Are all your habits good and desirable ones?", ta: "உங்கள் பழக்கங்கள் அனைத்தும் நல்ல மற்றும் விரும்பத்தக்கவையா?" },
  { en: "Can you usually let yourself go and enjoy yourself a lot at a lively party?", ta: "உற்சாகமான விருந்தில் உங்களை தளர்த்தி மகிழ முடிகிறதா?" },
  { en: "Would you call yourself tense or 'highly strung'?", ta: "உங்களை பதட்டமானவர் அல்லது 'மிகவும் இறுக்கமானவர்' என்று அழைப்பீர்களா?" },
  { en: "Do other people think of you as being very lively?", ta: "மற்றவர்கள் உங்களை மிகவும் உற்சாகமானவராக நினைக்கிறார்களா?" },
  { en: "After you have done something important, do you come away feeling you could have done better?", ta: "முக்கியமான ஒன்றை செய்த பிறகு, இன்னும் சிறப்பாக செய்திருக்கலாம் என்று உணர்கிறீர்களா?" },
  { en: "Are you mostly quiet when you are with other people?", ta: "மற்றவர்களுடன் இருக்கும்போது பெரும்பாலும் அமைதியாக இருக்கிறீர்களா?" },
  { en: "Do you sometimes gossip?", ta: "எப்போதாவது வதந்தி பேசுகிறீர்களா?" },
  { en: "Do ideas run through your head so that you cannot sleep?", ta: "எண்ணங்கள் உங்கள் தலையில் ஓடுவதால் தூங்க முடியவில்லையா?" },
  { en: "If there is something you want to know about, would you rather look it up in a book than talk to someone about it?", ta: "ஏதாவது தெரிந்துகொள்ள விரும்பினால், அதைப் பற்றி யாரிடமாவது பேசுவதை விட புத்தகத்தில் பார்ப்பீர்களா?" },
  { en: "Do you get palpitations or thumping in your heart?", ta: "உங்கள் இதயத்தில் படபடப்பு அல்லது துடிப்பு ஏற்படுகிறதா?" },
  { en: "Do you like the kind of work that you need to pay close attention to?", ta: "கவனமாக கவனிக்க வேண்டிய வேலையை விரும்புகிறீர்களா?" },
  { en: "Do you get attacks of shaking or trembling?", ta: "நடுக்கம் அல்லது நடுங்கல் தாக்குதல்கள் ஏற்படுகிறதா?" },
  { en: "Would you always declare everything at customs, even if you knew you could never be found out?", ta: "கண்டுபிடிக்க முடியாது என்று தெரிந்தாலும், சுங்கத்தில் எல்லாவற்றையும் அறிவிப்பீர்களா?" },
  { en: "Do you hate being with a crowd who play jokes on one another?", ta: "ஒருவருக்கொருவர் கேலி செய்யும் கூட்டத்துடன் இருப்பதை வெறுக்கிறீர்களா?" },
  { en: "Are you an irritable person?", ta: "நீங்கள் எரிச்சலான நபரா?" },
  { en: "Do you like doing things in which you have to act quickly?", ta: "விரைவாக செயல்பட வேண்டிய விஷயங்களை செய்ய விரும்புகிறீர்களா?" },
  { en: "Do you worry about awful things that might happen?", ta: "நடக்கக்கூடிய மோசமான விஷயங்களைப் பற்றி கவலைப்படுகிறீர்களா?" },
  { en: "Are you slow and unhurried in the way you move?", ta: "உங்கள் அசைவுகளில் மெதுவாகவும் அவசரமில்லாமலும் இருக்கிறீர்களா?" },
  { en: "Have you ever been late for an appointment or work?", ta: "எப்போதாவது சந்திப்பு அல்லது வேலைக்கு தாமதமாக சென்றதுண்டா?" },
  { en: "Do you have many nightmares?", ta: "உங்களுக்கு நிறைய கெட்ட கனவுகள் வருகிறதா?" },
  { en: "Do you like talking to people so much that you never miss a chance of talking to a stranger?", ta: "மக்களிடம் பேசுவதை மிகவும் விரும்பி, அந்நியரிடம் பேசும் வாய்ப்பை ஒருபோதும் தவறவிடமாட்டீர்களா?" },
  { en: "Are you troubled by aches and pains?", ta: "வலிகள் மற்றும் வேதனைகளால் துன்பப்படுகிறீர்களா?" },
  { en: "Would you be very unhappy if you could not see lots of people most of the time?", ta: "பெரும்பாலான நேரம் பலரைப் பார்க்க முடியாவிட்டால் மிகவும் மகிழ்ச்சியற்றவராக இருப்பீர்களா?" },
  { en: "Would you call yourself a nervous person?", ta: "உங்களை ஒரு பதட்டமான நபர் என்று அழைப்பீர்களா?" },
  { en: "Of all the people you know, are there some whom you definitely do not like?", ta: "உங்களுக்குத் தெரிந்தவர்களில், நிச்சயமாக பிடிக்காத சிலர் இருக்கிறார்களா?" },
  { en: "Would you say that you were fairly self-confident?", ta: "நீங்கள் ஓரளவு தன்னம்பிக்கை உள்ளவர் என்று சொல்வீர்களா?" },
  { en: "Are you easily hurt when people find fault with you or your work?", ta: "மக்கள் உங்களிடம் அல்லது உங்கள் வேலையில் குறை காணும்போது எளிதில் புண்படுகிறீர்களா?" },
  { en: "Do you find it hard to really enjoy yourself at a lively party?", ta: "உற்சாகமான விருந்தில் உண்மையாக மகிழ்வது கடினமாக உள்ளதா?" },
  { en: "Are you troubled by feelings of inferiority?", ta: "தாழ்வு மனப்பான்மை உணர்வுகளால் துன்பப்படுகிறீர்களா?" },
  { en: "Can you easily get some life into a dull party?", ta: "சலிப்பான விருந்தில் எளிதாக உற்சாகத்தை கொண்டு வர முடிகிறதா?" },
  { en: "Do you sometimes talk about things you know nothing about?", ta: "உங்களுக்கு எதுவும் தெரியாத விஷயங்களைப் பற்றி எப்போதாவது பேசுகிறீர்களா?" },
  { en: "Do you worry about your health?", ta: "உங்கள் உடல்நலம் பற்றி கவலைப்படுகிறீர்களா?" },
  { en: "Do you like playing pranks on others?", ta: "மற்றவர்களிடம் குறும்பு செய்வதை விரும்புகிறீர்களா?" },
  { en: "Do you suffer from sleeplessness?", ta: "தூக்கமின்மையால் பாதிக்கப்படுகிறீர்களா?" },
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

const OPTIONS = [
  { en: "Yes", ta: "ஆம்" },
  { en: "No", ta: "இல்லை" },
];

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

  let runningIndex = 0;

  return (
    <div className="h-screen flex flex-col bg-[#F7F8F6]">
      <div className="border-b border-line bg-white px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between">
        <div className="flex-1"></div>
        <Image 
          src="/Athmalogo.webp" 
          alt="Athma Mind Care Hospital" 
          width={238} 
          height={61} 
          className="w-[100px] h-auto md:w-[238px] md:h-auto object-contain" 
          priority 
        />
        <p className="text-[10px] md:text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide flex-1 text-right">
          Step 3 of 5 &middot; {pkg.name}
        </p>
      </div>

      <div className="h-1 bg-[#E9ECE9] w-full">
        <div
          className="h-1 bg-coral-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — selected package, hidden on mobile */}
        <div className="hidden md:block w-[400px] shrink-0 border-r border-line bg-white overflow-y-auto p-6">
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
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
          <div className="max-w-[640px] mx-auto">
            {CATEGORIES.map((cat, catIdx) => (
              <div
                key={cat.id}
                ref={(el) => (categoryRefs.current[catIdx] = el)}
                data-index={catIdx}
                className="mb-10 md:mb-14 scroll-mt-4 md:scroll-mt-6"
              >
                <p className="text-[10px] md:text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide mb-1 md:mb-1.5">
                  Questions {cat.range}
                </p>
                <h2 className="font-brand text-lg md:text-xl font-semibold text-teal-900 mb-4 md:mb-6">
                  Eysenck Personality Inventory
                </h2>

                <div className="space-y-5 md:space-y-6">
                  {cat.questions.map((question, qIdxInBlock) => {
                    const key = `${catIdx}-${qIdxInBlock}`;
                    const selected = answers[key];
                    runningIndex += 1;
                    return (
                      <div
                        key={key}
                        className="relative bg-white border border-line rounded-xl md:rounded-card pt-7 md:pt-8 pb-4 md:pb-5 px-4 md:px-5"
                      >
                        {/* Floating rounded question-number badge, top-center */}
                        <div
                          className={`absolute -top-4 md:-top-4.5 left-1/2 -translate-x-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[12px] md:text-[13px] font-bold text-white shadow-[0_4px_10px_rgba(240,120,40,0.35)] ring-4 ring-[#F7F8F6] transition-transform ${
                            selected
                              ? "bg-[#32447b]"
                              : "bg-gradient-to-br from-orange-400 to-orange-600"
                          }`}
                        >
                          {runningIndex}
                        </div>

                        <p className="text-[12px] md:text-[14.5px] font-medium text-ink mb-1 md:mb-1.5 text-center">
                          {question.en}
                        </p>
                        <p className="text-[11px] md:text-[13px] text-ink-soft mb-3 md:mb-4 font-bold text-center">
                          {question.ta}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {OPTIONS.map((option) => (
                            <button
                              key={option.en}
                              onClick={() => handleAnswer(catIdx, qIdxInBlock, option.en)}
                              className={`px-4 md:px-5 py-1.5 md:py-2 rounded-full text-[11px] md:text-[13px] font-medium border transition-colors ${
                                selected === option.en
                                  ? "bg-coral-600 border-coral-600 text-white"
                                  : "bg-[#FCFDFC] border-line text-ink hover:border-coral-300"
                              }`}
                            >
                              {option.en} / {option.ta}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pb-8 md:pb-10">
              <button
                type="button"
                disabled={answeredCount < totalQuestions}
                className="w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {answeredCount < totalQuestions
                  ? `Answer all questions (${answeredCount}/${totalQuestions})`
                  : "Submit assessment"}
              </button>
            </div>
          </div>
        </div>

        {/* Right — question-range sidebar, hidden on mobile */}
        <div className="hidden md:block w-[400px] shrink-0 border-l border-line bg-white overflow-y-auto py-6 px-3">
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