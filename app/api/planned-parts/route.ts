import { NextResponse } from "next/server";
import {
  deleteSupabaseRows,
  getSupabaseStatus,
  insertSupabaseRow,
  selectSupabaseRows,
  updateSupabaseRows,
} from "@/lib/supabaseRest";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAuthContext } from "@/lib/serverAuth";

type PlannedPartPayload = {
  vehicleId?: string;
  name?: string;
  category?: string;
  source?: string;
  price?: string;
  notes?: string;
};

const partSelect =
  "select=id,vehicle_id,name,category,source,price,status,fitment_score,fitment_status,fitment_warning,fitment_recommendation,fitment_checked_at,notes,created_at&order=created_at.desc";
const legacyPartSelect =
  "select=id,vehicle_id,name,category,source,price,status,notes,created_at&order=created_at.desc";

export async function GET(request: Request) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Sign in before loading planned parts." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  if (!vehicleId) {
    return NextResponse.json({ error: "Vehicle id is required." }, { status: 400 });
  }

  const ownsVehicle = await verifyVehicleOwnership(vehicleId, auth.profileId);

  if (!ownsVehicle) {
    return NextResponse.json({ error: "Vehicle was not found for this account." }, { status: 404 });
  }

  let result = await selectSupabaseRows({
    table: "planned_parts",
    query: `${partSelect}&vehicle_id=eq.${encodeURIComponent(vehicleId)}`,
  });

  if (!result.ok && result.error?.includes("fitment_")) {
    result = await selectSupabaseRows({
      table: "planned_parts",
      query: `${legacyPartSelect}&vehicle_id=eq.${encodeURIComponent(vehicleId)}`,
    });
  }

  if (!result.ok) {
    const demoMode = getSupabaseStatus() === "missing-config";

    return NextResponse.json(
      {
        plannedParts: [],
        demoMode,
        message: demoMode
          ? "Demo mode: Supabase env vars are missing, so planned parts are not loaded yet."
          : "Planned parts could not be loaded. Make sure the planned_parts table exists in Supabase.",
        error: result.error,
      },
      { status: demoMode ? 200 : 500 }
    );
  }

  return NextResponse.json({
    plannedParts: Array.isArray(result.data)
      ? result.data.map((part) => ({
          ...(part as Record<string, unknown>),
          fitment_score: (part as Record<string, unknown>).fitment_score ?? null,
          fitment_status: (part as Record<string, unknown>).fitment_status ?? null,
          fitment_warning: (part as Record<string, unknown>).fitment_warning ?? null,
          fitment_recommendation: (part as Record<string, unknown>).fitment_recommendation ?? null,
          fitment_checked_at: (part as Record<string, unknown>).fitment_checked_at ?? null,
        }))
      : result.data,
    demoMode: false,
  });
}

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `planned-parts:post:${getClientIp(request)}`,
      limit: 60,
      windowMs: 60_000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many planned part saves. Try again soon." }, { status: 429 });
    }

    const auth = await getAuthContext(request);

    if (!auth) {
      return NextResponse.json({ error: "Sign in before saving planned parts." }, { status: 401 });
    }

    const body = (await request.json()) as PlannedPartPayload;
    const validationError = validatePlannedPartPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const ownsVehicle = await verifyVehicleOwnership(body.vehicleId || "", auth.profileId);

    if (!ownsVehicle) {
      return NextResponse.json({ error: "Vehicle was not found for this account." }, { status: 404 });
    }

    const result = await insertSupabaseRow({
      table: "planned_parts",
      values: {
        vehicle_id: body.vehicleId,
        name: body.name?.trim(),
        category: body.category?.trim() || "Performance",
        source: body.source?.trim() || null,
        price: body.price?.trim() || null,
        status: "planned",
        notes: body.notes?.trim() || null,
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          saved: false,
          message: "Planned part could not be saved. Make sure the planned_parts table exists in Supabase.",
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      saved: true,
      plannedPart: Array.isArray(result.data) ? result.data[0] : result.data,
      message: "Planned part saved to this vehicle.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthContext(request);

    if (!auth) {
      return NextResponse.json({ error: "Sign in before updating planned parts." }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: string;
      status?: string;
      fitmentScore?: number;
      fitmentStatus?: string;
      fitmentWarning?: string;
      fitmentRecommendation?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Planned part id is required." }, { status: 400 });
    }

    const ownsPart = await verifyPlannedPartOwnership(body.id, auth.profileId);

    if (!ownsPart) {
      return NextResponse.json({ error: "Planned part was not found for this account." }, { status: 404 });
    }

    const values: Record<string, unknown> = {};

    if (body.status) {
      values.status = body.status === "installed" ? "installed" : "planned";
    }

    if (typeof body.fitmentScore === "number") {
      values.fitment_score = Math.max(0, Math.min(100, Math.round(body.fitmentScore)));
      values.fitment_status = body.fitmentStatus?.trim() || null;
      values.fitment_warning = body.fitmentWarning?.trim() || null;
      values.fitment_recommendation = body.fitmentRecommendation?.trim() || null;
      values.fitment_checked_at = new Date().toISOString();
    }

    if (Object.keys(values).length === 0) {
      return NextResponse.json({ error: "No planned part updates were provided." }, { status: 400 });
    }

    const result = await updateSupabaseRows({
      table: "planned_parts",
      query: `id=eq.${encodeURIComponent(body.id)}`,
      values,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          updated: false,
          message: "Planned part could not be updated.",
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updated: true,
      plannedPart: Array.isArray(result.data) ? result.data[0] : result.data,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Sign in before deleting planned parts." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Planned part id is required." }, { status: 400 });
  }

  const ownsPart = await verifyPlannedPartOwnership(id, auth.profileId);

  if (!ownsPart) {
    return NextResponse.json({ error: "Planned part was not found for this account." }, { status: 404 });
  }

  const result = await deleteSupabaseRows({
    table: "planned_parts",
    query: `id=eq.${encodeURIComponent(id)}`,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        deleted: false,
        message: "Planned part could not be deleted.",
        error: result.error,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    deleted: true,
    plannedPart: result.data,
  });
}

function validatePlannedPartPayload(body: PlannedPartPayload) {
  if (!body.vehicleId) {
    return "Vehicle id is required.";
  }

  if (!body.name || !body.name.trim()) {
    return "Part name is required.";
  }

  return null;
}

async function verifyVehicleOwnership(vehicleId: string, profileId: string) {
  const result = await selectSupabaseRows({
    table: "vehicles",
    query: `select=id&id=eq.${encodeURIComponent(vehicleId)}&user_id=eq.${encodeURIComponent(profileId)}&limit=1`,
  });

  return result.ok && Array.isArray(result.data) && Boolean(result.data[0]);
}

async function verifyPlannedPartOwnership(partId: string, profileId: string) {
  const result = await selectSupabaseRows({
    table: "planned_parts",
    query: `select=id,vehicle_id&id=eq.${encodeURIComponent(partId)}&limit=1`,
  });

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) {
    return false;
  }

  const part = result.data[0] as { vehicle_id?: string };

  return verifyVehicleOwnership(part.vehicle_id || "", profileId);
}
