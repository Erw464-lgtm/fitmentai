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

    return NextResponse.json({
      query,
      sources,
      message: `Live source search prepared for ${query}.`,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}
