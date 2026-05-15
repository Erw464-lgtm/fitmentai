import { NextResponse } from "next/server";
import { getSupabaseStatus, insertSupabaseRow } from "@/lib/supabaseRest";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type WaitlistPayload = {
  name?: string;
  email?: string;
  role?: string;
  note?: string;
  neededFeature?: string;
};

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `waitlist:${getClientIp(request)}`,
      limit: 8,
      windowMs: 60_000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many waitlist submissions. Try again soon." }, { status: 429 });
    }

    const body = (await request.json()) as WaitlistPayload;
    const validationError = validateWaitlistPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const row = {
      name: body.name?.trim() ?? "",
      email: body.email?.trim().toLowerCase() ?? "",
      role: body.role?.trim() || "Car enthusiast",
      needed_feature: body.neededFeature?.trim() || "Private beta access",
      note: body.note?.trim() || null,
      source: "fitmentai-mvp",
    };

    const result = await insertSupabaseRow({ table: "waitlist", values: row });

    if (!result.ok) {
      const status = getSupabaseStatus() === "missing-config" ? 202 : 500;

      return NextResponse.json(
        {
          saved: false,
          demoMode: getSupabaseStatus() === "missing-config",
          message:
            getSupabaseStatus() === "missing-config"
              ? "Demo mode: Supabase env vars are missing, so this signup was not stored yet."
              : "The waitlist signup could not be saved.",
          error: result.error,
        },
        { status }
      );
    }

    return NextResponse.json({
      saved: true,
      demoMode: false,
      message: "Saved to the FitmentAI private beta waitlist.",
      row: result.data,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Use POST to submit a private beta waitlist signup." },
    { status: 405 }
  );
}

function validateWaitlistPayload(body: WaitlistPayload) {
  if (!body.name || !body.name.trim()) {
    return "Name is required.";
  }

  if (!body.email || !isEmail(body.email)) {
    return "A valid email is required.";
  }

  return null;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
