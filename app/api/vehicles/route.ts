import { NextResponse } from "next/server";
import {
  deleteSupabaseRows,
  getSupabaseStatus,
  insertSupabaseRow,
  selectSupabaseRows,
  updateSupabaseRows,
} from "@/lib/supabaseRest";
import { getAuthContext } from "@/lib/serverAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type VehiclePayload = {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  nickname?: string;
  currentSetup?: string;
  suspensionSetup?: string;
  dreamSetup?: string;
  partsToBuy?: string;
};

export async function GET(request: Request) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({
      vehicles: [],
      demoMode: false,
      message: "Sign in to load saved garage vehicles.",
    });
  }

  const result = await selectSupabaseRows({
    table: "vehicles",
    query:
      `select=id,user_id,year,make,model,trim,nickname,current_setup,suspension_setup,dream_setup,parts_to_buy,created_at&user_id=eq.${encodeURIComponent(auth.profileId)}&order=created_at.desc`,
  });

  if (!result.ok) {
    const demoMode = getSupabaseStatus() === "missing-config";

    return NextResponse.json(
      {
        vehicles: [],
        demoMode,
        message: demoMode
          ? "Demo mode: Supabase env vars are missing, so garage vehicles are not loaded yet."
          : "Garage vehicles could not be loaded.",
        error: result.error,
      },
      { status: demoMode ? 200 : 500 }
    );
  }

  return NextResponse.json({
    vehicles: result.data,
    demoMode: false,
  });
}

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `vehicles:post:${getClientIp(request)}`,
      limit: 30,
      windowMs: 60_000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many vehicle saves. Try again soon." }, { status: 429 });
    }

    const auth = await getAuthContext(request);

    if (!auth) {
      return NextResponse.json({ error: "Sign in before saving vehicles." }, { status: 401 });
    }

    const body = (await request.json()) as VehiclePayload;
    const validationError = validateVehiclePayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await insertSupabaseRow({
      table: "vehicles",
      values: {
        user_id: auth.profileId,
        year: body.year?.trim(),
        make: body.make?.trim(),
        model: body.model?.trim(),
        trim: body.trim?.trim() || null,
        nickname: body.nickname?.trim() || "Saved vehicle",
        current_setup: body.currentSetup?.trim() || "Setup pending",
        suspension_setup: body.suspensionSetup?.trim() || "Suspension not saved yet",
        dream_setup: body.dreamSetup?.trim() || null,
        parts_to_buy: body.partsToBuy?.trim() || null,
      },
    });

    if (!result.ok) {
      const demoMode = getSupabaseStatus() === "missing-config";

      return NextResponse.json(
        {
          saved: false,
          demoMode,
          message: demoMode
            ? "Demo mode: Supabase env vars are missing, so this vehicle was not stored yet."
            : "Vehicle could not be saved.",
          error: result.error,
        },
        { status: demoMode ? 202 : 500 }
      );
    }

    return NextResponse.json({
      saved: true,
      demoMode: false,
      vehicle: Array.isArray(result.data) ? result.data[0] : result.data,
      message: "Vehicle saved to garage.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Sign in before deleting vehicles." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Vehicle id is required." }, { status: 400 });
  }

  const result = await deleteSupabaseRows({
    table: "vehicles",
    query: `id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(auth.profileId)}`,
  });

  if (!result.ok) {
    const demoMode = getSupabaseStatus() === "missing-config";

    return NextResponse.json(
      {
        deleted: false,
        demoMode,
        message: demoMode
          ? "Demo mode: Supabase env vars are missing, so this vehicle was not deleted."
          : "Vehicle could not be deleted.",
        error: result.error,
      },
      { status: demoMode ? 202 : 500 }
    );
  }

  return NextResponse.json({
    deleted: true,
    vehicle: result.data,
  });
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthContext(request);

    if (!auth) {
      return NextResponse.json({ error: "Sign in before updating vehicles." }, { status: 401 });
    }

    const body = (await request.json()) as { claimLegacy?: boolean };

    if (!body.claimLegacy) {
      return NextResponse.json({ error: "No vehicle update action was provided." }, { status: 400 });
    }

    const result = await updateSupabaseRows({
      table: "vehicles",
      query: "user_id=is.null",
      values: {
        user_id: auth.profileId,
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          updated: false,
          message: "Existing vehicles could not be moved to this profile.",
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updated: true,
      vehicles: result.data,
      message: "Existing vehicles moved to this profile.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

function validateVehiclePayload(body: VehiclePayload) {
  if (!body.year || !body.year.trim()) {
    return "Year is required.";
  }

  if (!body.make || !body.make.trim()) {
    return "Make is required.";
  }

  if (!body.model || !body.model.trim()) {
    return "Model is required.";
  }

  return null;
}
