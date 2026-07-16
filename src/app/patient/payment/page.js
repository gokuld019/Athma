"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PulseProgress from "@/components/ui/PulseProgress";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const packageIdParam = searchParams.get("package");
  const patientIdParam = searchParams.get("patientId");
  const packageName = searchParams.get("name") || "Package";
  const amountParam = searchParams.get("amount") || "0";

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("idle");
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [packageId, setPackageId] = useState(null);
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    if (packageIdParam) {
      const parsed = parseInt(packageIdParam, 10);
      if (!isNaN(parsed)) {
        setPackageId(parsed);
        localStorage.setItem("athma_selected_package_id", String(parsed));
      } else {
        console.error("package param is not a valid number:", packageIdParam);
      }
    } else {
      const stored = localStorage.getItem("athma_selected_package_id");
      if (stored) {
        const parsedStored = parseInt(stored, 10);
        if (!isNaN(parsedStored)) setPackageId(parsedStored);
      } else {
        console.error("No package id in URL or localStorage.");
      }
    }
  }, [packageIdParam]);

  useEffect(() => {
    if (patientIdParam) {
      setPatientId(patientIdParam);
      localStorage.setItem("athma_patient_id", patientIdParam);
    } else {
      const stored = localStorage.getItem("athma_patient_id");
      if (stored) setPatientId(stored);
    }
  }, [patientIdParam]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("athma_token");
    const tokenType = localStorage.getItem("athma_token_type");
    const role = localStorage.getItem("athma_role");

    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": tokenType ? `${tokenType} ${token}` : `Bearer ${token}`,
    };

    if (role) headers["X-User-Role"] = role;

    return headers;
  };

  const createOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!packageId) {
        setError("No package selected. Please go back and select a package.");
        setStage("failed");
        setLoading(false);
        return;
      }

      const headers = getAuthHeaders();

      const response = await fetch("https://api.crazystory.in/api/patient/payment/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({ package_id: packageId })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("athma_token");
          localStorage.removeItem("athma_token_type");
          localStorage.removeItem("athma_role");
          router.push("/patient/login");
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(`Failed to create order: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        setOrderData(result.data);
        if (result.data?.package?.id) {
          setPackageId(result.data.package.id);
          localStorage.setItem("athma_selected_package_id", String(result.data.package.id));
        }
        initializeRazorpay(result.data);
      } else {
        throw new Error(result.message || "Failed to create order");
      }
    } catch (err) {
      setError(err.message);
      setStage("failed");
      console.error("Error creating order:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeRazorpay = (order) => {
    setStage("redirecting");

    const userName = localStorage.getItem("athma_name") || "";
    const userEmail = localStorage.getItem("athma_email") || "";
    const userPhone = localStorage.getItem("athma_phone") || "";

    const options = {
      key: order.razorpay_key,
      amount: parseFloat(order.amount) * 100,
      currency: order.currency || "INR",
      name: "Athma Counseling",
      description: order.package.name,
      order_id: order.razorpay_order_id,
      prefill: { name: userName, email: userEmail, contact: userPhone },
      theme: { color: "#E85720" },
      handler: function (response) {
        verifyPayment(response, order);
      },
      modal: {
        ondismiss: function () {
          setStage("idle");
          setError("Payment cancelled.");
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError("Failed to initialize Razorpay. Please try again.");
      setStage("idle");
      console.error("Razorpay initialization error:", err);
    }
  };

  const verifyPayment = async (razorpayResponse, order) => {
    try {
      setStage("processing");

      const headers = getAuthHeaders();

      const response = await fetch("https://api.crazystory.in/api/patient/payment/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          payment_id: order.payment_id
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("athma_token");
          localStorage.removeItem("athma_token_type");
          localStorage.removeItem("athma_role");
          router.push("/patient/login");
          throw new Error("Session expired. Please login again.");
        }
        throw new Error("Payment verification failed");
      }

      const result = await response.json();

      if (result.status === "success") {
        setStage("success");

        // Determine the package id to carry forward to the thank-you page
        // BEFORE clearing it from localStorage.
        const resolvedPackageId = order?.package?.id ?? packageId;

        setTimeout(() => {
          localStorage.removeItem("athma_selected_package_id");
          const query = resolvedPackageId
            ? `?package=${resolvedPackageId}`
            : "";
          router.push(`/patient/thank-you${query}`);
        }, 2000);
      } else {
        throw new Error(result.message || "Payment verification failed");
      }
    } catch (err) {
      setError(err.message);
      setStage("failed");
      console.error("Payment verification error:", err);
    }
  };

  const handlePay = () => {
    if (loading) return;
    createOrder();
  };

  const displayAmount = amountParam ? parseFloat(amountParam).toFixed(2) : "0.00";

  return (
    <div className="max-w-[520px] mx-auto px-4 md:px-5 py-6 md:py-10 relative">
      <PulseProgress current={2} />

      <div className="bg-card border border-line rounded-xl md:rounded-card p-5 md:p-7 text-center">
        <p className="text-[10px] md:text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide mb-1 md:mb-1.5">
          Step 3 of 4
        </p>
        <h1 className="font-brand text-lg md:text-2xl font-semibold text-teal-900 mb-0.5 md:mb-1">
          Confirm your payment
        </h1>
        <p className="text-ink-soft text-xs md:text-[14.5px] mb-5 md:mb-7">
          You&apos;re paying for the {packageName}.
        </p>

        <div className="text-left bg-[#FCFDFC] border border-line rounded-lg md:rounded-[10px] px-3 md:px-4 py-3 md:py-4 mb-5 md:mb-7 text-[11px] md:text-[13px]">
          <div className="flex justify-between py-1 md:py-1.5 text-ink-soft">
            <span>Package</span>
            <span className="text-ink font-medium">{packageName}</span>
          </div>
          <div className="flex justify-between py-1 md:py-1.5 text-ink-soft">
            <span>Amount</span>
            <span className="text-ink font-medium">₹{displayAmount}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading || stage === "processing" || stage === "redirecting" || !packageId}
          className="w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading || stage === "processing" || stage === "redirecting" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Processing...
            </span>
          ) : (
            `Pay ₹${displayAmount} with Razorpay`
          )}
        </button>

        <p className="mt-3 text-[10px] md:text-[11px] text-gray-500">
          Secure payment powered by Razorpay
        </p>
      </div>

      {(stage === "redirecting" || stage === "processing" || stage === "success" || stage === "failed") && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 md:px-5">
          <div className="bg-white rounded-xl md:rounded-2xl px-6 md:px-8 py-7 md:py-9 w-full max-w-[300px] md:max-w-[320px] text-center">
            {stage === "redirecting" && (
              <>
                <div className="w-9 h-9 md:w-11 md:h-11 mx-auto mb-4 md:mb-5 rounded-full border-[3px] border-teal-100 border-t-teal-900 animate-spin" />
                <p className="font-brand text-[14px] md:text-[16px] font-semibold text-teal-900 mb-1 md:mb-1.5">
                  Redirecting to Razorpay
                </p>
                <p className="text-ink-soft text-[11px] md:text-[13px]">
                  Please wait a moment...
                </p>
              </>
            )}

            {stage === "processing" && (
              <>
                <div className="w-9 h-9 md:w-11 md:h-11 mx-auto mb-4 md:mb-5 rounded-full border-[3px] border-teal-100 border-t-teal-900 animate-spin" />
                <p className="font-brand text-[14px] md:text-[16px] font-semibold text-teal-900 mb-1 md:mb-1.5">
                  Verifying Payment
                </p>
                <p className="text-ink-soft text-[11px] md:text-[13px]">
                  Please wait while we verify your payment...
                </p>
              </>
            )}

            {stage === "success" && (
              <>
                <div className="w-9 h-9 md:w-11 md:h-11 mx-auto mb-4 md:mb-5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="md:w-[20px] md:h-[20px]">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#16A34A"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="font-brand text-[14px] md:text-[16px] font-semibold text-teal-900 mb-1 md:mb-1.5">
                  Payment Successful! 🎉
                </p>
                <p className="text-ink-soft text-[11px] md:text-[13px]">
                  Thank you for your purchase!
                </p>
              </>
            )}

            {stage === "failed" && (
              <>
                <div className="w-9 h-9 md:w-11 md:h-11 mx-auto mb-4 md:mb-5 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="md:w-[20px] md:h-[20px]">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="#DC2626"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="font-brand text-[14px] md:text-[16px] font-semibold text-red-600 mb-1 md:mb-1.5">
                  Payment Failed
                </p>
                <p className="text-ink-soft text-[11px] md:text-[13px] mb-4">
                  {error || "Something went wrong. Please try again."}
                </p>
                <button
                  onClick={() => {
                    setStage("idle");
                    setError(null);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}