"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PulseProgress from "@/components/ui/PulseProgress";

const registerSchema = z.object({
  fullName: z.string().min(2, "Enter the patient's full name"),
  age: z.coerce.number().min(0, "Enter a valid age").max(120, "Enter a valid age"),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Select a gender" }),
  }),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().min(5, "Enter the full address").max(200, "Address is too long"),
  city: z.string().min(2, "Enter the city").max(50, "City name is too long"),
  state: z.string().min(2, "Enter the state").max(50, "State name is too long"),
  pincode: z.string().min(6, "Enter a valid 6-digit pincode").max(6, "Enter a valid 6-digit pincode").regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  location: z.string().min(2, "Enter the patient's location"),
  referredBy: z.string().optional().or(z.literal("")),
});

export default function RegisterPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [patientId, setPatientId] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const goToPackages = (id) => {
    router.push(`/patient/packages?patientId=${id}`);
  };

  const onSubmit = async (data) => {
    try {
      const res = await axios.post("https://api.crazystory.in/api/auth/register", {
        name: data.fullName,
        email: data.email || undefined,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: "India",
        pincode: data.pincode,
        referred_by: data.referredBy || undefined,
        gender: data.gender.toLowerCase(),
        location: data.location,
        role: "patient",
      });

      if (res.data.status === "success") {
        const { user, access_token, token_type, patient_details } = res.data.data;

        // Store auth tokens
        localStorage.setItem("athma_token", access_token);
        localStorage.setItem("athma_token_type", token_type);
        localStorage.setItem("athma_user", JSON.stringify(user));
        
        // Store patient details
        if (patient_details) {
          localStorage.setItem("athma_patient_details", JSON.stringify(patient_details));
        }
        
        // Store patient ID
        const userId = user.id || patient_details?.id;
        localStorage.setItem("athma_patient_id", String(userId));

        setPatientId(userId);
        setShowSuccess(true);

        // Auto-navigate after delay
        setTimeout(() => {
          goToPackages(userId);
        }, 1800);
      } else {
        toast.error(res.data.message || "Registration failed, please try again");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Something went wrong, please try again"
      );
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-5 py-6 md:py-10 relative">
      <PulseProgress current={0} />

      <div className="bg-card border border-line rounded-xl md:rounded-card p-4 md:p-7">
        <p className="text-[10px] md:text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide mb-1 md:mb-1.5">
          Step 1 of 4
        </p>
        <h1 className="font-brand text-lg md:text-2xl font-semibold text-teal-900 mb-0.5 md:mb-1">
          Let&apos;s get you registered
        </h1>
        <p className="text-ink-soft text-xs md:text-[14.5px] mb-4 md:mb-6">
          Takes about a minute. Matches you to the right care package.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Row 1: Full Name & Age */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4.5">
            <div>
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">Full name</label>
              <input
                type="text"
                placeholder="Full Name"
                {...register("fullName")}
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              {errors.fullName && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.fullName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">Age</label>
              <input
                type="number"
                placeholder="Age"
                {...register("age")}
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              {errors.age && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.age.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Gender & Phone */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4.5">
            <div>
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">Gender</label>
              <select
                {...register("gender")}
                defaultValue=""
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              >
                <option value="" disabled>Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              {errors.gender && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.gender.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">Phone</label>
              <input
                type="tel"
                placeholder="Phone Number"
                {...register("phone")}
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              {errors.phone && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Row 3: Email (Full Width) */}
          <div className="mb-3 md:mb-4.5">
            <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
              Email <span className="text-ink-soft font-normal">(optional)</span>
            </label>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
            />
            {errors.email && (
              <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Row 4: Full Address (Full Width) */}
          <div className="mb-3 md:mb-4.5">
            <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
              Full Address <span className="text-coral-600">*</span>
            </label>
            <textarea
              placeholder="House/Flat No., Street, Area, Landmark"
              {...register("address")}
              rows={2}
              className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500 resize-none"
            />
            {errors.address && (
              <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Row 5: City, State, Pincode */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4.5">
            <div>
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
                City <span className="text-coral-600">*</span>
              </label>
              <input
                type="text"
                placeholder="City"
                {...register("city")}
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              {errors.city && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.city.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
                State <span className="text-coral-600">*</span>
              </label>
              <input
                type="text"
                placeholder="State"
                {...register("state")}
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              {errors.state && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.state.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
                Pincode <span className="text-coral-600">*</span>
              </label>
              <input
                type="text"
                placeholder="6-digit pincode"
                maxLength={6}
                {...register("pincode")}
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              {errors.pincode && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.pincode.message}</p>
              )}
            </div>
          </div>

          {/* Row 6: Location & Referred By */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <div>
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
                Location <span className="text-coral-600">*</span>
              </label>
              <input
                type="text"
                placeholder="District/Area"
                {...register("location")}
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              {errors.location && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.location.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
                Referred By <span className="text-ink-soft font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Doctor/Clinic/Person name"
                {...register("referredBy")}
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              {errors.referredBy && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.referredBy.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="w-full flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-[40%] py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </div>
        </form>

        {/* Login Button - placed below the form button */}
        <div className="mt-3 md:mt-4 text-center">
          <p className="text-ink-soft text-xs md:text-[14px] mb-1.5 md:mb-2">
            Already have an account?
          </p>
          <Link
            href="/patient/login"
            className="inline-block w-[40%] py-3 md:py-3.5 bg-transparent underline text-coral-600 font-semibold text-[13px] md:text-[16px] transition-colors text-center"
          >
            Log in
          </Link>
        </div>
      </div>

      <p className="text-center text-[10px] md:text-xs text-ink-soft mt-3 md:mt-4">
        Your details are shared only with your assigned doctor.
      </p>

      {/* Success popup */}
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 30, 26, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            animation: "athmaFadeIn 0.25s ease-out",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "2.5rem 2rem 2rem",
              width: "min(90vw, 360px)",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              animation: "athmaPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#E1F5EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12.5L9.5 18L20 6"
                  stroke="#0F6E56"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 30,
                    strokeDashoffset: 30,
                    animation: "athmaDraw 0.5s ease-out 0.15s forwards",
                  }}
                />
              </svg>
            </div>

            <h2 style={{ fontSize: "19px", fontWeight: 600, color: "#0B3B30", margin: "0 0 6px" }}>
              Registration successful
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7A75", margin: "0 0 24px" }}>
              Taking you to your care packages...
            </p>

            <button
              type="button"
              onClick={() => goToPackages(patientId)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                background: "#D85A30",
                color: "#fff",
                fontWeight: 600,
                fontSize: "14.5px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Continue now
            </button>
          </div>

          <style>{`
            @keyframes athmaFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes athmaPopIn {
              from { opacity: 0; transform: scale(0.85) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes athmaDraw {
              to { stroke-dashoffset: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}