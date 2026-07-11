"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Briefcase, Venus, Baby, HeartPulse, Sparkles, Clock, FileQuestion } from "lucide-react";
import PulseProgress from "@/components/ui/PulseProgress";

const packages = [
  {
    id: "standard-adult",
    name: "Standard Adult",
    age: "18 - 60 Years",
    price: 399,
    questions: 20,
    duration: "15 - 20 mins",
    icon: User,
    features: [
      "General Mental Health Screening",
      "Doctor Review within 24 Hours",
      "WhatsApp Report",
    ],
    featured: false,
  },
  {
    id: "executive",
    name: "Executive",
    age: "18 - 60 Years",
    price: 499,
    questions: 35,
    duration: "20 - 25 mins",
    icon: Briefcase,
    features: [
      "Advanced Health Screening",
      "Priority Doctor Review",
      "WhatsApp Report + Consultation",
    ],
    featured: true,
  },
  {
    id: "executive-women",
    name: "Executive Women",
    age: "All Women",
    price: 499,
    questions: 35,
    duration: "20 - 25 mins",
    icon: Venus,
    features: [
      "Women's Wellness Assessment",
      "Priority Doctor Review",
      "WhatsApp Report + Consultation",
    ],
    featured: false,
  },
  {
    id: "child",
    name: "Child",
    age: "0 - 12 Years",
    price: 399,
    questions: 15,
    duration: "10 - 15 mins",
    icon: Baby,
    features: [
      "Child Behaviour Assessment",
      "Doctor Review",
      "WhatsApp Report",
    ],
    featured: false,
  },
  {
    id: "elderly",
    name: "Elderly People",
    age: "Above 60 Years",
    price: 399,
    questions: 20,
    duration: "15 - 20 mins",
    icon: HeartPulse,
    features: [
      "Senior Wellness Assessment",
      "Doctor Review",
      "WhatsApp Report",
    ],
    featured: false,
  },
  {
    id: "adolescence",
    name: "Adolescence",
    age: "13 - 18 Years",
    price: 300,
    questions: 15,
    duration: "10 - 15 mins",
    icon: Sparkles,
    features: [
      "Teen Mental Health Assessment",
      "Doctor Review",
      "WhatsApp Report",
    ],
    featured: false,
  },
];

export default function PackagesPage({ patientId }) {
      const router = useRouter();
 

  const choosePackage = (pkg) => {
    router.push(
      `/patient/payment?patientId=${patientId}&package=${pkg.id}&amount=${pkg.price}`
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F9F8]">
      {/* ===== Decorative background — calm, abstract, wellness-associated ===== */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        {/* soft blurred gradient blobs for depth */}
        <div className="absolute top-10 -left-24 w-[420px] h-[420px] rounded-full bg-orange-100/60 blur-[90px]" />
        <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-orange-100/50 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[360px] h-[360px] rounded-full bg-teal-50/70 blur-[80px]" />

        {/* spiral echo, bottom right — unchanged */}
        <svg
          className="absolute -bottom-20 -right-20 w-[420px] h-[420px] opacity-[0.06]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M100 100 C100 70 130 60 150 80 C175 105 160 145 125 150 C80 156 45 120 55 80 C67 32 120 15 160 40"
            stroke="#E85720"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-5 py-6 md:py-10">
        <PulseProgress current={1} />

        <div className="mb-6 md:mb-8">
          <p className="text-[10px] md:text-[12px] font-semibold uppercase tracking-widest text-teal-500">
            Step 2 of 5
          </p>

          <h1 className="text-xl md:text-3xl font-bold text-teal-900 mt-1 md:mt-2">
            Choose Your Care Package
          </h1>

          <p className="text-xs md:text-base text-gray-500 mt-1 md:mt-2">
            Select the package that best suits the patient's age and assessment
            needs.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-7">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-xl md:rounded-2xl border bg-white p-3 md:p-6 flex flex-col shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  pkg.featured
                    ? "border-orange-500"
                    : "border-gray-200 hover:border-teal-500"
                }`}
              >
                {pkg.featured && (
                  <span className="absolute -top-2.5 md:-top-3 left-2 md:left-5 bg-orange-500 text-white text-[9px] md:text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                {/* Icon badge — top right corner */}
                <div
                  className={`absolute top-3 md:top-6 right-3 md:right-6 w-7 h-7 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center ${
                    pkg.featured
                      ? "bg-orange-50 text-orange-600"
                      : "bg-teal-50 text-teal-700"
                  }`}
                >
                  <Icon size={14} strokeWidth={2} className="md:w-[22px] md:h-[22px]" />
                </div>

                <h2 className="text-sm md:text-2xl font-bold text-teal-900 pr-10 md:pr-14">
                  {pkg.name}
                </h2>

                {/* Age group — highlighted pill instead of plain text */}
                <div className="mt-1.5 md:mt-2.5 inline-flex items-center gap-1 md:gap-1.5 w-fit bg-teal-50 text-teal-800 text-[10px] md:text-[12.5px] font-semibold px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                  <User size={10} strokeWidth={2.5} className="md:w-[13px] md:h-[13px]" />
                  {pkg.age}
                </div>

                {/* Price — bigger, boxed, and given room to breathe */}
                <div className="mt-2 md:mt-5 flex items-end gap-1 md:gap-2 bg-gray-50 rounded-lg md:rounded-xl px-2 md:px-4 py-2 md:py-3.5">
                  <span className="text-[10px] md:text-[13px] text-gray-400 font-medium mb-0.5 md:mb-1">₹</span>
                  <span className="text-xl md:text-[38px] leading-none font-extrabold text-gray-900">
                    {pkg.price}
                  </span>
                  <span className="text-gray-500 text-[9px] md:text-[12.5px] mb-0.5 md:mb-1">/ Assessment</span>
                </div>

                <div className="mt-2 md:mt-5 grid grid-cols-2 gap-1.5 md:gap-3 text-[10px] md:text-[12.5px]">
                  <div className="flex items-center gap-1 md:gap-2 bg-gray-50 rounded-md md:rounded-lg px-2 md:px-3 py-1 md:py-2">
                    <FileQuestion size={12} className="text-teal-600 md:w-[15px] md:h-[15px]" />
                    <span className="font-semibold text-gray-700">{pkg.questions} Qs</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 bg-gray-50 rounded-md md:rounded-lg px-2 md:px-3 py-1 md:py-2">
                    <Clock size={12} className="text-teal-600 md:w-[15px] md:h-[15px]" />
                    <span className="font-semibold text-gray-700">{pkg.duration}</span>
                  </div>
                </div>

                <hr className="my-2 md:my-5" />

                <ul className="space-y-1.5 md:space-y-3 flex-1">
                  {pkg.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-1.5 md:gap-3 text-[10px] md:text-sm text-gray-600"
                    >
                      <span className="text-green-600 font-bold mt-[1px] text-[10px] md:text-sm">
                        ✓
                      </span>

                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => choosePackage(pkg)}
                  className={`mt-3 md:mt-8 w-full py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-[11px] md:text-base transition ${
                    pkg.featured
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "border border-gray-300 hover:border-teal-600 hover:bg-teal-600 hover:text-white"
                  }`}
                >
                  Choose Package
                </button>
              </div>
            );
          })}
        </div>
      </div>

     {/* ===== Mascot — floating chat trigger, hidden on mobile ===== */}
<button className="hidden md:fixed md:bottom-7 md:left-10 z-30 md:flex items-center gap-3 group">
  <span className="relative flex">
    <span className="absolute inset-0 rounded-full bg-orange-400/30 animate-ping" />
    <span className="relative w-[250px] h-[250px] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
      <Image
        src="/unnamed.gif"
        alt="Athma mascot — Let's talk"
        width={600}
        height={600}
        unoptimized
        className="object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.15)]"
      />
    </span>
  </span>
  <span className="hidden md:flex items-center bg-white/90 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 rounded-full px-4 py-2 text-[12.5px] font-semibold text-teal-800 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
    Let&apos;s talk 👋
  </span>
</button>
    </div>
  );
}