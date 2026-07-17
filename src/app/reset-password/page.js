"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import Image from "next/image";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least 1 number")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter"),
  password_confirmation: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

// Inner component that uses useSearchParams
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const resetToken = searchParams.get("token");
  const resetEmail = searchParams.get("email");
  
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid
  const [tokenError, setTokenError] = useState("");
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

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
      const res = await axios.post("https://api.crazystory.in/api/auth/reset-password", {
        email: resetEmail,
        token: resetToken,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      if (res.data.status === "success") {
        setPasswordResetSuccess(true);
        toast.success(res.data.message || "Password reset successfully!");
      } else {
        toast.error(res.data.message || "Failed to reset password");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not reset password. Please try again."
      );
    }
  };

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
                Verifying your reset link
              </h1>
              <p className="text-slate-500 text-[13px] md:text-[14px]">
                Please wait while we verify your reset link...
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
                This password reset link is invalid or has expired. Please request a new one.
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

          {/* ===== Password Reset Success State ===== */}
          {passwordResetSuccess && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-2">
                Password reset successful!
              </h1>
              <p className="text-slate-500 text-[13px] md:text-[14px] mb-6">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              
              <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={16} className="text-teal-600" />
                  <p className="text-[12px] md:text-[13px] font-medium text-teal-800">
                    Security tip
                  </p>
                </div>
                <p className="text-[11px] md:text-[12px] text-teal-700 text-left">
                  Use a strong, unique password that you don't use for other accounts. Consider using a password manager to keep your credentials safe.
                </p>
              </div>

              <Link
                href="/patient/login"
                className="block w-full py-3 md:py-3.5 rounded-xl bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14px] transition-colors text-center"
              >
                Sign in with new password
              </Link>
            </div>
          )}

          {/* ===== Reset Password Form ===== */}
          {!verifyingToken && tokenValid === true && !passwordResetSuccess && (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                  <ShieldCheck size={22} className="text-teal-600" />
                </div>
                <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-1">
                  Set new password
                </h1>
                <p className="text-slate-500 text-[13px] md:text-[14px]">
                  Create a new password for{" "}
                  <span className="font-medium text-teal-700">{resetEmail}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-[12px] md:text-[13px] font-medium text-slate-700 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...register("password")}
                      className={`w-full px-4 py-3 pr-11 border rounded-xl text-[13px] md:text-[14px] bg-[#FCFDFC] focus:outline-2 transition-colors ${
                        errors.password 
                          ? "border-rose-400 focus:outline-rose-400" 
                          : "border-slate-200 focus:outline-teal-500 focus:border-teal-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-rose-500 text-[11px] md:text-xs mt-1.5 flex items-center gap-1">
                      <XCircle size={12} />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[12px] md:text-[13px] font-medium text-slate-700 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    {...register("password_confirmation")}
                    className={`w-full px-4 py-3 border rounded-xl text-[13px] md:text-[14px] bg-[#FCFDFC] focus:outline-2 transition-colors ${
                      errors.password_confirmation 
                        ? "border-rose-400 focus:outline-rose-400" 
                        : "border-slate-200 focus:outline-teal-500 focus:border-teal-500"
                    }`}
                  />
                  {errors.password_confirmation && (
                    <p className="text-rose-500 text-[11px] md:text-xs mt-1.5 flex items-center gap-1">
                      <XCircle size={12} />
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl">
                  <p className="text-[12px] md:text-[13px] font-semibold text-teal-800 mb-2">
                    Password requirements:
                  </p>
                  <ul className="text-[11px] md:text-[12px] text-teal-700 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                      At least 1 number
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                      At least 1 lowercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                      At least 1 uppercase letter
                    </li>
                  </ul>
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
                      Resetting password...
                    </>
                  ) : (
                    "Reset password"
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
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-teal-600" />
          <p className="text-slate-500 text-[14px]">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}