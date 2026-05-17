import { NextResponse } from "next/server";
import { getSupabaseStatus, selectSupabaseRows } from "@/lib/supabaseRest";

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
  sources?: CatalogSource[];
};

type CatalogSource = {
  id: string;
  part_id: string;
  source_name: string;
  source_type: string;
  trust_level: string;
  url: string;
  price_range: string;
  source_priority: number;
  inventory_status: string;
  source_notes: string;
};

const partSelect = [
  "id",
  "slug",
  "title",
  "brand",
  "category",
  "type",
  "vehicle_make",
  "vehicle_model",
  "year_start",
  "year_end",
  "trim_notes",
  "compatibility_notes",
  "fitment_confidence",
  "fitment_risk",
  "install_difficulty",
  "estimated_price",
  "required_verification",
  "tags",
  "image_tone",
].join(",");

const sourceSelect = [
  "id",
  "part_id",
  "source_name",
  "source_type",
  "trust_level",
  "url",
  "price_range",
  "source_priority",
  "inventory_status",
  "source_notes",
].join(",");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make") || "Porsche";
  const model = searchParams.get("model") || "Macan";
  const year = Number(searchParams.get("year") || "2017");

  const partResult = await selectSupabaseRows({
    table: "parts",
    query: [
      `select=${partSelect}`,
      `vehicle_make=ilike.${encodeURIComponent(make)}`,
      `vehicle_model=ilike.${encodeURIComponent(model)}`,
      `year_start=lte.${year}`,
      `year_end=gte.${year}`,
      "order=fitment_confidence.desc,title.asc",
      "limit=50",
    ].join("&"),
  });

  if (!partResult.ok || !Array.isArray(partResult.data)) {
    const demoMode = getSupabaseStatus() === "missing-config";

    return NextResponse.json({
      parts: fallbackCatalog,
      demoMode,
      source: "fallback",
      message: demoMode
        ? "Supabase is not configured, so FitmentAI is showing the built-in catalog preview."
        : "Run real-parts-catalog-migration.sql in Supabase to enable the richer catalog tables.",
      error: partResult.error,
    });
  }

  const parts = partResult.data as CatalogPart[];
  const ids = parts.map((part) => part.id).filter(Boolean);

  if (!ids.length) {
    return NextResponse.json({
      parts: fallbackCatalog,
      demoMode: false,
      source: "fallback",
      message: "No catalog rows matched this vehicle yet, so FitmentAI is showing the starter Porsche Macan catalog.",
    });
  }

  const sourceResult = await selectSupabaseRows({
    table: "part_sources",
    query: `select=${sourceSelect}&part_id=in.(${ids.join(",")})&order=source_priority.asc`,
  });
  const sources = sourceResult.ok && Array.isArray(sourceResult.data) ? (sourceResult.data as CatalogSource[]) : [];
  const sourcesByPart = sources.reduce<Record<string, CatalogSource[]>>((groups, source) => {
    groups[source.part_id] = [...(groups[source.part_id] || []), source];
    return groups;
  }, {});

  return NextResponse.json({
    parts: parts.map((part) => ({
      ...part,
      sources: sourcesByPart[part.id] || [],
    })),
    demoMode: false,
    source: "supabase",
  });
}

const fallbackCatalog: CatalogPart[] = [
  {
    id: "fallback-fabspeed-intake",
    slug: "2017-porsche-macan-turbo-fabspeed-high-flow-intake",
    title: "High-flow intake research candidate",
    brand: "Fabspeed Motorsport",
    category: "Performance",
    type: "Intake",
    vehicle_make: "Porsche",
    vehicle_model: "Macan",
    year_start: 2015,
    year_end: 2018,
    trim_notes: "Research candidate for 2017 Porsche Macan Turbo-style performance planning.",
    compatibility_notes: "Verify engine, emissions legality, sensor fitment, heat shield, and hardware before buying.",
    fitment_confidence: 82,
    fitment_risk: "Medium",
    install_difficulty: "Moderate",
    estimated_price: "$450-$900 research range",
    required_verification: ["Engine/trim compatibility", "Emissions legality", "Sensor fitment", "Hardware included"],
    tags: ["Porsche", "Macan", "Turbo", "Performance", "Intake"],
    image_tone: "from-[#102a1a] via-[#07120c] to-[#5d4614]",
    sources: [
      {
        id: "fallback-source-fabspeed",
        part_id: "fallback-fabspeed-intake",
        source_name: "Fabspeed Motorsport",
        source_type: "Manufacturer",
        trust_level: "High",
        url: "https://www.google.com/search?q=site%3Afabspeed.com+2017+Porsche+Macan+Turbo+intake",
        price_range: "$450-$900 research range",
        source_priority: 1,
        inventory_status: "Research",
        source_notes: "Manufacturer search link; verify the exact product page.",
      },
    ],
  },
  {
    id: "fallback-aa-carbon-spoiler",
    slug: "2017-porsche-macan-turbo-aa-carbon-rear-spoiler",
    title: "Carbon rear spoiler research candidate",
    brand: "AA Carbon",
    category: "Exterior",
    type: "Spoiler",
    vehicle_make: "Porsche",
    vehicle_model: "Macan",
    year_start: 2015,
    year_end: 2018,
    trim_notes: "Confirm hatch shape, finish, mounting method, and return policy.",
    compatibility_notes: "Carbon aero needs stronger photo proof because fit and finish vary.",
    fitment_confidence: 70,
    fitment_risk: "Medium-high",
    install_difficulty: "Easy-moderate",
    estimated_price: "$350-$900 research range",
    required_verification: ["Hatch/body shape", "Mounting method", "Weave and finish", "Return policy"],
    tags: ["Porsche", "Macan", "Exterior", "Carbon", "Spoiler"],
    image_tone: "from-[#173923] via-[#0b1810] to-[#4f3b11]",
    sources: [
      {
        id: "fallback-source-aa-carbon",
        part_id: "fallback-aa-carbon-spoiler",
        source_name: "AA Carbon",
        source_type: "Retailer",
        trust_level: "Medium",
        url: "https://aacarbonparts.com/search?q=2017%20Porsche%20Macan%20rear%20spoiler",
        price_range: "$350-$900 research range",
        source_priority: 1,
        inventory_status: "Research",
        source_notes: "Carbon aero source; verify photos and return terms.",
      },
    ],
  },
  {
    id: "fallback-suncoast-oem",
    slug: "2017-porsche-macan-turbo-suncoast-oem-accessory",
    title: "OEM accessory research candidate",
    brand: "Suncoast Porsche Parts",
    category: "Exterior",
    type: "OEM accessory",
    vehicle_make: "Porsche",
    vehicle_model: "Macan",
    year_start: 2015,
    year_end: 2018,
    trim_notes: "Dealer/OEM source. Confirm genuine Porsche part number and model year range.",
    compatibility_notes: "Useful for validating factory accessory fitment and part numbers.",
    fitment_confidence: 90,
    fitment_risk: "Low-medium",
    install_difficulty: "Varies",
    estimated_price: "Varies by accessory",
    required_verification: ["Genuine part number", "Dealer availability", "Year range", "Trim notes"],
    tags: ["Porsche", "Macan", "OEM", "Exterior", "Accessory"],
    image_tone: "from-[#0f2b1a] via-[#07120c] to-[#49370f]",
    sources: [
      {
        id: "fallback-source-suncoast",
        part_id: "fallback-suncoast-oem",
        source_name: "Suncoast Porsche Parts",
        source_type: "Retailer",
        trust_level: "High",
        url: "https://www.google.com/search?q=site%3Asuncoastparts.com+2017+Porsche+Macan+accessory",
        price_range: "Varies",
        source_priority: 1,
        inventory_status: "Research",
        source_notes: "Dealer/OEM source for part number confirmation.",
      },
    ],
  },
];
