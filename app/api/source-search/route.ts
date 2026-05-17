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
    confidence: 92,
    warning: "Best for genuine accessories, but confirm region, dealer availability, and exact model generation.",
  },
  {
    id: "rennline",
    source: "Rennline",
    sourceType: "Manufacturer",
    domain: "rennline.com",
    url: "https://www.rennline.com/search?q=",
    confidence: 88,
    warning: "Strong Porsche aftermarket source. Confirm exact chassis, trim notes, and install instructions.",
  },
  {
    id: "aa-carbon",
    source: "AA Carbon Parts",
    sourceType: "Retailer",
    domain: "aacarbonparts.com",
    url: "https://aacarbonparts.com/search?q=",
    confidence: 74,
    warning: "Good carbon source candidate. Verify product photos, material, return policy, and exact fitment claim.",
  },
  {
    id: "ahacarbon",
    source: "AhaCarbon",
    sourceType: "Retailer",
    domain: "ahacarbon.com",
    url: "https://ahacarbon.com/search?q=",
    confidence: 76,
    warning: "Useful for carbon aero searches. Confirm vehicle years, installation method, and shipping/return terms.",
  },
  {
    id: "pelican-parts",
    source: "Pelican Parts",
    sourceType: "Retailer",
    domain: "pelicanparts.com",
    url: "https://www.google.com/search?q=",
    confidence: 82,
    warning: "Good Porsche catalog source. Confirm OEM/OES/aftermarket distinction and part number.",
  },
  {
    id: "suncoast",
    source: "Suncoast Porsche Parts",
    sourceType: "Retailer",
    domain: "suncoastparts.com",
    url: "https://www.google.com/search?q=",
    confidence: 84,
    warning: "Strong genuine Porsche parts candidate. Confirm exact trim and dealer fitment notes.",
  },
  {
    id: "flat-6",
    source: "Flat 6 Motorsports",
    sourceType: "Shop",
    domain: "flat6motorsports.com",
    url: "https://www.google.com/search?q=",
    confidence: 83,
    warning: "Good Porsche performance source. Confirm supporting mods and install complexity.",
  },
  {
    id: "ecs",
    source: "ECS Tuning",
    sourceType: "Retailer",
    domain: "ecstuning.com",
    url: "https://www.google.com/search?q=",
    confidence: 80,
    warning: "Broad catalog source. Confirm brand, part number, and fitment notes before buying.",
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
      const sourceUrl = source.url.includes("google.com/search")
        ? `${source.url}${encodeURIComponent(sourceQuery)}`
        : `${source.url}${encodeURIComponent(query)}`;

      return {
        id: source.id,
        name: partName,
        category,
        source: source.source,
        sourceUrl,
        sourceType: source.sourceType,
        price: "Live source",
        confidence: source.confidence,
        fitmentClaim: `Live search for ${query} on ${source.source}.`,
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
