"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";

// Simple Thank You Modal
function ThankYouModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center relative animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-teal-900 mb-3">
          Thank You! 🙏
        </h2>

        {/* Message */}
        <div className="space-y-3 text-gray-600">
          <p className="text-[15px] leading-relaxed">
            Our team will verify all your responses and contact you soon.
          </p>
          <p className="text-[14px] font-medium text-teal-700 bg-teal-50 rounded-lg py-3 px-4">
            We appreciate your time and trust in us! 💙
          </p>
        </div>

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[14px] transition-all shadow-md hover:shadow-lg"
        >
          Back to Categories
        </button>
      </div>
    </div>
  );
}

// Usage example
export default function Home() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-teal-600 text-white rounded-lg"
      >
        Show Thank You Modal
      </button>

      {showModal && (
        <ThankYouModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}