import { NextResponse } from "next/server";
import { insertSupabaseRow, selectSupabaseRows, updateSupabaseRows } from "@/lib/supabaseRest";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type AuthPayload = {
  action?: "sign-up" | "sign-in";
  email?: string;
  password?: string;
  displayName?: string;
  role?: string;
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
};

type SupabaseAuthSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: SupabaseAuthUser;
};

const profileSelect = "select=id,auth_user_id,email,display_name,role,created_at";

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `auth:${getClientIp(request)}`,
      limit: 12,
      windowMs: 60_000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many sign-in attempts. Try again soon." }, { status: 429 });
    }

    const body = (await request.json()) as AuthPayload;
    const action = body.action === "sign-up" ? "sign-up" : "sign-in";
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    if (action === "sign-up") {
      await createAuthUser({
        email,
        password,
        displayName: body.displayName?.trim() || email.split("@")[0],
        role: body.role?.trim() || "Car enthusiast",
      });
    }

    const session = await signInWithPassword(email, password);

    if (!session.user?.id || !session.access_token) {
      return NextResponse.json(
        { error: "Supabase Auth did not return a valid session." },
        { status: 500 }
      );
    }

    const profile = await ensureProfile({
      authUserId: session.user.id,
      email: session.user.email || email,
      displayName: body.displayName?.trim() || email.split("@")[0],
      role: body.role?.trim() || "Car enthusiast",
    });

    return NextResponse.json({
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        expiresAt: session.expires_at,
        user: {
          id: session.user.id,
          email: session.user.email || email,
        },
      },
      profile,
      message: action === "sign-up" ? "Account created and signed in." : "Signed in.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed." },
      { status: 500 }
    );
  }
}

async function createAuthUser({
  email,
  password,
  displayName,
  role,
}: {
  email: string;
  password: string;
  displayName: string;
  role: string;
}) {
  const config = getAuthConfig();
  const response = await fetch(`${config.url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role,
      },
    }),
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok && !String(extractAuthError(data, text)).toLowerCase().includes("already")) {
    throw new Error(extractAuthError(data, text));
  }
}

async function signInWithPassword(email: string, password: string) {
  const config = getAuthConfig();
  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.authKey,
      Authorization: `Bearer ${config.authKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new Error(extractAuthError(data, text));
  }

  return data as SupabaseAuthSession;
}

async function ensureProfile({
  authUserId,
  email,
  displayName,
  role,
}: {
  authUserId: string;
  email: string;
  displayName: string;
  role: string;
}) {
  const byAuthId = await selectSupabaseRows({
    table: "profiles",
    query: `${profileSelect}&auth_user_id=eq.${encodeURIComponent(authUserId)}&limit=1`,
  });

  if (byAuthId.ok && Array.isArray(byAuthId.data) && byAuthId.data[0]) {
    return byAuthId.data[0];
  }

  const byEmail = await selectSupabaseRows({
    table: "profiles",
    query: `${profileSelect}&email=eq.${encodeURIComponent(email)}&limit=1`,
  });

  if (byEmail.ok && Array.isArray(byEmail.data) && byEmail.data[0]) {
    const existing = byEmail.data[0] as { id: string };
    const updated = await updateSupabaseRows({
      table: "profiles",
      query: `id=eq.${encodeURIComponent(existing.id)}`,
      values: {
        auth_user_id: authUserId,
        display_name: displayName,
        role,
      },
    });

    if (!updated.ok) {
      throw new Error(updated.error || "Profile could not be linked to this auth user.");
    }

    return Array.isArray(updated.data) ? updated.data[0] : updated.data;
  }

  const inserted = await insertSupabaseRow({
    table: "profiles",
    values: {
      auth_user_id: authUserId,
      email,
      display_name: displayName,
      role,
    },
  });

  if (!inserted.ok) {
    throw new Error(inserted.error || "Profile could not be created.");
  }

  return Array.isArray(inserted.data) ? inserted.data[0] : inserted.data;
}

function getAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase URL and service role key are required for auth.");
  }

  return {
    url,
    serviceRoleKey,
    authKey: anonKey || serviceRoleKey,
  };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractAuthError(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    if ("msg" in data) return String((data as { msg?: unknown }).msg);
    if ("message" in data) return String((data as { message?: unknown }).message);
    if ("error_description" in data) {
      return String((data as { error_description?: unknown }).error_description);
    }
  }

  return fallback || "Supabase Auth request failed.";
}
