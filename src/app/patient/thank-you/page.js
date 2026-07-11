"use client";

import Image from "next/image";
import Link from "next/link";

// DUMMY VERSION — static content, no API calls yet.
// Later this can pull the patient's name and package from
// query params or a session/context set earlier in the flow.

export default function ThankYouPage() {
  return (
    <div className="max-w-[480px] mx-auto px-4 md:px-5 py-10 md:py-16 text-center">
      <div className="flex justify-center mb-5 md:mb-8">
        <Image
          src="/Athmalogo.webp"
          alt="Athma Mind Care Hospital"
          width={120}
          height={39}
          className="md:w-[160px] md:h-[52px]"
          priority
        />
      </div>

      <div className="bg-card border border-line rounded-xl md:rounded-card p-6 md:p-9">
        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full bg-teal-100 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="md:w-[28px] md:h-[28px]">
            <path
              d="M5 13l4 4L19 7"
              stroke="#2B3E63"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="font-brand text-lg md:text-[22px] font-semibold text-teal-900 mb-2 md:mb-2.5">
          Thank you, your details are with the doctor
        </h1>
        <p className="text-ink-soft text-xs md:text-[14px] leading-relaxed mb-6 md:mb-8">
          Your answers have been submitted and a doctor is reviewing your case.
          You&apos;ll receive the recommendation on WhatsApp or SMS, usually
          within a few hours.
        </p>

        <div className="text-left bg-[#FCFDFC] border border-line rounded-lg md:rounded-[10px] px-3 md:px-4 py-3 md:py-4 mb-6 md:mb-8 text-[11px] md:text-[13px]">
          <div className="flex justify-between py-1 md:py-1.5 text-ink-soft">
            <span>Package</span>
            <span className="text-ink font-medium">Premium package</span>
          </div>
          <div className="flex justify-between py-1 md:py-1.5 text-ink-soft">
            <span>Expected response</span>
            <span className="text-ink font-medium">Within 6 hours</span>
          </div>
          <div className="flex justify-between py-1 md:py-1.5 text-ink-soft">
            <span>Delivery</span>
            <span className="text-ink font-medium">WhatsApp / SMS</span>
          </div>
        </div>

       <Link
  href="/patient/category"
  className="inline-block w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors text-center"
>
  Back to Questions
</Link>
      </div>

      <p className="text-center text-[10px] md:text-xs text-ink-soft mt-4 md:mt-6">
        Need urgent help? Call the hospital directly instead of waiting for a
        reply.
      </p>
    </div>
  );
}