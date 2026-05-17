import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAuthContext } from "@/lib/serverAuth";
import { deleteSupabaseRows, getSupabaseStatus, insertSupabaseRow, selectSupabaseRows } from "@/lib/supabaseRest";

type AiNotePayload = {
  vehicleId?: string;
  question?: string;
  answer?: string;
  mode?: string;
  confidence?: string;
};

const aiNoteSelect =
  "select=id,user_id,vehicle_id,title,question,answer,mode,confidence,created_at&order=created_at.desc";

export async function GET(request: Request) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Sign in before loading AI notes." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");
  const vehicleFilter = vehicleId ? `&vehicle_id=eq.${encodeURIComponent(vehicleId)}` : "";

  if (vehicleId) {
    const ownsVehicle = await verifyVehicleOwnership(vehicleId, auth.profileId);

    if (!ownsVehicle) {
      return NextResponse.json({ error: "Vehicle was not found for this account." }, { status: 404 });
    }
  }

  const result = await selectSupabaseRows({
    table: "ai_notes",
    query: `${aiNoteSelect}&user_id=eq.${encodeURIComponent(auth.profileId)}${vehicleFilter}`,
  });

  if (!result.ok) {
    const demoMode = getSupabaseStatus() === "missing-config";

    return NextResponse.json(
      {
        aiNotes: [],
        demoMode,
        message: demoMode
          ? "Demo mode: Supabase env vars are missing, so AI notes are not loaded yet."
          : "AI notes could not be loaded. Run the ai-notes migration in Supabase.",
        error: result.error,
      },
      { status: demoMode ? 200 : 500 }
    );
  }

  return NextResponse.json({
    aiNotes: Array.isArray(result.data) ? result.data : [],
    demoMode: false,
  });
}

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `ai-notes:post:${getClientIp(request)}`,
      limit: 40,
      windowMs: 60_000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many AI note saves. Try again soon." }, { status: 429 });
    }

    const auth = await getAuthContext(request);

    if (!auth) {
      return NextResponse.json({ error: "Sign in before saving AI notes." }, { status: 401 });
    }

    const body = (await request.json()) as AiNotePayload;
    const validationError = validateAiNotePayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const vehicleId = body.vehicleId || null;

    if (vehicleId) {
      const ownsVehicle = await verifyVehicleOwnership(vehicleId, auth.profileId);

      if (!ownsVehicle) {
        return NextResponse.json({ error: "Vehicle was not found for this account." }, { status: 404 });
      }
    }

    const result = await insertSupabaseRow({
      table: "ai_notes",
      values: {
        user_id: auth.profileId,
        vehicle_id: vehicleId,
        title: buildTitle(body.question || "", body.mode || ""),
        question: body.question?.trim() || null,
        answer: body.answer?.trim(),
        mode: body.mode?.trim() || null,
        confidence: body.confidence?.trim() || null,
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          saved: false,
          message: "AI note could not be saved. Run the ai-notes migration in Supabase.",
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      saved: true,
      aiNote: Array.isArray(result.data) ? result.data[0] : result.data,
      message: "AI answer saved to this build.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Sign in before deleting AI notes." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "AI note id is required." }, { status: 400 });
  }

  const ownsNote = await verifyAiNoteOwnership(id, auth.profileId);

  if (!ownsNote) {
    return NextResponse.json({ error: "AI note was not found for this account." }, { status: 404 });
  }

  const result = await deleteSupabaseRows({
    table: "ai_notes",
    query: `id=eq.${encodeURIComponent(id)}`,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        deleted: false,
        message: "AI note could not be deleted.",
        error: result.error,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    deleted: true,
    aiNote: result.data,
  });
}

function validateAiNotePayload(body: AiNotePayload) {
  if (!body.answer || !body.answer.trim()) {
    return "AI answer is required.";
  }

  return null;
}

function buildTitle(question: string, mode: string) {
  const cleanQuestion = question.trim();

  if (cleanQuestion) {
    return cleanQuestion.length > 72 ? `${cleanQuestion.slice(0, 69)}...` : cleanQuestion;
  }

  return mode ? `${mode.replace(/-/g, " ")} note` : "Saved AI answer";
}

async function verifyVehicleOwnership(vehicleId: string, profileId: string) {
  const result = await selectSupabaseRows({
    table: "vehicles",
    query: `select=id&id=eq.${encodeURIComponent(vehicleId)}&user_id=eq.${encodeURIComponent(profileId)}&limit=1`,
  });

  return result.ok && Array.isArray(result.data) && Boolean(result.data[0]);
}

async function verifyAiNoteOwnership(noteId: string, profileId: string) {
  const result = await selectSupabaseRows({
    table: "ai_notes",
    query: `select=id&id=eq.${encodeURIComponent(noteId)}&user_id=eq.${encodeURIComponent(profileId)}&limit=1`,
  });

  return result.ok && Array.isArray(result.data) && Boolean(result.data[0]);
}
