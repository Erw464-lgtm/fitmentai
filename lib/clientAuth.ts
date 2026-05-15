"use client";

type StoredSession = {
  accessToken?: string;
};

export function getAuthHeaders(): Record<string, string> {
  const sessionText = window.localStorage.getItem("fitmentai-session");

  if (!sessionText) {
    return {};
  }

  try {
    const session = JSON.parse(sessionText) as StoredSession;

    return session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
  } catch {
    return {};
  }
}
