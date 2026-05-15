import { NextResponse } from "next/server";
import { scoreFitment, type FitmentRequest } from "@/lib/fitmentScore";
import { getSupabaseStatus, insertSupabaseRow } from "@/lib/supabaseRest";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const suspensionSetups = new Set([
  "stock",
  "lowering-springs",
  "coilovers",
  "air-suspension",
]);

const partCategories = new Set([
  "wheels",
  "tires",
  "suspension",
  "spacers-adapters",
  "brakes",
  "exterior",
  "performance-interior",
]);

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `score:${getClientIp(request)}`,
      limit: 60,
      windowMs: 60_000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many fitment checks. Try again soon." }, { status: 429 });
    }

    const body = (await request.json()) as Partial<FitmentRequest>;
    const validationError = validatePayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const payload = normalizePayload(body);
    const result = scoreFitment(payload);
    const saved = await saveFitmentCheck(payload, result);

    return NextResponse.json({
      ...result,
      database: saved,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Submit vehicle and fitment specs as JSON." },
      { status: 400 }
    );
  }
}

async function saveFitmentCheck(
  request: FitmentRequest,
  result: ReturnType<typeof scoreFitment>
) {
  if (getSupabaseStatus() === "missing-config") {
    return {
      saved: false,
      demoMode: true,
      message: "Supabase env vars are missing, so this fitment check was not stored yet.",
    };
  }

  const insert = await insertSupabaseRow({
    table: "fitment_checks",
    values: {
      request,
      score: result.score,
      status: result.status,
      risk_level: result.status,
      warnings: result.warnings,
      recommendations: result.recommendations,
    },
  });

  return {
    saved: insert.ok,
    demoMode: false,
    message: insert.ok ? "Fitment check saved." : "Fitment check could not be saved.",
    error: insert.error,
  };
}

export function GET() {
  return NextResponse.json(
    { error: "Use POST with fitment specs to score a setup." },
    { status: 405 }
  );
}

function normalizePayload(body: Partial<FitmentRequest>): FitmentRequest {
  return {
    year: body.year ?? "",
    make: body.make ?? "",
    model: body.model ?? "",
    trim: body.trim ?? "",
    partCategory: body.partCategory as FitmentRequest["partCategory"],
    partType: body.partType ?? "",
    specificPart: body.specificPart ?? "",
    currentWheelSize: body.currentWheelSize ?? "",
    newWheelSize: body.newWheelSize ?? "",
    tireSize: body.tireSize ?? "",
    offset: body.offset ?? "",
    suspensionSetup: body.suspensionSetup as FitmentRequest["suspensionSetup"],
    spacerSize: body.spacerSize ?? "",
    notes: body.notes ?? "",
  };
}

function validatePayload(body: Partial<FitmentRequest>) {
  const requiredFields: Array<keyof FitmentRequest> = [
    "year",
    "make",
    "model",
    "partCategory",
    "partType",
    "currentWheelSize",
    "newWheelSize",
    "tireSize",
    "offset",
    "suspensionSetup",
    "spacerSize",
  ];

  for (const field of requiredFields) {
    if (!body[field] || typeof body[field] !== "string") {
      return `Missing or invalid field: ${field}`;
    }
  }

  if (!suspensionSetups.has(body.suspensionSetup ?? "")) {
    return "Invalid suspension setup.";
  }

  if (!partCategories.has(body.partCategory ?? "")) {
    return "Invalid part category.";
  }

  return null;
}
