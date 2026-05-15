"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, Car, CheckCircle2, Gauge, Loader2, Send, Sparkles, Wrench } from "lucide-react";
import { getAuthHeaders } from "@/lib/clientAuth";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: string | null;
};

type GarageVehicle = {
  id: string;
  user_id: string | null;
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
  price: string | null;
  status: "planned" | "installed";
  fitment_score: number | null;
  fitment_status: string | null;
  fitment_warning: string | null;
  fitment_recommendation: string | null;
  notes: string | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const starterQuestions = [
  "What is the smartest next part to buy?",
  "Which saved parts need a fitment check?",
  "What has the highest fitment risk?",
  "Make this build more daily drivable.",
];

export function AskFitmentAI() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [plannedParts, setPlannedParts] = useState<PlannedPart[]>([]);
  const [question, setQuestion] = useState("What should I check before buying my next part?");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about your saved car, planned parts, fitment scores, warnings, or what to buy next. I will use your garage context.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [aiProvider, setAiProvider] = useState("Checking AI");
  const [aiProviderMessage, setAiProviderMessage] = useState("Checking whether live Gemini is connected.");

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0],
    [selectedVehicleId, vehicles]
  );
  const checkedParts = plannedParts.filter((part) => part.fitment_score !== null);
  const riskyParts = plannedParts.filter((part) => (part.fitment_score ?? 100) < 70 || Boolean(part.fitment_warning));
  const uncheckedParts = plannedParts.filter((part) => part.fitment_score === null);
  const averageScore = checkedParts.length
    ? Math.round(checkedParts.reduce((total, part) => total + (part.fitment_score || 0), 0) / checkedParts.length)
    : null;

  useEffect(() => {
    void loadAiStatus();

    const savedProfile = window.localStorage.getItem("fitmentai-profile");

    if (!savedProfile) {
      setContextLoading(false);
      return;
    }

    try {
      const parsedProfile = JSON.parse(savedProfile) as Profile;
      setProfile(parsedProfile);
      void loadVehicles(parsedProfile.id);
    } catch {
      window.localStorage.removeItem("fitmentai-profile");
      setContextLoading(false);
    }
  }, []);

  async function loadAiStatus() {
    try {
      const response = await fetch("/api/ask", { cache: "no-store" });
      const result = (await response.json()) as { provider?: string; label?: string; model?: string | null };

      setAiProvider(result.provider === "gemini" ? "Gemini live" : result.label || "Local fallback");
      setAiProviderMessage(
        result.provider === "gemini"
          ? `Live Gemini is connected${result.model ? ` using ${result.model}` : ""}.`
          : "Gemini is not connected, so Ask FitmentAI will use the local fallback."
      );
    } catch {
      setAiProvider("Local fallback");
      setAiProviderMessage("Could not confirm Gemini status, so the badge will update after your next question.");
    }
  }

  useEffect(() => {
    if (selectedVehicle?.id) {
      void loadPlannedParts(selectedVehicle.id);
    } else {
      setPlannedParts([]);
    }
  }, [selectedVehicle?.id]);

  async function loadVehicles(profileId: string) {
    setContextLoading(true);

    try {
      const response = await fetch("/api/vehicles", {
        cache: "no-store",
        headers: getAuthHeaders(),
      });
      const result = (await response.json()) as { vehicles?: GarageVehicle[] };
      const nextVehicles = result.vehicles ?? [];

      setVehicles(nextVehicles);
      setSelectedVehicleId(nextVehicles[0]?.id ?? "");
    } catch {
      setVehicles([]);
    } finally {
      setContextLoading(false);
    }
  }

  async function loadPlannedParts(vehicleId: string) {
    try {
      const response = await fetch(`/api/planned-parts?vehicleId=${encodeURIComponent(vehicleId)}`, {
        cache: "no-store",
        headers: getAuthHeaders(),
      });
      const result = (await response.json()) as { plannedParts?: PlannedPart[] };
      setPlannedParts(result.plannedParts ?? []);
    } catch {
      setPlannedParts([]);
    }
  }

  async function askQuestion(event?: React.FormEvent<HTMLFormElement>, preset?: string) {
    event?.preventDefault();
    const nextQuestion = (preset || question).trim();

    if (!nextQuestion) {
      return;
    }

    setLoading(true);
    setMessages((current) => [...current, { role: "user", content: nextQuestion }]);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: nextQuestion,
          profile,
          vehicle: selectedVehicle,
          plannedParts,
        }),
      });
      const result = (await response.json()) as { answer?: string; provider?: string; error?: string };
      const answer = result.answer || buildMockAnswer(nextQuestion, selectedVehicle, plannedParts, profile);

      setAiProvider(result.provider === "gemini" ? "Gemini live" : "Local fallback");
      setAiProviderMessage(
        result.provider === "gemini"
          ? "Last answer was generated with live Gemini."
          : "Last answer used the local fallback response."
      );
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
      setQuestion("");
    } catch {
      const answer = buildMockAnswer(nextQuestion, selectedVehicle, plannedParts, profile);
      setAiProvider("Local fallback");
      setAiProviderMessage("The API request failed, so this answer used the local fallback response.");
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
      setQuestion("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="ask" className="relative mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="absolute inset-x-5 top-0 -z-10 h-[460px] rounded-[40px] bg-[radial-gradient(circle_at_20%_30%,rgba(154,116,40,0.16),transparent_34%),radial-gradient(circle_at_80%_45%,rgba(47,138,85,0.16),transparent_36%)] blur-2xl" />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-line bg-panel/95 p-5 shadow-glow md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Ask FitmentAI</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5]">Build intelligence cockpit.</h2>
              <p className="mt-4 leading-7 text-[#b8ac91]">
                Ask about saved cars, planned parts, fitment scores, warnings, buyer priority, and build direction.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-volt/25 bg-volt/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#d8cba9]">
              <Sparkles className="h-4 w-4 text-volt" />
              AI-ready assistant
            </span>
          </div>

          <div className="mt-6 rounded-lg border border-volt/15 bg-volt/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#f3ead5]">
                <Car className="h-4 w-4 text-volt" />
                Active garage context
              </div>
              <span className="rounded-md border border-line bg-[#07120c] px-3 py-1 text-xs text-[#9e9278]">
                {contextLoading ? "Loading" : selectedVehicle ? "Connected" : "Needs vehicle"}
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
                Vehicle
                <select
                  value={selectedVehicleId}
                  onChange={(event) => setSelectedVehicleId(event.target.value)}
                  className="h-11 rounded-lg border border-line bg-[#09160e] px-3 text-[#f3ead5] outline-none ring-volt/20 transition focus:border-volt focus:ring-4"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicleName(vehicle)}
                    </option>
                  ))}
                  {vehicles.length === 0 ? <option>No saved vehicles yet</option> : null}
                </select>
              </label>
              <ContextLine label="Profile" value={profile ? profile.display_name || profile.email : "Sign in from My Garage"} />
              <ContextLine label="Current setup" value={selectedVehicle?.current_setup || "No vehicle selected"} />
              <ContextLine label="Dream setup" value={selectedVehicle?.dream_setup || "No dream setup saved"} />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard icon={Gauge} label="Avg score" value={averageScore === null ? "N/A" : `${averageScore}/100`} />
            <MetricCard icon={AlertTriangle} label="Risk flags" value={`${riskyParts.length}`} tone={riskyParts.length ? "warning" : "good"} />
            <MetricCard icon={Wrench} label="Unchecked" value={`${uncheckedParts.length}`} />
          </div>

          <div className="mt-4 rounded-lg border border-line bg-[#07120c] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-volt">Parts memory</p>
              <span className="text-xs text-[#9e9278]">{plannedParts.length} saved</span>
            </div>
            <div className="mt-3 grid gap-2">
              {plannedParts.slice(0, 3).map((part) => (
                <div key={part.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-[#09160e] px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-[#f3ead5]">{part.name}</p>
                    <p className="mt-1 text-xs text-[#9e9278]">{part.category}{part.source ? ` - ${part.source}` : ""}</p>
                  </div>
                  <span className="rounded-md border border-volt/20 bg-volt/10 px-2 py-1 text-xs font-semibold text-[#d8cba9]">
                    {part.fitment_score === null ? "Unchecked" : `${part.fitment_score}/100`}
                  </span>
                </div>
              ))}
              {plannedParts.length === 0 ? (
                <p className="rounded-md border border-dashed border-line bg-[#09160e] px-3 py-3 text-sm text-[#9e9278]">
                  Add planned parts in My Garage so FitmentAI has more build context.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-volt/15 bg-volt/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-volt">AI integration ready</p>
              <span className="rounded-md border border-line bg-[#07120c] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9e9278]">
                {aiProvider}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#b8ac91]">
              {aiProviderMessage}
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-volt">Suggested questions</p>
            {starterQuestions.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => void askQuestion(undefined, starter)}
                className="rounded-lg border border-line bg-[#09160e] px-4 py-3 text-left text-sm text-[#d8cba9] transition hover:border-volt hover:text-volt"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[520px] flex-col rounded-lg border border-line bg-[#07120c] p-4 shadow-volt md:min-h-[640px] md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-volt">
              <Bot className="h-4 w-4" />
              Fitment command chat
            </div>
            <span className="rounded-md border border-volt/20 bg-volt/10 px-3 py-1 text-xs text-[#d8cba9]">
              {contextLoading ? "Loading context" : "Garage context ready"}
            </span>
          </div>

          <div className="mt-5 grid flex-1 content-start gap-3 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-lg border p-4 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "border-volt/15 bg-volt/5 text-[#d8cba9]"
                    : "border-line bg-[#0a180f] text-[#f3ead5]"
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-volt">
                  {message.role === "assistant" ? <Sparkles className="h-3.5 w-3.5" /> : null}
                  {message.role === "assistant" ? "FitmentAI" : "You"}
                </div>
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
            ))}
          </div>

          <form onSubmit={(event) => void askQuestion(event)} className="mt-5 grid gap-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about a part, score, warning, or what to buy next..."
              rows={3}
              className="min-h-24 rounded-lg border border-line bg-[#09160e] px-4 py-3 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Ask
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function buildMockAnswer(
  question: string,
  vehicle: GarageVehicle | undefined,
  plannedParts: PlannedPart[],
  profile: Profile | null
) {
  if (!profile) {
    return "Sign in from My Garage first so I can use your saved cars and planned parts. After that, I can answer with garage context instead of generic advice.";
  }

  if (!vehicle) {
    return "I do not see a saved vehicle under this profile yet. Add a car in My Garage, then I can help plan parts, fitment checks, and next steps.";
  }

  const lowerQuestion = question.toLowerCase();
  const riskyParts = plannedParts.filter((part) => (part.fitment_score ?? 100) < 70 || Boolean(part.fitment_warning));
  const uncheckedParts = plannedParts.filter((part) => part.fitment_score === null);
  const checkedParts = plannedParts.filter((part) => part.fitment_score !== null);
  const nextPart = uncheckedParts[0] || riskyParts[0] || plannedParts.find((part) => part.status === "planned");
  const vehicleLabel = vehicleName(vehicle);
  const contextLine = `${vehicleLabel} | current: ${vehicle.current_setup || "not saved"} | suspension: ${vehicle.suspension_setup || "not saved"}`;

  if (
    lowerQuestion.includes("horsepower") ||
    lowerQuestion.includes("hp") ||
    lowerQuestion.includes("turbo") ||
    lowerQuestion.includes("tune") ||
    lowerQuestion.includes("power") ||
    lowerQuestion.includes("performance")
  ) {
    return `Performance estimate\n${contextLine}\n\nA turbo upgrade can add meaningful horsepower, but the exact gain depends on the turbo size, tune, fuel, intercooler, downpipe/exhaust flow, and engine health. For a ${vehicleLabel}, I would treat this as a high-impact performance mod that needs supporting parts and professional tuning, not a simple bolt-on estimate.\n\nNext step: compare manufacturer dyno charts for the exact turbo kit, confirm ECU tuning support, and check heat management before buying.`;
  }

  if (lowerQuestion.includes("risk") || lowerQuestion.includes("warning") || lowerQuestion.includes("fit")) {
    if (riskyParts.length === 0 && uncheckedParts.length === 0) {
      return `Garage readout\n${contextLine}\n\nNo unresolved fitment warnings are saved right now. I would still verify exact trim, drivetrain, mounting points, brake clearance, and seller fitment notes before purchase.`;
    }

    const riskSummary = [...riskyParts, ...uncheckedParts]
      .slice(0, 3)
      .map((part) => {
        if (part.fitment_score !== null) {
          return `- ${part.name}: ${part.fitment_score}/100, ${part.fitment_warning || "review recommended"}`;
        }
        return `- ${part.name}: not checked yet`;
      })
      .join("\n");

    return `Fitment risk readout\n${contextLine}\n\nMain review items:\n${riskSummary}\n\nRecommendation: run checks on unchecked parts first, then fix or replace anything with a low score before buying more parts.`;
  }

  if (lowerQuestion.includes("next") || lowerQuestion.includes("buy") || lowerQuestion.includes("recommend")) {
    if (!nextPart) {
      return `Next move\n${contextLine}\n\nNo planned parts are saved yet. Add 2 or 3 parts you are considering, then I can rank them by fitment risk, install priority, and build impact.`;
    }

    return `Next buy recommendation\n${contextLine}\n\nFocus on: ${nextPart.name}\nCategory: ${nextPart.category}${nextPart.source ? `\nSource: ${nextPart.source}` : ""}${nextPart.price ? `\nPrice: ${nextPart.price}` : ""}\n\nWhy: it is the next unresolved item in the build plan. Before buying, run or review its fitment check, confirm exact trim compatibility, and compare it against at least one verified install on the same generation.`;
  }

  if (lowerQuestion.includes("summarize") || lowerQuestion.includes("setup")) {
    return `Build summary\nVehicle: ${vehicleLabel}\nCurrent setup: ${vehicle.current_setup || "not saved yet"}\nSuspension: ${vehicle.suspension_setup || "not saved yet"}\nDream setup: ${vehicle.dream_setup || "not saved yet"}\nParts to buy: ${vehicle.parts_to_buy || "not saved yet"}\nPlanned parts: ${plannedParts.length ? plannedParts.map((part) => `${part.name}${part.fitment_score !== null ? ` (${part.fitment_score}/100)` : ""}`).join(", ") : "none yet"}`;
  }

  if (lowerQuestion.includes("daily") || lowerQuestion.includes("drivable") || lowerQuestion.includes("street")) {
    return `Daily drivability advice\n${contextLine}\n\nKeep tire sizing conservative, avoid aggressive spacers until clearance is proven, and prioritize parts with saved fitment checks above 75/100. For this build, I would verify suspension travel, rubbing risk, and any exterior mounting points before moving to more aggressive parts.`;
  }

  return `Garage recommendation\n${contextLine}\n\nSaved parts: ${plannedParts.length}\nChecked parts: ${checkedParts.length}\nUnchecked parts: ${uncheckedParts.length}\nRisk flags: ${riskyParts.length}\n\nBest next step: run fitment checks on unchecked parts first, resolve low-score warnings, then buy the parts with the clearest vehicle-specific fitment evidence.`;
}

function vehicleName(vehicle: GarageVehicle) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
}

function ContextLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-[#07120c] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-volt">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#b8ac91]">{value}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  tone?: "default" | "good" | "warning";
}) {
  const toneClass =
    tone === "good"
      ? "border-signal/25 bg-signal/10 text-signal"
      : tone === "warning"
        ? "border-warning/35 bg-warning/10 text-orange-200"
        : "border-volt/25 bg-volt/10 text-volt";

  return (
    <div className="rounded-lg border border-line bg-[#07120c] p-4">
      <div className={`grid h-9 w-9 place-items-center rounded-lg border ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#9e9278]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#f3ead5]">{value}</p>
    </div>
  );
}
