import { NextResponse } from "next/server";
import { getSupabaseStatus, insertSupabaseRow, selectSupabaseRows } from "@/lib/supabaseRest";

type ProfilePayload = {
  email?: string;
  displayName?: string;
  role?: string;
};

const profileSelect = "select=id,email,display_name,role,created_at";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const result = await selectSupabaseRows({
    table: "profiles",
    query: `${profileSelect}&email=eq.${encodeURIComponent(email)}&limit=1`,
  });

  if (!result.ok) {
    const demoMode = getSupabaseStatus() === "missing-config";

    return NextResponse.json(
      {
        profile: null,
        demoMode,
        message: demoMode
          ? "Demo mode: Supabase env vars are missing, so profiles are not loaded yet."
          : "Profile could not be loaded.",
        error: result.error,
      },
      { status: demoMode ? 200 : 500 }
    );
  }

  return NextResponse.json({
    profile: Array.isArray(result.data) ? result.data[0] ?? null : null,
    demoMode: false,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProfilePayload;
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const existing = await selectSupabaseRows({
      table: "profiles",
      query: `${profileSelect}&email=eq.${encodeURIComponent(email)}&limit=1`,
    });

    if (existing.ok && Array.isArray(existing.data) && existing.data[0]) {
      return NextResponse.json({
        profile: existing.data[0],
        created: false,
        message: "Profile loaded.",
      });
    }

    const insert = await insertSupabaseRow({
      table: "profiles",
      values: {
        email,
        display_name: body.displayName?.trim() || email.split("@")[0],
        role: body.role?.trim() || "Car enthusiast",
      },
    });

    if (!insert.ok) {
      const demoMode = getSupabaseStatus() === "missing-config";

      return NextResponse.json(
        {
          profile: null,
          created: false,
          demoMode,
          message: demoMode
            ? "Demo mode: Supabase env vars are missing, so this profile was not stored yet."
            : "Profile could not be created.",
          error: insert.error,
        },
        { status: demoMode ? 202 : 500 }
      );
    }

    return NextResponse.json({
      profile: Array.isArray(insert.data) ? insert.data[0] : insert.data,
      created: true,
      message: "Profile created.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}
