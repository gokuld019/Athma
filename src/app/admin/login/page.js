"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = "https://api.crazystory.in/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result || result.status !== "success") {
        const message =
          result?.message ||
          (res.status === 401 || res.status === 422
            ? "Invalid username or password."
            : "Something went wrong. Please try again.");
        setError(message);
        setSubmitting(false);
        return;
      }

      const { access_token, token_type, user } = result.data;

      // Save token in localStorage
      localStorage.setItem("athma_admin_token", access_token);
      localStorage.setItem("athma_admin_token_type", token_type || "Bearer");
      localStorage.setItem("athma_admin_user", JSON.stringify(user));

      const redirectTo = searchParams.get("redirect") || "/admin";
      router.push(redirectTo);
    } catch (err) {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F7F8F6]">
      {/* ===== Left brand panel ===== */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-teal-900">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-coral-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] w-[380px] h-[380px] rounded-full bg-teal-400/10 blur-3xl" />

        <svg
          className="absolute bottom-24 left-0 w-full h-24 opacity-40"
          viewBox="0 0 600 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 L120,50 L145,15 L170,85 L195,50 L600,50"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            className="pulse-line"
          />
        </svg>
        <style>{`
          .pulse-line {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: draw-pulse 3.2s ease-in-out infinite;
          }
          @keyframes draw-pulse {
            0% { stroke-dashoffset: 1; opacity: 0.2; }
            45% { stroke-dashoffset: 0; opacity: 1; }
            70% { opacity: 1; }
            100% { stroke-dashoffset: -1; opacity: 0.2; }
          }
        `}</style>

        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-2">
              <Image src="/Athmalogo.webp" alt="Athma" width={34} height={34} className="object-contain" />
            </div>
            <span className="font-brand text-white text-[17px] font-bold leading-tight">
              Athma <br /> Mind Care
            </span>
          </div>

          <div className="max-w-[380px]">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-white mb-4">
              <Sparkles size={13} /> Admin Console
            </span>
            <h1 className="font-brand text-white text-[30px] font-bold leading-[1.25] mb-3">
              Manage care, packages, and patients from one place.
            </h1>
            <p className="text-teal-100/80 text-[14px] leading-relaxed">
              Sign in with your admin credentials to access the Athma dashboard, patient queue,
              and care package settings.
            </p>
          </div>

          <div className="flex items-center gap-2 text-teal-200/70 text-[12.5px]">
            <ShieldCheck size={15} />
            Restricted access — admin credentials required.
          </div>
        </div>
      </div>

      {/* ===== Right form panel ===== */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="flex lg:hidden items-center gap-2.5 mb-10 justify-center">
            <div className="bg-teal-900 rounded-xl p-2">
              <Image src="/Athmalogo.webp" alt="Athma" width={26} height={26} className="object-contain" />
            </div>
            <span className="font-brand text-teal-900 text-[15px] font-bold">Athma Mind Care</span>
          </div>

          <div className="mb-8">
            <h2 className="font-brand text-[24px] font-bold text-teal-900">Admin sign in</h2>
            <p className="text-ink-soft text-[13.5px] mt-1.5">
              Enter your admin username and password to continue.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] px-4 py-3 mb-5 text-[13px]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="admin123"
                  className="w-full pl-10 pr-4 py-3 border border-line rounded-[10px] text-[14px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12.5px] font-medium text-ink">Password</label>
                <a href="#" className="text-[12px] font-semibold text-coral-600 hover:text-coral-700">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 border border-line rounded-[10px] text-[14px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-coral-600"
              />
              <span className="text-[13px] text-ink-soft">Keep me signed in on this device</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14px] transition-colors disabled:opacity-70"
            >
              {submitting ? (
                "Signing in..."
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[12px] text-ink-soft mt-8">
            Athma Admin Console · Access restricted to authorized staff
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}