"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  ClipboardCopy,
  Database,
  Gauge,
  Layers3,
  Loader2,
  MessageCircle,
  Radar,
  RefreshCw,
  ScanLine,
  Share2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/clientAuth";

type GarageVehicle = {
  id: string;
  year: string;
  make: string;
  model: string;
  trim: string | null;
  nickname: string | null;
  current_setup: string | null;
  suspension_setup: string | null;
  dream_setup: string | null;
  parts_to_buy: string | null;
};

type PlannedPart = {
  id: string;
  name: string;
  category: string;
  source: string | null;
  source_type?: string | null;
  status: "planned" | "installed";
  fitment_score: number | null;
  fitment_warning: string | null;
  fitment_recommendation: string | null;
};

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

const demoVehicle: GarageVehicle = {
  id: "demo-porsche",
  year: "2017",
  make: "Porsche",
  model: "Macan",
  trim: "Turbo",
  nickname: "Demo street SUV",
  current_setup: "20x9 +35, 265/45R20",
  suspension_setup: "Lowering springs",
  dream_setup: "OEM+ daily build with intake, exhaust, wheels, and carbon exterior pieces",
  parts_to_buy: "Air intake, rear spoiler, wheels, brake pads",
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
    nextParts: ["OEM maintenance refresh", "Factory accessory upgrade", "Premium interior hardware"],
    risks: ["Keep tire diameter near OEM", "Verify genuine part numbers", "Protect daily drivability"],
    proof: ["Dealer or OEM source", "Clear return path", "Vehicle-specific part number"],
    accent: "from-signal to-volt",
  },
  {
    id: "street",
    name: "Street Performance",
    intent: "Sharper sound, response, and premium enthusiast parts.",
    stance: 38,
    score: 84,
    daily: 78,
    source: 86,
    complexity: 48,
    budget: "$4k-$7.5k",
    nextParts: ["Valved exhaust", "High-flow intake", "Staged performance package"],
    risks: ["Emissions legality", "Heat management", "Tune and supporting-mod decisions"],
    proof: ["Manufacturer fitment claim", "Same-platform install", "Complete hardware list"],
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
    nextParts: ["Carbon rear spoiler", "Carbon front lip", "Mirror caps and diffuser"],
    risks: ["Body-panel tolerance", "Finish and weave match", "Return policy matters"],
    proof: ["Same-car photo proof", "Mounting method", "Panel-gap confirmation"],
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
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(demoVehicle.id);
  const [plannedParts, setPlannedParts] = useState<PlannedPart[]>([]);
  const [modeId, setModeId] = useState(modes[0].id);
  const [loading, setLoading] = useState(true);
  const [partsLoading, setPartsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || demoVehicle,
    [selectedVehicleId, vehicles]
  );
  const active = useMemo(() => modes.find((mode) => mode.id === modeId) || modes[0], [modeId]);
  const vehicleLabel = `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}${selectedVehicle.trim ? ` ${selectedVehicle.trim}` : ""}`;
  const checkedParts = plannedParts.filter((part) => part.fitment_score !== null);
  const riskyParts = plannedParts.filter((part) => (part.fitment_score ?? 100) < 70 || Boolean(part.fitment_warning));
  const installedParts = plannedParts.filter((part) => part.status === "installed");
  const sourcedParts = plannedParts.filter((part) => Boolean(part.source));
  const checkedAverage = checkedParts.length
    ? checkedParts.reduce((total, part) => total + (part.fitment_score || 0), 0) / checkedParts.length
    : 72;
  const checkedRatio = plannedParts.length ? checkedParts.length / plannedParts.length : 0;
  const installedRatio = plannedParts.length ? installedParts.length / plannedParts.length : 0;
  const sourceRatio = plannedParts.length ? sourcedParts.length / plannedParts.length : 0;
  const forecast = {
    readiness: clamp(Math.round(active.score * 0.5 + checkedAverage * 0.38 + checkedRatio * 12 - riskyParts.length * 5)),
    daily: clamp(Math.round(active.daily + installedRatio * 6 - riskyParts.length * 5)),
    source: clamp(Math.round(active.source * 0.55 + sourceRatio * 30 + checkedRatio * 15)),
    complexity: clamp(Math.round(active.complexity + plannedParts.length * 2 + riskyParts.length * 4)),
  };
  const nextParts = unique([
    ...plannedParts.filter((part) => part.status === "planned").map((part) => part.name),
    ...active.nextParts,
  ]).slice(0, 3);
  const risks = unique([
    ...riskyParts.map((part) => part.fitment_warning || `${part.name} has a low fitment score`),
    ...active.risks,
  ]).slice(0, 3);
  const evidence = [
    `${checkedParts.length}/${plannedParts.length || 0} saved parts fitment checked`,
    `${sourcedParts.length}/${plannedParts.length || 0} saved parts have a source`,
    checkedParts.length ? `Checked-part average: ${Math.round(checkedAverage)}/100` : "No saved fitment checks yet",
  ];
  const isDemo = selectedVehicle.id === demoVehicle.id;

  useEffect(() => {
    void loadVehicles();
  }, []);

  useEffect(() => {
    const savedMode = window.localStorage.getItem(`fitmentai-build-twin-mode:${selectedVehicle.id}`);
    setModeId(modes.some((mode) => mode.id === savedMode) ? savedMode || modes[0].id : modes[0].id);

    if (selectedVehicle.id === demoVehicle.id) {
      setPlannedParts([]);
      return;
    }

    void loadPlannedParts(selectedVehicle.id);
  }, [selectedVehicle.id]);

  async function loadVehicles() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/vehicles", { cache: "no-store", headers: getAuthHeaders() });
      const result = (await response.json()) as { vehicles?: GarageVehicle[]; message?: string };
      const nextVehicles = result.vehicles ?? [];

      setVehicles(nextVehicles);
      setSelectedVehicleId(nextVehicles[0]?.id || demoVehicle.id);
      if (!nextVehicles.length) {
        setMessage(result.message || "Showing the Porsche demo twin. Sign in and save a vehicle to use your garage.");
      }
    } catch {
      setMessage("Showing the Porsche demo twin while the garage is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlannedParts(vehicleId: string) {
    setPartsLoading(true);

    try {
      const response = await fetch(`/api/planned-parts?vehicleId=${encodeURIComponent(vehicleId)}`, {
        cache: "no-store",
        headers: getAuthHeaders(),
      });
      const result = (await response.json()) as { plannedParts?: PlannedPart[] };
      setPlannedParts(result.plannedParts ?? []);
    } catch {
      setPlannedParts([]);
      setMessage("Vehicle loaded, but its saved parts could not be loaded.");
    } finally {
      setPartsLoading(false);
    }
  }

  function selectMode(nextModeId: string) {
    setModeId(nextModeId);
    setMessage("");
    window.localStorage.setItem(`fitmentai-build-twin-mode:${selectedVehicle.id}`, nextModeId);
  }

  function generatePassport() {
    setScanning(true);
    setMessage("");
    window.setTimeout(() => {
      setScanning(false);
      setMessage(`Build Passport generated from ${isDemo ? "demo data" : "your saved garage data"}.`);
    }, 850);
  }

  async function copyPassport() {
    const text = [
      `FitmentAI Build Passport: ${vehicleLabel}`,
      `Mode: ${active.name}`,
      `Current setup: ${selectedVehicle.current_setup || "Not saved"}`,
      `Suspension: ${selectedVehicle.suspension_setup || "Not saved"}`,
      `Fitment readiness: ${forecast.readiness}/100`,
      `Daily drivability: ${forecast.daily}/100`,
      `Source confidence: ${forecast.source}/100`,
      `Install complexity: ${forecast.complexity}/100`,
      `Evidence: ${checkedParts.length} checked, ${riskyParts.length} risk flags, ${installedParts.length} installed`,
      "",
      "Next parts:",
      ...nextParts.map((part) => `- ${part}`),
      "",
      "Risk forecast:",
      ...risks.map((risk) => `- ${risk}`),
      "",
      "Built with FitmentAI: https://fitmentai.vercel.app/#twin",
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
      `Build a next-step plan for my ${vehicleLabel} in ${active.name} mode.`,
      `Current setup: ${selectedVehicle.current_setup || "not saved"}. Suspension: ${selectedVehicle.suspension_setup || "not saved"}.`,
      `Current forecast: ${forecast.readiness}/100 readiness, ${forecast.daily}/100 daily drivability, ${forecast.source}/100 source confidence, ${forecast.complexity}/100 install complexity.`,
      `Saved parts: ${plannedParts.length ? plannedParts.map((part) => part.name).join(", ") : "none yet"}.`,
      `Risks to solve: ${risks.join(", ")}.`,
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Garage intelligence</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5] md:text-5xl">AI Build Twin Studio.</h2>
        </div>
        <p className="text-sm leading-7 text-[#b8ac91] md:text-base">
          Turn a saved car into a living build forecast. FitmentAI now uses its saved parts, checks, warnings, sources, and install progress to explain every score.
        </p>
      </div>

      <div className="mb-5 rounded-lg border border-line bg-panel/95 p-4 shadow-glow">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <label className="block flex-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-volt">Vehicle twin</span>
            <select
              value={selectedVehicle.id}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              className="mt-2 h-12 w-full rounded-lg border border-line bg-[#09160e] px-4 font-semibold text-[#f3ead5] outline-none transition focus:border-volt"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ""}
                </option>
              ))}
              <option value={demoVehicle.id}>2017 Porsche Macan Turbo - Demo</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void loadVehicles()}
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-5 font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh garage
          </button>
          <span className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold ${isDemo ? "border-warning/40 bg-warning/10 text-[#d8cba9]" : "border-signal/40 bg-signal/10 text-[#a9d9b8]"}`}>
            <Car className="h-4 w-4" />
            {isDemo ? "Demo twin" : "Live garage twin"}
          </span>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <TwinContext label="Current setup" value={selectedVehicle.current_setup || "Not saved yet"} />
          <TwinContext label="Suspension" value={selectedVehicle.suspension_setup || "Not saved yet"} />
          <TwinContext label="Garage evidence" value={partsLoading ? "Loading saved parts..." : `${plannedParts.length} parts / ${checkedParts.length} checked / ${riskyParts.length} risks`} />
        </div>
        {message ? <p className="mt-3 text-sm text-[#d8cba9]">{message}</p> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-lg border border-line bg-panel/95 p-4 shadow-glow md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Build direction</p>
              <h3 className="mt-2 text-xl font-semibold text-[#f3ead5]">{vehicleLabel}</h3>
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
                onClick={() => selectMode(mode.id)}
                className={`rounded-lg border p-4 text-left transition ${
                  active.id === mode.id
                    ? "border-volt bg-volt/15 shadow-[0_0_34px_rgba(154,116,40,0.14)]"
                    : "border-line bg-[#09160e] hover:border-volt/70"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#f3ead5]">{mode.name}</p>
                  <span className="rounded-md border border-line bg-[#07120c] px-2 py-1 text-xs font-semibold text-[#d8cba9]">
                    {active.id === mode.id ? forecast.readiness : mode.score}/100
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#9e9278]">{mode.intent}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={generatePassport} disabled={scanning} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:opacity-70">
              {scanning ? <ScanLine className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              {scanning ? "Scanning build..." : "Generate Passport"}
            </button>
            <button type="button" onClick={() => void copyPassport()} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-5 font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt">
              <ClipboardCopy className="h-4 w-4" />
              Copy Passport
            </button>
            <button type="button" onClick={sendToAskFitmentAI} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-5 font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt sm:col-span-2">
              <MessageCircle className="h-4 w-4" />
              Ask FitmentAI to plan this build
            </button>
            <a href="#database" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-5 font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt sm:col-span-2">
              <Database className="h-4 w-4" />
              Open real parts database
            </a>
          </div>
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
                {isDemo ? "Demo build twin" : "Garage-connected twin"}
              </span>
              <span className="rounded-lg border border-line bg-[#07120c]/80 px-3 py-2 text-xs font-semibold text-[#d8cba9]">{active.budget}</span>
            </div>

            <div className="relative mx-auto mt-12 aspect-[16/7] max-w-3xl">
              <div className="absolute inset-x-[6%] bottom-[18%] h-px bg-[#38533f]" />
              <div className="absolute inset-x-[9%] rounded-t-[100px] border-2 border-[#d4a62a] bg-[#173923] shadow-[0_26px_70px_rgba(0,0,0,0.6)] transition-all duration-500" style={{ bottom: `${12 + active.stance / 8}%`, height: `${34 - active.stance / 10}%` }} />
              <div className="absolute inset-x-[19%] top-[16%] h-[40%] rounded-t-[90px] border-2 border-[#5b7b5f] bg-[#0d2416]" />
              <div className="absolute bottom-[8%] left-[12%] h-[32%] w-[18%] rounded-full border-[10px] border-[#ead28a] bg-[#07150e]" />
              <div className="absolute bottom-[8%] right-[12%] h-[32%] w-[18%] rounded-full border-[10px] border-[#ead28a] bg-[#07150e]" />
              <div className={`absolute left-[30%] top-[44%] h-2 w-[40%] rounded-full bg-gradient-to-r ${active.accent} shadow-[0_0_34px_rgba(154,116,40,0.45)]`} />
              <div className="absolute right-[8%] top-[14%] rounded-lg border border-volt/35 bg-[#07120c]/90 px-3 py-2 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#9e9278]">Readiness</p>
                <p className="text-3xl font-semibold text-volt">{forecast.readiness}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="grid gap-3">
              <TwinMetric label="Fitment readiness" value={forecast.readiness} note={`${checkedParts.length} checked, ${riskyParts.length} risks`} />
              <TwinMetric label="Daily drivability" value={forecast.daily} note={`${active.name} forecast`} />
              <TwinMetric label="Source confidence" value={forecast.source} note={`${sourcedParts.length} sourced parts`} />
              <TwinMetric label="Install complexity" value={forecast.complexity} note={`${plannedParts.length} saved parts`} invert />
            </div>
            <div className="grid gap-4">
              <PassportBlock icon={Layers3} title="Next parts" items={nextParts} />
              <PassportBlock icon={Gauge} title="Risk forecast" items={risks} />
              <PassportBlock icon={Share2} title="Why this score" items={evidence} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TwinContext({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-[#09160e] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9e9278]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#f3ead5]">{value}</p>
    </div>
  );
}

function TwinMetric({ label, value, note, invert = false }: { label: string; value: number; note: string; invert?: boolean }) {
  const displayValue = invert ? 100 - value : value;

  return (
    <div className="rounded-lg border border-line bg-[#09160e] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9e9278]">{label}</p>
        <p className="font-semibold text-[#f3ead5]">{value}/100</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#17251a]">
        <div className="h-full rounded-full bg-gradient-to-r from-signal to-volt transition-all duration-500" style={{ width: `${displayValue}%` }} />
      </div>
      <p className="mt-2 text-xs text-[#9e9278]">{note}</p>
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
          <div key={item} className="rounded-md border border-line bg-[#07120c] px-3 py-2 text-sm text-[#d8cba9]">{item}</div>
        ))}
      </div>
    </div>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}
