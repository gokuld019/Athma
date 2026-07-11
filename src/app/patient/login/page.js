"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";


const loginSchema = z.object({
  username: z.string().min(10, "Enter your registered phone number"),
  password: z.string().min(1, "Enter your password"),
});

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await axios.post("https://api.crazystory.in/api/auth/login", {
        username: data.username,
        password: data.password,
      });

      if (res.data.status === "success") {
        const { access_token, token_type, role } = res.data.data;

        localStorage.setItem("athma_token", access_token);
        localStorage.setItem("athma_token_type", token_type);
        localStorage.setItem("athma_role", role);

        toast.success(res.data.message || "Login successful");

        // Role-based redirect — same login endpoint likely serves doctors too
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
        err.response?.data?.message || "Invalid phone number or password"
      );
    }
  };

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
            Sign in with your registered phone number to continue.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3 md:mb-4.5">
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">
                Phone number
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                {...register("username")}
                className="w-full px-3 md:px-3.5 py-2 md:py-2.5 border border-line rounded-lg md:rounded-[9px] text-[13px] md:text-[14.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              {errors.username && (
                <p className="text-coral-600 text-[10px] md:text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            <div className="mb-1.5 md:mb-2">
              <label className="block text-[11px] md:text-[13px] font-medium mb-1 md:mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 md:py-3.5 rounded-lg md:rounded-[10px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13px] md:text-[14.5px] transition-colors disabled:opacity-60 mt-4 md:mt-5"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

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