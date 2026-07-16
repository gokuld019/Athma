"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, ChevronRight } from "lucide-react";

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const packageIdParam = searchParams.get("package") || searchParams.get("packageId");

  const [packageId, setPackageId] = useState(null);
  const [resolvingId, setResolvingId] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packageInfo, setPackageInfo] = useState(null);
  const [subheadings, setSubheadings] = useState([]);
  const [isPaid, setIsPaid] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [noPackageId, setNoPackageId] = useState(false);

  // Resolve packageId: URL param -> localStorage fallback
  useEffect(() => {
    if (packageIdParam) {
      const parsed = parseInt(packageIdParam, 10);
      if (!isNaN(parsed)) {
        setPackageId(parsed);
        localStorage.setItem("athma_selected_package_id", String(parsed));
        setResolvingId(false);
        return;
      }
    }
    const stored = localStorage.getItem("athma_selected_package_id");
    if (stored) {
      const parsedStored = parseInt(stored, 10);
      if (!isNaN(parsedStored)) {
        setPackageId(parsedStored);
        setResolvingId(false);
        return;
      }
    }

    console.error("No packageId found in URL or localStorage on /patient/category.");
    setNoPackageId(true);
    setResolvingId(false);
    setLoading(false);
  }, [packageIdParam]);

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

  useEffect(() => {
    if (resolvingId) return;
    if (!packageId) return;

    const fetchSubheadings = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = getAuthHeaders();

        const response = await fetch(
          `https://api.crazystory.in/api/patient/packages/${packageId}/subheadings`,
          {
            method: "GET",
            headers
          }
        );

        const result = await response.json();

        if (!response.ok || result.status === "error") {
          if (response.status === 401) {
            localStorage.removeItem("athma_token");
            localStorage.removeItem("athma_token_type");
            localStorage.removeItem("athma_role");
            router.push("/patient/login");
            return;
          }

          setIsPaid(false);
          setError(result.message || "You must purchase this package to access its content.");
          setPackageInfo({
            id: result.package_id,
            name: result.package_name,
            price: result.price
          });
          setLoading(false);
          return;
        }

        setIsPaid(result.data?.is_paid ?? false);
        setPackageInfo(result.data?.package || null);
        setSubheadings(result.data?.subheadings || []);
      } catch (err) {
        console.error("Error fetching package subheadings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubheadings();
  }, [packageId, resolvingId, router]);

  // Navigate to assessment with proper parameters
  const goToAssessment = (subheading) => {
    if (!isPaid) {
      alert("You must purchase this package to access its content.");
      return;
    }
    
    setCheckingId(subheading.id);
    
    // Store the current assessment info in localStorage
    localStorage.setItem("athma_current_assessment_package", String(packageId));
    localStorage.setItem("athma_current_assessment_subheading", String(subheading.id));
    localStorage.setItem("athma_current_assessment_name", subheading.name || subheading.title);
    
    // Navigate to assessment page with proper query parameters
    router.push(
      `/patient/assessment?subheading_id=${subheading.id}&package_id=${packageId}`
    );
  };

  if (noPackageId) {
    return (
      <div className="max-w-[900px] mx-auto px-4 md:px-5 py-16 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Package Selected</h2>
        <p className="text-gray-600 mb-6">
          We couldn't find a package to show categories for. Please choose a package first.
        </p>
        <button
          onClick={() => router.push("/patient/packages")}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
        >
          Go to Packages
        </button>
      </div>
    );
  }

  if (resolvingId || loading) {
    return (
      <div className="max-w-[900px] mx-auto px-4 md:px-5 py-16 text-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking package access...</p>
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="max-w-[900px] mx-auto px-4 md:px-5 py-16 text-center">
        <div className="text-red-500 text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Package Not Purchased</h2>
        <p className="text-gray-600 mb-1">
          {error || "You must purchase this package to access its content."}
        </p>
        {packageInfo?.name && (
          <p className="text-gray-500 text-sm mb-6">
            {packageInfo.name} — ₹{packageInfo.price}
          </p>
        )}
        <button
          onClick={() => router.push("/patient/packages")}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
        >
          Go to Packages
        </button>
      </div>
    );
  }

  if (subheadings.length === 0) {
    return (
      <div className="max-w-[900px] mx-auto px-4 md:px-5 py-16 text-center">
        <p className="text-gray-600">No assessment categories available for this package yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-5 py-8 md:py-14">
      <div className="text-center mb-6 md:mb-10">
        <p className="text-[10px] md:text-[12.5px] font-semibold text-teal-500 uppercase tracking-wide mb-1.5 md:mb-2">
          {packageInfo?.name || "Your Package"}
        </p>
        <h1 className="font-brand text-xl md:text-[26px] font-semibold text-teal-900 mb-1.5 md:mb-2">
          Choose an assessment to begin
        </h1>
        <p className="text-ink-soft text-xs md:text-[14.5px] max-w-[480px] mx-auto">
          Your package includes several short assessments. Pick one below to
          start — you can come back and complete the others anytime.
        </p>
      </div>

      <div className="flex flex-col gap-2 md:gap-3">
        {subheadings.map((sub) => {
          const isChecking = checkingId === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => goToAssessment(sub)}
              disabled={isChecking}
              className="group flex items-center gap-3 md:gap-4 bg-card border border-line rounded-xl md:rounded-[14px] px-4 md:px-5 py-3 md:py-4 text-left hover:border-teal-500 hover:shadow-[0_4px_20px_rgba(43,62,99,0.08)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-900 group-hover:text-white transition-colors">
                <ClipboardList size={18} strokeWidth={2} className="md:w-[22px] md:h-[22px]" />
              </div>

              <div className="flex-1">
                {sub.code && (
                  <p className="text-[10px] md:text-[11.5px] font-semibold text-coral-600 uppercase tracking-wide">
                    {sub.code}
                  </p>
                )}
                <p className="text-[13px] md:text-[15px] font-semibold text-ink">
                  {sub.name || sub.title}
                </p>
                {sub.question_count != null && (
                  <p className="text-[11px] md:text-[12.5px] text-ink-soft mt-0.5">
                    {sub.question_count} question{sub.question_count === 1 ? "" : "s"}
                  </p>
                )}
              </div>

              <ChevronRight
                size={16}
                className="text-ink-soft group-hover:text-teal-700 group-hover:translate-x-1 transition-all md:w-[20px] md:h-[20px]"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}