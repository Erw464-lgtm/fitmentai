import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type SourceSearchPayload = {
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
    trim?: string | null;
  };
  part?: {
    name?: string;
    category?: string;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const sourceDirectory = [
  {
    id: "porsche-tequipment",
    source: "Porsche Genuine / Tequipment",
    sourceType: "Manufacturer",
    domain: "porsche.com",
    url: "https://www.porsche.com/usa/accessoriesandservices/tequipment/",
    searchMode: "direct",
    confidence: 93,
    specialty: "OEM accessories, genuine Porsche add-ons, dealer-supported parts",
    warning: "Best for genuine accessories, but confirm region, dealer availability, and exact Macan generation.",
  },
  {
    id: "rennline",
    source: "Rennline",
    sourceType: "Manufacturer",
    domain: "rennline.com",
    url: "https://www.rennline.com/search?q=",
    searchMode: "query",
    confidence: 90,
    specialty: "Billet parts, interior upgrades, mounts, suspension, track accessories, aero, carbon",
    warning: "Strong Porsche aftermarket source. Confirm exact chassis, trim notes, and install instructions.",
  },
  {
    id: "pelican-parts",
    source: "Pelican Parts",
    sourceType: "Retailer",
    domain: "pelicanparts.com",
    url: "https://www.google.com/search?q=",
    searchMode: "site",
    confidence: 86,
    specialty: "OEM/OEM+ Porsche maintenance parts, DIY guides, repair articles, forum knowledge",
    warning: "Great research source. Confirm whether the part is OEM, OES, aftermarket, or only a guide/article result.",
  },
  {
    id: "aa-carbon",
    source: "AA Carbon",
    sourceType: "Retailer",
    domain: "aacarbonparts.com",
    url: "https://aacarbonparts.com/search?q=",
    searchMode: "query",
    confidence: 74,
    specialty: "Carbon fiber aero, spoilers, diffusers, lips, body pieces, interior carbon",
    warning: "Carbon parts need extra fitment proof. Verify photos, mounting method, material, shipping, and return policy.",
  },
  {
    id: "fabspeed",
    source: "Fabspeed Motorsport",
    sourceType: "Manufacturer",
    domain: "fabspeed.com",
    url: "https://www.google.com/search?q=",
    searchMode: "site",
    confidence: 87,
    specialty: "Premium Porsche exhausts, intakes, headers, tunes, and performance upgrades",
    warning: "Performance parts can affect warranty, emissions, sound level, heat, and tune requirements.",
  },
  {
    id: "soul",
    source: "Soul Performance Products",
    sourceType: "Manufacturer",
    domain: "soulpp.com",
    url: "https://www.google.com/search?q=",
    searchMode: "site",
    confidence: 86,
    specialty: "High-end Porsche exhaust systems and performance hardware",
    warning: "Confirm exhaust fitment, valve compatibility, emissions legality, sound expectations, and install hardware.",
  },
  {
    id: "numeric-racing",
    source: "Numeric Racing",
    sourceType: "Manufacturer",
    domain: "numericracing.com",
    url: "https://numericracing.com/search?q=",
    searchMode: "query",
    confidence: 80,
    specialty: "Porsche shifters, cables, pedals, and driver feel upgrades",
    warning: "Best for Porsche manual/track feel parts. Confirm transmission compatibility before saving.",
  },
  {
    id: "ahacarbon",
    source: "AhaCarbon",
    sourceType: "Retailer",
    domain: "ahacarbon.com",
    url: "https://ahacarbon.com/search?q=",
    searchMode: "query",
    confidence: 72,
    specialty: "Factory-direct carbon fiber aero and styling parts",
    warning: "Confirm Porsche model availability, year range, weave, finish, install method, and return terms.",
  },
  {
    id: "suncoast",
    source: "Suncoast Porsche Parts",
    sourceType: "Retailer",
    domain: "suncoastparts.com",
    url: "https://www.google.com/search?q=",
    searchMode: "site",
    confidence: 88,
    specialty: "OEM Porsche dealer parts, accessories, curated enthusiast upgrades",
    warning: "Strong OEM/dealer source. Confirm exact Macan generation, trim, and whether the item is genuine or curated aftermarket.",
  },
  {
    id: "ecs",
    source: "ECS Tuning",
    sourceType: "Retailer",
    domain: "ecstuning.com",
    url: "https://www.ecstuning.com/Search/SiteSearch/",
    searchMode: "path",
    confidence: 81,
    specialty: "Large Euro enthusiast catalog for Porsche, Audi, BMW, VW parts",
    warning: "Broad catalog source. Confirm brand, vehicle selector fitment, part number, and return terms.",
  },
  {
    id: "fcp-euro",
    source: "FCP Euro",
    sourceType: "Retailer",
    domain: "fcpeuro.com",
    url: "https://www.fcpeuro.com/products?keywords=",
    searchMode: "query",
    confidence: 84,
    specialty: "Euro maintenance, OEM/OE parts, replacement parts, lifetime replacement angle",
    warning: "Best for maintenance/OE parts. Confirm Porsche catalog coverage and whether the part is performance or replacement.",
  },
  {
    id: "flat-6",
    source: "Flat 6 Motorsports",
    sourceType: "Shop",
    domain: "flat6motorsports.com",
    url: "https://flat6motorsports.com/search?q=",
    searchMode: "query",
    confidence: 85,
    specialty: "Boutique Porsche performance, aero, wheels, tuning, and curated aftermarket parts",
    warning: "Good Porsche specialist source. Confirm supporting mods, install complexity, and whether it fits the Macan platform.",
  },
];

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `source-search:post:${getClientIp(request)}`,
      limit: 80,
      windowMs: 60_000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many source searches. Try again soon." }, { status: 429 });
    }

    const body = (await request.json()) as SourceSearchPayload;
    const vehicleLabel = [
      body.vehicle?.year,
      body.vehicle?.make,
      body.vehicle?.model,
      body.vehicle?.trim,
    ]
      .filter(Boolean)
      .join(" ");
    const partName = body.part?.name?.trim() || "aftermarket part";
    const category = body.part?.category?.trim() || "Performance";
    const query = [vehicleLabel, partName, category].filter(Boolean).join(" ");

    if (!query.trim()) {
      return NextResponse.json({ error: "Search query is required." }, { status: 400 });
    }

    const sources = sourceDirectory.map((source) => {
      const sourceQuery = `${query} site:${source.domain}`;
      const sourceUrl = buildSourceUrl(source, query, sourceQuery);

      return {
        id: source.id,
        name: partName,
        category,
        source: source.source,
        sourceUrl,
        sourceType: source.sourceType,
        price: "Live source",
        confidence: source.confidence,
        fitmentClaim: `Live search for ${query} on ${source.source}. Specialty: ${source.specialty}.`,
        warning: source.warning,
        notes: `Live source search candidate for ${vehicleLabel || "selected vehicle"}. Open the source, confirm the exact listing, then save and run a fitment check.`,
      };
    });
    const aiResult = await getAiSourceReadout({
      query,
      vehicleLabel,
      partName,
      category,
      sources,
    });

    return NextResponse.json({
      query,
      sources,
      aiProvider: aiResult.provider,
      aiSummary: aiResult.summary,
      message: `Live source search prepared for ${query}.`,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

function buildSourceUrl(
  source: {
    url: string;
    searchMode: string;
  },
  query: string,
  sourceQuery: string
) {
  if (source.searchMode === "direct") {
    return source.url;
  }

  if (source.searchMode === "site") {
    return `${source.url}${encodeURIComponent(sourceQuery)}`;
  }

  if (source.searchMode === "path") {
    return `${source.url}${encodeURIComponent(query).replace(/%20/g, "+")}`;
  }

  return `${source.url}${encodeURIComponent(query)}`;
}

async function getAiSourceReadout({
  query,
  vehicleLabel,
  partName,
  category,
  sources,
}: {
  query: string;
  vehicleLabel: string;
  partName: string;
  category: string;
  sources: Array<{
    source: string;
    sourceType: string;
    confidence: number;
    warning: string;
  }>;
}) {
  const fallback = buildLocalSourceReadout(sources);
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return {
      provider: "mock",
      summary: fallback,
    };
  }

  try {
    const model = normalizeGeminiModel(process.env.GEMINI_MODEL);
    const prompt = [
      "You are FitmentAI, an automotive parts sourcing assistant.",
      "Rank these source-search candidates for a buyer who wants the safest source to inspect before saving a part.",
      "Do not claim that a source definitely has the part. These are search links, not confirmed product listings.",
      "Give concise practical advice with these exact labels: Best first source, Why, Watch-outs, Next step.",
      "Keep it under 130 words.",
      "",
      `Vehicle: ${vehicleLabel || "not selected"}`,
      `Part: ${partName}`,
      `Category: ${category}`,
      `Search query: ${query}`,
      "",
      "Sources:",
      sources
        .map((source) => `- ${source.source} (${source.sourceType}), confidence ${source.confidence}/100, warning: ${source.warning}`)
        .join("\n"),
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 260,
          },
        }),
        cache: "no-store",
      }
    );
    const data = (await response.json()) as GeminiResponse & { error?: { message?: string } };

    if (!response.ok) {
      return {
        provider: "mock",
        summary: fallback,
        message: data.error?.message,
      };
    }

    const summary = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim();

    return {
      provider: summary ? "gemini" : "mock",
      summary: summary || fallback,
    };
  } catch {
    return {
      provider: "mock",
      summary: fallback,
    };
  }
}

function buildLocalSourceReadout(
  sources: Array<{
    source: string;
    sourceType: string;
    confidence: number;
    warning: string;
  }>
) {
  const best = [...sources].sort((a, b) => b.confidence - a.confidence)[0];

  if (!best) {
    return "Best first source: Run a source search first.\nWhy: FitmentAI needs source candidates before ranking them.\nWatch-outs: Confirm exact year, trim, and part number.\nNext step: Open the strongest listing, then save it to the build.";
  }

  return `Best first source: ${best.source}\nWhy: It has the strongest source confidence in this search set.\nWatch-outs: ${best.warning}\nNext step: Open the source, confirm the exact listing, save it to the build, then run a fitment check.`;
}

function normalizeGeminiModel(model?: string) {
  return (model || "gemini-2.5-flash-lite").trim().replace(/^models\//, "");
}
