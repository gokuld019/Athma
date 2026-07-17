"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, User, Phone, AtSign } from "lucide-react";
import Image from "next/image";

const changeUsernameSchema = z.object({
  new_username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9._@+\- ]+$/,
      "Username can only contain letters, numbers, spaces, and special characters (._@+-)"
    ),
});

// Inner component that uses useSearchParams
function ChangeUsernameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const resetToken = searchParams.get("token");
  const resetEmail = searchParams.get("email");
  
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(null);
  const [tokenError, setTokenError] = useState("");
  const [usernameChangeSuccess, setUsernameChangeSuccess] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changeUsernameSchema),
  });

  const watchedUsername = watch("new_username", "");

  // Verify token on mount
  useEffect(() => {
    if (resetToken && resetEmail) {
      verifyToken(resetEmail, resetToken);
    } else {
      setVerifyingToken(false);
      setTokenValid(false);
      setTokenError("Invalid or missing reset link parameters.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken, resetEmail]);

  const verifyToken = async (email, token) => {
    setVerifyingToken(true);
    setTokenValid(null);
    setTokenError("");
    
    try {
      const res = await axios.post("https://api.crazystory.in/api/auth/verify-token", {
        email: email,
        token: token,
      });

      if (res.data.status === "success") {
        setTokenValid(true);
        toast.success("Token verified successfully");
      } else {
        setTokenValid(false);
        setTokenError(res.data.message || "Invalid or expired token");
      }
    } catch (err) {
      setTokenValid(false);
      setTokenError(
        err.response?.data?.message || "Token verification failed. The link may be invalid or expired."
      );
    } finally {
      setVerifyingToken(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const res = await axios.post("https://api.crazystory.in/api/auth/change-username", {
        email: resetEmail,
        token: resetToken,
        new_username: data.new_username.trim(),
      });

      if (res.data.status === "success") {
        setNewUsername(res.data.data?.new_username || data.new_username.trim());
        setUsernameChangeSuccess(true);
        toast.success(res.data.message || "Username changed successfully!");
      } else {
        toast.error(res.data.message || "Failed to change username");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not change username. Please try again."
      );
    }
  };

  // Detect if input is phone number (only digits)
  const isPhoneNumber = /^\d+$/.test(watchedUsername.trim());
  const inputLength = watchedUsername.trim().length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F6] px-4 md:px-5 py-6 md:py-10">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex justify-center mb-6 md:mb-8">
          <Image
            src="/Athmalogo.webp"
            alt="Athma Mind Care Hospital"
            width={200}
            height={64}
            className="md:w-[238px] md:h-[61px]"
            priority
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {/* ===== Verifying Token State ===== */}
          {verifyingToken && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="animate-spin text-teal-600" />
              </div>
              <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-2">
                Verifying your link
              </h1>
              <p className="text-slate-500 text-[13px] md:text-[14px]">
                Please wait while we verify your change username link...
              </p>
            </div>
          )}

          {/* ===== Invalid Token State ===== */}
          {!verifyingToken && tokenValid === false && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-rose-500" />
              </div>
              <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-2">
                Invalid or expired link
              </h1>
              <p className="text-slate-500 text-[13px] md:text-[14px] mb-2">
                {tokenError}
              </p>
              <p className="text-slate-400 text-[12px] md:text-[13px] mb-6">
                This change username link is invalid or has expired. Please request a new one.
              </p>
              
              <div className="space-y-3">
                <Link
                  href="/patient/login"
                  className="block w-full py-3 md:py-3.5 rounded-xl bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14px] transition-colors text-center"
                >
                  Go to login
                </Link>
                <button
                  onClick={() => verifyToken(resetEmail, resetToken)}
                  className="w-full py-3 md:py-3.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-teal-700 font-semibold text-[14px] transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* ===== Username Change Success State ===== */}
          {usernameChangeSuccess && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-2">
                Username changed successfully!
              </h1>
              <p className="text-slate-500 text-[13px] md:text-[14px] mb-4">
                Your new username is
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl mb-6">
                {/^\d{10}$/.test(newUsername) ? (
                  <Phone size={16} className="text-teal-600" />
                ) : (
                  <AtSign size={16} className="text-teal-600" />
                )}
                <span className="text-[18px] md:text-[20px] font-bold text-teal-700">{newUsername}</span>
              </div>
              <p className="text-slate-400 text-[12px] md:text-[13px] mb-6">
                Use this username to sign in to your account.
              </p>

              <Link
                href="/patient/login"
                className="block w-full py-3 md:py-3.5 rounded-xl bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14px] transition-colors text-center"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {/* ===== Change Username Form ===== */}
          {!verifyingToken && tokenValid === true && !usernameChangeSuccess && (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                  <User size={22} className="text-teal-600" />
                </div>
                <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-1">
                  Change username
                </h1>
                <p className="text-slate-500 text-[13px] md:text-[14px]">
                  Enter a new username for{" "}
                  <span className="font-medium text-teal-700">{resetEmail}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {/* New Username */}
                <div>
                  <label className="block text-[12px] md:text-[13px] font-medium text-slate-700 mb-1.5">
                    New username
                  </label>
                  <div className="relative">
                    {isPhoneNumber && inputLength >= 10 ? (
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    ) : (
                      <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    )}
                    <input
                      type="text"
                      placeholder="Enter phone number or custom username"
                      {...register("new_username")}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-[13px] md:text-[14px] bg-[#FCFDFC] focus:outline-2 transition-colors ${
                        errors.new_username 
                          ? "border-rose-400 focus:outline-rose-400" 
                          : "border-slate-200 focus:outline-teal-500 focus:border-teal-500"
                      }`}
                    />
                  </div>
                  {errors.new_username && (
                    <p className="text-rose-500 text-[11px] md:text-xs mt-1.5 flex items-center gap-1">
                      <XCircle size={12} />
                      {errors.new_username.message}
                    </p>
                  )}
                  
                  {/* Input Type Indicator */}
                  {watchedUsername.trim().length > 0 && !errors.new_username && (
                    <div className="mt-2 flex items-center gap-2">
                      {isPhoneNumber ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] md:text-[12px] text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                          <Phone size={12} />
                          Phone number format detected
                          {inputLength === 10 && (
                            <CheckCircle2 size={12} className="text-emerald-500" />
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] md:text-[12px] text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                          <AtSign size={12} />
                          Custom username format
                        </span>
                      )}
                      {!isPhoneNumber && (
                        <span className="text-[11px] text-slate-400">
                          {inputLength} character{inputLength !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl">
                  <p className="text-[12px] md:text-[13px] font-semibold text-teal-800 mb-2">
                    Username guidelines:
                  </p>
                  <ul className="text-[11px] md:text-[12px] text-teal-700 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
                      <span>You can use a <strong>10-digit phone number</strong> (e.g., 9876543210)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
                      <span>Or a <strong>custom username</strong> with letters and numbers (e.g., john_doe, user123)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
                      <span>Allowed characters: letters (a-z, A-Z), numbers (0-9), spaces, and (._@+-)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
                      <span>Minimum 3 characters, maximum 50 characters</span>
                    </li>
                  </ul>
                </div>

                {/* Examples */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[11px] md:text-[12px] font-medium text-slate-600 mb-2">
                    Examples of valid usernames:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono">
                      9876543210
                    </span>
                    <span className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono">
                      john_doe
                    </span>
                    <span className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono">
                      user123
                    </span>
                    <span className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono">
                      jane.doe
                    </span>
                    <span className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono">
                      my name
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14px] md:text-[15px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Changing username...
                    </>
                  ) : (
                    "Change username"
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-5 text-center">
                <Link
                  href="/patient/login"
                  className="inline-flex items-center gap-1.5 text-[13px] text-teal-700 hover:text-teal-800 font-medium transition-colors"
                >
                  <ArrowLeft size={15} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] md:text-[12px] text-slate-400 mt-6">
          Secured with end-to-end encryption · Athma Mind Care
        </p>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function ChangeUsernamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-teal-600" />
          <p className="text-slate-500 text-[14px]">Loading...</p>
        </div>
      </div>
    }>
      <ChangeUsernameContent />
    </Suspense>
  );
}