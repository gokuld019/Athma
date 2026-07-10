"use client";

import Image from "next/image";
import Link from "next/link";

// DUMMY VERSION — static content, no API calls yet.
// Later this can pull the patient's name and package from
// query params or a session/context set earlier in the flow.

export default function ThankYouPage() {
  return (
    <div className="max-w-[480px] mx-auto px-5 py-16 text-center">
      <div className="flex justify-center mb-8">
        <Image
          src="/Athmalogo.webp"
          alt="Athma Mind Care Hospital"
          width={160}
          height={52}
          priority
        />
      </div>

      <div className="bg-card border border-line rounded-card p-9">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal-100 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#2B3E63"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="font-brand text-[22px] font-semibold text-teal-900 mb-2.5">
          Thank you, your details are with the doctor
        </h1>
        <p className="text-ink-soft text-[14px] leading-relaxed mb-8">
          Your answers have been submitted and a doctor is reviewing your case.
          You&apos;ll receive the recommendation on WhatsApp or SMS, usually
          within a few hours.
        </p>

        <div className="text-left bg-[#FCFDFC] border border-line rounded-[10px] px-4 py-4 mb-8 text-[13px]">
          <div className="flex justify-between py-1.5 text-ink-soft">
            <span>Package</span>
            <span className="text-ink font-medium">Premium package</span>
          </div>
          <div className="flex justify-between py-1.5 text-ink-soft">
            <span>Expected response</span>
            <span className="text-ink font-medium">Within 6 hours</span>
          </div>
          <div className="flex justify-between py-1.5 text-ink-soft">
            <span>Delivery</span>
            <span className="text-ink font-medium">WhatsApp / SMS</span>
          </div>
        </div>

       <Link
  href="/patient/category"
  className="inline-block w-full py-3.5 rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14.5px] transition-colors text-center"
>
  Back to Questions
</Link>
      </div>

      <p className="text-center text-xs text-ink-soft mt-6">
        Need urgent help? Call the hospital directly instead of waiting for a
        reply.
      </p>
    </div>
  );
}