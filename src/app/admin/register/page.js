"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const PASSWORD_CHECKS = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "number", label: "Contains a number", test: (v) => /\d/.test(v) },
  { key: "case", label: "Upper & lower case", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });

  const handleChange = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    // Clear error for the field being edited
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const passwordsMatch = form.confirm.length > 0 && form.password === form.confirm;

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = "Full name is required";
    }
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Please enter a valid 10-digit number";
    }
    
    if (!form.password) {
      newErrors.password = "Password is required";
    } else {
      const allChecksPassed = PASSWORD_CHECKS.every(check => check.test(form.password));
      if (!allChecksPassed) {
        newErrors.password = "Password doesn't meet all requirements";
      }
    }
    
    if (!form.confirm) {
      newErrors.confirm = "Please confirm your password";
    } else if (form.password !== form.confirm) {
      newErrors.confirm = "Passwords don't match";
    }
    
    if (!agreed) {
      newErrors.agreed = "You must agree to the terms";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    // TODO: replace with real registration call
    setTimeout(() => setSubmitting(false), 1200);
  };

  return (
    <div className="min-h-screen flex bg-[#F7F8F6]">
      {/* ===== Left brand panel ===== */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-teal-900">
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-coral-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-80px] w-[380px] h-[380px] rounded-full bg-teal-400/10 blur-3xl" />

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

        <div className="relative z-10 flex flex-col justify-center w-full px-12 py-12">
          <div className="max-w-[380px]">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-white mb-4">
              <Sparkles size={13} /> Join the Portal
            </span>
            <h1 className="font-brand text-white text-[30px] font-bold leading-[1.25] mb-3">
              Create your account and start your care journey today.
            </h1>
            <p className="text-teal-100/80 text-[14px] leading-relaxed mb-6">
              Book assessments, track your progress, and stay connected with your care team —
              securely, in one place.
            </p>
            <ul className="space-y-2.5">
              {["Guided mental wellness assessments", "Direct access to your care team", "Private, encrypted records"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2.5 text-teal-100/90 text-[13.5px]">
                    <CheckCircle2 size={15} className="text-coral-400 shrink-0" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-teal-200/70 text-[12.5px]">
            <ShieldCheck size={15} />
            Data protected with end-to-end encrypted patient records.
          </div>
        </div>
      </div>

      {/* ===== Right form panel ===== */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="bg-teal-900 rounded-xl p-2">
              <Image src="/Athmalogo.webp" alt="Athma" width={26} height={26} className="object-contain" />
            </div>
            <span className="font-brand text-teal-900 text-[15px] font-bold">Athma Mind Care</span>
          </div>

          <div className="mb-7">
            <h2 className="font-brand text-[24px] font-bold text-teal-900">Create your account</h2>
            <p className="text-ink-soft text-[13.5px] mt-1.5">
              It only takes a minute to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Priya Sharma"
                  className={`w-full pl-10 pr-4 py-3 border rounded-[10px] text-[14px] bg-[#FCFDFC] focus:outline-2 transition-colors ${
                    errors.name 
                      ? "border-rose-400 focus:outline-rose-400" 
                      : "border-line focus:outline-teal-500 focus:border-teal-500"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="flex items-center gap-1 text-[11.5px] text-rose-500 mt-1.5">
                  <AlertCircle size={12} />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12.5px] font-medium text-ink mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-3 py-3 border rounded-[10px] text-[13.5px] bg-[#FCFDFC] focus:outline-2 transition-colors ${
                      errors.email 
                        ? "border-rose-400 focus:outline-rose-400" 
                        : "border-line focus:outline-teal-500 focus:border-teal-500"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-[11.5px] text-rose-500 mt-1.5">
                    <AlertCircle size={12} />
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-ink mb-1.5">Phone</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="98765 43210"
                    className={`w-full pl-10 pr-3 py-3 border rounded-[10px] text-[13.5px] bg-[#FCFDFC] focus:outline-2 transition-colors ${
                      errors.phone 
                        ? "border-rose-400 focus:outline-rose-400" 
                        : "border-line focus:outline-teal-500 focus:border-teal-500"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="flex items-center gap-1 text-[11.5px] text-rose-500 mt-1.5">
                    <AlertCircle size={12} />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-3 border rounded-[10px] text-[14px] bg-[#FCFDFC] focus:outline-2 transition-colors ${
                    errors.password 
                      ? "border-rose-400 focus:outline-rose-400" 
                      : "border-line focus:outline-teal-500 focus:border-teal-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-[11.5px] text-rose-500 mt-1.5">
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
              {form.password.length > 0 && !errors.password && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {PASSWORD_CHECKS.map((check) => {
                    const passed = check.test(form.password);
                    return (
                      <span
                        key={check.key}
                        className={`flex items-center gap-1 text-[11.5px] ${
                          passed ? "text-emerald-600" : "text-ink-soft"
                        }`}
                      >
                        <CheckCircle2 size={12} className={passed ? "text-emerald-500" : "text-line"} />
                        {check.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => handleChange("confirm", e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 border rounded-[10px] text-[14px] bg-[#FCFDFC] focus:outline-2 transition-colors ${
                    errors.confirm || (form.confirm.length > 0 && !passwordsMatch)
                      ? "border-rose-400 focus:outline-rose-400"
                      : "border-line focus:outline-teal-500 focus:border-teal-500"
                  }`}
                />
              </div>
              {errors.confirm && (
                <p className="flex items-center gap-1 text-[11.5px] text-rose-500 mt-1.5">
                  <AlertCircle size={12} />
                  {errors.confirm}
                </p>
              )}
              {!errors.confirm && form.confirm.length > 0 && !passwordsMatch && (
                <p className="flex items-center gap-1 text-[11.5px] text-rose-500 mt-1.5">
                  <AlertCircle size={12} />
                  Passwords don&apos;t match yet.
                </p>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (errors.agreed) setErrors((prev) => ({ ...prev, agreed: "" }));
                }}
                className={`w-4 h-4 rounded mt-0.5 ${errors.agreed ? 'accent-rose-600' : 'accent-coral-600'}`}
              />
              <span className="text-[12.5px] text-ink-soft leading-relaxed">
                I agree to the <a href="#" className="font-semibold text-teal-800">Terms of Service</a> and{" "}
                <a href="#" className="font-semibold text-teal-800">Privacy Policy</a>.
              </span>
            </label>
            {errors.agreed && (
              <p className="flex items-center gap-1 text-[11.5px] text-rose-500 -mt-2 ml-7">
                <AlertCircle size={12} />
                {errors.agreed}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14px] transition-colors disabled:opacity-50"
            >
              {submitting ? (
                "Creating account..."
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[13px] text-ink-soft mt-7">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-teal-800 hover:text-teal-900">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}