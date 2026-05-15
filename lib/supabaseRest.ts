type SupabaseInsertOptions = {
  table: string;
  values: Record<string, unknown>;
};

type SupabaseSelectOptions = {
  table: string;
  query?: string;
};

type SupabaseDeleteOptions = {
  table: string;
  query: string;
};

type SupabaseUpdateOptions = {
  table: string;
  query: string;
  values: Record<string, unknown>;
};

export type SupabaseStatus = "configured" | "missing-config";

export function getSupabaseStatus(): SupabaseStatus {
  return getSupabaseConfig() ? "configured" : "missing-config";
}

export async function insertSupabaseRow({ table, values }: SupabaseInsertOptions) {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      ok: false,
      status: 503,
      data: null,
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const response = await fetchWithTimeout(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(values),
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: response.ok ? null : extractSupabaseError(data, text),
  };
}

export async function selectSupabaseRows({ table, query = "select=*" }: SupabaseSelectOptions) {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      ok: false,
      status: 503,
      data: null,
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const response = await fetchWithTimeout(`${config.url}/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: response.ok ? null : extractSupabaseError(data, text),
  };
}

export async function deleteSupabaseRows({ table, query }: SupabaseDeleteOptions) {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      ok: false,
      status: 503,
      data: null,
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const response = await fetchWithTimeout(`${config.url}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Prefer: "return=representation",
    },
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: response.ok ? null : extractSupabaseError(data, text),
  };
}

export async function updateSupabaseRows({ table, query, values }: SupabaseUpdateOptions) {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      ok: false,
      status: 503,
      data: null,
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const response = await fetchWithTimeout(`${config.url}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(values),
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: response.ok ? null : extractSupabaseError(data, text),
  };
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Supabase request timed out. Please try again."
      : "Supabase request failed before a response was returned.";

    return new Response(JSON.stringify({ message }), {
      status: 504,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractSupabaseError(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    return String((data as { message?: unknown }).message);
  }

  return fallback || "Supabase request failed.";
}
