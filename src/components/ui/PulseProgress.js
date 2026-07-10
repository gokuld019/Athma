"use client";

import Image from "next/image";

const steps = ["Register", "Package", "Payment", "Questions"];

export default function PulseProgress({ current = 0 }) {
  const fillPercent = (current / (steps.length - 1)) * 100;

  return (
    <div className="mb-7">
      <div className="flex justify-center mb-6">
  <Image
    src="/Athmalogo.webp"
    alt="Athma Mind Care Hospital"
    width={280}
    height={90}
    priority
  />
</div>

      <div className="relative h-[34px] flex items-center">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-line" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-coral-600 transition-all duration-500"
          style={{ width: `${fillPercent}%` }}
        />
        <div className="relative flex justify-between w-full z-10">
          {steps.map((label, i) => (
            <div
              key={label}
              className={`w-3 h-3 rounded-full border-[1.5px] transition-all duration-300 ${
                i < current
                  ? "bg-coral-600 border-coral-600"
                  : i === current
                  ? "bg-teal-900 border-teal-900 shadow-[0_0_0_5px_var(--color-teal-100)]"
                  : "bg-card border-line"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[11.5px] text-ink-soft">
        {steps.map((label, i) => (
          <span
            key={label}
            className={
              i === 0
                ? "text-left"
                : i === steps.length - 1
                ? "text-right"
                : "text-center"
            }
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}