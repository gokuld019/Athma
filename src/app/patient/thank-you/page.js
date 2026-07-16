"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

function ThankYouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packageId, setPackageId] = useState(null);
  const [packageName, setPackageName] = useState("Package");

  useEffect(() => {
    const fromUrl = searchParams.get("package");
    if (fromUrl) {
      setPackageId(fromUrl);
      return;
    }
    const stored = localStorage.getItem("athma_selected_package_id");
    if (stored) setPackageId(stored);
  }, [searchParams]);

  const handleBackToQuestions = () => {
    if (packageId) {
      router.push(`/patient/category?package=${packageId}`);
    } else {
      // No package id available anywhere — send them to pick one instead
      // of landing on the "No Package Selected" dead end.
      router.push("/patient/packages");
    }
  };

  return (
    <div className="max-w-[620px] mx-auto px-4 md:px-5 py-10 md:py-16 text-center">
      <div className="flex justify-center mb-8 md:mb-10">
        <Image
          src="/Athmalogo.webp"
          alt="Athma Mind Care Hospital"
          width={220}
          height={70}
          className="object-contain"
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 md:px-10 py-8 md:py-10">
        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#0F6E56"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-teal-900 mb-3">
          Thank you, your details are with the doctor
        </h1>

        <p className="text-sm md:text-[15px] text-gray-500 leading-relaxed mb-6 md:mb-8">
          Your answers have been submitted and a doctor is reviewing your
          case. You&apos;ll receive the recommendation on WhatsApp or SMS,
          usually within a few hours.
        </p>

        <div className="text-left bg-gray-50 rounded-xl px-4 md:px-5 py-4 mb-6 md:mb-8 text-[13px] md:text-sm">
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">Package</span>
            <span className="font-semibold text-gray-800">{packageName}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">Expected response</span>
            <span className="font-semibold text-gray-800">Within 6 hours</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">Delivery</span>
            <span className="font-semibold text-gray-800">WhatsApp / SMS</span>
          </div>
        </div>

        <button
          onClick={handleBackToQuestions}
          className="w-full py-3 md:py-3.5 rounded-xl font-semibold text-sm md:text-[15px] bg-orange-500 hover:bg-orange-600 text-white transition"
        >
          Back to Questions
        </button>
      </div>

      <p className="text-xs md:text-[13px] text-gray-500 mt-5 md:mt-6">
        Need urgent help? Call the hospital directly instead of waiting for a reply.
      </p>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  );
}