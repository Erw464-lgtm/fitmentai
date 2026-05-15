import {
  ArrowRight,
  Bot,
  Car,
  CheckCircle2,
  Database,
  Gauge,
  MessageSquare,
  PackageSearch,
  UserPlus,
} from "lucide-react";

const demoSteps = [
  {
    icon: UserPlus,
    label: "01",
    title: "Sign in or use the demo garage",
    copy: "Show that cars, planned parts, and fitment results can belong to one profile.",
    href: "#garage",
  },
  {
    icon: Car,
    label: "02",
    title: "Save a car",
    copy: "Add a vehicle, current setup, dream setup, and parts-to-buy list.",
    href: "#garage",
  },
  {
    icon: PackageSearch,
    label: "03",
    title: "Find a part listing",
    copy: "Use the parts finder to compare example listings from manufacturers and parts websites.",
    href: "#demo",
  },
  {
    icon: Gauge,
    label: "04",
    title: "Run fitment score",
    copy: "Open a listing, check compatibility, then review score, warning, and recommendation.",
    href: "#demo",
  },
  {
    icon: MessageSquare,
    label: "05",
    title: "Ask FitmentAI",
    copy: "Ask build questions using saved garage and planned-part context.",
    href: "#ask",
  },
  {
    icon: Database,
    label: "06",
    title: "Show saved data",
    copy: "Refresh Supabase or the Garage page to confirm the saved records.",
    href: "#garage",
  },
];

const liveToday = [
  "Garage vehicle saves",
  "Planned part saves",
  "Fitment score API",
  "Waitlist capture",
  "Ask FitmentAI fallback",
];

const comingSoon = [
  "Live web part search",
  "Real AI answers",
  "Verified community fitment data",
  "VIN/trim decoding",
];

export function DemoGuide() {
  return (
    <section id="demo-path" className="relative mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="rounded-lg border border-line bg-panel/95 p-4 shadow-glow md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Walkthrough</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#f3ead5]">A clean 2-minute product walkthrough.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b8ac91]">
              Use this order when showing FitmentAI: save the car, find a part, run the score, save it to the build,
              then ask FitmentAI what to do next.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href="#garage"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-volt px-5 text-sm font-semibold text-[#07120c] transition hover:bg-[#b98d31]"
            >
              Start demo
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#waitlist"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-volt/35 bg-volt/10 px-5 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
            >
              Join waitlist
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {demoSteps.map((step) => (
            <a
              key={step.label}
              href={step.href}
              className="group rounded-lg border border-line bg-[#07120c] p-4 transition hover:border-volt/70 hover:bg-volt/5"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-volt/25 bg-volt/10 text-volt transition group-hover:border-volt">
                  <step.icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d7c28b]">{step.label}</span>
              </div>
              <h3 className="mt-4 font-semibold text-[#f3ead5]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#b8ac91]">{step.copy}</p>
            </a>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-volt/15 bg-volt/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#f3ead5]">
              <CheckCircle2 className="h-4 w-4 text-volt" />
              Working today
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {liveToday.map((item) => (
                <span key={item} className="rounded-md border border-volt/20 bg-[#07120c] px-3 py-1 text-xs font-semibold text-[#d8cba9]">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-[#07120c] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#f3ead5]">
              <Bot className="h-4 w-4 text-volt" />
              Next integrations
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {comingSoon.map((item) => (
                <span key={item} className="rounded-md border border-line bg-[#09160e] px-3 py-1 text-xs font-semibold text-[#9e9278]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
