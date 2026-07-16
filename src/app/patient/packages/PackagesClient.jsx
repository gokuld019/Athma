"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Briefcase, Venus, Baby, HeartPulse, Sparkles, Clock, FileQuestion, X } from "lucide-react";
import PulseProgress from "@/components/ui/PulseProgress";

// TEMP fallback — remove once backend returns numeric "id" in /api/patient/packages
const SLUG_TO_ID = {
  "standard-adult": 1,
  "executive": 2,
  "executive-women": 3,
  "child": 4,
  "elderly": 5,
  "adolescence": 6
};

const getIcon = (name) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("executive") && nameLower.includes("women")) return Venus;
  if (nameLower.includes("executive")) return Briefcase;
  if (nameLower.includes("child")) return Baby;
  if (nameLower.includes("elderly")) return HeartPulse;
  if (nameLower.includes("adolescence")) return Sparkles;
  return User;
};

const getFeatures = (pkg) => {
  const features = [];
  features.push(pkg.description);

  if (pkg.name.toLowerCase().includes("executive")) {
    features.push("Priority Doctor Review");
    features.push("WhatsApp Report + Consultation");
  } else {
    features.push("Doctor Review within 24 Hours");
    features.push("WhatsApp Report");
  }

  if (pkg.slug === "standard-adult") {
    features[0] = "General Mental Health Screening";
  } else if (pkg.slug === "executive") {
    features[0] = "Advanced Health Screening";
  } else if (pkg.slug === "executive-women") {
    features[0] = "Women's Wellness Assessment";
  } else if (pkg.slug === "child") {
    features[0] = "Child Behaviour Assessment";
  } else if (pkg.slug === "elderly") {
    features[0] = "Senior Wellness Assessment";
  } else if (pkg.slug === "adolescence") {
    features[0] = "Teen Mental Health Assessment";
  }

  return features;
};

const getQuestionsCount = (slug) => {
  const counts = {
    "standard-adult": 20,
    "executive": 35,
    "executive-women": 35,
    "child": 15,
    "elderly": 20,
    "adolescence": 15
  };
  return counts[slug] || 20;
};

const getDuration = (slug) => {
  const durations = {
    "standard-adult": "15 - 20 mins",
    "executive": "20 - 25 mins",
    "executive-women": "20 - 25 mins",
    "child": "10 - 15 mins",
    "elderly": "15 - 20 mins",
    "adolescence": "10 - 15 mins"
  };
  return durations[slug] || "15 - 20 mins";
};

export default function PackagesPage({ patientId: patientIdProp }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientId, setPatientId] = useState(patientIdProp || "");
  const [checkingPackageId, setCheckingPackageId] = useState(null);

  // Consent modal state — this is now the ONLY consent step, shown once per "Choose Package" click
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [pendingPkg, setPendingPkg] = useState(null);
  const [consentSubmitting, setConsentSubmitting] = useState(false);

  // Track whether terms/consent has already been agreed to (server-confirmed),
  // so we don't hit the "agree" API again on every package click.
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  // Resolve patientId: prop -> URL param -> localStorage
  useEffect(() => {
    if (patientIdProp) {
      setPatientId(patientIdProp);
      localStorage.setItem("athma_patient_id", String(patientIdProp));
      return;
    }

    const fromUrl = searchParams.get("patientId");
    if (fromUrl) {
      setPatientId(fromUrl);
      localStorage.setItem("athma_patient_id", fromUrl);
      return;
    }

    const stored = localStorage.getItem("athma_patient_id");
    if (stored) {
      setPatientId(stored);
    } else {
      console.warn("No patientId found from prop, URL, or localStorage.");
    }
  }, [patientIdProp, searchParams]);

  // Quietly check (in background) if user already agreed — doesn't block or gate any page.
  // If already agreed, we skip calling the "agree" API again from the modal.
  useEffect(() => {
    const checkTermsStatus = async () => {
      try {
        const token = localStorage.getItem("athma_token");
        const tokenType = localStorage.getItem("athma_token_type");
        const role = localStorage.getItem("athma_role");

        if (!token) return;

        const authHeader = tokenType ? `${tokenType} ${token}` : `Bearer ${token}`;

        const response = await fetch("https://api.crazystory.in/api/patient/terms/check", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
            "X-User-Role": role || "patient"
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === "success" && result.data?.has_agreed) {
            setHasAgreedToTerms(true);
          }
        }
      } catch (err) {
        console.error("Error checking terms status:", err);
      }
    };

    checkTermsStatus();
  }, []);

  // Accept terms and conditions — called from the consent modal's "Agree & Continue" button
  const acceptTerms = async () => {
    try {
      const token = localStorage.getItem("athma_token");
      const tokenType = localStorage.getItem("athma_token_type");
      const role = localStorage.getItem("athma_role");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const authHeader = tokenType ? `${tokenType} ${token}` : `Bearer ${token}`;

      const response = await fetch("https://api.crazystory.in/api/patient/terms/agree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
          "X-User-Role": role || "patient"
        },
        body: JSON.stringify({
          terms_version: "1.0"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to accept terms");
      }

      const result = await response.json();

      if (result.status === "success") {
        setHasAgreedToTerms(true);
        return true;
      } else {
        throw new Error(result.message || "Failed to accept terms");
      }
    } catch (err) {
      console.error("Error accepting terms:", err);
      return false;
    }
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const token = localStorage.getItem("athma_token");
        const tokenType = localStorage.getItem("athma_token_type");
        const role = localStorage.getItem("athma_role");

        if (!token) {
          throw new Error("Authentication token not found. Please login again.");
        }

        const authHeader = tokenType
          ? `${tokenType} ${token}`
          : `Bearer ${token}`;

        const response = await fetch("https://api.crazystory.in/api/patient/packages", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
            "X-User-Role": role || "patient"
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("athma_token");
            localStorage.removeItem("athma_token_type");
            localStorage.removeItem("athma_role");
            router.push("/patient/login");
            throw new Error("Session expired. Please login again.");
          }
          throw new Error(`Failed to fetch packages: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === "success") {
          const transformedPackages = result.data.map((pkg) => {
            const resolvedId = pkg.id ?? SLUG_TO_ID[pkg.slug] ?? null;
            if (!resolvedId) {
              console.error("No numeric id resolvable for package:", pkg);
            }
            return {
              id: pkg.slug,
              packageId: resolvedId,
              name: pkg.name,
              age: pkg.age_group,
              price: parseInt(pkg.price),
              questions: getQuestionsCount(pkg.slug),
              duration: getDuration(pkg.slug),
              icon: getIcon(pkg.name),
              features: getFeatures(pkg),
              featured: pkg.slug === "executive"
            };
          });

          setPackages(transformedPackages);
        } else {
          throw new Error(result.message || "Invalid response from server");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching packages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [router]);

  // Helper to build auth headers for the status check
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

  // Clicking "Choose Package" just opens the single consent modal — no separate terms page.
  const handleChoosePackage = (pkg) => {
    if (!pkg.packageId) {
      console.error("Missing packageId for package:", pkg);
      alert("This package is missing an ID — please contact support.");
      return;
    }

    setPendingPkg(pkg);
    setConsentChecked(false);
    setConsentOpen(true);
  };

  const closeConsent = () => {
    setConsentOpen(false);
    setPendingPkg(null);
    setConsentChecked(false);
  };

  // Consent modal's "Agree & Continue" — accepts terms (if not already accepted) then proceeds.
  const confirmConsentAndProceed = async () => {
    if (!consentChecked || !pendingPkg) return;
    const pkg = pendingPkg;

    setConsentSubmitting(true);

    // Record agreement on the backend if not already recorded
    if (!hasAgreedToTerms) {
      const accepted = await acceptTerms();
      if (!accepted) {
        alert("Please accept the terms and conditions to continue.");
        setConsentSubmitting(false);
        return;
      }
    }

    setConsentOpen(false);
    setConsentSubmitting(false);

    if (!patientId) {
      console.error("Missing patientId when navigating to payment.");
    }

    try {
      setCheckingPackageId(pkg.packageId);

      const headers = getAuthHeaders();

      const statusResponse = await fetch(
        `https://api.crazystory.in/api/patient/payment/status/${pkg.packageId}`,
        {
          method: "GET",
          headers
        }
      );

      if (!statusResponse.ok) {
        if (statusResponse.status === 401) {
          localStorage.removeItem("athma_token");
          localStorage.removeItem("athma_token_type");
          localStorage.removeItem("athma_role");
          router.push("/patient/login");
          return;
        }
        console.error(`Payment status check failed: ${statusResponse.status}`);
      } else {
        const statusData = await statusResponse.json();

        if (statusData?.data?.is_paid) {
          router.push(`/patient/category?package=${pkg.packageId}`);
          return;
        }
      }

      const url = `/patient/payment?patientId=${encodeURIComponent(patientId || "")}&package=${pkg.packageId}&name=${encodeURIComponent(pkg.name)}&amount=${pkg.price}`;
      router.push(url);
    } catch (err) {
      console.error("Error checking payment status:", err);
      const url = `/patient/payment?patientId=${encodeURIComponent(patientId || "")}&package=${pkg.packageId}&name=${encodeURIComponent(pkg.name)}&amount=${pkg.price}`;
      router.push(url);
    } finally {
      setCheckingPackageId(null);
      setPendingPkg(null);
      setConsentChecked(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9F8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9F8]">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Packages</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9F8]">
        <div className="text-center">
          <p className="text-gray-600">No packages available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F9F8]">
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute top-10 -left-24 w-[420px] h-[420px] rounded-full bg-orange-100/60 blur-[90px]" />
        <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-orange-100/50 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[360px] h-[360px] rounded-full bg-teal-50/70 blur-[80px]" />

        <svg
          className="absolute -bottom-20 -right-20 w-[420px] h-[420px] opacity-[0.06]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M100 100 C100 70 130 60 150 80 C175 105 160 145 125 150 C80 156 45 120 55 80 C67 32 120 15 160 40"
            stroke="#E85720"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-5 py-6 md:py-10">
        <PulseProgress current={1} />

        <div className="mb-6 md:mb-8">
          <p className="text-[10px] md:text-[12px] font-semibold uppercase tracking-widest text-teal-500">
            Step 2 of 5
          </p>

          <h1 className="text-xl md:text-3xl font-bold text-teal-900 mt-1 md:mt-2">
            Choose Your Care Package
          </h1>

          <p className="text-xs md:text-base text-gray-500 mt-1 md:mt-2">
            Select the package that best suits the patient's age and assessment
            needs.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-7">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            const isChecking = checkingPackageId === pkg.packageId;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-xl md:rounded-2xl border bg-white p-3 md:p-6 flex flex-col shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  pkg.featured
                    ? "border-orange-500"
                    : "border-gray-200 hover:border-teal-500"
                }`}
              >
                {pkg.featured && (
                  <span className="absolute -top-2.5 md:-top-3 left-2 md:left-5 bg-orange-500 text-white text-[9px] md:text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                <div
                  className={`absolute top-3 md:top-6 right-3 md:right-6 w-7 h-7 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center ${
                    pkg.featured
                      ? "bg-orange-50 text-orange-600"
                      : "bg-teal-50 text-teal-700"
                  }`}
                >
                  <Icon size={14} strokeWidth={2} className="md:w-[22px] md:h-[22px]" />
                </div>

                <h2 className="text-sm md:text-2xl font-bold text-teal-900 pr-10 md:pr-14">
                  {pkg.name}
                </h2>

                <div className="mt-1.5 md:mt-2.5 inline-flex items-center gap-1 md:gap-1.5 w-fit bg-teal-50 text-teal-800 text-[10px] md:text-[12.5px] font-semibold px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                  <User size={10} strokeWidth={2.5} className="md:w-[13px] md:h-[13px]" />
                  {pkg.age}
                </div>

                <div className="mt-2 md:mt-5 flex items-end gap-1 md:gap-2 bg-gray-50 rounded-lg md:rounded-xl px-2 md:px-4 py-2 md:py-3.5">
                  <span className="text-[10px] md:text-[13px] text-gray-400 font-medium mb-0.5 md:mb-1">₹</span>
                  <span className="text-xl md:text-[38px] leading-none font-extrabold text-gray-900">
                    {pkg.price}
                  </span>
                  <span className="text-gray-500 text-[9px] md:text-[12.5px] mb-0.5 md:mb-1">/ Assessment</span>
                </div>

                <div className="mt-2 md:mt-5 grid grid-cols-2 gap-1.5 md:gap-3 text-[10px] md:text-[12.5px]">
                  <div className="flex items-center gap-1 md:gap-2 bg-gray-50 rounded-md md:rounded-lg px-2 md:px-3 py-1 md:py-2">
                    <FileQuestion size={12} className="text-teal-600 md:w-[15px] md:h-[15px]" />
                    <span className="font-semibold text-gray-700">{pkg.questions} Qs</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 bg-gray-50 rounded-md md:rounded-lg px-2 md:px-3 py-1 md:py-2">
                    <Clock size={12} className="text-teal-600 md:w-[15px] md:h-[15px]" />
                    <span className="font-semibold text-gray-700">{pkg.duration}</span>
                  </div>
                </div>

                <hr className="my-2 md:my-5" />

                <ul className="space-y-1.5 md:space-y-3 flex-1">
                  {pkg.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-1.5 md:gap-3 text-[10px] md:text-sm text-gray-600"
                    >
                      <span className="text-green-600 font-bold mt-[1px] text-[10px] md:text-sm">
                        ✓
                      </span>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleChoosePackage(pkg)}
                  disabled={isChecking}
                  className={`mt-3 md:mt-8 w-full py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-[11px] md:text-base transition disabled:opacity-60 disabled:cursor-not-allowed ${
                    pkg.featured
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "border border-gray-300 hover:border-teal-600 hover:bg-teal-600 hover:text-white"
                  }`}
                >
                  {isChecking ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Checking...
                    </span>
                  ) : (
                    "Choose Package"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consent Modal — the ONLY consent step, shown once per "Choose Package" click */}
      {consentOpen && pendingPkg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeConsent}
        >
          <div
            className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 md:px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-base md:text-lg font-bold text-teal-900">
                Consent &amp; Acknowledgement
              </h3>
              <button
                onClick={closeConsent}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 md:px-6 py-4 space-y-3 text-xs md:text-sm text-gray-600 leading-relaxed">
              <p>
                I understand that the psychological test I undergo will be
                valid only if I answer the questions true to my conscience,
                consciousness, and self-awareness. Failing which, the report
                can change, for which I will hold responsibility, not Athma
                Mind Care Hospital.
              </p>
              <p>
                All reports are based on your answers. This is not a final
                diagnosis. The psychological assessment should be correlated
                with clinical findings.
              </p>
              <p>
                Following the recommendations of the report will enhance
                your mental health.
              </p>
              <p>
                We will rate scores of scales and give the total value of
                the scale as Normal, Mild, Moderate, Severe, etc.
              </p>
              <p>
                If abnormal, we will give short recommendations about
                consulting a Psychiatrist or Psychologist.
              </p>
            </div>

            <div className="px-5 md:px-6 py-4 border-t border-gray-100">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-teal-600 shrink-0"
                />
                <span className="text-xs md:text-sm text-gray-700 font-medium">
                  I have read and agree to the terms above.
                </span>
              </label>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={closeConsent}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs md:text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmConsentAndProceed}
                  disabled={!consentChecked || consentSubmitting}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs md:text-sm bg-teal-600 text-white hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {consentSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Please wait...
                    </>
                  ) : (
                    <>Agree &amp; Continue</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className="hidden md:fixed md:bottom-7 md:left-10 z-30 md:flex items-center gap-3 group">
        <span className="relative flex">
          <span className="absolute inset-0 rounded-full bg-orange-400/30 animate-ping" />
          <span className="relative w-[250px] h-[250px] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/unnamed.gif"
              alt="Athma mascot — Let's talk"
              width={600}
              height={600}
              unoptimized
              className="object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.15)]"
            />
          </span>
        </span>
        <span className="hidden md:flex items-center bg-white/90 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 rounded-full px-4 py-2 text-[12.5px] font-semibold text-teal-800 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          Let&apos;s talk 👋
        </span>
      </button>
    </div>
  );
}