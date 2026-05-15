"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Camera, ChevronDown, LogOut, Trash2, UserCircle2 } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: string | null;
  avatar_url?: string | null;
};

export function AccountMenu() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadProfile();

    function handleStorage(event: StorageEvent) {
      if (event.key === "fitmentai-profile" || event.key === "fitmentai-session") {
        loadProfile();
      }
    }

    function handleFocus() {
      loadProfile();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  function loadProfile() {
    const savedProfile = window.localStorage.getItem("fitmentai-profile");

    if (!savedProfile) {
      setProfile(null);
      return;
    }

    try {
      setProfile(JSON.parse(savedProfile) as Profile);
    } catch {
      window.localStorage.removeItem("fitmentai-profile");
      setProfile(null);
    }
  }

  function signOut() {
    window.localStorage.removeItem("fitmentai-profile");
    window.localStorage.removeItem("fitmentai-session");
    setProfile(null);
    setOpen(false);
    window.dispatchEvent(new StorageEvent("storage", { key: "fitmentai-profile" }));
  }

  function updateStoredProfile(nextProfile: Profile) {
    window.localStorage.setItem("fitmentai-profile", JSON.stringify(nextProfile));
    setProfile(nextProfile);
    window.dispatchEvent(new StorageEvent("storage", { key: "fitmentai-profile" }));
  }

  function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !profile) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 1_500_000) {
      alert("Choose an image under 1.5MB for this MVP profile photo.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateStoredProfile({ ...profile, avatar_url: reader.result });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function removeAvatar() {
    if (!profile) {
      return;
    }

    updateStoredProfile({ ...profile, avatar_url: null });
  }

  const displayName = profile?.display_name || profile?.email || "Sign in";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-[#111f15] px-3 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
      >
        <Avatar profile={profile} size="sm" />
        <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
        <span className="sm:hidden">{profile ? "Account" : "Sign in"}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-72 rounded-lg border border-line bg-[#07120c] p-3 shadow-glow">
          {profile ? (
            <div className="rounded-lg border border-volt/15 bg-volt/5 p-3">
              <div className="flex items-start gap-3">
                <Avatar profile={profile} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#f3ead5]">{displayName}</p>
                  <p className="mt-1 truncate text-xs text-[#9e9278]">{profile.email}</p>
                  <p className="mt-2 text-xs text-[#d8cba9]">{profile.role || "Member"}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt">
                  <Camera className="h-3.5 w-3.5" />
                  {profile.avatar_url ? "Change photo" : "Upload photo"}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
                {profile.avatar_url ? (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-warning hover:text-orange-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove photo
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-volt/15 bg-volt/5 p-3">
              <p className="text-sm font-semibold text-[#f3ead5]">No account loaded</p>
              <p className="mt-1 text-xs leading-5 text-[#9e9278]">Sign in from My Garage to save cars and planned parts.</p>
            </div>
          )}

          <div className="mt-3 grid gap-2">
            <MenuLink href="#garage" onClick={() => setOpen(false)}>
              My Garage
            </MenuLink>
            <MenuLink href="#ask" onClick={() => setOpen(false)}>
              Ask FitmentAI
            </MenuLink>
            <MenuLink href="#demo" onClick={() => setOpen(false)}>
              Fitment Checker
            </MenuLink>
            {profile ? (
              <button
                type="button"
                onClick={signOut}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-3 text-left text-sm font-semibold text-[#d8cba9] transition hover:border-warning hover:text-orange-200"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <a
                href="#garage"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-volt px-3 text-sm font-semibold text-[#07120c] transition hover:bg-[#b98d31]"
              >
                Sign in or create account
              </a>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ profile, size }: { profile: Profile | null; size: "sm" | "lg" }) {
  const dimension = size === "lg" ? "h-12 w-12" : "h-5 w-5";

  if (profile?.avatar_url) {
    return (
      <span className={`${dimension} shrink-0 overflow-hidden rounded-full border border-volt/35 bg-[#09160e]`}>
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span className={`${dimension} grid shrink-0 place-items-center rounded-full border border-volt/25 bg-volt/10 text-volt`}>
      <UserCircle2 className={size === "lg" ? "h-7 w-7" : "h-4 w-4"} />
    </span>
  );
}

function MenuLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex h-10 items-center rounded-lg border border-line px-3 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
    >
      {children}
    </a>
  );
}
