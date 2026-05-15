import { NextResponse } from "next/server";
import { getAuthConfig, getAuthContext } from "@/lib/serverAuth";
import { selectSupabaseRows, updateSupabaseRows } from "@/lib/supabaseRest";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type PhotoPayload = {
  imageData?: string;
};

const bucketName = "profile-photos";
const maxUploadBytes = 1_500_000;

export async function GET(request: Request) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ avatarUrl: null, message: "Sign in to load profile photo." }, { status: 401 });
  }

  const result = await selectSupabaseRows({
    table: "profiles",
    query: `select=avatar_url&id=eq.${encodeURIComponent(auth.profileId)}&limit=1`,
  });

  if (!result.ok) {
    return NextResponse.json({ avatarUrl: null, error: result.error }, { status: 200 });
  }

  const profile = Array.isArray(result.data) ? (result.data[0] as { avatar_url?: string | null } | undefined) : null;

  return NextResponse.json({ avatarUrl: profile?.avatar_url || null });
}

export async function POST(request: Request) {
  const limit = checkRateLimit({
    key: `profile-photo:${getClientIp(request)}`,
    limit: 12,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many profile photo uploads. Try again soon." }, { status: 429 });
  }

  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Sign in before uploading a profile photo." }, { status: 401 });
  }

  const body = (await request.json()) as PhotoPayload;
  const parsed = parseImageData(body.imageData);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await ensureProfilePhotoBucket();

  const path = `${auth.profileId}/avatar-${Date.now()}.jpg`;
  const upload = await uploadProfilePhoto(path, parsed.bytes, parsed.mimeType);

  if (!upload.ok) {
    return NextResponse.json({ error: upload.error }, { status: upload.status });
  }

  const config = getAuthConfig();
  const avatarUrl = `${config.url}/storage/v1/object/public/${bucketName}/${path}`;
  const update = await updateSupabaseRows({
    table: "profiles",
    query: `id=eq.${encodeURIComponent(auth.profileId)}`,
    values: { avatar_url: avatarUrl },
  });

  if (!update.ok) {
    return NextResponse.json(
      {
        error: update.error || "Photo uploaded, but the profile row could not be updated.",
        avatarUrl,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    avatarUrl,
    profile: Array.isArray(update.data) ? update.data[0] : update.data,
  });
}

export async function DELETE(request: Request) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Sign in before removing a profile photo." }, { status: 401 });
  }

  const update = await updateSupabaseRows({
    table: "profiles",
    query: `id=eq.${encodeURIComponent(auth.profileId)}`,
    values: { avatar_url: null },
  });

  if (!update.ok) {
    return NextResponse.json({ error: update.error || "Profile photo could not be removed." }, { status: 500 });
  }

  return NextResponse.json({
    avatarUrl: null,
    profile: Array.isArray(update.data) ? update.data[0] : update.data,
  });
}

function parseImageData(imageData?: string) {
  if (!imageData) {
    return { ok: false as const, error: "Image data is required." };
  }

  const match = imageData.match(/^data:(image\/jpeg|image\/png|image\/webp);base64,(.+)$/);

  if (!match) {
    return { ok: false as const, error: "Upload a JPEG, PNG, or WebP image." };
  }

  const mimeType = match[1];
  const bytes = Buffer.from(match[2], "base64");

  if (bytes.byteLength > maxUploadBytes) {
    return { ok: false as const, error: "Profile photo is still too large after compression." };
  }

  return { ok: true as const, mimeType, bytes };
}

async function ensureProfilePhotoBucket() {
  const config = getAuthConfig();
  const existing = await fetch(`${config.url}/storage/v1/bucket/${bucketName}`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (existing.ok) {
    return;
  }

  await fetch(`${config.url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: true,
      file_size_limit: maxUploadBytes,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
    }),
    cache: "no-store",
  });
}

async function uploadProfilePhoto(path: string, bytes: Buffer, mimeType: string) {
  const config = getAuthConfig();
  const body = new Blob([new Uint8Array(bytes)], { type: mimeType });
  const response = await fetch(`${config.url}/storage/v1/object/${bucketName}/${path}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body,
    cache: "no-store",
  });
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  return {
    ok: response.ok,
    status: response.status,
    error: response.ok ? null : extractStorageError(data, text),
  };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractStorageError(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    return String((data as { message?: unknown }).message);
  }

  return fallback || "Supabase Storage request failed.";
}
