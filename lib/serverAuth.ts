import { selectSupabaseRows } from "@/lib/supabaseRest";

type SupabaseAuthUser = {
  id: string;
  email?: string;
};

type AuthContext = {
  accessToken: string;
  authUser: SupabaseAuthUser;
  profileId: string;
  email: string;
};

export async function getAuthContext(request: Request): Promise<AuthContext | null> {
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!accessToken) {
    return null;
  }

  const config = getAuthConfig();
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.authKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const authUser = (await response.json()) as SupabaseAuthUser;

  if (!authUser.id) {
    return null;
  }

  const profileResult = await selectSupabaseRows({
    table: "profiles",
    query: `select=id,email&auth_user_id=eq.${encodeURIComponent(authUser.id)}&limit=1`,
  });

  if (!profileResult.ok || !Array.isArray(profileResult.data) || !profileResult.data[0]) {
    return null;
  }

  const profile = profileResult.data[0] as { id: string; email?: string };

  return {
    accessToken,
    authUser,
    profileId: profile.id,
    email: profile.email || authUser.email || "",
  };
}

export function getAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase URL and service role key are required.");
  }

  return {
    url,
    serviceRoleKey,
    authKey: anonKey || serviceRoleKey,
  };
}
