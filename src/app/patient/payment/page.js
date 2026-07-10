"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PulseProgress from "@/components/ui/PulseProgress";

// DUMMY VERSION — no real Razorpay SDK yet.
// Simulates: click Pay -> "Redirecting to Razorpay" modal -> "Payment
// successful" modal -> redirect to the questionnaire page.

export default function PaymentPage() {
  const router = useRouter();
  // stage: "idle" | "redirecting" | "success"
  const [stage, setStage] = useState("idle");

  const packageName = "Premium package";
  const amount = 999;

  const handleDummyPay = () => {
    setStage("redirecting");

    setTimeout(() => {
      setStage("success");

      setTimeout(() => {
        router.push("/patient/thank-you");
      }, 1400);
    }, 1600);
  };

  return (
    <div className="max-w-[520px] mx-auto px-5 py-10 relative">
      <PulseProgress current={2} />

      <div className="bg-card border border-line rounded-card p-7 text-center">
        <p className="text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide mb-1.5">
          Step 3 of 4
        </p>
        <h1 className="font-brand text-2xl font-semibold text-teal-900 mb-1">
          Confirm your payment
        </h1>
        <p className="text-ink-soft text-[14.5px] mb-7">
          You&apos;re paying for the {packageName}.
        </p>

        <div className="text-left bg-[#FCFDFC] border border-line rounded-[10px] px-4 py-4 mb-7 text-[13px]">
          <div className="flex justify-between py-1.5 text-ink-soft">
            <span>Package</span>
            <span className="text-ink font-medium">{packageName}</span>
          </div>
          <div className="flex justify-between py-1.5 text-ink-soft">
            <span>Amount</span>
            <span className="text-ink font-medium">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleDummyPay}
          disabled={stage !== "idle"}
          className="w-full py-3.5 rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14.5px] transition-colors disabled:opacity-60"
        >
          Pay ₹{amount.toFixed(2)} with Razorpay
        </button>
      </div>

      {/* ===== Modal overlay ===== */}
      {stage !== "idle" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
          <div className="bg-white rounded-2xl px-8 py-9 w-full max-w-[320px] text-center">
            {stage === "redirecting" && (
              <>
                <div className="w-11 h-11 mx-auto mb-5 rounded-full border-[3px] border-teal-100 border-t-teal-900 animate-spin" />
                <p className="font-brand text-[16px] font-semibold text-teal-900 mb-1.5">
                  Redirecting to Razorpay
                </p>
                <p className="text-ink-soft text-[13px]">
                  Please wait a moment...
                </p>
              </>
            )}

            {stage === "success" && (
              <>
                <div className="w-11 h-11 mx-auto mb-5 rounded-full bg-teal-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#2B3E63"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="font-brand text-[16px] font-semibold text-teal-900 mb-1.5">
                  Payment successful
                </p>
                <p className="text-ink-soft text-[13px]">
                  Taking you to your questionnaire...
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}