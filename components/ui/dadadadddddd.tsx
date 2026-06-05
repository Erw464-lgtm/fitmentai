"use client";

import { cn } from "@/lib/utils";
import { Minus, Plus, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export const Component = () => {
  const [count, setCount] = useState(3);

  return (
    <div className={cn("rounded-lg border border-line bg-[#09160e] p-4 shadow-glow")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-volt/25 bg-volt/10 text-volt">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-[#f3ead5]">Build priority tuner</h1>
            <p className="mt-1 text-sm leading-6 text-[#9e9278]">
              Use this demo control to show how FitmentAI can adjust build intensity before recommending parts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCount((prev) => Math.max(0, prev - 1))}
            className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-[#07120c] text-[#d8cba9] transition hover:border-volt hover:text-volt"
            aria-label="Lower build priority"
          >
            <Minus className="h-4 w-4" />
          </button>
          <h2 className="min-w-16 rounded-lg border border-volt/30 bg-volt/10 px-4 py-2 text-center text-xl font-semibold text-[#f3ead5]">
            {count}
          </h2>
          <button
            type="button"
            onClick={() => setCount((prev) => Math.min(10, prev + 1))}
            className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-[#07120c] text-[#d8cba9] transition hover:border-volt hover:text-volt"
            aria-label="Raise build priority"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#17251a]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-signal to-volt transition-all duration-300"
          style={{ width: `${count * 10}%` }}
        />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#b8ac91]">
        {count <= 3 ? "Daily-safe recommendations" : count <= 7 ? "Balanced street build" : "Aggressive build planning"}
      </p>
    </div>
  );
};
