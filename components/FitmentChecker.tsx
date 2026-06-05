"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, BookmarkPlus, CheckCircle2, ChevronDown, ExternalLink, Gauge, Loader2, Sparkles, X } from "lucide-react";
import { getAuthHeaders } from "@/lib/clientAuth";
import type { FitmentRequest, FitmentResponse, PartCategory, SuspensionSetup } from "@/lib/fitmentScore";

const initialForm: FitmentRequest = {
  year: "2020",
  make: "BMW",
  model: "M340i",
  trim: "xDrive",
  partCategory: "wheels",
  partType: "Wheel and tire package",
  specificPart: "Apex VS-5RS wheels, 19x9.5 +35, Michelin Pilot Sport 4S",
  currentWheelSize: "18x8",
  newWheelSize: "19x9.5",
  tireSize: "255/35R19",
  offset: "+35",
  suspensionSetup: "coilovers",
  spacerSize: "5mm",
  notes: "Daily driver, wants flush fitment without rubbing.",
};

const suspensionOptions: Array<{ value: SuspensionSetup; label: string }> = [
  { value: "stock", label: "Stock" },
  { value: "lowering-springs", label: "Lowering springs" },
  { value: "coilovers", label: "Coilovers" },
  { value: "air-suspension", label: "Air suspension" },
];

const yearOptions = Array.from({ length: 28 }, (_, index) => String(2027 - index));
const makeOptions = ["Acura", "Audi", "BMW", "Chevrolet", "Dodge", "Ford", "Honda", "Hyundai", "Infiniti", "Lexus", "Mazda", "Mercedes-Benz", "Nissan", "Porsche", "Subaru", "Tesla", "Toyota", "Volkswagen"];
const modelOptionsByMake: Record<string, string[]> = {
  Acura: ["Integra", "TLX", "RSX", "NSX"],
  Audi: ["A4", "S4", "A5", "RS 5", "RS 3"],
  BMW: ["3 Series", "M340i", "M3", "M4", "5 Series"],
  Chevrolet: ["Camaro", "Corvette", "SS", "Malibu"],
  Dodge: ["Challenger", "Charger", "Dart"],
  Ford: ["Mustang", "Focus ST", "Fiesta ST", "Taurus SHO"],
  Honda: ["Civic", "Accord", "S2000", "Prelude"],
  Hyundai: ["Elantra N", "Veloster N", "Genesis Coupe"],
  Infiniti: ["G35", "G37", "Q50", "Q60"],
  Lexus: ["IS 250", "IS 350", "RC 350", "GS 350"],
  Mazda: ["MX-5 Miata", "Mazda3", "RX-8", "Mazda6"],
  "Mercedes-Benz": ["C-Class", "CLA", "E-Class", "AMG GT"],
  Nissan: ["350Z", "370Z", "Z", "GT-R", "Silvia"],
  Porsche: ["911", "Cayman", "Boxster", "Panamera", "Taycan", "Macan"],
  Subaru: ["WRX", "WRX STI", "BRZ", "Legacy GT"],
  Tesla: ["Model 3", "Model S", "Model Y"],
  Toyota: ["GR86", "Supra", "Camry", "Corolla"],
  Volkswagen: ["Golf GTI", "Golf R", "Jetta GLI", "Arteon"],
};
const trimOptionsByMakeAndModel: Record<string, Record<string, string[]>> = {
  Acura: {
    Integra: ["Base", "A-Spec", "A-Spec Technology", "Type S"],
    TLX: ["Base", "Technology", "A-Spec", "Type S"],
    RSX: ["Base", "Type S"],
    NSX: ["Coupe", "Type S"],
  },
  Audi: {
    A4: ["Premium", "Premium Plus", "Prestige"],
    S4: ["Premium", "Premium Plus", "Prestige"],
    A5: ["Premium", "Premium Plus", "Prestige"],
    "RS 5": ["Base", "Competition"],
    "RS 3": ["Base", "Dynamic Plus"],
  },
  BMW: {
    "3 Series": ["330i", "330i xDrive", "M Sport"],
    M340i: ["Base", "xDrive"],
    M3: ["Base", "Competition", "Competition xDrive"],
    M4: ["Base", "Competition", "Competition xDrive"],
    "5 Series": ["530i", "540i", "540i xDrive", "M Sport"],
  },
  Chevrolet: {
    Camaro: ["1LT", "2LT", "LT1", "SS", "ZL1"],
    Corvette: ["Stingray", "Z51", "Grand Sport", "Z06"],
    SS: ["Base"],
    Malibu: ["LS", "RS", "LT", "Premier"],
  },
  Dodge: {
    Challenger: ["SXT", "GT", "R/T", "Scat Pack", "Hellcat"],
    Charger: ["SXT", "GT", "R/T", "Scat Pack", "Hellcat"],
    Dart: ["SE", "SXT", "GT", "Limited"],
  },
  Ford: {
    Mustang: ["EcoBoost", "GT", "Mach 1", "Dark Horse", "Shelby GT500"],
    "Focus ST": ["ST1", "ST2", "ST3"],
    "Fiesta ST": ["ST"],
    "Taurus SHO": ["SHO"],
  },
  Honda: {
    Civic: ["LX", "Sport", "EX", "Si", "Type R"],
    Accord: ["LX", "Sport", "EX-L", "Touring"],
    S2000: ["Base", "CR"],
    Prelude: ["Base", "Si", "SH"],
  },
  Hyundai: {
    "Elantra N": ["Base", "Performance"],
    "Veloster N": ["Base", "Performance Package"],
    "Genesis Coupe": ["2.0T", "3.8", "R-Spec", "Track"],
  },
  Infiniti: {
    G35: ["Base", "Journey", "Sport"],
    G37: ["Base", "Journey", "Sport", "IPL"],
    Q50: ["Pure", "Luxe", "Sport", "Red Sport 400"],
    Q60: ["Pure", "Luxe", "Sport", "Red Sport 400"],
  },
  Lexus: {
    "IS 250": ["Base", "F Sport"],
    "IS 350": ["Base", "F Sport"],
    "RC 350": ["Base", "F Sport"],
    "GS 350": ["Base", "F Sport"],
  },
  Mazda: {
    "MX-5 Miata": ["Sport", "Club", "Grand Touring"],
    Mazda3: ["Select", "Preferred", "Premium", "Turbo"],
    "RX-8": ["Sport", "Touring", "Grand Touring", "R3"],
    Mazda6: ["Sport", "Touring", "Grand Touring", "Signature"],
  },
  "Mercedes-Benz": {
    "C-Class": ["C 300", "C 300 4MATIC", "AMG C 43", "AMG C 63"],
    CLA: ["CLA 250", "CLA 250 4MATIC", "AMG CLA 35", "AMG CLA 45"],
    "E-Class": ["E 350", "E 450", "AMG E 53", "AMG E 63"],
    "AMG GT": ["GT", "GT S", "GT C", "GT R"],
  },
  Nissan: {
    "350Z": ["Base", "Enthusiast", "Touring", "Track", "Nismo"],
    "370Z": ["Base", "Sport", "Touring", "Nismo"],
    Z: ["Sport", "Performance", "Nismo"],
    "GT-R": ["Premium", "Track Edition", "Nismo"],
    Silvia: ["Spec-S", "Spec-R"],
  },
  Porsche: {
    "911": ["Carrera", "Carrera S", "Carrera 4S", "GTS", "Turbo", "Turbo S", "GT3"],
    Cayman: ["Base", "S", "GTS", "GT4"],
    Boxster: ["Base", "S", "GTS", "Spyder"],
    Panamera: ["Base", "4", "4S", "GTS", "Turbo S"],
    Taycan: ["Base", "4S", "GTS", "Turbo", "Turbo S"],
    Macan: ["Base", "T", "S", "GTS", "Turbo"],
  },
  Subaru: {
    WRX: ["Base", "Premium", "Limited", "GT", "TR"],
    "WRX STI": ["Base", "Limited", "Type RA", "S209"],
    BRZ: ["Premium", "Limited", "tS"],
    "Legacy GT": ["Base", "Limited", "Spec.B"],
  },
  Tesla: {
    "Model 3": ["Rear-Wheel Drive", "Long Range", "Performance"],
    "Model S": ["Long Range", "Plaid"],
    "Model Y": ["Rear-Wheel Drive", "Long Range", "Performance"],
  },
  Toyota: {
    GR86: ["Base", "Premium", "Trueno Edition"],
    Supra: ["2.0", "3.0", "3.0 Premium", "A91"],
    Camry: ["SE", "XSE", "TRD", "XLE"],
    Corolla: ["LE", "SE", "XSE", "GR Corolla"],
  },
  Volkswagen: {
    "Golf GTI": ["S", "SE", "Autobahn"],
    "Golf R": ["Base", "20th Anniversary"],
    "Jetta GLI": ["S", "Autobahn"],
    Arteon: ["SE R-Line", "SEL R-Line", "SEL Premium R-Line"],
  },
};
const wheelSizeOptions = ["16x7", "17x7.5", "17x8", "18x8", "18x8.5", "18x9", "19x8.5", "19x9", "19x9.5", "19x10", "20x9", "20x10", "20x11"];
const tireSizeOptions = ["215/45R17", "225/40R18", "235/40R18", "245/35R19", "255/35R19", "265/35R19", "275/30R20", "285/30R20", "305/30R20", "315/35R20", "315/45R20"];
const offsetOptions = ["+55", "+45", "+40", "+35", "+30", "+25", "+20", "+15", "+10", "0", "-5", "-12"];
const spacerOptions = ["0mm", "3mm", "5mm", "10mm", "15mm", "20mm", "25mm", "30mm"];
const partCategoryOptions: Array<{ value: PartCategory; label: string }> = [
  { value: "wheels", label: "Wheels" },
  { value: "tires", label: "Tires" },
  { value: "suspension", label: "Suspension" },
  { value: "spacers-adapters", label: "Spacers & Adapters" },
  { value: "brakes", label: "Brakes" },
  { value: "exterior", label: "Exterior" },
  { value: "performance-interior", label: "Performance and Interior" },
];
const partTypeOptionsByCategory: Record<PartCategory, string[]> = {
  wheels: ["Wheel set", "Forged wheels", "Flow formed wheels", "OEM wheels", "Beadlock wheels", "Wheel and tire package"],
  tires: ["Summer tires", "All-season tires", "Performance tires", "Track tires", "Drag radials", "Winter tires"],
  suspension: ["Lowering springs", "Coilovers", "Air suspension kit", "Sway bars", "Control arms"],
  "spacers-adapters": ["Wheel spacers", "Wheel adapters", "Stud conversion", "Lug nuts / bolts", "Hub rings"],
  brakes: ["Brake pads", "Brake rotors", "Big brake kit", "Calipers", "Brake lines", "Brake fluid", "Pad wear sensors"],
  exterior: [
    "Full body kit",
    "Front lip / splitter",
    "Side skirts",
    "Rear diffuser",
    "Spoiler / wing",
    "Carbon hood",
    "Widebody / overfenders",
    "Mirror caps",
    "Grille",
    "Headlights",
    "Tail lights",
    "Side markers",
    "Emblems / badges",
  ],
  "performance-interior": [
    "Axle-back exhaust",
    "Cat-back exhaust",
    "Downpipe",
    "Headers",
    "Midpipe",
    "Valved exhaust",
    "Exhaust tips",
    "Cold air intake",
    "Short ram intake",
    "Turbo inlet",
    "Charge pipe",
    "Intercooler",
    "Air filter",
    "ECU tune",
    "Piggyback tuner",
    "Turbo upgrade",
    "Supercharger kit",
    "Fuel pump",
    "Injectors",
    "Shift knob",
    "Seats",
    "Steering wheel",
    "Gauge cluster",
    "Interior trim",
  ],
};

const intakeSteps = ["Vehicle", "Search", "Listing", "Score"];
const sourceFilters = ["All", "Manufacturer", "ECS Tuning", "FCP Euro", "Turner", "Fitment Industries", "Marketplace"];
const sampleBuilds: Array<{ label: string; hint: string; form: FitmentRequest }> = [
  {
    label: "G80 M3 flush setup",
    hint: "Wheels + tires",
    form: {
      ...initialForm,
      year: "2024",
      make: "BMW",
      model: "M3",
      trim: "Competition xDrive",
      partCategory: "wheels",
      partType: "Forged wheels",
      specificPart: "Apex VS-5RS forged wheels, 19x10 +22, Michelin Pilot Sport 4S",
      currentWheelSize: "19x9",
      newWheelSize: "19x10",
      tireSize: "275/30R20",
      offset: "+25",
      suspensionSetup: "lowering-springs",
      spacerSize: "0mm",
      notes: "Wants a flush daily setup with no rubbing on a G80 M3.",
    },
  },
  {
    label: "GR Supra aero plan",
    hint: "Exterior",
    form: {
      ...initialForm,
      year: "2022",
      make: "Toyota",
      model: "Supra",
      trim: "3.0 Premium",
      partCategory: "exterior",
      partType: "Spoiler / wing",
      specificPart: "Carbon fiber duckbill spoiler for A90/A91 Supra",
      currentWheelSize: "19x9",
      newWheelSize: "19x9.5",
      tireSize: "255/35R19",
      offset: "+35",
      suspensionSetup: "stock",
      spacerSize: "0mm",
      notes: "Looking for clean carbon exterior parts that do not require drilling if possible.",
    },
  },
  {
    label: "Mustang GT track pack",
    hint: "Brakes + tires",
    form: {
      ...initialForm,
      year: "2024",
      make: "Ford",
      model: "Mustang",
      trim: "GT",
      partCategory: "brakes",
      partType: "Big brake kit",
      specificPart: "Front big brake kit with 6-piston calipers and 15 inch rotors",
      currentWheelSize: "19x9",
      newWheelSize: "19x10",
      tireSize: "285/30R20",
      offset: "+40",
      suspensionSetup: "coilovers",
      spacerSize: "5mm",
      notes: "Track-focused build needs brake clearance and wheel fitment confidence.",
    },
  },
];

type MockPart = {
  id: string;
  name: string;
  source: string;
  price: string;
  fitmentNote: string;
  risk: "Low" | "Medium" | "High";
  specs: string;
  eta: string;
};

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
};

type GarageVehicle = {
  id: string;
  year: string;
  make: string;
  model: string;
  trim: string | null;
  nickname: string | null;
};

type PlannedPart = {
  id: string;
};

function getTrimOptions(make: string, model: string) {
  return trimOptionsByMakeAndModel[make]?.[model] ?? ["Base"];
}

export function FitmentChecker() {
  const [form, setForm] = useState<FitmentRequest>(initialForm);
  const [result, setResult] = useState<FitmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState("");
  const [selectedPart, setSelectedPart] = useState<MockPart | null>(null);
  const [listingMessage, setListingMessage] = useState("");
  const [scoringPartId, setScoringPartId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicle[]>([]);
  const [targetVehicleId, setTargetVehicleId] = useState("");
  const [savingListingId, setSavingListingId] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const allMockParts = useMemo(() => buildMockParts(form), [form]);
  const mockParts = useMemo(
    () => (sourceFilter === "All" ? allMockParts : allMockParts.filter((part) => part.source === sourceFilter)),
    [allMockParts, sourceFilter]
  );
  const targetVehicle = useMemo(
    () => garageVehicles.find((vehicle) => vehicle.id === targetVehicleId) ?? garageVehicles[0],
    [garageVehicles, targetVehicleId]
  );
  const vehicleSummary = [form.year, form.make, form.model, form.trim].filter(Boolean).join(" ");
  const categorySummary = partCategoryOptions.find((option) => option.value === form.partCategory)?.label || form.partCategory;
  const currentSearch = `${vehicleSummary} ${form.partType}`;

  const scoreTone = useMemo(() => {
    if (!result) {
    return "from-signal to-volt";
    }

    if (result.score >= 82) {
      return "from-emerald-500 to-volt";
    }

    if (result.score >= 64) {
      return "from-signal to-electric";
    }

    if (result.score >= 42) {
      return "from-amber-300 to-orange-400";
    }

    return "from-red-400 to-rose-500";
  }, [result]);

  useEffect(() => {
    const savedProfile = window.localStorage.getItem("fitmentai-profile");
    const fitmentDraft = window.localStorage.getItem("fitmentai-fitment-draft");

    if (fitmentDraft) {
      try {
        const parsedDraft = JSON.parse(fitmentDraft) as Partial<FitmentRequest>;
        setForm((current) => ({
          ...current,
          ...parsedDraft,
          partCategory: (parsedDraft.partCategory as PartCategory) || current.partCategory,
          suspensionSetup: (parsedDraft.suspensionSetup as SuspensionSetup) || current.suspensionSetup,
        }));
        setListingMessage("Catalog part loaded into the Fitment Checker. Review the setup, then run the score.");
      } catch {
        setListingMessage("Catalog fitment draft could not be loaded.");
      } finally {
        window.localStorage.removeItem("fitmentai-fitment-draft");
      }
    }

    if (!savedProfile) {
      return;
    }

    try {
      const parsedProfile = JSON.parse(savedProfile) as Profile;
      setProfile(parsedProfile);
      void loadGarageVehicles(parsedProfile.id);
    } catch {
      window.localStorage.removeItem("fitmentai-profile");
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runFitmentScore(form);
  }

  async function runFitmentScore(payload: FitmentRequest) {
    setIsLoading(true);
    setError("");

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Fitment scoring failed.");
      }

      setResult(data as FitmentResponse);
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.name === "AbortError"
          ? "Fitment scoring took too long. Try again, or refresh the local server if it keeps hanging."
          : submitError instanceof Error
          ? submitError.message
          : "Something went wrong while scoring this setup."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateField<Field extends keyof FitmentRequest>(
    field: Field,
    value: FitmentRequest[Field]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateMake(make: string) {
    const model = modelOptionsByMake[make]?.[0] ?? "";

    setForm((current) => ({
      ...current,
      make,
      model,
      trim: getTrimOptions(make, model)[0] ?? "",
    }));
  }

  function updateModel(model: string) {
    setForm((current) => ({
      ...current,
      model,
      trim: getTrimOptions(current.make, model)[0] ?? "",
    }));
  }

  function updatePartCategory(partCategory: PartCategory) {
    setForm((current) => ({
      ...current,
      partCategory,
      partType: partTypeOptionsByCategory[partCategory][0],
    }));
  }

  function applySampleBuild(sample: FitmentRequest) {
    setForm(sample);
    setResult(null);
    setSelectedPart(null);
    setError("");
    setListingMessage("");
    setSourceFilter("All");
  }

  async function loadGarageVehicles(profileId: string) {
    try {
      const response = await fetch("/api/vehicles", {
        cache: "no-store",
        headers: getAuthHeaders(),
      });
      const data = (await response.json()) as { vehicles?: GarageVehicle[] };
      const vehicles = data.vehicles ?? [];
      const matchingVehicle =
        vehicles.find(
          (vehicle) =>
            vehicle.year === form.year &&
            vehicle.make === form.make &&
            vehicle.model === form.model &&
            (vehicle.trim || "") === form.trim
        ) ?? vehicles[0];

      setGarageVehicles(vehicles);
      setTargetVehicleId(matchingVehicle?.id ?? "");
    } catch {
      setGarageVehicles([]);
      setTargetVehicleId("");
    }
  }

  async function runListingFitment(part: MockPart) {
    const nextForm = {
      ...form,
      specificPart: `${part.name}, ${part.specs}, ${part.source}, ${part.price}`,
      notes: `${form.notes} Listing note: ${part.fitmentNote}`,
    };

    setForm(nextForm);
    setScoringPartId(part.id);
    await runFitmentScore(nextForm);
    setScoringPartId("");
    setSelectedPart(null);
  }

  async function saveListingToBuild(part: MockPart) {
    if (!profile) {
      setListingMessage("Sign in from My Garage before saving found parts to Supabase.");
      return;
    }

    if (!targetVehicle) {
      setListingMessage("Save a vehicle in My Garage first, then come back and save this listing to that build.");
      return;
    }

    setSavingListingId(part.id);
    setListingMessage("");

    try {
      const response = await fetch("/api/planned-parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          vehicleId: targetVehicle.id,
          name: part.name,
          category: partCategoryOptions.find((option) => option.value === form.partCategory)?.label || form.partCategory,
          source: part.source,
          price: part.price,
          notes: `${part.specs}. ${part.fitmentNote}`,
        }),
      });
      const data = (await response.json()) as {
        plannedPart?: PlannedPart;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.plannedPart) {
        throw new Error(data.error || data.message || "Part could not be saved to this build.");
      }

      if (result) {
        await fetch("/api/planned-parts", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            id: data.plannedPart.id,
            fitmentScore: result.score,
            fitmentStatus: result.status,
            fitmentWarning: result.warnings[0] || result.summary,
            fitmentRecommendation: result.recommendations[0] || "Verify this exact listing before buying.",
          }),
        });
      }

      setListingMessage(`${part.name} saved to ${vehicleName(targetVehicle)} in My Garage.`);
    } catch (saveError) {
      setListingMessage(saveError instanceof Error ? saveError.message : "Part could not be saved to this build.");
    } finally {
      setSavingListingId("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-line bg-panel/95 p-4 shadow-glow md:p-6"
      >
        <div className="mb-5 rounded-lg border border-line bg-[#0a180f] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">
                Find parts
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f3ead5]">Find a part, then check if it fits.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9e9278]">
                Start with the car, choose what you are shopping for, pick a listing, then run a fitment score before saving it to your build.
              </p>
            </div>
            <div className="rounded-md border border-line bg-[#111f15] px-3 py-1 text-xs font-medium text-[#b8ac91] whitespace-nowrap">
              Guided search
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {intakeSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-md border border-line bg-[#111f15] px-3 py-2 text-center text-xs font-semibold text-[#b8ac91]"
              >
                <span className="mr-1 text-volt">0{index + 1}</span>
                {step}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-volt/15 bg-volt/5 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-volt">Quick sample builds</p>
              <p className="text-xs text-[#9e9278]">Use one to demo the flow fast.</p>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {sampleBuilds.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => applySampleBuild(sample.form)}
                  className="rounded-lg border border-line bg-[#09160e] p-3 text-left transition hover:border-volt hover:bg-[#111f15]"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9e9278]">{sample.hint}</span>
                  <span className="mt-1 block text-sm font-semibold text-[#f3ead5]">{sample.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-sm font-semibold text-[#f3ead5]">1. Vehicle + part target</p>
            <p className="mt-1 text-xs text-[#9e9278]">These choices automatically shape the listings and fitment score.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Year"
            value={form.year}
            options={yearOptions}
            onChange={(value) => updateField("year", value)}
          />
          <Select
            label="Make"
            value={form.make}
            options={makeOptions}
            onChange={updateMake}
          />
          <Select
            label="Model"
            value={form.model}
            options={modelOptionsByMake[form.make] ?? []}
            onChange={updateModel}
          />
          <Select
            label="Trim"
            value={form.trim}
            options={getTrimOptions(form.make, form.model)}
            onChange={(value) => updateField("trim", value)}
          />
          <OptionSelect
            label="Part category"
            value={form.partCategory}
            options={partCategoryOptions}
            onChange={(value) => updatePartCategory(value as PartCategory)}
          />
          <Select
            label="Part type"
            value={form.partType}
            options={partTypeOptionsByCategory[form.partCategory]}
            onChange={(value) => updateField("partType", value)}
          />
        </div>

        <label className="mt-4 grid gap-2 text-sm font-medium text-[#b8ac91]">
          2. What part are you looking at? <span className="text-xs font-normal text-[#72684f]">(optional but helpful)</span>
          <textarea
            value={form.specificPart}
            onChange={(event) => updateField("specificPart", event.target.value)}
            rows={3}
            className="rounded-lg border border-line bg-[#09160e] px-4 py-3 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
            placeholder="Example: Rennline intake, AA Carbon spoiler, exact listing title, part number, material, dimensions, or seller claim."
          />
          <span className="text-xs font-normal leading-5 text-[#72684f]">
            Leave it blank to browse example listings for this category.
          </span>
        </label>

        <div className="mt-5 rounded-lg border border-volt/20 bg-volt/5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Current search</p>
              <p className="mt-2 text-lg font-semibold text-[#f3ead5]">{currentSearch}</p>
              <p className="mt-1 text-sm text-[#9e9278]">{categorySummary} for {vehicleSummary}</p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-volt px-4 text-sm font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
              Quick score
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-line bg-[#0a180f] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Step 3 - Find a part</p>
              <h3 className="mt-2 text-lg font-semibold text-[#f3ead5]">Possible listings from different websites</h3>
              <p className="mt-2 text-sm leading-6 text-[#9e9278]">
                Pick one listing to view details, run a fitment check, or save it to My Garage.
              </p>
            </div>
            <span className="rounded-md border border-line bg-[#111f15] px-3 py-1 text-xs text-[#9e9278]">
              {mockParts.length} results
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sourceFilters.map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setSourceFilter(source)}
                  className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-semibold transition ${
                    sourceFilter === source
                      ? "border-volt bg-volt text-[#07120c]"
                      : "border-line bg-[#09160e] text-[#d8cba9] hover:border-volt hover:text-volt"
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>

            {mockParts.map((part) => (
              <button
                key={part.id}
                type="button"
                onClick={() => {
                  setSelectedPart(part);
                  setListingMessage("");
                }}
                className="rounded-lg border border-line bg-[#07120c] p-4 text-left transition hover:-translate-y-0.5 hover:border-volt/70 hover:bg-volt/5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-line bg-[#09160e] px-2 py-1 text-[11px] font-semibold text-[#d8cba9]">
                        {part.source}
                      </span>
                      <span className="text-xs text-[#9e9278]">{part.price}</span>
                      <span className="text-xs text-[#72684f]">{part.eta}</span>
                    </div>
                    <p className="mt-3 font-semibold text-[#f3ead5]">{part.name}</p>
                    <p className="mt-2 text-xs leading-5 text-[#9e9278]">{part.specs}</p>
                  </div>
                  <span className={`w-fit shrink-0 rounded-md px-2 py-1 text-xs font-bold ${riskClass(part.risk)}`}>
                    {part.risk} risk
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#b8ac91]">{part.fitmentNote}</p>
                <span className="mt-3 inline-flex text-xs font-semibold text-volt">View listing actions</span>
              </button>
            ))}
          </div>

          {listingMessage ? (
            <p className="mt-3 rounded-lg border border-volt/25 bg-volt/10 p-3 text-sm text-[#d8cba9]">
              {listingMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-5 rounded-lg border border-line bg-[#0a180f]">
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-[#f3ead5]">
                Advanced options
              </span>
              <span className="mt-1 block text-xs text-[#9e9278]">
                Wheel specs, tire sizing, offset, ride height, and spacers
              </span>
            </span>
            <ChevronDown
              className={`h-5 w-5 text-volt transition ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAdvanced ? (
            <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
              <Select
                label="Current wheel size"
                value={form.currentWheelSize}
                options={wheelSizeOptions}
                onChange={(value) => updateField("currentWheelSize", value)}
              />
              <Select
                label="New wheel size"
                value={form.newWheelSize}
                options={wheelSizeOptions}
                onChange={(value) => updateField("newWheelSize", value)}
              />
              <Select
                label="Tire size"
                value={form.tireSize}
                options={tireSizeOptions}
                onChange={(value) => updateField("tireSize", value)}
              />
              <Select
                label="Offset"
                value={form.offset}
                options={offsetOptions}
                onChange={(value) => updateField("offset", value)}
              />
              <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
                Suspension setup
                <select
                  value={form.suspensionSetup}
                  onChange={(event) =>
                    updateField("suspensionSetup", event.target.value as SuspensionSetup)
                  }
                  className="h-12 rounded-lg border border-line bg-[#09160e] px-4 text-[#f3ead5] outline-none ring-volt/20 transition focus:border-volt focus:ring-4"
                >
                  {suspensionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <Select
                label="Spacer size"
                value={form.spacerSize}
                options={spacerOptions}
                onChange={(value) => updateField("spacerSize", value)}
              />
            </div>
          ) : null}
        </div>

        <label className="mt-4 grid gap-2 text-sm font-medium text-[#b8ac91]">
          Extra notes
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={4}
            className="rounded-lg border border-line bg-[#09160e] px-4 py-3 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-lg border border-warning/35 bg-warning/10 p-3 text-sm text-orange-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
          {isLoading ? "Scoring listing" : "Run Fitment Score"}
        </button>
      </form>

      <div className="rounded-lg border border-line bg-[#07120c] p-5 text-white shadow-volt md:p-7 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-volt">
            <Sparkles className="h-4 w-4" />
            Fitment verdict
          </div>
          <span className="rounded-md border border-volt/20 bg-volt/10 px-3 py-1 text-xs text-[#d8cba9]">
            0-100 compatibility
          </span>
        </div>

        {result ? (
          <div className="mt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Fitment score</p>
                <p className="mt-1 text-5xl font-semibold text-white md:text-6xl">{result.score}</p>
              </div>
              <div
                className={`rounded-md bg-gradient-to-r ${scoreTone} px-4 py-2 text-sm font-bold text-[#07120c]`}
              >
                {result.status}
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#2a2a1d]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${scoreTone}`}
                style={{ width: `${result.score}%` }}
              />
            </div>

            <p className="mt-6 text-base leading-7 text-slate-200">{result.summary}</p>
            {result.logicNote ? (
              <p className="mt-3 text-sm leading-6 text-[#9e9278]">{result.logicNote}</p>
            ) : null}

            <ResultList
              title="Warnings"
              icon={<AlertTriangle className="h-4 w-4 text-amber-300" />}
              items={result.warnings}
            />
            <ResultList
              title="Recommended next steps"
              icon={<CheckCircle2 className="h-4 w-4 text-volt" />}
              items={result.recommendations}
            />
          </div>
        ) : (
          <div className="mt-8">
            <div className="rounded-lg border border-dashed border-volt/30 bg-volt/5 p-6 text-[#b8ac91]">
              <p className="text-3xl font-semibold text-white">Ready when you pick a listing.</p>
              <p className="mt-4 leading-7">
                Find a part on the left, open its listing actions, then run a fitment check to see compatibility warnings before buying.
              </p>
            </div>
            <div className="mt-4 rounded-lg border border-line bg-[#09160e] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-volt">Current setup</p>
              <div className="mt-3 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#9e9278]">Vehicle</span>
                  <span className="text-right font-semibold text-[#f3ead5]">{vehicleSummary}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#9e9278]">Part target</span>
                  <span className="text-right font-semibold text-[#f3ead5]">{form.partType}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#9e9278]">Suspension</span>
                  <span className="text-right font-semibold text-[#f3ead5]">
                    {suspensionOptions.find((option) => option.value === form.suspensionSetup)?.label || form.suspensionSetup}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {["Pick a listing", "Run fitment check", "Save to My Garage"].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-volt/15 bg-volt/5 p-3 text-sm">
                  <span className="text-[#b8ac91]">{item}</span>
                  <span className="text-[#72684f]">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedPart ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-3 backdrop-blur-sm md:place-items-center md:p-6">
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-volt/25 bg-[#07120c] p-4 shadow-glow md:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Part listing</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#f3ead5]">{selectedPart.name}</h3>
                <p className="mt-2 text-sm text-[#9e9278]">
                  {selectedPart.source} - {selectedPart.price}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!scoringPartId) {
                    setSelectedPart(null);
                  }
                }}
                className="grid h-10 w-10 place-items-center rounded-lg border border-line text-[#d8cba9] transition hover:border-volt hover:text-volt disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close listing details"
                disabled={Boolean(scoringPartId)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailPill label="Vehicle" value={[form.year, form.make, form.model, form.trim].filter(Boolean).join(" ")} />
              <DetailPill label="Category" value={partCategoryOptions.find((option) => option.value === form.partCategory)?.label || form.partCategory} />
              <DetailPill label="Specs" value={selectedPart.specs} />
              <DetailPill label="Ship time" value={selectedPart.eta} />
            </div>

            <div className="mt-5 rounded-lg border border-line bg-[#0a180f] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#f3ead5]">Compatibility notes</p>
                <span className={`rounded-md px-2 py-1 text-xs font-bold ${riskClass(selectedPart.risk)}`}>
                  {selectedPart.risk} risk
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#b8ac91]">{selectedPart.fitmentNote}</p>
            </div>

            <div className="mt-5 rounded-lg border border-volt/15 bg-volt/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-volt">Before buying</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#b8ac91]">
                <li>Confirm exact trim and drivetrain fitment.</li>
                <li>Compare against a verified install on the same generation.</li>
                <li>Run FitmentAI score before saving it to a build plan.</li>
              </ul>
            </div>

            <div className="mt-5 rounded-lg border border-line bg-[#0a180f] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="grid flex-1 gap-2 text-sm font-medium text-[#b8ac91]">
                  Save target
                  <select
                    value={targetVehicleId}
                    onChange={(event) => setTargetVehicleId(event.target.value)}
                    className="h-11 rounded-lg border border-line bg-[#09160e] px-3 text-[#f3ead5] outline-none ring-volt/20 transition focus:border-volt focus:ring-4"
                  >
                    {garageVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicleName(vehicle)}
                      </option>
                    ))}
                    {garageVehicles.length === 0 ? <option>No garage vehicles found</option> : null}
                  </select>
                </label>
                <a
                  href="#garage"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                >
                  Open Garage
                </a>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#9e9278]">
                {profile
                  ? "This saves the listing as a planned part on the selected Supabase garage vehicle."
                  : "Sign in from My Garage to save directly to Supabase."}
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void runListingFitment(selectedPart)}
                disabled={Boolean(scoringPartId)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {scoringPartId === selectedPart.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
                {scoringPartId === selectedPart.id ? "Scoring this listing..." : "Step 4 - Run Fitment Check"}
              </button>
              <button
                type="button"
                onClick={() => void saveListingToBuild(selectedPart)}
                disabled={Boolean(scoringPartId) || savingListingId === selectedPart.id}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-[#09160e] px-5 font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
              >
                {savingListingId === selectedPart.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
                {savingListingId === selectedPart.id ? "Saving..." : "Save to Build"}
              </button>
            </div>

            {listingMessage ? (
              <p className="mt-3 rounded-lg border border-volt/25 bg-volt/10 p-3 text-sm text-[#d8cba9]">
                {listingMessage}
              </p>
            ) : null}

            {scoringPartId === selectedPart.id ? (
              <p className="mt-3 rounded-lg border border-volt/25 bg-volt/10 p-3 text-sm text-[#d8cba9]">
                Checking this listing against the selected vehicle. The drawer will close when the score is ready.
              </p>
            ) : null}

            <div className="mt-4 inline-flex items-center gap-2 text-xs text-[#72684f]">
              <ExternalLink className="h-3.5 w-3.5" />
              Source links are preview links for now.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type SelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-lg border border-line bg-[#09160e] px-4 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function OptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-lg border border-line bg-[#09160e] px-4 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildMockParts(form: FitmentRequest): MockPart[] {
  const vehicle = [form.year, form.make, form.model].filter(Boolean).join(" ");
  const categoryLabel = partCategoryOptions.find((option) => option.value === form.partCategory)?.label || "Part";
  const baseName = form.partType || categoryLabel;

  return [
    {
      id: "manufacturer-direct",
      name: `${vehicle} ${baseName}`,
      source: "Manufacturer",
      price: "$429-$699",
      fitmentNote: `Claims compatibility with ${vehicle}. Best option to verify part number, trim notes, and install documents before purchase.`,
      risk: "Low",
      specs: form.specificPart || `${categoryLabel}, vehicle-specific listing`,
      eta: "Ships in 3-5 days",
    },
    {
      id: "ecs-tuning",
      name: `${baseName} enthusiast package`,
      source: "ECS Tuning",
      price: "$389-$799",
      fitmentNote: `Strong enthusiast-style listing for ${form.make} ${form.model}. Review chassis notes, hardware included, and install guide details.`,
      risk: "Medium",
      specs: `${form.newWheelSize}, ${form.tireSize}, ${form.offset}`,
      eta: "Ships in 1-2 weeks",
    },
    {
      id: "fcp-euro",
      name: `${vehicle} OE+ ${baseName}`,
      source: "FCP Euro",
      price: "$319-$749",
      fitmentNote: "Good option for OE+ builds. Check exact engine, trim, warranty notes, and whether supporting hardware is included.",
      risk: "Low",
      specs: form.specificPart || `${categoryLabel}, OE+ fitment`,
      eta: "Ships in 2-4 days",
    },
    {
      id: "turner-motorsport",
      name: `${baseName} motorsport setup`,
      source: "Turner",
      price: "$499-$1,099",
      fitmentNote: "More performance-focused listing. Verify brake clearance, suspension setup, and any track-use compromises before buying.",
      risk: "Medium",
      specs: `${form.newWheelSize}, ${form.offset}, ${form.suspensionSetup}`,
      eta: "Ships in 5-10 days",
    },
    {
      id: "fitment-industries",
      name: `${vehicle} fitment matched ${baseName}`,
      source: "Fitment Industries",
      price: "$699-$1,499",
      fitmentNote: "Fitment-oriented listing with stronger wheel/tire context. Still confirm final specs, ride height, and customer gallery examples.",
      risk: form.partCategory === "wheels" || form.partCategory === "tires" ? "Low" : "Medium",
      specs: `${form.newWheelSize}, ${form.tireSize}, ${form.spacerSize} spacer`,
      eta: "Ships in 1-3 weeks",
    },
    {
      id: "marketplace-listing",
      name: `Universal ${baseName}`,
      source: "Marketplace",
      price: "$189-$399",
      fitmentNote: "Lower confidence listing because the compatibility language is broad. Use FitmentAI before buying and ask seller for exact proof.",
      risk: "High",
      specs: form.specificPart || "Universal fitment claim",
      eta: "Varies by seller",
    },
  ];
}

function riskClass(risk: MockPart["risk"]) {
  if (risk === "Low") {
    return "bg-signal/15 text-signal";
  }

  if (risk === "Medium") {
    return "bg-volt/15 text-volt";
  }

  return "bg-warning/15 text-orange-200";
}

function vehicleName(vehicle: GarageVehicle) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-[#09160e] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-volt">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#d8cba9]">{value}</p>
    </div>
  );
}

function ResultList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
        {icon}
        {title}
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item} className="rounded-lg border border-volt/15 bg-volt/5 p-3 text-sm leading-6 text-[#d8cba9]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
