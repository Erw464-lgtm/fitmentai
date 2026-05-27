"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ClipboardCopy, Database, Gauge, Layers3, MessageCircle, Radar, ScanLine, Share2, Sparkles, Wand2 } from "lucide-react";

type BuildMode = {
  id: string;
  name: string;
  intent: string;
  stance: number;
  score: number;
  daily: number;
  source: number;
  complexity: number;
  budget: string;
  nextParts: string[];
  risks: string[];
  proof: string[];
  accent: string;
};

const modes: BuildMode[] = [
  {
    id: "oem",
    name: "OEM+ Daily",
    intent: "Clean, reliable, low-risk upgrades for daily driving.",
    stance: 22,
    score: 91,
    daily: 94,
    source: 88,
    complexity: 24,
    budget: "$1.8k-$3.5k",
    nextParts: ["Suncoast OEM accessory", "FCP Euro maintenance kit", "Rennline interior hardware"],
    risks: ["Low exterior scrape risk", "Verify genuine part numbers", "Keep tire diameter near OEM"],
    proof: ["Dealer/OEM source", "Low install complexity", "Strong return path"],
    accent: "from-signal to-volt",
  },
  {
    id: "street",
    name: "Street Performance",
    intent: "Sharper sound, intake response, and premium enthusiast parts.",
    stance: 38,
    score: 84,
    daily: 78,
    source: 86,
    complexity: 48,
    budget: "$4k-$7.5k",
    nextParts: ["Soul valved exhaust", "Fabspeed high-flow intake", "Flat 6 staged package"],
    risks: ["Emissions legality", "Heat management", "Tune/supporting mod decisions"],
    proof: ["Manufacturer source", "Porsche specialist source", "Fitment checklist saved"],
    accent: "from-[#2f8a55] to-[#c2932e]",
  },
  {
    id: "carbon",
    name: "Carbon Show Build",
    intent: "Visible exterior transformation with carbon aero and detail pieces.",
    stance: 52,
    score: 73,
    daily: 70,
    source: 74,
    complexity: 58,
    budget: "$3k-$6k",
    nextParts: ["AA Carbon rear spoiler", "Carbon front lip", "Mirror caps and diffuser"],
    risks: ["Hatch/body-panel tolerance", "Finish/weave match", "Return policy matters"],
    proof: ["Photo proof needed", "Mounting method needed", "Same-car install preferred"],
    accent: "from-warning to-volt",
  },
  {
    id: "track",
    name: "Track Utility",
    intent: "Brake, cooling, tire, and reliability planning before power chasing.",
    stance: 44,
    score: 81,
    daily: 66,
    source: 82,
    complexity: 72,
    budget: "$5k-$9k",
    nextParts: ["Brake pads and fluid", "Cooling reliability refresh", "Performance tires"],
    risks: ["Brake heat", "Tire load rating", "Maintenance before power"],
    proof: ["Service history", "Same-platform track notes", "Shop inspection"],
    accent: "from-signal to-[#d7a43a]",
  },
];

export function BuildTwinStudio() {
  const [modeId, setModeId] = useState(modes[0].id);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const active = useMemo(() => modes.find((mode) => mode.id === modeId) || modes[0], [modeId]);

  function generatePassport() {
    setScanning(true);
    setMessage("");
    window.setTimeout(() => {
      setScanning(false);
      setMessage("Build Passport generated. Copy it or use this view for the demo.");
    }, 850);
  }

  async function copyPassport() {
    const text = [
      `FitmentAI Build Passport: 2017 Porsche Macan Turbo`,
      `Mode: ${active.name}`,
      `Intent: ${active.intent}`,
      `Fitment readiness: ${active.score}/100`,
      `Daily drivability: ${active.daily}/100`,
      `Source confidence: ${active.source}/100`,
      `Install complexity: ${active.complexity}/100`,
      `Budget range: ${active.budget}`,
      "",
      "Next parts:",
      ...active.nextParts.map((part) => `- ${part}`),
      "",
      "Risk forecast:",
      ...active.risks.map((risk) => `- ${risk}`),
      "",
      "Evidence needed:",
      ...active.proof.map((proof) => `- ${proof}`),
      "",
      "Built with FitmentAI: https://fitmentai.vercel.app",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setMessage("Build Passport copied.");
    } catch {
      setMessage("Clipboard blocked. Use the visible passport details.");
    }
  }

  function sendToAskFitmentAI() {
    const question = [
      `Build a next-step plan for my 2017 Porsche Macan Turbo in ${active.name} mode.`,
      `Intent: ${active.intent}`,
      `Current forecast: ${active.score}/100 readiness, ${active.daily}/100 daily drivability, ${active.source}/100 source confidence, ${active.complexity}/100 install complexity.`,
      `Parts I am considering: ${active.nextParts.join(", ")}.`,
      `Risks to solve: ${active.risks.join(", ")}.`,
      "Give me the smartest buying order, what to verify before purchase, and what I should avoid.",
    ].join("\n");

    window.localStorage.setItem("fitmentai-ask-draft", question);
    window.location.hash = "ask";
  }

  return (
    <section id="twin" className="relative mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="absolute inset-x-5 top-0 -z-10 h-[620px] rounded-[40px] bg-[radial-gradient(circle_at_18%_20%,rgba(154,116,40,0.18),transparent_36%),radial-gradient(circle_at_78%_46%,rgba(47,138,85,0.18),transparent_34%)] blur-2xl" />
      <div className="mb-6 grid gap-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Wow feature</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5] md:text-5xl">AI Build Twin Studio.</h2>
        </div>
        <p className="text-sm leading-7 text-[#b8ac91] md:text-base">
          Turn a saved car into a living build preview: pick a build direction, watch risk and stance change, then generate a shareable Build Passport.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-lg border border-line bg-panel/95 p-4 shadow-glow md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Build direction</p>
              <h3 className="mt-2 text-xl font-semibold text-[#f3ead5]">2017 Porsche Macan Turbo</h3>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-lg border border-volt/25 bg-volt/10 text-volt">
              <Wand2 className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-5 grid gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setModeId(mode.id);
                  setMessage("");
                }}
                className={`rounded-lg border p-4 text-left transition ${
                  active.id === mode.id
                    ? "border-volt bg-volt/15 shadow-[0_0_34px_rgba(154,116,40,0.14)]"
                    : "border-line bg-[#09160e] hover:border-volt/70"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#f3ead5]">{mode.name}</p>
                  <span className="rounded-md border border-line bg-[#07120c] px-2 py-1 text-xs font-semibold text-[#d8cba9]">
                    {mode.score}/100
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#9e9278]">{mode.intent}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={generatePassport}
              disabled={scanning}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {scanning ? <ScanLine className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              {scanning ? "Scanning build..." : "Generate Passport"}
            </button>
            <button
              type="button"
              onClick={() => void copyPassport()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-5 font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
            >
              <ClipboardCopy className="h-4 w-4" />
              Copy Passport
            </button>
            <button
              type="button"
              onClick={sendToAskFitmentAI}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-5 font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt sm:col-span-2"
            >
              <MessageCircle className="h-4 w-4" />
              Ask FitmentAI to plan this build
            </button>
            <a
              href="#database"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-5 font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt sm:col-span-2"
            >
              <Database className="h-4 w-4" />
              Open real parts database
            </a>
          </div>
          {message ? (
            <p className="mt-3 rounded-lg border border-volt/25 bg-volt/10 p-3 text-sm text-[#d8cba9]">{message}</p>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-[#07120c] shadow-glow">
          <div className="relative min-h-[360px] border-b border-line bg-[radial-gradient(circle_at_50%_65%,rgba(154,116,40,0.16),transparent_38%),linear-gradient(180deg,#0b1c12,#07120c)] p-5">
            <div className="absolute inset-0 opacity-60">
              <div className="absolute left-8 right-8 top-16 h-px bg-gradient-to-r from-transparent via-volt/60 to-transparent" />
              <div className="absolute bottom-16 left-8 right-8 h-px bg-gradient-to-r from-transparent via-signal/60 to-transparent" />
              <div className="absolute left-1/2 top-8 h-[78%] w-px bg-gradient-to-b from-volt/40 to-transparent" />
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg border border-volt/25 bg-volt/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#d8cba9]">
                <Radar className="h-4 w-4" />
                Live build twin
              </span>
              <span className="rounded-lg border border-line bg-[#07120c]/80 px-3 py-2 text-xs font-semibold text-[#d8cba9]">
                {active.budget}
              </span>
            </div>

            <div className="relative mx-auto mt-12 aspect-[16/7] max-w-3xl">
              <div className="absolute inset-x-[6%] bottom-[18%] h-px bg-[#38533f]" />
              <div
                className="absolute inset-x-[9%] rounded-t-[100px] border-2 border-[#d4a62a] bg-[#173923] shadow-[0_26px_70px_rgba(0,0,0,0.6)] transition-all duration-500"
                style={{ bottom: `${12 + active.stance / 8}%`, height: `${34 - active.stance / 10}%` }}
              />
              <div className="absolute inset-x-[19%] top-[16%] h-[40%] rounded-t-[90px] border-2 border-[#5b7b5f] bg-[#0d2416]" />
              <div className="absolute bottom-[8%] left-[12%] h-[32%] w-[18%] rounded-full border-[10px] border-[#ead28a] bg-[#07150e]" />
              <div className="absolute bottom-[8%] right-[12%] h-[32%] w-[18%] rounded-full border-[10px] border-[#ead28a] bg-[#07150e]" />
              <div className={`absolute left-[30%] top-[44%] h-2 w-[40%] rounded-full bg-gradient-to-r ${active.accent} shadow-[0_0_34px_rgba(154,116,40,0.45)]`} />
              <div className="absolute right-[8%] top-[14%] rounded-lg border border-volt/35 bg-[#07120c]/90 px-3 py-2 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#9e9278]">Readiness</p>
                <p className="text-3xl font-semibold text-volt">{active.score}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="grid gap-3">
              <TwinMetric label="Fitment readiness" value={active.score} />
              <TwinMetric label="Daily drivability" value={active.daily} />
              <TwinMetric label="Source confidence" value={active.source} />
              <TwinMetric label="Install complexity" value={active.complexity} invert />
            </div>
            <div className="grid gap-4">
              <PassportBlock icon={Layers3} title="Next parts" items={active.nextParts} />
              <PassportBlock icon={Gauge} title="Risk forecast" items={active.risks} />
              <PassportBlock icon={Share2} title="Evidence needed" items={active.proof} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TwinMetric({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const displayValue = invert ? 100 - value : value;

  return (
    <div className="rounded-lg border border-line bg-[#09160e] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9e9278]">{label}</p>
        <p className="font-semibold text-[#f3ead5]">{invert ? `${value}/100` : `${displayValue}/100`}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#17251a]">
        <div className="h-full rounded-full bg-gradient-to-r from-signal to-volt transition-all duration-500" style={{ width: `${displayValue}%` }} />
      </div>
    </div>
  );
}

function PassportBlock({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-[#09160e] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-volt">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-md border border-line bg-[#07120c] px-3 py-2 text-sm text-[#d8cba9]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
