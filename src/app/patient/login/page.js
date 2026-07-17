"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Info, Mail, ArrowLeft, Loader2, User, Phone, AtSign } from "lucide-react";
import Image from "next/image";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Enter your password"),
});

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

const forgotUsernameSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentialHelp, setShowCredentialHelp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotUsername, setShowForgotUsername] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [usernameEmailSent, setUsernameEmailSent] = useState(false);
  
  // Store email for display in success messages
  const [submittedEmail, setSubmittedEmail] = useState("");
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const watchedUsername = watch("username", "");

  const {
    register: registerForgotPassword,
    handleSubmit: handleForgotPasswordSubmit,
    formState: { errors: forgotPasswordErrors, isSubmitting: isSubmittingForgotPassword },
    reset: resetForgotPasswordForm,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const {
    register: registerForgotUsername,
    handleSubmit: handleForgotUsernameSubmit,
    formState: { errors: forgotUsernameErrors, isSubmitting: isSubmittingForgotUsername },
    reset: resetForgotUsernameForm,
  } = useForm({
    resolver: zodResolver(forgotUsernameSchema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await axios.post("https://api.crazystory.in/api/auth/login", {
        username: data.username.trim(),
        password: data.password,
      });

      if (res.data.status === "success") {
        const { access_token, token_type, role } = res.data.data;

        localStorage.setItem("athma_token", access_token);
        localStorage.setItem("athma_token_type", token_type);
        localStorage.setItem("athma_role", role);

        toast.success(res.data.message || "Login successful");

        if (role === "doctor") {
          router.push("/doctor");
        } else {
          router.push("/patient/packages");
        }
      } else {
        toast.error(res.data.message || "Login failed, please try again");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Invalid username or password"
      );
    }
  };

  const onForgotPassword = async (data) => {
    try {
      const res = await axios.post("https://api.crazystory.in/api/auth/forgot-password", {
        email: data.email,
      });

      if (res.data.status === "success") {
        setSubmittedEmail(data.email);
        setResetEmailSent(true);
        toast.success(res.data.message || "Reset link sent to your email");
      } else {
        toast.error(res.data.message || "Failed to send reset link");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not send reset link. Please try again."
      );
    }
  };

  const onForgotUsername = async (data) => {
    try {
      const res = await axios.post("https://api.crazystory.in/api/auth/forgot-username", {
        email: data.email,
      });

      if (res.data.status === "success") {
        setSubmittedEmail(data.email);
        setUsernameEmailSent(true);
        toast.success(res.data.message || "Username sent to your email");
      } else {
        toast.error(res.data.message || "Failed to send username");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not send username. Please try again."
      );
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowForgotUsername(false);
    setResetEmailSent(false);
    setUsernameEmailSent(false);
    setSubmittedEmail("");
    resetForgotPasswordForm();
    resetForgotUsernameForm();
  };

  // Detect if input is phone number (only digits)
  const isPhoneNumber = /^\d+$/.test(watchedUsername.trim());
  const inputLength = watchedUsername.trim().length;

  // ========== FORGOT PASSWORD VIEW ==========
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4 md:px-5 py-6 md:py-10">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center justify-center gap-2.5 mr-3">
            <div className="flex justify-center mb-4 md:mb-6">
              <Image
                src="/Athmalogo.webp"
                alt="Athma Mind Care Hospital"
                width={180}
                height={58}
                className="md:w-[238px] md:h-[61px]"
                priority
              />
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl md:rounded-card p-5 md:p-7">
            {resetEmailSent ? (
              // Success State
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-emerald-600" />
                </div>
                <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-2">
                  Check your email
                </h1>
                <p className="text-ink-soft text-xs md:text-[14px] mb-2 leading-relaxed">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-teal-700">{submittedEmail}</span>
                </p>
                <p className="text-ink-soft text-[12px] md:text-[13px] mb-6 leading-relaxed">
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <div className="p-3 md:p-4 bg-amber-50 border border-amber-100 rounded-lg text-left mb-6">
                  <p className="text-[11px] md:text-[12px] text-amber-800 font-medium mb-1">
                    Didn't receive the email?
                  </p>
                  <ul className="text-[10.5px] md:text-[11.5px] text-amber-700 space-y-1">
                    <li>• Check your spam or junk folder</li>
                    <li>• Make sure you entered the correct email address</li>
                    <li>• The link expires after 60 minutes</li>
                  </ul>
                </div>
                <button
                  onClick={handleBackToLogin}
                  className="w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              // Forgot Password Form
              <>
                <button
                  onClick={handleBackToLogin}
                  className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-medium text-[13px] mb-4 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </button>

                <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-0.5 md:mb-1">
                  Forgot password?
                </h1>
                <p className="text-ink-soft text-xs md:text-[14.5px] mb-5 md:mb-6">
                  Enter your registered email address and we'll send you a reset link.
                </p>

                <form onSubmit={handleForgotPasswordSubmit(onForgotPassword)} noValidate>
                  <div className="mb-4 md:mb-5">
                    <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        {...registerForgotPassword("email")}
                        className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
                      />
                    </div>
                    {forgotPasswordErrors.email && (
                      <p className="text-coral-600 text-[10px] md:text-xs mt-1">{forgotPasswordErrors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingForgotPassword}
                    className="w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmittingForgotPassword ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending reset link...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========== FORGOT USERNAME VIEW ==========
  if (showForgotUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4 md:px-5 py-6 md:py-10">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center justify-center gap-2.5 mr-3">
            <div className="flex justify-center mb-4 md:mb-6">
              <Image
                src="/Athmalogo.webp"
                alt="Athma Mind Care Hospital"
                width={180}
                height={58}
                className="md:w-[238px] md:h-[61px]"
                priority
              />
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl md:rounded-card p-5 md:p-7">
            {usernameEmailSent ? (
              // Success State
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <User size={28} className="text-emerald-600" />
                </div>
                <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-2">
                  Check your email
                </h1>
                <p className="text-ink-soft text-xs md:text-[14px] mb-2 leading-relaxed">
                  We've sent your username to{" "}
                  <span className="font-medium text-teal-700">{submittedEmail}</span>
                </p>
                <p className="text-ink-soft text-[12px] md:text-[13px] mb-6 leading-relaxed">
                  Check your inbox to find your username. You can also use the link in the email to change your username if needed.
                </p>
                <div className="p-3 md:p-4 bg-teal-50 border border-teal-100 rounded-lg text-left mb-6">
                  <p className="text-[11px] md:text-[12px] text-teal-800 font-medium mb-1">
                    What to expect:
                  </p>
                  <ul className="text-[10.5px] md:text-[11.5px] text-teal-700 space-y-1">
                    <li>• Your username will be in the email</li>
                    <li>• You can also change your username using the link provided</li>
                    <li>• The change username link expires in 24 hours</li>
                  </ul>
                </div>
                <button
                  onClick={handleBackToLogin}
                  className="w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              // Forgot Username Form
              <>
                <button
                  onClick={handleBackToLogin}
                  className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-medium text-[13px] mb-4 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </button>

                <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-0.5 md:mb-1">
                  Forgot username?
                </h1>
                <p className="text-ink-soft text-xs md:text-[14.5px] mb-5 md:mb-6">
                  Enter your registered email address and we'll send you your username.
                </p>

                <form onSubmit={handleForgotUsernameSubmit(onForgotUsername)} noValidate>
                  <div className="mb-4 md:mb-5">
                    <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        {...registerForgotUsername("email")}
                        className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
                      />
                    </div>
                    {forgotUsernameErrors.email && (
                      <p className="text-coral-600 text-[10px] md:text-xs mt-1">{forgotUsernameErrors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingForgotUsername}
                    className="w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmittingForgotUsername ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending username...
                      </>
                    ) : (
                      "Send username"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========== LOGIN VIEW (Main) ==========
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 md:px-5 py-6 md:py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-2.5 mr-3">
          <div className="flex justify-center mb-4 md:mb-6">
            <Image
              src="/Athmalogo.webp"
              alt="Athma Mind Care Hospital"
              width={180}
              height={58}
              className="md:w-[238px] md:h-[61px]"
              priority
            />
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl md:rounded-card p-5 md:p-7">
          <h1 className="font-brand text-xl md:text-2xl font-semibold text-teal-900 mb-0.5 md:mb-1">
            Welcome back
          </h1>
          <p className="text-ink-soft text-xs md:text-[14.5px] mb-5 md:mb-6">
            Sign in with your phone number or username to continue.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3 md:mb-4.5">
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
                Phone number or username
              </label>
              <div className="relative">
                {isPhoneNumber && inputLength >= 10 ? (
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                ) : (
                  <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                )}
                <input
                  type="text"
                  placeholder="Phone number or username"
                  {...register("username")}
                  className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
                />
              </div>
              {errors.username && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.username.message}</p>
              )}
              
              {/* Input Type Indicator */}
              {watchedUsername.trim().length > 0 && !errors.username && (
                <div className="mt-1.5">
                  {isPhoneNumber && inputLength === 10 ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] text-teal-600">
                      <Phone size={11} />
                      Phone number detected
                    </span>
                  ) : isPhoneNumber && inputLength < 10 ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] text-amber-600">
                      <Phone size={11} />
                      Phone number should be 10 digits
                    </span>
                  ) : !isPhoneNumber ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] text-purple-600">
                      <AtSign size={11} />
                      Username format
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mb-1.5 md:mb-2">
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className="w-full px-3 md:px-3.5 py-2 md:py-2.5 pr-10 md:pr-11 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-ink-soft"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} className="md:w-[17px] md:h-[17px]" /> : <Eye size={15} className="md:w-[17px] md:h-[17px]" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Links */}
            <div className="flex items-center justify-between mb-1">
              <button
                type="button"
                onClick={() => setShowForgotUsername(true)}
                className="text-[11px] md:text-[12.5px] text-teal-700 hover:text-teal-800 font-medium transition-colors"
              >
                Forgot username?
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[11px] md:text-[12.5px] text-teal-700 hover:text-teal-800 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors disabled:opacity-60 mt-3 md:mt-4"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Credential Help Section */}
          <div className="mt-4 md:mt-5 pt-4 border-t border-line/60">
            <button
              type="button"
              onClick={() => setShowCredentialHelp(!showCredentialHelp)}
              className="flex items-center gap-1.5 text-[11px] md:text-[12.5px] text-teal-700 hover:text-teal-800 font-medium transition-colors"
            >
              <Info size={14} className="md:w-[15px] md:h-[15px]" />
              First time logging in? Tap here to know your credentials
            </button>

            {showCredentialHelp && (
              <div className="mt-3 p-3 md:p-3.5 bg-teal-50/50 border border-teal-100 rounded-lg md:rounded-[9px] space-y-2.5 md:space-y-3">
                <div>
                  <h4 className="text-[11px] md:text-[12.5px] font-semibold text-teal-900 mb-1">
                    Your login credentials
                  </h4>
                  <p className="text-[10.5px] md:text-[11.5px] text-ink-soft">
                    After registration, we send your login details via WhatsApp to your registered number.
                    If you missed the message, here's how to log in:
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 md:w-5.5 md:h-5.5 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                      <span className="text-[10px] md:text-[11px] font-bold text-teal-700">1</span>
                    </div>
                    <div>
                      <p className="text-[10.5px] md:text-[11.5px] font-medium text-ink">Username</p>
                      <p className="text-[10.5px] md:text-[11.5px] text-ink-soft">
                        Your 10-digit registered phone number
                      </p>
                      <p className="text-[10px] md:text-[11px] text-ink-soft/70 mt-0.5">
                        Example: 9876543210
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 md:w-5.5 md:h-5.5 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                      <span className="text-[10px] md:text-[11px] font-bold text-teal-700">2</span>
                    </div>
                    <div>
                      <p className="text-[10.5px] md:text-[11.5px] font-medium text-ink">Password</p>
                      <p className="text-[10.5px] md:text-[11.5px] text-ink-soft">
                        Last 5 digits of your phone number
                      </p>
                      <p className="text-[10px] md:text-[11px] text-ink-soft/70 mt-0.5">
                        If your number is 9876543210, your password is <span className="font-semibold text-teal-800">43210</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-white/60 border border-teal-100 rounded-md">
                  <p className="text-[10px] md:text-[11px] text-teal-700">
                    <strong>Note:</strong> You can also use a custom username if you've changed it. 
                    Both phone number and custom username work for login.
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] md:text-[13px] text-ink-soft mt-4 md:mt-5">
            New patient?{" "}
            <Link href="/patient/register" className="text-teal-700 font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}