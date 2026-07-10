"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Blocks a page unless a valid token exists in localStorage.
 * Redirects to /patient/register if there's no token.
 *
 * Usage inside any protected page component:
 *   const { checking } = useRequireAuth();
 *   if (checking) return null; // or a loading spinner
 */
export function useRequireAuth() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("athma_token");
    if (!token) {
      router.replace("/patient/register");
    } else {
      setChecking(false);
    }
  }, [router]);

  return { checking };
}