import { BadgeCheck, Gauge, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";

const verifiedSetups = [
  {
    vehicle: "2017 Porsche Macan Turbo",
    style: "OEM+ Daily Driver",
    status: "Verified street fit",
    score: 88,
    imageTone: "from-[#173923] via-[#0b1810] to-[#4f3b11]",
    tags: ["Daily Driver", "Performance", "Exterior"],
    specs: {
      wheels: "20x9 +35 factory-style flow formed wheels",
      tires: "265/45R20 Michelin Pilot Sport All Season",
      suspension: "Lowering springs, conservative ride height",
      brakes: "Street performance pads, OEM calipers",
      exterior: "Carbon rear spoiler, front lip, smoked side markers",
      performance: "High-flow intake, cat-back exhaust, ECU-ready hardware",
      interior: "Sport pedal set, fitted mats, wireless CarPlay upgrade",
    },
    result: {
      concern: "Front lip and lowered ride height need driveway clearance checks.",
      fix: "Keep tire diameter near OEM and avoid aggressive spacer changes.",
      proof: "Matched against SUV street builds with similar drop and tire diameter.",
    },
  },
  {
    vehicle: "2024 BMW M340i xDrive",
    style: "Flush OEM+",
    status: "Verified low-risk setup",
    score: 92,
    imageTone: "from-[#102a1a] via-[#07120c] to-[#5d4614]",
    tags: ["Flush", "Daily Driver", "Intake"],
    specs: {
      wheels: "19x9.5 +35 lightweight wheels",
      tires: "255/35R19 max performance summer tires",
      suspension: "Mild lowering springs",
      brakes: "OEM M Sport brakes with verified barrel clearance",
      exterior: "Carbon mirror caps, rear diffuser, subtle trunk lip",
      performance: "Closed-box intake, valved exhaust, heat shield included",
      interior: "Alcantara wheel trim and digital gauge coding",
    },
    result: {
      concern: "Rear poke can increase if spacer is added on top of +35 offset.",
      fix: "Run no spacer or 3mm max unless fender photos confirm clearance.",
      proof: "Compared to known G20 xDrive builds on lowering springs.",
    },
  },
  {
    vehicle: "2021 Toyota GR Supra 3.0",
    style: "Street Aero",
    status: "Verified with install notes",
    score: 84,
    imageTone: "from-[#142d1c] via-[#0a180f] to-[#604817]",
    tags: ["Show Car", "Exterior", "Performance"],
    specs: {
      wheels: "19x9.5 front / 19x10.5 rear staggered wheels",
      tires: "255/35R19 front / 275/35R19 rear",
      suspension: "Coilovers with street ride height",
      brakes: "Big brake friendly wheel profile",
      exterior: "Front splitter, side skirts, duckbill spoiler, carbon vents",
      performance: "Catted downpipe, intake, charge pipe, conservative tune",
      interior: "Bucket-ready seat mounts and harness bar planning",
    },
    result: {
      concern: "Front splitter scrape risk and rear tire clearance under compression.",
      fix: "Keep street ride height, verify splitter overhang, and avoid oversized rear tire.",
      proof: "Verified against similar A90 aero and wheel setups.",
    },
  },
  {
    vehicle: "2018 Honda Civic Type R",
    style: "Track Weekend",
    status: "Verified track package",
    score: 86,
    imageTone: "from-[#0f2b1a] via-[#07120c] to-[#49370f]",
    tags: ["Track Build", "Brakes", "Suspension"],
    specs: {
      wheels: "18x9.5 +38 track wheels",
      tires: "265/35R18 200TW tires",
      suspension: "Coilovers with track alignment",
      brakes: "Track pads, stainless lines, high-temp fluid",
      exterior: "Functional rear wing, brake cooling guides, tow hook",
      performance: "Intercooler, intake, tune-safe supporting mods",
      interior: "Fixed-back seat plan, data mount, fire extinguisher bracket",
    },
    result: {
      concern: "Inner tire clearance and brake heat management.",
      fix: "Verify camber target, use proven wheel barrel profile, and inspect liner rub.",
      proof: "Matched to track-focused FK8 fitment records.",
    },
  },
];

export function VerifiedSetups() {
  return (
    <section id="verified" className="relative mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="absolute inset-x-5 top-0 -z-10 h-[560px] rounded-[40px] bg-[radial-gradient(circle_at_24%_28%,rgba(154,116,40,0.15),transparent_36%),radial-gradient(circle_at_76%_58%,rgba(47,138,85,0.14),transparent_36%)] blur-2xl" />
      <div className="mb-8 grid gap-5 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Verified setups</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5] md:text-5xl">
            Real build examples across the whole car.
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-[#b8ac91] md:text-base">
          These mock verified records show how FitmentAI will compare complete builds:
          wheel and tire fitment, suspension, brakes, exterior parts, performance
          upgrades, interior changes, install risk, and the recommended fix.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {verifiedSetups.map((setup) => (
          <article
            key={setup.vehicle}
            className="overflow-hidden rounded-lg border border-line bg-panel/95 shadow-glow transition hover:border-volt/60 hover:shadow-[0_0_40px_rgba(154,116,40,0.16)]"
          >
            <div className={`h-32 bg-gradient-to-br ${setup.imageTone} p-5`}>
              <div className="flex h-full items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d7c28b]">
                    {setup.style}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#f3ead5]">{setup.vehicle}</h3>
                </div>
                <div className="rounded-lg border border-volt/40 bg-[#07120c]/80 px-4 py-3 text-center backdrop-blur">
                  <p className="text-xs text-[#9e9278]">Score</p>
                  <p className="text-2xl font-semibold text-volt">{setup.score}</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-semibold text-[#bfe5c6]">
                  <BadgeCheck className="h-4 w-4" />
                  {setup.status}
                </span>
                {setup.tags.map((tag) => (
                  <span key={tag} className="rounded-lg border border-line bg-[#09160e] px-3 py-1 text-xs font-semibold text-[#d8cba9]">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Object.entries(setup.specs).map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-line bg-[#07120c] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-volt">
                      {label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#d8cba9]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <ResultBlock icon={Gauge} label="Main concern" value={setup.result.concern} />
                <ResultBlock icon={Wrench} label="Recommended fix" value={setup.result.fix} />
                <ResultBlock icon={ShieldCheck} label="Verification" value={setup.result.proof} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResultBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-volt/15 bg-volt/5 p-4">
      <Icon className="h-4 w-4 text-volt" />
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d7c28b]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#b8ac91]">{value}</p>
    </div>
  );
}
