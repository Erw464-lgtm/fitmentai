"use client";

import { useEffect, useMemo, useState } from "react";
import { BookmarkPlus, ClipboardCopy, Database, ExternalLink, Gauge, HelpCircle, Loader2, MessageCircle, Search, ShieldCheck } from "lucide-react";

type CatalogSource = {
  id: string;
  source_name: string;
  source_type: string;
  trust_level: string;
  url: string;
  price_range: string;
  inventory_status: string;
  source_notes: string;
};

type CatalogPart = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: string;
  type: string;
  vehicle_make: string;
  vehicle_model: string;
  year_start: number;
  year_end: number;
  trim_notes: string;
  compatibility_notes: string;
  fitment_confidence: number;
  fitment_risk: string;
  install_difficulty: string;
  estimated_price: string;
  required_verification: string[];
  tags: string[];
  image_tone: string;
  sources: CatalogSource[];
};

export function PartsDatabase() {
  const [parts, setParts] = useState<CatalogPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedWhy, setExpandedWhy] = useState("");

  useEffect(() => {
    void loadCatalog();
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(parts.map((part) => part.category)))], [parts]);
  const filteredParts = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return parts.filter((part) => {
      const matchesCategory = category === "All" || part.category === category;
      const searchable = [part.title, part.brand, part.category, part.type, part.compatibility_notes, ...(part.tags || [])]
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!needle || searchable.includes(needle));
    });
  }, [category, parts, query]);

  async function loadCatalog() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/catalog-parts?year=2017&make=Porsche&model=Macan", { cache: "no-store" });
      const result = (await response.json()) as {
        parts?: CatalogPart[];
        source?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Catalog could not be loaded.");
      }

      setParts(result.parts ?? []);
      setMessage(
        result.source === "supabase"
          ? "Loaded from Supabase catalog tables."
          : result.message || "Showing starter catalog preview."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Catalog could not be loaded.");
      setParts([]);
    } finally {
      setLoading(false);
    }
  }

  async function copyPartBrief(part: CatalogPart) {
    const text = [
      `FitmentAI catalog brief: ${part.brand} ${part.title}`,
      `Vehicle: ${part.year_start}-${part.year_end} ${part.vehicle_make} ${part.vehicle_model}`,
      `Category: ${part.category} / ${part.type}`,
      `Confidence: ${part.fitment_confidence}/100`,
      `Risk: ${part.fitment_risk}`,
      `Install: ${part.install_difficulty}`,
      `Price: ${part.estimated_price}`,
      "",
      `Compatibility notes: ${part.compatibility_notes}`,
      "",
      "Verify before buying:",
      ...(part.required_verification || []).map((item) => `- ${item}`),
      "",
      "Sources:",
      ...(part.sources || []).map((source) => `- ${source.source_name} (${source.source_type}, ${source.trust_level} trust): ${source.url}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${part.brand} brief copied.`);
    } catch {
      setMessage("Clipboard blocked. Open the source and copy details manually.");
    }
  }

  function sendToGarage(part: CatalogPart) {
    const primarySource = part.sources?.[0];

    window.localStorage.setItem(
      "fitmentai-catalog-part-draft",
      JSON.stringify({
        name: `${part.brand} ${part.title}`,
        category: part.category,
        source: primarySource?.source_name || part.brand,
        sourceUrl: primarySource?.url || "",
        sourceType: primarySource?.source_type || "Retailer",
        price: primarySource?.price_range || part.estimated_price,
        fitmentClaim: `${part.compatibility_notes} Confidence: ${part.fitment_confidence}/100. Risk: ${part.fitment_risk}.`,
        notes: [
          part.trim_notes,
          `Install difficulty: ${part.install_difficulty}.`,
          `Verify: ${(part.required_verification || []).join(", ")}`,
        ]
          .filter(Boolean)
          .join(" "),
      })
    );
    setMessage(`${part.brand} draft sent to My Garage. Select a saved car, then save it to the build.`);
    window.location.hash = "garage";
  }

  function sendToFitment(part: CatalogPart) {
    window.localStorage.setItem(
      "fitmentai-fitment-draft",
      JSON.stringify({
        year: "2017",
        make: part.vehicle_make || "Porsche",
        model: part.vehicle_model || "Macan",
        trim: "Turbo",
        partCategory: normalizeFitmentCategory(part.category),
        partType: part.type || part.category,
        specificPart: `${part.brand} ${part.title} - ${part.compatibility_notes}`,
        notes: `${part.trim_notes} Verify before buying: ${(part.required_verification || []).join(", ")}.`,
      })
    );
    setMessage(`${part.brand} sent to the Fitment Checker.`);
    window.location.hash = "demo";
  }

  function sendToAsk(part: CatalogPart) {
    window.localStorage.setItem(
      "fitmentai-ask-draft",
      `Should I buy the ${part.brand} ${part.title} for my 2017 Porsche Macan Turbo? Explain the fitment score, missing proof, risks, and what I should verify before buying.`
    );
    setMessage(`${part.brand} question sent to Ask FitmentAI.`);
    window.location.hash = "ask";
  }

  return (
    <section id="database" className="relative mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="absolute inset-x-5 top-0 -z-10 h-[560px] rounded-[40px] bg-[radial-gradient(circle_at_22%_22%,rgba(154,116,40,0.16),transparent_34%),radial-gradient(circle_at_80%_50%,rgba(47,138,85,0.15),transparent_34%)] blur-2xl" />
      <div className="mb-6 grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Parts database</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5] md:text-5xl">
            A real catalog foundation for FitmentAI.
          </h2>
        </div>
        <p className="text-sm leading-7 text-[#b8ac91] md:text-base">
          This turns the MVP into a structured parts intelligence database: vehicle ranges, source trust, fitment confidence,
          risk, install difficulty, verification requirements, and source links.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-panel/95 p-4 shadow-glow md:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-volt" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search brand, category, risk, or verification notes..."
              className="h-12 w-full rounded-lg border border-line bg-[#09160e] pl-10 pr-4 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-12 rounded-lg border border-line bg-[#09160e] px-4 text-[#f3ead5] outline-none ring-volt/20 transition focus:border-volt focus:ring-4"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadCatalog()}
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Refresh
          </button>
        </div>

        {message ? (
          <p className="mt-3 rounded-lg border border-volt/25 bg-volt/10 p-3 text-sm text-[#d8cba9]">
            {message}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {filteredParts.map((part) => (
            <article key={part.id} className="overflow-hidden rounded-lg border border-line bg-[#07120c]">
              <div className={`h-24 bg-gradient-to-br ${part.image_tone || "from-[#173923] via-[#0b1810] to-[#4f3b11]"} p-4`}>
                <div className="flex h-full items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d7c28b]">
                      {part.category} / {part.type}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-[#f3ead5]">{part.brand}</h3>
                  </div>
                  <div className="rounded-lg border border-volt/40 bg-[#07120c]/80 px-3 py-2 text-center backdrop-blur">
                    <p className="text-[11px] text-[#9e9278]">Fitment</p>
                    <p className="text-xl font-semibold text-volt">{part.fitment_confidence}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-[#f3ead5]">{part.title}</h4>
                    <p className="mt-1 text-sm text-[#9e9278]">
                      {part.year_start}-{part.year_end} {part.vehicle_make} {part.vehicle_model}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyPartBrief(part)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    Copy brief
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <MiniMetric label="Risk" value={part.fitment_risk} />
                  <MiniMetric label="Install" value={part.install_difficulty} />
                  <MiniMetric label="Price" value={part.estimated_price} />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => sendToGarage(part)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-volt px-3 text-xs font-semibold text-[#07120c] transition hover:bg-[#b98d31]"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    Save draft
                  </button>
                  <button
                    type="button"
                    onClick={() => sendToFitment(part)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                  >
                    <Gauge className="h-4 w-4" />
                    Check fitment
                  </button>
                  <button
                    type="button"
                    onClick={() => sendToAsk(part)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Ask AI
                  </button>
                </div>

                <p className="mt-4 text-sm leading-6 text-[#b8ac91]">{part.compatibility_notes}</p>
                <p className="mt-2 text-xs leading-5 text-[#9e9278]">{part.trim_notes}</p>

                <div className="mt-4 rounded-lg border border-line bg-[#09160e] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-volt">
                      <HelpCircle className="h-4 w-4" />
                      Why this score?
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedWhy((current) => (current === part.id ? "" : part.id))}
                      className="rounded-md border border-line px-2 py-1 text-xs font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                    >
                      {expandedWhy === part.id ? "Hide" : "Show"}
                    </button>
                  </div>
                  {expandedWhy === part.id ? (
                    <div className="mt-3 grid gap-2 text-xs leading-5 text-[#b8ac91] sm:grid-cols-2">
                      <EvidenceLine label="What helps" value={scoreHelps(part)} />
                      <EvidenceLine label="What hurts" value={scoreHurts(part)} />
                      <EvidenceLine label="Improve score" value={scoreImprovement(part)} />
                      <EvidenceLine label="Confidence reason" value={confidenceReason(part)} />
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg border border-line bg-[#09160e] p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-volt">
                    <Database className="h-4 w-4" />
                    Fitment evidence
                  </div>
                  <div className="mt-3 grid gap-2 text-xs leading-5 text-[#b8ac91] sm:grid-cols-2">
                    <EvidenceLine label="Manufacturer claim" value={part.compatibility_notes || "No claim saved yet"} />
                    <EvidenceLine label="Source proof" value={`${part.sources?.length || 0} source${part.sources?.length === 1 ? "" : "s"} attached`} />
                    <EvidenceLine label="Verified setup match" value={part.fitment_confidence >= 85 ? "Strong Macan catalog match" : "Needs same-car install proof"} />
                    <EvidenceLine label="Missing proof" value={(part.required_verification || []).slice(0, 3).join(", ")} />
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-volt/15 bg-volt/5 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-volt">
                    <ShieldCheck className="h-4 w-4" />
                    Verify before buying
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(part.required_verification || []).map((item) => (
                      <span key={item} className="rounded-md border border-line bg-[#09160e] px-2 py-1 text-xs text-[#d8cba9]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {(part.sources || []).map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-line bg-[#09160e] p-3 transition hover:border-volt hover:bg-volt/5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[#f3ead5]">{source.source_name}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-volt">
                          Open <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#9e9278]">
                        {source.source_type} / {source.trust_level} trust / {source.inventory_status}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#b8ac91]">{source.source_notes}</p>
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {!loading && filteredParts.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-line bg-[#07120c] p-6 text-sm leading-6 text-[#9e9278]">
            No matching catalog parts yet. Try clearing search or running the catalog migration in Supabase.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-[#09160e] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-volt">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#f3ead5]">{value}</p>
    </div>
  );
}

function EvidenceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#07120c] p-3">
      <p className="font-semibold uppercase tracking-[0.12em] text-[#d7c28b]">{label}</p>
      <p className="mt-1 text-[#b8ac91]">{value || "Not available yet"}</p>
    </div>
  );
}

function scoreHelps(part: CatalogPart) {
  const helpers = [];
  if (part.sources?.some((source) => source.trust_level === "High")) helpers.push("high-trust source");
  if (part.year_start && part.year_end) helpers.push("saved year range");
  if (part.tags?.includes("Porsche") || part.tags?.includes("Macan")) helpers.push("vehicle-specific tags");
  return helpers.join(", ") || "structured catalog data";
}

function scoreHurts(part: CatalogPart) {
  const concerns = [];
  if (part.fitment_risk.toLowerCase().includes("medium")) concerns.push("fitment still needs proof");
  if (part.category === "Exterior") concerns.push("body-panel tolerance risk");
  if (part.category === "Performance") concerns.push("supporting mod / legality checks");
  return concerns.join(", ") || "few obvious blockers";
}

function scoreImprovement(part: CatalogPart) {
  return `Add same-car install proof, exact part number, and ${part.required_verification?.[0] || "manufacturer fitment notes"}.`;
}

function confidenceReason(part: CatalogPart) {
  return `${part.fitment_confidence}/100 because FitmentAI has ${part.sources?.length || 0} source${part.sources?.length === 1 ? "" : "s"}, ${part.required_verification?.length || 0} verification checks, and a ${part.fitment_risk} risk rating.`;
}

function normalizeFitmentCategory(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes("wheel")) return "wheels";
  if (lower.includes("tire")) return "tires";
  if (lower.includes("suspension")) return "suspension";
  if (lower.includes("spacer") || lower.includes("adapter")) return "spacers-adapters";
  if (lower.includes("brake")) return "brakes";
  if (lower.includes("exterior")) return "exterior";
  return "performance-interior";
}
