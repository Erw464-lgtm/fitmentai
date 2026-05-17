"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Gauge, Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { getAuthHeaders } from "@/lib/clientAuth";
import type { FitmentRequest, FitmentResponse, PartCategory, SuspensionSetup } from "@/lib/fitmentScore";

type GarageVehicle = {
  id: string;
  user_id: string | null;
  year: string;
  make: string;
  model: string;
  trim: string | null;
  nickname: string | null;
  current_setup: string | null;
  suspension_setup: string | null;
  dream_setup: string | null;
  parts_to_buy: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  auth_user_id?: string | null;
  email: string;
  display_name: string | null;
  role: string | null;
  created_at: string;
};

type ProfileForm = {
  displayName: string;
  email: string;
  password: string;
  role: string;
};

type VehicleForm = {
  year: string;
  make: string;
  model: string;
  trim: string;
  nickname: string;
  currentSetup: string;
  suspensionSetup: string;
  dreamSetup: string;
  partsToBuy: string;
};

type PlannedPart = {
  id: string;
  vehicle_id: string;
  name: string;
  category: string;
  source: string | null;
  source_url?: string | null;
  source_type?: string | null;
  price: string | null;
  fitment_claim?: string | null;
  status: "planned" | "installed";
  fitment_score: number | null;
  fitment_status: string | null;
  fitment_warning: string | null;
  fitment_recommendation: string | null;
  fitment_checked_at: string | null;
  notes: string | null;
  created_at: string;
};

type PlannedPartForm = {
  name: string;
  category: string;
  source: string;
  sourceUrl: string;
  sourceType: string;
  price: string;
  fitmentClaim: string;
  notes: string;
};

type SourceCandidate = {
  id: string;
  name: string;
  category: string;
  source: string;
  sourceUrl: string;
  sourceType: string;
  price: string;
  confidence: number;
  fitmentClaim: string;
  warning: string;
  notes: string;
};

type AiNote = {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  title: string;
  question: string | null;
  answer: string;
  mode: string | null;
  confidence: string | null;
  created_at: string;
};

const initialForm: VehicleForm = {
  year: "2020",
  make: "BMW",
  model: "M340i",
  trim: "xDrive",
  nickname: "Daily build",
  currentSetup: "19x9.5 +35, 255/35R19",
  suspensionSetup: "Lowering springs",
  dreamSetup: "OEM+ street build with wheels, exhaust, and carbon aero",
  partsToBuy: "Wheels, tires, intake, front lip",
};

const demoVehicleForm: VehicleForm = {
  year: "2017",
  make: "Porsche",
  model: "Macan",
  trim: "Turbo",
  nickname: "Demo street SUV",
  currentSetup: "20x9 +35, 265/45R20",
  suspensionSetup: "Lowering springs",
  dreamSetup: "OEM+ daily build with intake, exhaust, wheels, and carbon exterior pieces",
  partsToBuy: "Air intake, rear spoiler, wheels, brake pads",
};

const initialProfileForm: ProfileForm = {
  displayName: "Evin Wood",
  email: "erw464@icloud.com",
  password: "",
  role: "Car enthusiast",
};

const initialPartForm: PlannedPartForm = {
  name: "Air intake",
  category: "Performance",
  source: "Eventuri",
  sourceUrl: "https://www.eventuri.net",
  sourceType: "Manufacturer",
  price: "$350-$500",
  fitmentClaim: "Seller claims trim-specific fitment with included heat shield.",
  notes: "Check engine, trim, emissions, and install hardware before buying.",
};

const demoPartForm: PlannedPartForm = {
  name: "Carbon rear spoiler",
  category: "Exterior",
  source: "RW Carbon",
  sourceUrl: "https://www.rwcarbon.com",
  sourceType: "Retailer",
  price: "$450-$700",
  fitmentClaim: "Listing claims Porsche Macan hatch compatibility.",
  notes: "Verify hatch shape, mounting points, and Turbo trim compatibility before buying.",
};

const partCategories = [
  "Wheels",
  "Tires",
  "Suspension",
  "Spacers & Adapters",
  "Brakes",
  "Exterior",
  "Performance",
  "Interior",
];

const sourceTypes = ["Manufacturer", "Retailer", "Marketplace", "Shop", "Forum"];

const fallbackVehicles: GarageVehicle[] = [
  {
    id: "demo-bmw",
    user_id: null,
    year: "2020",
    make: "BMW",
    model: "M340i",
    trim: "xDrive",
    nickname: "Demo daily build",
    current_setup: "19x9.5 +35, 255/35R19",
    suspension_setup: "Lowering springs",
    dream_setup: "OEM+ street build with carbon lip and valved exhaust",
    parts_to_buy: "BBS wheels, Michelin tires, Akrapovic exhaust",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-civic",
    user_id: null,
    year: "2018",
    make: "Honda",
    model: "Civic",
    trim: "Type R",
    nickname: "Demo track weekend",
    current_setup: "18x9.5 +38, 265/35R18",
    suspension_setup: "Coilovers",
    dream_setup: "Track setup with brakes, tires, and aero balance",
    parts_to_buy: "Brake pads, track tires, rear wing",
    created_at: new Date().toISOString(),
  },
];

const garageCachePrefix = "fitmentai-garage-cache";

export function GarageManager() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>(initialProfileForm);
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [plannedParts, setPlannedParts] = useState<PlannedPart[]>([]);
  const [aiNotes, setAiNotes] = useState<AiNote[]>([]);
  const [form, setForm] = useState<VehicleForm>(initialForm);
  const [partForm, setPartForm] = useState<PlannedPartForm>(initialPartForm);
  const [loading, setLoading] = useState(true);
  const [partsLoading, setPartsLoading] = useState(false);
  const [aiNotesLoading, setAiNotesLoading] = useState(false);
  const [sourceSearching, setSourceSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPart, setSavingPart] = useState(false);
  const [savingCandidateId, setSavingCandidateId] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [claimingVehicles, setClaimingVehicles] = useState(false);
  const [checkingPartId, setCheckingPartId] = useState("");
  const [message, setMessage] = useState("");
  const [partsMessage, setPartsMessage] = useState("");
  const [aiNotesMessage, setAiNotesMessage] = useState("");
  const [sourceSearchMessage, setSourceSearchMessage] = useState("");
  const [sourceSearchAiSummary, setSourceSearchAiSummary] = useState("");
  const [sourceSearchProvider, setSourceSearchProvider] = useState("");
  const [liveSourceCandidates, setLiveSourceCandidates] = useState<SourceCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedId) ?? vehicles[0],
    [selectedId, vehicles]
  );

  useEffect(() => {
    if (selectedVehicle?.id && !selectedVehicle.id.startsWith("demo-")) {
      void loadPlannedParts(selectedVehicle.id);
      void loadAiNotes(selectedVehicle.id);
    } else {
      setPlannedParts([]);
      setAiNotes([]);
    }
  }, [selectedVehicle?.id]);

  const installedCount = plannedParts.filter((part) => part.status === "installed").length;
  const buildProgress = plannedParts.length ? Math.round((installedCount / plannedParts.length) * 100) : 0;
  const sourceCandidates = useMemo(
    () => buildSourceCandidates(partForm, selectedVehicle),
    [partForm, selectedVehicle]
  );
  const displayedSourceCandidates = liveSourceCandidates.length ? liveSourceCandidates : sourceCandidates;

  useEffect(() => {
    const savedProfile = window.localStorage.getItem("fitmentai-profile");
    const savedSession = window.localStorage.getItem("fitmentai-session");

    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile) as Profile;
        setProfile(parsedProfile);
        setProfileForm((current) => ({
          ...current,
          displayName: parsedProfile.display_name || current.displayName,
          email: parsedProfile.email || current.email,
          password: savedSession ? "saved-session" : current.password,
          role: parsedProfile.role || current.role,
        }));
      } catch {
        window.localStorage.removeItem("fitmentai-profile");
      }
    }
  }, []);

  useEffect(() => {
    const cachedVehicles = readGarageCache(profile?.id);

    if (cachedVehicles.length) {
      setVehicles(cachedVehicles);
      setSelectedId(cachedVehicles[0]?.id ?? "");
      setLoading(false);
    }

    void loadVehicles(profile?.id);
  }, [profile?.id]);

  async function authenticateProfile(action: "sign-in" | "sign-up") {
    setSigningIn(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profileForm,
          action,
        }),
      });
      const result = (await response.json()) as {
        profile?: Profile;
        session?: unknown;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.profile) {
        throw new Error(result.error || result.message || "Profile could not be loaded.");
      }

      setProfile(result.profile);
      window.localStorage.setItem("fitmentai-profile", JSON.stringify(result.profile));
      if (result.session) {
        window.localStorage.setItem("fitmentai-session", JSON.stringify(result.session));
      }
      setProfileForm((current) => ({ ...current, password: "saved-session" }));
      setMessage(result.message || "Account loaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account could not be loaded.");
    } finally {
      setSigningIn(false);
    }
  }

  function signOutProfile() {
    setProfile(null);
    setPlannedParts([]);
    window.localStorage.removeItem("fitmentai-profile");
    window.localStorage.removeItem("fitmentai-session");
    setProfileForm((current) => ({ ...current, password: "" }));
    setMessage("Signed out. Showing legacy demo/garage data.");
  }

  async function claimExistingVehicles() {
    if (!profile) {
      setMessage("Load a profile before claiming existing vehicles.");
      return;
    }

    setClaimingVehicles(true);
    setMessage("");

    try {
      const response = await fetch("/api/vehicles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          claimLegacy: true,
        }),
      });
      const result = (await response.json()) as { message?: string; error?: string; vehicles?: GarageVehicle[] };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Existing vehicles could not be moved to this profile.");
      }

      setMessage(result.message || "Existing vehicles moved to this profile.");
      await loadVehicles(profile.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Existing vehicles could not be moved to this profile.");
    } finally {
      setClaimingVehicles(false);
    }
  }

  async function loadVehicles(profileId = profile?.id) {
    const cacheKey = getGarageCacheKey(profileId);
    const hasCachedVehicles = vehicles.length > 0;

    setLoading(!hasCachedVehicles);
    setMessage("");

    try {
      const response = await fetchWithTimeout("/api/vehicles", {
        cache: "no-store",
        headers: getAuthHeaders(),
      }, 6500);
      const result = (await response.json()) as {
        vehicles?: GarageVehicle[];
        demoMode?: boolean;
        message?: string;
      };
      const nextVehicles = result.vehicles?.length ? result.vehicles : profileId ? [] : fallbackVehicles;

      setVehicles(nextVehicles);
      setSelectedId(nextVehicles[0]?.id ?? "");
      window.localStorage.setItem(cacheKey, JSON.stringify(nextVehicles));

      if (result.demoMode) {
        setMessage(result.message || "Demo mode: connect Supabase to load saved vehicles.");
      }
    } catch (error) {
      if (!hasCachedVehicles) {
        const cachedVehicles = readGarageCache(profileId);

        if (cachedVehicles.length) {
          setVehicles(cachedVehicles);
          setSelectedId(cachedVehicles[0]?.id ?? "");
          setMessage("Showing cached garage vehicles while the database catches up.");
        } else {
          setVehicles(fallbackVehicles);
          setSelectedId(fallbackVehicles[0].id);
          setMessage("Garage API was slow, so demo vehicles are showing for now. Try Refresh in a moment.");
        }
      } else {
        setMessage(error instanceof Error ? error.message : "Garage refresh took too long. Showing the current garage view.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveVehicle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetchWithTimeout("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...form,
        }),
      }, 8000);
      const result = (await response.json()) as {
        vehicle?: GarageVehicle;
        message?: string;
        error?: string;
        demoMode?: boolean;
      };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Vehicle could not be saved.");
      }

      if (result.vehicle) {
        const nextVehicles = [result.vehicle as GarageVehicle, ...vehicles.filter((vehicle) => !vehicle.id.startsWith("demo-"))];

        setVehicles(nextVehicles);
        setSelectedId(result.vehicle.id);
        window.localStorage.setItem(getGarageCacheKey(profile?.id), JSON.stringify(nextVehicles));
      }

      setMessage(result.message || "Vehicle saved to Supabase.");
      setForm(initialForm);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Vehicle could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteVehicle(id: string) {
    if (id.startsWith("demo-")) {
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== id));
      return;
    }

    setMessage("");

    try {
      const response = await fetch(`/api/vehicles?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Vehicle could not be deleted.");
      }

      setVehicles((current) => current.filter((vehicle) => vehicle.id !== id));
      setMessage("Vehicle deleted from Supabase.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Vehicle could not be deleted.");
    }
  }

  async function loadPlannedParts(vehicleId: string) {
    setPartsLoading(true);
    setPartsMessage("");

    try {
      const response = await fetchWithTimeout(`/api/planned-parts?vehicleId=${encodeURIComponent(vehicleId)}`, {
        cache: "no-store",
        headers: getAuthHeaders(),
      }, 6500);
      const result = (await response.json()) as {
        plannedParts?: PlannedPart[];
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Planned parts could not be loaded.");
      }

      setPlannedParts(result.plannedParts ?? []);
    } catch (error) {
      setPlannedParts([]);
      setPartsMessage(error instanceof Error ? error.message : "Planned parts could not be loaded.");
    } finally {
      setPartsLoading(false);
    }
  }

  async function loadAiNotes(vehicleId: string) {
    setAiNotesLoading(true);
    setAiNotesMessage("");

    try {
      const response = await fetchWithTimeout(`/api/ai-notes?vehicleId=${encodeURIComponent(vehicleId)}`, {
        cache: "no-store",
        headers: getAuthHeaders(),
      }, 6500);
      const result = (await response.json()) as {
        aiNotes?: AiNote[];
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || result.message || "AI notes could not be loaded.");
      }

      setAiNotes(result.aiNotes ?? []);
    } catch (error) {
      setAiNotes([]);
      setAiNotesMessage(error instanceof Error ? error.message : "AI notes could not be loaded.");
    } finally {
      setAiNotesLoading(false);
    }
  }

  async function savePlannedPart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedVehicle || selectedVehicle.id.startsWith("demo-")) {
      setPartsMessage("Save or select a database vehicle before adding planned parts.");
      return;
    }

    setSavingPart(true);
    setPartsMessage("Saving part to this car...");

    const optimisticPart: PlannedPart = {
      id: `temp-${Date.now()}`,
      vehicle_id: selectedVehicle.id,
      name: partForm.name.trim(),
      category: partForm.category.trim() || "Performance",
      source: partForm.source.trim() || null,
      source_url: normalizePartUrl(partForm.sourceUrl),
      source_type: partForm.sourceType.trim() || "Retailer",
      price: partForm.price.trim() || null,
      fitment_claim: partForm.fitmentClaim.trim() || null,
      status: "planned",
      fitment_score: null,
      fitment_status: null,
      fitment_warning: null,
      fitment_recommendation: null,
      fitment_checked_at: null,
      notes: partForm.notes.trim() || null,
      created_at: new Date().toISOString(),
    };

    setPlannedParts((current) => [optimisticPart, ...current]);

    try {
      const response = await fetchWithTimeout("/api/planned-parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          ...partForm,
        }),
      }, 8000);
      const result = (await response.json()) as {
        plannedPart?: PlannedPart;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Planned part could not be saved.");
      }

      if (result.plannedPart) {
        setPlannedParts((current) =>
          current.map((part) => (part.id === optimisticPart.id ? (result.plannedPart as PlannedPart) : part))
        );
      }

      setPartForm(initialPartForm);
      setPartsMessage(result.message || "Part saved to this vehicle.");
    } catch (error) {
      setPlannedParts((current) => current.filter((part) => part.id !== optimisticPart.id));
      setPartsMessage(error instanceof Error ? error.message : "Planned part could not be saved.");
    } finally {
      setSavingPart(false);
    }
  }

  async function saveSourceCandidate(candidate: SourceCandidate) {
    if (!selectedVehicle || selectedVehicle.id.startsWith("demo-")) {
      setPartsMessage("Save or select a database vehicle before saving a source candidate.");
      return;
    }

    setSavingCandidateId(candidate.id);
    setPartsMessage(`Saving ${candidate.source} to this build...`);

    const optimisticPart: PlannedPart = {
      id: `temp-${Date.now()}`,
      vehicle_id: selectedVehicle.id,
      name: candidate.name,
      category: candidate.category,
      source: candidate.source,
      source_url: normalizePartUrl(candidate.sourceUrl),
      source_type: candidate.sourceType,
      price: candidate.price,
      fitment_claim: candidate.fitmentClaim,
      status: "planned",
      fitment_score: null,
      fitment_status: null,
      fitment_warning: null,
      fitment_recommendation: null,
      fitment_checked_at: null,
      notes: candidate.notes,
      created_at: new Date().toISOString(),
    };

    setPlannedParts((current) => [optimisticPart, ...current]);

    try {
      const response = await fetchWithTimeout("/api/planned-parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          name: candidate.name,
          category: candidate.category,
          source: candidate.source,
          sourceUrl: candidate.sourceUrl,
          sourceType: candidate.sourceType,
          price: candidate.price,
          fitmentClaim: candidate.fitmentClaim,
          notes: candidate.notes,
        }),
      }, 8000);
      const result = (await response.json()) as {
        plannedPart?: PlannedPart;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Source candidate could not be saved.");
      }

      if (result.plannedPart) {
        setPlannedParts((current) =>
          current.map((part) => (part.id === optimisticPart.id ? (result.plannedPart as PlannedPart) : part))
        );
      }

      setPartsMessage(`${candidate.source} saved to this build. Run Check next to score fitment.`);
    } catch (error) {
      setPlannedParts((current) => current.filter((part) => part.id !== optimisticPart.id));
      setPartsMessage(error instanceof Error ? error.message : "Source candidate could not be saved.");
    } finally {
      setSavingCandidateId("");
    }
  }

  async function runLiveSourceSearch() {
    setSourceSearching(true);
    setSourceSearchMessage("Searching real source directories...");

    try {
      const response = await fetchWithTimeout("/api/source-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicle: selectedVehicle
            ? {
                year: selectedVehicle.year,
                make: selectedVehicle.make,
                model: selectedVehicle.model,
                trim: selectedVehicle.trim,
              }
            : undefined,
          part: {
            name: partForm.name,
            category: partForm.category,
          },
        }),
      }, 8000);
      const result = (await response.json()) as {
        sources?: SourceCandidate[];
        aiProvider?: string;
        aiSummary?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Live source search could not run.");
      }

      setLiveSourceCandidates(result.sources ?? []);
      setSourceSearchAiSummary(result.aiSummary || "");
      setSourceSearchProvider(result.aiProvider === "gemini" ? "Gemini live" : "Local fallback");
      setSourceSearchMessage(result.message || "Live source search ready.");
    } catch (error) {
      setSourceSearchMessage(error instanceof Error ? error.message : "Live source search could not run.");
    } finally {
      setSourceSearching(false);
    }
  }

  async function togglePartStatus(part: PlannedPart) {
    const nextStatus = part.status === "installed" ? "planned" : "installed";
    setPlannedParts((current) => current.map((item) => (item.id === part.id ? { ...item, status: nextStatus } : item)));

    try {
      const response = await fetch("/api/planned-parts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: part.id,
          status: nextStatus,
        }),
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Part status could not be updated.");
      }
    } catch (error) {
      setPlannedParts((current) => current.map((item) => (item.id === part.id ? part : item)));
      setPartsMessage(error instanceof Error ? error.message : "Part status could not be updated.");
    }
  }

  async function deletePlannedPart(id: string) {
    const deletedPart = plannedParts.find((part) => part.id === id);
    setPlannedParts((current) => current.filter((part) => part.id !== id));
    setPartsMessage("");

    try {
      const response = await fetch(`/api/planned-parts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error || result.message || "Planned part could not be deleted.");
      }
    } catch (error) {
      if (deletedPart) {
        setPlannedParts((current) => [deletedPart, ...current]);
      }
      setPartsMessage(error instanceof Error ? error.message : "Planned part could not be deleted.");
    }
  }

  async function deleteAiNote(id: string) {
    const deletedNote = aiNotes.find((note) => note.id === id);
    setAiNotes((current) => current.filter((note) => note.id !== id));
    setAiNotesMessage("");

    try {
      const response = await fetch(`/api/ai-notes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error || result.message || "AI note could not be deleted.");
      }
    } catch (error) {
      if (deletedNote) {
        setAiNotes((current) => [deletedNote, ...current]);
      }
      setAiNotesMessage(error instanceof Error ? error.message : "AI note could not be deleted.");
    }
  }

  async function runPartFitmentCheck(part: PlannedPart) {
    if (!selectedVehicle) {
      setPartsMessage("Select a vehicle before running a fitment check.");
      return;
    }

    setCheckingPartId(part.id);
    setPartsMessage("");

    try {
      const scoreResponse = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildFitmentRequest(selectedVehicle, part)),
      });
      const scoreResult = (await scoreResponse.json()) as FitmentResponse & { error?: string };

      if (!scoreResponse.ok) {
        throw new Error(scoreResult.error || "Fitment check could not be run.");
      }

      const fitmentPatch = {
        id: part.id,
        fitmentScore: scoreResult.score,
        fitmentStatus: scoreResult.status,
        fitmentWarning: scoreResult.warnings[0] || scoreResult.summary,
        fitmentRecommendation: scoreResult.recommendations[0] || "Verify this exact listing before buying.",
      };

      const updateResponse = await fetch("/api/planned-parts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(fitmentPatch),
      });
      const updateResult = (await updateResponse.json()) as {
        plannedPart?: PlannedPart;
        error?: string;
        message?: string;
      };

      if (!updateResponse.ok) {
        throw new Error(updateResult.error || updateResult.message || "Fitment result could not be saved to this part.");
      }

      if (updateResult.plannedPart) {
        setPlannedParts((current) =>
          current.map((item) => (item.id === part.id ? (updateResult.plannedPart as PlannedPart) : item))
        );
      } else {
        setPlannedParts((current) =>
          current.map((item) =>
            item.id === part.id
              ? {
                  ...item,
                  fitment_score: fitmentPatch.fitmentScore,
                  fitment_status: fitmentPatch.fitmentStatus,
                  fitment_warning: fitmentPatch.fitmentWarning,
                  fitment_recommendation: fitmentPatch.fitmentRecommendation,
                  fitment_checked_at: new Date().toISOString(),
                }
              : item
          )
        );
      }

      setPartsMessage(`Fitment result saved to ${part.name}.`);
    } catch (error) {
      setPartsMessage(error instanceof Error ? error.message : "Fitment check could not be saved to this part.");
    } finally {
      setCheckingPartId("");
    }
  }

  return (
    <section id="garage" className="relative mx-auto grid max-w-7xl gap-6 px-4 py-12 md:px-8 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="absolute inset-x-5 top-0 -z-10 h-[520px] rounded-[40px] bg-[radial-gradient(circle_at_24%_35%,rgba(154,116,40,0.17),transparent_36%),radial-gradient(circle_at_78%_50%,rgba(47,138,85,0.16),transparent_36%)] blur-2xl" />
        <div className="rounded-lg border border-line bg-panel/95 p-5 shadow-glow md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Garage</p>
        <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5]">Store every car you are building.</h2>
        <p className="mt-4 leading-7 text-[#b8ac91]">
          Save vehicles to Supabase, then use them as the foundation for builds,
          fitment checks, saved parts, and AI context.
        </p>

        <div className="mt-6 rounded-lg border border-volt/15 bg-volt/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Profile</p>
              <h3 className="mt-2 text-lg font-semibold text-[#f3ead5]">
                {profile ? profile.display_name || profile.email : "Create an account or sign in"}
              </h3>
              <p className="mt-1 text-sm text-[#9e9278]">
                {profile
                  ? `${profile.email} - ${profile.role || "Member"}`
                  : "Supabase Auth email/password account for garage ownership."}
              </p>
            </div>
            {profile ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void claimExistingVehicles()}
                  disabled={claimingVehicles}
                  className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {claimingVehicles ? "Claiming..." : "Claim existing cars"}
                </button>
                <button
                  type="button"
                  onClick={signOutProfile}
                  className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-[#d8cba9] transition hover:border-warning hover:text-orange-200"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>

          {!profile ? (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Display name" value={profileForm.displayName} onChange={(value) => updateProfileForm("displayName", value)} />
                <Input label="Email" value={profileForm.email} onChange={(value) => updateProfileForm("email", value)} required />
                <Input label="Password" value={profileForm.password} onChange={(value) => updateProfileForm("password", value)} required type="password" />
                <Input label="Role" value={profileForm.role} onChange={(value) => updateProfileForm("role", value)} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void authenticateProfile("sign-in")}
                  disabled={signingIn}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-volt/40 bg-[#09160e] px-5 font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => void authenticateProfile("sign-up")}
                  disabled={signingIn}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create account
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Vehicle entry</p>
            <h3 className="mt-2 text-lg font-semibold text-[#f3ead5]">Add a car to this garage</h3>
          </div>
          <button
            type="button"
            onClick={fillDemoVehicle}
            className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
          >
            Use demo car
          </button>
        </div>

        <form onSubmit={saveVehicle} className="mt-3 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Year" value={form.year} onChange={(value) => updateForm("year", value)} required />
            <Input label="Make" value={form.make} onChange={(value) => updateForm("make", value)} required />
            <Input label="Model" value={form.model} onChange={(value) => updateForm("model", value)} required />
            <Input label="Trim" value={form.trim} onChange={(value) => updateForm("trim", value)} />
          </div>
          <Input label="Build nickname" value={form.nickname} onChange={(value) => updateForm("nickname", value)} />
          <Input label="Current setup" value={form.currentSetup} onChange={(value) => updateForm("currentSetup", value)} />
          <Input label="Suspension setup" value={form.suspensionSetup} onChange={(value) => updateForm("suspensionSetup", value)} />
          <TextArea label="Dream setup" value={form.dreamSetup} onChange={(value) => updateForm("dreamSetup", value)} />
          <TextArea label="Parts to buy" value={form.partsToBuy} onChange={(value) => updateForm("partsToBuy", value)} />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {profile ? "Save vehicle to my garage" : "Save vehicle to database"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-lg border border-volt/25 bg-volt/10 p-3 text-sm text-[#d8cba9]">
            {message}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-line bg-panel/95 p-4 shadow-glow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Saved vehicles</p>
            <h3 className="mt-2 text-xl font-semibold text-[#f3ead5]">
              {loading ? "Loading garage..." : `${vehicles.length} garage vehicle${vehicles.length === 1 ? "" : "s"}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => void loadVehicles()}
            className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {vehicles.map((vehicle) => (
            <button
              type="button"
              key={vehicle.id}
              onClick={() => setSelectedId(vehicle.id)}
              className={`rounded-lg border p-4 text-left transition ${
                selectedVehicle?.id === vehicle.id ? "border-volt bg-volt/10" : "border-line bg-[#0a180f] hover:border-volt/60"
              }`}
            >
              <p className="text-sm font-semibold text-[#f3ead5]">{vehicleName(vehicle)}</p>
              <p className="mt-1 text-xs text-[#9e9278]">{vehicle.nickname || "Saved build"}</p>
              <p className="mt-4 text-xs leading-5 text-[#b8ac91]">{vehicle.current_setup || "Setup pending"}</p>
            </button>
          ))}
        </div>

        {!loading && vehicles.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-line bg-[#07120c] p-5">
            <p className="font-semibold text-[#f3ead5]">No cars saved to this profile yet.</p>
            <p className="mt-2 text-sm leading-6 text-[#9e9278]">
              Use the demo car button on the left, save it, then add a planned part and run a fitment check.
            </p>
          </div>
        ) : null}

        {selectedVehicle ? (
          <div className="mt-4 rounded-lg border border-line bg-[#07120c] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Selected vehicle</p>
                <h3 className="mt-2 text-xl font-semibold text-[#f3ead5]">{vehicleName(selectedVehicle)}</h3>
              </div>
              <button
                type="button"
                onClick={() => void deleteVehicle(selectedVehicle.id)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-[#d8cba9] transition hover:border-warning hover:text-orange-200"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Detail label="Current setup" value={selectedVehicle.current_setup} />
              <Detail label="Suspension" value={selectedVehicle.suspension_setup} />
              <Detail label="Dream setup" value={selectedVehicle.dream_setup} />
              <Detail label="Parts to buy" value={selectedVehicle.parts_to_buy} />
            </div>

            <div className="mt-4 rounded-lg border border-line bg-[#07120c] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Saved AI notes</p>
                  <h4 className="mt-2 text-lg font-semibold text-[#f3ead5]">
                    {aiNotesLoading ? "Loading AI answers..." : `${aiNotes.length} saved answer${aiNotes.length === 1 ? "" : "s"}`}
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-[#9e9278]">
                    Ask FitmentAI can now save advice, risk checks, and build plans directly to this vehicle.
                  </p>
                </div>
                <a
                  href="#ask"
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-volt/30 bg-volt/10 px-4 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                >
                  <Sparkles className="h-4 w-4" />
                  Ask AI
                </a>
              </div>

              {aiNotesMessage ? (
                <p className="mt-3 rounded-lg border border-volt/25 bg-volt/10 p-3 text-sm text-[#d8cba9]">
                  {aiNotesMessage}
                </p>
              ) : null}

              <div className="mt-4 grid gap-3">
                {aiNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-line bg-[#09160e] p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#f3ead5]">{note.title}</p>
                          {note.confidence ? (
                            <span className="rounded-md border border-volt/20 bg-volt/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8cba9]">
                              {note.confidence}
                            </span>
                          ) : null}
                        </div>
                        {note.question ? (
                          <p className="mt-2 text-xs leading-5 text-[#9e9278]">Question: {note.question}</p>
                        ) : null}
                        <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-6 text-[#b8ac91]">
                          {note.answer}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void deleteAiNote(note.id)}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-warning hover:text-orange-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {!aiNotesLoading && aiNotes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line bg-[#09160e] p-4 text-sm leading-6 text-[#9e9278]">
                    No AI notes saved for this car yet. Go to Ask FitmentAI, ask about this build, then hit Save to My Garage.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-volt/15 bg-volt/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Build planner</p>
                  <h4 className="mt-2 text-lg font-semibold text-[#f3ead5]">
                    {plannedParts.length ? `${buildProgress}% complete` : "Plan parts for this car"}
                  </h4>
                  <p className="mt-1 text-sm text-[#9e9278]">
                    {partsLoading
                      ? "Loading planned parts..."
                      : `${installedCount} installed / ${plannedParts.length} planned`}
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#17251a] sm:w-48">
                  <div className="h-full rounded-full bg-volt transition-all" style={{ width: `${buildProgress}%` }} />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-line bg-[#07120c] p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-[#b8ac91]">
                  Save a part from any manufacturer, retailer, shop, marketplace, or forum, then run a check to attach fitment risk to it.
                </p>
                <button
                  type="button"
                  onClick={fillDemoPart}
                  className="h-10 shrink-0 rounded-lg border border-line px-4 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                >
                  Use demo part
                </button>
              </div>

              <div className="mt-4 rounded-lg border border-line bg-[#07120c] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Compare sources</p>
                    <h4 className="mt-2 text-lg font-semibold text-[#f3ead5]">
                      {partForm.name || "Part"} across websites
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-[#9e9278]">
                      Run a live source search for real Porsche, Rennline, AA Carbon, AhaCarbon, retailer, and shop search links, then save the best source to this build.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {liveSourceCandidates.length ? (
                      <button
                        type="button"
                        onClick={() => {
                          setLiveSourceCandidates([]);
                          setSourceSearchAiSummary("");
                          setSourceSearchProvider("");
                          setSourceSearchMessage("Showing starter comparison sources.");
                        }}
                        className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                      >
                        Starter sources
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void runLiveSourceSearch()}
                      disabled={sourceSearching}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-volt px-4 text-sm font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {sourceSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Live source search
                    </button>
                  </div>
                </div>

                {sourceSearchMessage ? (
                  <p className="mt-3 rounded-lg border border-volt/25 bg-volt/10 p-3 text-sm text-[#d8cba9]">
                    {sourceSearchMessage}
                  </p>
                ) : null}

                {sourceSearchAiSummary ? (
                  <div className="mt-3 rounded-lg border border-volt/20 bg-volt/5 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Sparkles className="h-4 w-4 text-volt" />
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">AI source advisor</p>
                      <span className="rounded-md border border-line bg-[#07120c] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9e9278]">
                        {sourceSearchProvider}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#d8cba9]">
                      {sourceSearchAiSummary}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {displayedSourceCandidates.map((candidate) => (
                    <div key={candidate.id} className="rounded-lg border border-line bg-[#09160e] p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[#f3ead5]">{candidate.source}</p>
                            <span className="rounded-md border border-volt/20 bg-volt/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8cba9]">
                              {candidate.sourceType}
                            </span>
                            <span className={`rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                              candidate.confidence >= 86
                                ? "bg-signal/15 text-signal"
                                : candidate.confidence >= 74
                                  ? "bg-volt/15 text-volt"
                                  : "bg-warning/15 text-orange-200"
                            }`}>
                              {candidate.confidence}% confidence
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[#d7c28b]">{candidate.price}</p>
                          <p className="mt-2 text-xs leading-5 text-[#b8ac91]">Claim: {candidate.fitmentClaim}</p>
                          <p className="mt-2 text-xs leading-5 text-orange-200">Check: {candidate.warning}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                          <a
                            href={candidate.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              setPartForm({
                                name: candidate.name,
                                category: candidate.category,
                                source: candidate.source,
                                sourceUrl: candidate.sourceUrl,
                                sourceType: candidate.sourceType,
                                price: candidate.price,
                                fitmentClaim: candidate.fitmentClaim,
                                notes: candidate.notes,
                              })
                            }
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-line px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveSourceCandidate(candidate)}
                            disabled={savingCandidateId === candidate.id || !selectedVehicle || selectedVehicle.id.startsWith("demo-")}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-volt px-3 text-xs font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {savingCandidateId === candidate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Save best
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={savePlannedPart} className="mt-4 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Part name" value={partForm.name} onChange={(value) => updatePartForm("name", value)} required />
                  <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
                    Category
                    <select
                      value={partForm.category}
                      onChange={(event) => updatePartForm("category", event.target.value)}
                      className="h-11 rounded-lg border border-line bg-[#09160e] px-3 text-[#f3ead5] outline-none ring-volt/20 transition focus:border-volt focus:ring-4"
                    >
                      {partCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input label="Source name" value={partForm.source} onChange={(value) => updatePartForm("source", value)} />
                  <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
                    Source type
                    <select
                      value={partForm.sourceType}
                      onChange={(event) => updatePartForm("sourceType", event.target.value)}
                      className="h-11 rounded-lg border border-line bg-[#09160e] px-3 text-[#f3ead5] outline-none ring-volt/20 transition focus:border-volt focus:ring-4"
                    >
                      {sourceTypes.map((sourceType) => (
                        <option key={sourceType} value={sourceType}>
                          {sourceType}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input label="Source URL" value={partForm.sourceUrl} onChange={(value) => updatePartForm("sourceUrl", value)} />
                  <Input label="Price" value={partForm.price} onChange={(value) => updatePartForm("price", value)} />
                </div>
                <TextArea label="Fitment claim from listing" value={partForm.fitmentClaim} onChange={(value) => updatePartForm("fitmentClaim", value)} />
                <TextArea label="Notes" value={partForm.notes} onChange={(value) => updatePartForm("notes", value)} />
                <button
                  type="submit"
                  disabled={savingPart || !selectedVehicle || selectedVehicle.id.startsWith("demo-")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingPart ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Save part to this car
                </button>
              </form>

              {partsMessage ? (
                <p className="mt-3 rounded-lg border border-volt/25 bg-volt/10 p-3 text-sm text-[#d8cba9]">
                  {partsMessage}
                </p>
              ) : null}

              <div className="mt-4 grid gap-3">
                {plannedParts.map((part) => {
                  const partIsSaving = part.id.startsWith("temp-");

                  return (
                  <div key={part.id} className={`rounded-lg border p-3 ${partIsSaving ? "border-volt/35 bg-volt/5" : "border-line bg-[#07120c]"}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#f3ead5]">{part.name}</p>
                          <span
                            className={`rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                              partIsSaving
                                ? "bg-volt/20 text-[#d8cba9]"
                                : part.status === "installed"
                                  ? "bg-signal/15 text-signal"
                                  : "bg-volt/15 text-volt"
                            }`}
                          >
                            {partIsSaving ? "saving" : part.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[#9e9278]">
                          {part.category}
                          {part.source ? ` - ${part.source}` : ""}
                          {part.price ? ` - ${part.price}` : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-md border border-volt/20 bg-volt/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8cba9]">
                            {part.source_type || inferSourceType(part.source)}
                          </span>
                          {part.source_url ? (
                            <a
                              href={part.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-line bg-[#09160e] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8cba9] transition hover:border-volt hover:text-volt"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open source
                            </a>
                          ) : (
                            <span className="rounded-md border border-line bg-[#09160e] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9e9278]">
                              URL needed
                            </span>
                          )}
                        </div>
                        {part.fitment_claim ? (
                          <p className="mt-2 rounded-lg border border-line bg-[#0a180f] p-3 text-xs leading-5 text-[#d8cba9]">
                            Listing claim: {part.fitment_claim}
                          </p>
                        ) : null}
                        {part.notes ? <p className="mt-2 text-sm leading-6 text-[#b8ac91]">{part.notes}</p> : null}
                        {part.fitment_score !== null ? (
                          <div className="mt-3 rounded-lg border border-volt/15 bg-volt/5 p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-volt px-2 py-1 text-xs font-bold text-[#07120c]">
                                {part.fitment_score}/100
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d8cba9]">
                                {part.fitment_status || "Fitment checked"}
                              </span>
                            </div>
                            {part.fitment_warning ? (
                              <p className="mt-2 text-xs leading-5 text-orange-200">{part.fitment_warning}</p>
                            ) : null}
                            {part.fitment_recommendation ? (
                              <p className="mt-2 text-xs leading-5 text-[#b8ac91]">
                                Recommendation: {part.fitment_recommendation}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => void runPartFitmentCheck(part)}
                          disabled={checkingPartId === part.id || partIsSaving}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
                        >
                          {checkingPartId === part.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
                          Check
                        </button>
                        <button
                          type="button"
                          onClick={() => void togglePartStatus(part)}
                          disabled={partIsSaving}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-signal hover:text-signal sm:flex-none"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {part.status === "installed" ? "Planned" : "Installed"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deletePlannedPart(part.id)}
                          disabled={partIsSaving}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-warning hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })}
                {!partsLoading && plannedParts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line bg-[#07120c] p-4 text-sm text-[#9e9278]">
                    No planned parts saved for this car yet. Add one from a parts website, then run Check to save a score.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );

  function updateForm<Key extends keyof VehicleForm>(key: Key, value: VehicleForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateProfileForm<Key extends keyof ProfileForm>(key: Key, value: ProfileForm[Key]) {
    setProfileForm((current) => ({ ...current, [key]: value }));
  }

  function updatePartForm<Key extends keyof PlannedPartForm>(key: Key, value: PlannedPartForm[Key]) {
    setPartForm((current) => ({ ...current, [key]: value }));
  }

  function fillDemoVehicle() {
    setForm(demoVehicleForm);
    setMessage("Demo vehicle loaded. Save it to add it to this profile.");
  }

  function fillDemoPart() {
    setPartForm(demoPartForm);
    setPartsMessage("Demo part loaded. Save it, then run Check to store a fitment result.");
  }
}

function getGarageCacheKey(profileId?: string) {
  return `${garageCachePrefix}:${profileId || "legacy"}`;
}

function readGarageCache(profileId?: string) {
  try {
    const cached = window.localStorage.getItem(getGarageCacheKey(profileId));
    const parsed = cached ? (JSON.parse(cached) as GarageVehicle[]) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

function vehicleName(vehicle: GarageVehicle) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
}

function buildFitmentRequest(vehicle: GarageVehicle, part: PlannedPart): FitmentRequest {
  return {
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim || "",
    partCategory: normalizePartCategory(part.category),
    partType: part.name,
    specificPart: [part.name, part.source, part.source_type, part.price, part.fitment_claim, part.source_url, part.notes].filter(Boolean).join(" - "),
    currentWheelSize: extractWheelSize(vehicle.current_setup) || "18x8",
    newWheelSize: extractWheelSize(part.notes || part.name) || extractWheelSize(vehicle.current_setup) || "19x9.5",
    tireSize: extractTireSize(part.notes || vehicle.current_setup || "") || "255/35R19",
    offset: extractOffset(part.notes || vehicle.current_setup || "") || "+35",
    suspensionSetup: normalizeSuspension(vehicle.suspension_setup),
    spacerSize: extractSpacer(part.notes || vehicle.current_setup || "") || "0mm",
    notes: [vehicle.dream_setup, part.notes].filter(Boolean).join(" "),
  };
}

function normalizePartUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function inferSourceType(source: string | null | undefined) {
  const lower = source?.toLowerCase() || "";

  if (lower.includes("forum") || lower.includes("owner")) return "Forum";
  if (lower.includes("shop") || lower.includes("tuning")) return "Shop";
  if (lower.includes("ebay") || lower.includes("market")) return "Marketplace";
  if (lower.includes("carbon") || lower.includes("motorsport") || lower.includes("performance")) return "Retailer";

  return "Retailer";
}

function buildSourceCandidates(part: PlannedPartForm, vehicle: GarageVehicle | undefined): SourceCandidate[] {
  const partName = part.name.trim() || "Selected part";
  const category = part.category.trim() || "Performance";
  const vehicleLabel = vehicle ? vehicleName(vehicle) : "selected vehicle";
  const slug = encodeURIComponent(`${vehicleLabel} ${partName}`.toLowerCase().replace(/\s+/g, "-"));
  const baseClaim = part.fitmentClaim.trim() || `Claims compatibility with ${vehicleLabel}.`;

  return [
    {
      id: "manufacturer-direct",
      name: partName,
      category,
      source: part.source.trim() || "Manufacturer Direct",
      sourceUrl: part.sourceUrl.trim() || `https://www.google.com/search?q=${slug}+manufacturer`,
      sourceType: part.sourceType.trim() || "Manufacturer",
      price: part.price.trim() || "$350-$500",
      confidence: 91,
      fitmentClaim: baseClaim,
      warning: "Best fitment evidence, but confirm exact trim and included hardware.",
      notes: `Manufacturer-style source for ${vehicleLabel}. Save this when fitment notes and part numbers are clear.`,
    },
    {
      id: "retailer-stock",
      name: partName,
      category,
      source: "Specialty retailer",
      sourceUrl: `https://www.google.com/search?q=${slug}+retailer`,
      sourceType: "Retailer",
      price: "$325-$575",
      confidence: 82,
      fitmentClaim: `Retailer listing says this fits ${vehicleLabel} or the same generation.`,
      warning: "Check return policy, trim notes, and whether the listing uses generic compatibility.",
      notes: `Retailer source candidate. Good for availability and returns, but verify the actual manufacturer part number.`,
    },
    {
      id: "marketplace-value",
      name: partName,
      category,
      source: "Marketplace listing",
      sourceUrl: `https://www.google.com/search?q=${slug}+marketplace`,
      sourceType: "Marketplace",
      price: "$220-$430",
      confidence: 64,
      fitmentClaim: `Marketplace seller claims broad ${vehicle?.make || "vehicle"} fitment.`,
      warning: "Higher risk: verify photos, part number, mounting points, seller reputation, and return terms.",
      notes: "Marketplace option. Save only if the seller provides exact fitment proof and clear photos.",
    },
    {
      id: "shop-verified",
      name: partName,
      category,
      source: "Tuning shop recommendation",
      sourceUrl: `https://www.google.com/search?q=${slug}+tuning+shop`,
      sourceType: "Shop",
      price: "$420-$700 installed",
      confidence: 87,
      fitmentClaim: `Shop-style recommendation based on installed builds similar to ${vehicleLabel}.`,
      warning: "Usually stronger install confidence, but ask what labor, hardware, and warranty are included.",
      notes: "Shop-backed source candidate. Useful when installation details matter as much as part price.",
    },
  ];
}

function normalizePartCategory(category: string): PartCategory {
  const lower = category.toLowerCase();

  if (lower.includes("wheel")) return "wheels";
  if (lower.includes("tire")) return "tires";
  if (lower.includes("suspension")) return "suspension";
  if (lower.includes("spacer") || lower.includes("adapter")) return "spacers-adapters";
  if (lower.includes("brake")) return "brakes";
  if (lower.includes("exterior")) return "exterior";

  return "performance-interior";
}

function normalizeSuspension(setup: string | null): SuspensionSetup {
  const lower = setup?.toLowerCase() || "";

  if (lower.includes("spring")) return "lowering-springs";
  if (lower.includes("coil")) return "coilovers";
  if (lower.includes("air")) return "air-suspension";

  return "stock";
}

function extractWheelSize(text: string | null) {
  return text?.match(/\b\d{2}x\d{1,2}(?:\.\d)?\b/i)?.[0] ?? "";
}

function extractTireSize(text: string) {
  return text.match(/\b\d{3}\/\d{2}R\d{2}\b/i)?.[0] ?? "";
}

function extractOffset(text: string) {
  return text.match(/[+-]\d{1,3}\b/)?.[0] ?? "";
}

function extractSpacer(text: string) {
  return text.match(/\b\d{1,2}mm\b/i)?.[0] ?? "";
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-volt/15 bg-volt/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-volt">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#b8ac91]">{value || "Not saved yet"}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-line bg-[#09160e] px-3 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
      {label}
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-line bg-[#09160e] px-3 py-3 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
      />
    </label>
  );
}
