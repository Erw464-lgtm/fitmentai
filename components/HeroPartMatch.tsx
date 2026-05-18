"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Gauge, Radar, ScanLine, ShieldCheck, Sparkles } from "lucide-react";

type HeroMatch = {
  id: string;
  label: string;
  source: string;
  vehicle: string;
  category: string;
  score: number;
  status: string;
  risk: string;
  specs: string[];
  checks: Array<{ label: string; value: string; tone: "good" | "review" | "risk" }>;
  verify: string[];
  glow: string;
  carAccent: string;
};

const heroMatches: HeroMatch[] = [
  {
    id: "suncoast-oem",
    label: "OEM aero accessory",
    source: "Suncoast Porsche Parts",
    vehicle: "2017 Porsche Macan Turbo",
    category: "Exterior",
    score: 90,
    status: "Strong match",
    risk: "Low-medium",
    specs: ["OEM-style", "2015-2018", "Dealer source", "Trim check"],
    checks: [
      { label: "Year range", value: "Pass", tone: "good" },
      { label: "Trim notes", value: "Review", tone: "review" },
      { label: "Mounting", value: "Verify", tone: "review" },
      { label: "Return path", value: "Strong", tone: "good" },
    ],
    verify: ["Genuine part number", "Dealer availability", "Exact Macan generation"],
    glow: "from-signal to-volt",
    carAccent: "bg-signal",
  },
  {
    id: "soul-exhaust",
    label: "Valved exhaust system",
    source: "Soul Performance Products",
    vehicle: "2017 Porsche Macan Turbo",
    category: "Performance",
    score: 84,
    status: "Performance fit",
    risk: "Medium",
    specs: ["Valved", "Turbo trim", "Sound risk", "Hardware"],
    checks: [
      { label: "Platform", value: "Pass", tone: "good" },
      { label: "Valve control", value: "Verify", tone: "review" },
      { label: "Emissions", value: "Review", tone: "risk" },
      { label: "Install", value: "Moderate", tone: "review" },
    ],
    verify: ["Valve compatibility", "Emissions legality", "Tip alignment"],
    glow: "from-[#2f8a55] to-[#c2932e]",
    carAccent: "bg-volt",
  },
  {
    id: "aa-carbon-spoiler",
    label: "Carbon rear spoiler",
    source: "AA Carbon",
    vehicle: "2017 Porsche Macan Turbo",
    category: "Exterior",
    score: 70,
    status: "Needs proof",
    risk: "Medium-high",
    specs: ["Carbon", "Hatch fit", "Finish", "Tape/hardware"],
    checks: [
      { label: "Body shape", value: "Review", tone: "review" },
      { label: "Photos", value: "Needed", tone: "risk" },
      { label: "Mounting", value: "Verify", tone: "review" },
      { label: "Return policy", value: "Critical", tone: "risk" },
    ],
    verify: ["Install photos", "Mounting method", "Return policy"],
    glow: "from-warning to-volt",
    carAccent: "bg-warning",
  },
];

export function HeroPartMatch() {
  const [activeId, setActiveId] = useState(heroMatches[0].id);
  const active = useMemo(() => heroMatches.find((match) => match.id === activeId) || heroMatches[0], [activeId]);

  return (
    <div className="rounded-lg border border-line bg-panel/95 p-3 shadow-glow">
      <div className="grid gap-3 lg:grid-cols-[1fr_0.72fr]">
        <div className="relative overflow-hidden rounded-lg border border-[#234231] bg-[#07150e] p-5 text-white">
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-volt/10 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-signal/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-md border border-volt/25 bg-volt/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#d8cba9]">
              <Radar className="h-3.5 w-3.5" />
              Live sample match
            </span>
            <span className="text-sm text-volt">{active.vehicle}</span>
          </div>

          <div className="relative mt-5 grid gap-2 sm:grid-cols-3">
            {heroMatches.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() => setActiveId(match.id)}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  active.id === match.id
                    ? "border-volt bg-volt/15 text-[#f3ead5] shadow-[0_0_28px_rgba(154,116,40,0.18)]"
                    : "border-line bg-[#09160e] text-[#b8ac91] hover:border-volt hover:text-volt"
                }`}
              >
                <span className="block text-xs font-semibold">{match.label}</span>
                <span className="mt-1 block text-[11px] text-[#9e9278]">{match.source}</span>
              </button>
            ))}
          </div>

          <div className="relative mt-5 border-y border-volt/15 py-7">
            <div className="relative mx-auto aspect-[16/8] max-w-lg overflow-hidden rounded-lg border border-line bg-[radial-gradient(circle_at_50%_80%,rgba(154,116,40,0.14),transparent_42%),linear-gradient(180deg,#08150d,#07120c)]">
              <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-volt/70 to-transparent" />
              <div className="absolute inset-x-10 bottom-8 h-px bg-gradient-to-r from-transparent via-signal/70 to-transparent" />
              <div className="absolute left-8 top-8 h-[70%] w-px bg-gradient-to-b from-volt/40 to-transparent" />
              <div className="absolute right-8 top-8 h-[70%] w-px bg-gradient-to-b from-signal/40 to-transparent" />
              <div className="absolute left-[6%] right-[6%] top-[62%] h-px bg-[#38533f]" />
              <div className="absolute inset-x-[8%] bottom-[15%] h-[34%] rounded-t-[80px] border-2 border-[#d4a62a] bg-[#173923] shadow-[0_22px_50px_rgba(0,0,0,0.55)] transition" />
              <div className="absolute inset-x-[17%] top-[21%] h-[36%] rounded-t-[90px] border-2 border-[#5b7b5f] bg-[#0d2416]" />
              <div className="absolute bottom-[9%] left-[11%] h-[28%] w-[17%] rounded-full border-[10px] border-[#ead28a] bg-[#07150e]" />
              <div className="absolute bottom-[9%] right-[11%] h-[28%] w-[17%] rounded-full border-[10px] border-[#ead28a] bg-[#07150e]" />
              <div className={`absolute left-[30%] top-[47%] h-2 w-[40%] rounded-full ${active.carAccent} shadow-[0_0_24px_rgba(154,116,40,0.45)]`} />
              <div className="absolute left-[12%] top-[22%] inline-flex items-center gap-2 rounded-md border border-signal/40 bg-signal/10 px-2 py-1 text-[11px] font-semibold text-[#bfe5c6]">
                <ScanLine className="h-3.5 w-3.5" />
                scanning listing
              </div>
              <div className={`absolute right-[10%] top-[22%] rounded-md border px-2 py-1 text-[11px] font-semibold ${
                active.score >= 86
                  ? "border-signal/50 bg-signal/15 text-[#bfe5c6]"
                  : active.score >= 76
                    ? "border-volt/50 bg-volt/15 text-[#d8cba9]"
                    : "border-warning/60 bg-warning/15 text-orange-200"
              }`}>
                {active.risk} risk
              </div>
              <div className="absolute inset-x-[10%] bottom-3 grid grid-cols-3 gap-2">
                {active.verify.map((item) => (
                  <div key={item} className="rounded-md border border-line bg-[#07120c]/85 px-2 py-1 text-center text-[10px] font-semibold text-[#d8cba9] backdrop-blur">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {active.specs.map((spec) => (
              <div key={spec} className="rounded-lg border border-volt/20 bg-volt/10 p-3 text-center">
                <p className="text-xs font-semibold text-[#f3ead5] sm:text-sm">{spec}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-line bg-[#0b1810] p-5">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-signal">
              <Sparkles className="h-4 w-4" />
              Instant fitment readout
            </p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-sm text-[#9e9278]">Fitment score</p>
                <p className="mt-1 text-5xl font-semibold text-[#f3ead5] md:text-6xl">{active.score}</p>
              </div>
              <p className={`rounded-md px-3 py-1 text-xs font-bold ${
                active.score >= 86 ? "bg-signal text-[#07120c]" : active.score >= 76 ? "bg-volt text-[#07120c]" : "bg-warning text-[#07120c]"
              }`}>
                {active.status}
              </p>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#2a2a1d]">
              <div className={`h-full rounded-full bg-gradient-to-r ${active.glow} transition-all duration-500`} style={{ width: `${active.score}%` }} />
            </div>
            <div className="mt-5 grid gap-2">
              {active.checks.map((check) => (
                <div key={check.label} className="flex items-center justify-between rounded-md border border-line bg-[#101f15] px-3 py-2 text-sm">
                  <span className="text-[#b8ac91]">{check.label}</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      check.tone === "good" ? "text-[#bfe5c6]" : check.tone === "risk" ? "text-orange-200" : "text-[#d7c28b]"
                    }`}
                  >
                    {check.tone === "good" ? <BadgeCheck className="h-3.5 w-3.5" /> : check.tone === "risk" ? <AlertTriangle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {check.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-lg border border-volt/20 bg-volt/5 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-volt">
              <Gauge className="h-4 w-4" />
              Why this matters
            </div>
            <p className="mt-2 text-sm leading-6 text-[#b8ac91]">
              Click a sample listing and FitmentAI changes the score, risk, specs, verification checklist, and source context instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
