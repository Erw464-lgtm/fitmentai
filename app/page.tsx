import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Car,
  Database,
  Gauge,
  Layers3,
  PackageCheck,
  ShieldAlert,
  Store,
  Wrench,
} from "lucide-react";
import { AccountMenu } from "@/components/AccountMenu";
import { AskFitmentAI } from "@/components/AskFitmentAI";
import { ContactForm } from "@/components/ContactForm";
import { DemoGuide } from "@/components/DemoGuide";
import { FitmentChecker } from "@/components/FitmentChecker";
import { GarageManager } from "@/components/GarageManager";
import { SectionCard } from "@/components/SectionCard";
import { TabbedPanels } from "@/components/TabbedPanels";
import { WaitlistForm } from "@/components/WaitlistForm";

const problems = [
  "Aftermarket parts are scattered across manufacturer sites, parts stores, forums, screenshots, listings, and guesswork.",
  "Wheels, aero, carbon pieces, lighting, intakes, exhausts, and suspension parts can all create clearance or install surprises.",
  "Drivers, shops, and sellers need faster confidence before buying or recommending a specific listing.",
];

const audiences = [
  { icon: Car, label: "Car enthusiasts", copy: "Find parts for a saved car, then check compatibility before checkout." },
  { icon: Wrench, label: "Wheel shops", copy: "Qualify fitment questions before a customer orders a specific listing." },
  { icon: Layers3, label: "Detailing shops", copy: "Support clients planning cosmetic upgrades." },
  { icon: BadgeCheck, label: "Used car dealers", copy: "Validate aftermarket setups on inventory." },
  { icon: Store, label: "Aftermarket sellers", copy: "Help buyers compare compatible packages across manufacturers." },
];

const futureFeatures = [
  { icon: Database, title: "VIN lookup", copy: "Decode vehicle configuration before searching parts and scoring fitment." },
  { icon: PackageCheck, title: "Verified installs", copy: "Learn from shop records, customer outcomes, manufacturer notes, and platform data." },
  { icon: Camera, title: "Photo analysis", copy: "Estimate ride height, poke, tire gap, and aero clearance from images." },
  { icon: Gauge, title: "Shop dashboard", copy: "Manage customer part searches, saved listings, and package recommendations in one workflow." },
];

const heroChecks = ["Brake clearance", "Poke risk", "Ride height", "Trim conflicts"];
const waitlistBenefits = [
  "Save your garage",
  "Find parts across websites",
  "Check fitment before buying",
  "Ask FitmentAI for build advice",
];
const demoSteps = [
  { title: "Save your car", copy: "Start in My Garage so the app has your exact year, make, model, trim, and setup." },
  { title: "Find a part", copy: "Search a preview catalog across manufacturer, retailer, and marketplace style listings." },
  { title: "Run fitment", copy: "Select a listing and score compatibility before buying it." },
  { title: "Ask FitmentAI", copy: "Use AI to compare risk, supporting mods, and next build steps." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-ink text-[#f3ead5]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(154,116,40,0.22),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(47,138,85,0.16),transparent_28%),linear-gradient(180deg,#07120c_0%,#0a180f_46%,#061009_100%)]" />
      <header className="border-b border-line bg-[#07120c]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-8">
          <a href="#home" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-volt/50 bg-[#111f15] text-volt">
              <Gauge className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold leading-5">FitmentAI</span>
              <span className="block text-xs text-[#9e9278]">Aftermarket fitment OS</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-6 text-sm font-medium text-[#b8ac91] md:flex">
              <a className="transition hover:text-volt" href="#home">Home</a>
              <a className="transition hover:text-volt" href="#demo">Find Parts</a>
              <a className="transition hover:text-volt" href="#garage">My Garage</a>
              <a className="transition hover:text-volt" href="#ask">Ask FitmentAI</a>
              <a className="transition hover:text-volt" href="#how">Roadmap</a>
              <a className="transition hover:text-volt" href="#waitlist">Waitlist</a>
              <a className="transition hover:text-volt" href="#contact">Contact</a>
            </nav>
            <AccountMenu />
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-xs font-semibold text-[#b8ac91] md:hidden">
          {[
            ["Home", "#home"],
            ["Find Parts", "#demo"],
            ["Garage", "#garage"],
            ["Ask AI", "#ask"],
            ["Roadmap", "#how"],
            ["Waitlist", "#waitlist"],
            ["Contact", "#contact"],
          ].map(([label, href]) => (
            <a
              key={href}
              className="shrink-0 rounded-lg border border-line bg-[#111f15] px-3 py-2 transition hover:border-volt hover:text-volt"
              href={href}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <TabbedPanels
        home={
          <>
            <section id="home" className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-8 md:px-8 lg:grid-cols-[0.84fr_1.16fr] lg:gap-10 lg:pb-16 lg:pt-14">
              <div className="absolute inset-x-5 top-8 -z-10 h-[520px] rounded-[40px] bg-[radial-gradient(circle_at_24%_35%,rgba(154,116,40,0.18),transparent_34%),radial-gradient(circle_at_74%_45%,rgba(47,138,85,0.14),transparent_36%)] blur-2xl" />
              <div className="flex flex-col justify-center">
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-panel/90 px-3 py-2 text-sm font-medium text-[#d8cba9] shadow-sm">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  Part search + fitment confidence
                </div>
                <h1 className="max-w-4xl text-4xl font-semibold leading-[1.02] text-[#f3ead5] md:text-7xl">
                  FitmentAI
                </h1>
                <p className="mt-5 text-xl font-medium text-[#d7c28b] md:text-3xl">
                  Know if it fits before you buy.
                </p>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[#b8ac91] md:mt-6 md:text-lg md:leading-8">
                  A focused platform for finding aftermarket parts from manufacturer and
                  parts websites, then checking whether wheels, tires, suspension,
                  aero, lighting, intakes, body panels, and exhaust systems fit your
                  exact car before money leaves the account.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#demo"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-volt px-6 font-semibold text-[#07120c] transition hover:bg-[#b98d31]"
                  >
                    Try Parts + Fitment
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#waitlist"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-panel/80 px-6 font-semibold text-[#f3ead5] transition hover:border-volt hover:text-volt"
                  >
                    Join Waitlist
                  </a>
                </div>
              </div>

              <div className="rounded-lg border border-line bg-panel/95 p-3 shadow-glow">
                <div className="grid gap-3 lg:grid-cols-[1fr_0.72fr]">
                  <div className="rounded-lg border border-[#234231] bg-[#07150e] p-5 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-md border border-volt/25 bg-volt/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#d8cba9]">
                        Sample part match
                      </span>
                      <span className="text-sm text-volt">M340i xDrive</span>
                    </div>
                    <div className="mt-6 border-y border-volt/15 py-8">
                      <div className="relative mx-auto aspect-[16/7] max-w-lg">
                        <div className="absolute left-[5%] right-[5%] top-[58%] h-px bg-[#38533f]" />
                        <div className="absolute inset-x-[8%] bottom-[12%] h-[38%] rounded-t-[80px] border-2 border-[#d4a62a] bg-[#173923] shadow-[0_22px_50px_rgba(0,0,0,0.55)]" />
                        <div className="absolute inset-x-[16%] top-[13%] h-[42%] rounded-t-[90px] border-2 border-[#5b7b5f] bg-[#0d2416]" />
                        <div className="absolute bottom-[4%] left-[10%] h-[32%] w-[18%] rounded-full border-[10px] border-[#ead28a] bg-[#07150e]" />
                        <div className="absolute bottom-[4%] right-[10%] h-[32%] w-[18%] rounded-full border-[10px] border-[#ead28a] bg-[#07150e]" />
                        <div className="absolute left-[3%] top-[54%] h-px w-[94%] bg-gradient-to-r from-transparent via-volt to-transparent" />
                        <div className="absolute left-[30%] top-[42%] h-2 w-[40%] rounded-full bg-signal" />
                        <div className="absolute right-[16%] top-[20%] rounded-md border border-warning/70 bg-warning/15 px-2 py-1 text-[11px] font-semibold text-orange-200">
                          example risk
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {["19x9.5", "+35", "255/35", "5mm"].map((spec) => (
                        <div key={spec} className="rounded-lg border border-volt/20 bg-volt/10 p-3 text-center">
                          <p className="text-xs font-semibold text-[#f3ead5] sm:text-sm">{spec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-lg border border-line bg-[#0b1810] p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">
                        Example fitment score
                      </p>
                      <div className="mt-5 flex items-end justify-between">
                        <div>
                          <p className="text-sm text-[#9e9278]">Fitment score</p>
                          <p className="mt-1 text-5xl font-semibold text-[#f3ead5] md:text-6xl">72</p>
                        </div>
                        <p className="rounded-md bg-volt px-3 py-1 text-xs font-bold text-[#07120c]">
                          Possible fit
                        </p>
                      </div>
                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#2a2a1d]">
                        <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-signal to-volt" />
                      </div>
                      <div className="mt-5 grid gap-2">
                        {heroChecks.map((check) => (
                          <div key={check} className="flex items-center justify-between rounded-md border border-line bg-[#101f15] px-3 py-2 text-sm">
                            <span className="text-[#b8ac91]">{check}</span>
                            <span className="font-semibold text-[#d7c28b]">Review</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="mt-8 text-sm leading-6 text-[#b8ac91]">
                      Built to help shoppers compare parts from different websites, pick
                      a listing, and see the fitment risk before checkout.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="absolute inset-x-5 top-0 -z-10 h-[420px] rounded-[40px] bg-[radial-gradient(circle_at_20%_30%,rgba(47,138,85,0.15),transparent_36%),radial-gradient(circle_at_80%_55%,rgba(154,116,40,0.12),transparent_36%)] blur-2xl" />
              <SectionCard eyebrow="Problems solved" title="Find the right part before purchase">
                <ul className="space-y-4">
                  {problems.map((problem) => (
                    <li key={problem} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-volt" />
                      <span>{problem}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <div className="grid gap-4 sm:grid-cols-2">
                {audiences.map((audience) => (
                  <div key={audience.label} className="rounded-lg border border-line bg-panel/95 p-5 shadow-sm">
                    <audience.icon className="h-5 w-5 text-volt" />
                    <h3 className="mt-4 text-lg font-semibold text-[#f3ead5]">{audience.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#b8ac91]">{audience.copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="relative mx-auto max-w-7xl px-4 py-12 md:px-8">
              <div className="absolute inset-x-5 top-0 -z-10 h-[360px] rounded-[40px] bg-[radial-gradient(circle_at_26%_30%,rgba(154,116,40,0.15),transparent_34%),radial-gradient(circle_at_78%_62%,rgba(47,138,85,0.14),transparent_34%)] blur-2xl" />
              <div className="rounded-lg border border-line bg-panel/95 p-5 shadow-glow md:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">How to demo</p>
                    <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5] md:text-4xl">Show the whole build journey in four clicks.</h2>
                  </div>
                  <a
                    href="#garage"
                    className="inline-flex h-11 w-fit items-center justify-center rounded-lg border border-volt/30 bg-volt/10 px-4 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                  >
                    Start in My Garage
                  </a>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-4">
                  {demoSteps.map((step, index) => (
                    <a key={step.title} href={index === 0 ? "#garage" : index === 1 || index === 2 ? "#demo" : "#ask"} className="rounded-lg border border-line bg-[#09160e] p-4 transition hover:border-volt hover:bg-volt/5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">0{index + 1}</span>
                      <h3 className="mt-3 font-semibold text-[#f3ead5]">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#b8ac91]">{step.copy}</p>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </>
        }
        demo={
          <>
            <DemoGuide />
            <section id="demo" className="relative mx-auto max-w-7xl px-4 py-12 md:px-8">
              <div className="absolute inset-x-5 top-0 -z-10 h-[720px] rounded-[40px] bg-[radial-gradient(circle_at_30%_20%,rgba(154,116,40,0.16),transparent_34%),radial-gradient(circle_at_78%_45%,rgba(47,138,85,0.18),transparent_34%)] blur-2xl" />
              <FitmentChecker />
            </section>
          </>
        }
        garage={<GarageManager />}
        ask={<AskFitmentAI />}
        how={
          <>
            <section id="how" className="relative mx-auto grid max-w-7xl gap-6 px-4 py-12 md:px-8 lg:grid-cols-3">
              <div className="absolute inset-x-5 top-0 -z-10 h-[360px] rounded-[40px] bg-[radial-gradient(circle_at_50%_40%,rgba(154,116,40,0.14),transparent_42%)] blur-2xl" />
              <SectionCard eyebrow="Roadmap" title="Search parts">
                FitmentAI starts from a saved car, then searches manufacturer and
                parts-site listings by year, make, model, trim, category, and part type.
              </SectionCard>
              <SectionCard eyebrow="Part match" title="Select a listing">
                FitmentAI compares source, seller, category, and part details before the
                user chooses which listing to check.
              </SectionCard>
              <SectionCard eyebrow="Buyer action" title="Score fitment">
                Every selected listing becomes a 0-100 compatibility score with checks
                for rubbing, poke, brake clearance, ground clearance, routing, mounting
                points, and install risk.
              </SectionCard>
            </section>
            <section className="relative mx-auto max-w-7xl px-4 py-12 md:px-8">
              <div className="absolute inset-x-5 top-0 -z-10 h-[360px] rounded-[40px] bg-[radial-gradient(circle_at_68%_36%,rgba(154,116,40,0.16),transparent_40%)] blur-2xl" />
              <div className="mb-8 max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Future features</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5] md:text-4xl">From demo to fitment intelligence layer</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {futureFeatures.map((feature) => (
                  <div key={feature.title} className="rounded-lg border border-line bg-panel/95 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <feature.icon className="h-5 w-5 text-volt" />
                      <span className="rounded-md border border-line bg-[#09160e] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9e9278]">
                        Coming soon
                      </span>
                    </div>
                    <h3 className="mt-4 font-semibold text-[#f3ead5]">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#b8ac91]">{feature.copy}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        }
        waitlist={
          <section id="waitlist" className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="absolute inset-x-5 top-0 -z-10 h-[420px] rounded-[40px] bg-[radial-gradient(circle_at_20%_30%,rgba(154,116,40,0.18),transparent_38%),radial-gradient(circle_at_70%_65%,rgba(47,138,85,0.12),transparent_34%)] blur-2xl" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Waitlist</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5] md:text-5xl">
                Get early access to AI-powered parts search.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#b8ac91]">
                Join the private beta for garage-based part discovery, fitment
                checks, verified setup data, and AI build planning before it opens
                publicly.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {waitlistBenefits.map((benefit) => (
                  <div key={benefit} className="rounded-lg border border-line bg-panel/80 p-4">
                    <p className="text-sm font-semibold text-[#f3ead5]">{benefit}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm font-semibold text-[#d7c28b]">
                Built for enthusiasts, shops, and aftermarket sellers.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-panel/95 p-5 shadow-glow md:p-7">
              <WaitlistForm />
            </div>
          </section>
        }
        contact={
          <section id="contact" className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="absolute inset-x-5 top-0 -z-10 h-[420px] rounded-[40px] bg-[radial-gradient(circle_at_24%_32%,rgba(47,138,85,0.14),transparent_36%),radial-gradient(circle_at_76%_60%,rgba(154,116,40,0.16),transparent_36%)] blur-2xl" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Contact</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5] md:text-5xl">Tell us what your build needs next.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#b8ac91]">
                Send feedback, request a feature, or tell FitmentAI what car and parts you want supported first.
              </p>
              <div className="mt-6 grid gap-3">
                {["Best cars to support first", "Part websites to connect", "Fitment checks that matter most"].map((item) => (
                  <div key={item} className="rounded-lg border border-line bg-panel/80 p-4 text-sm font-semibold text-[#f3ead5]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-line bg-panel/95 p-5 shadow-glow md:p-7">
              <ContactForm />
            </div>
          </section>
        }
      />

      <footer className="border-t border-line bg-[#07120c]/80 px-4 py-5 text-center text-xs leading-5 text-[#9e9278] md:px-8">
        FitmentAI is an early build-planning platform. Always verify final fitment, safety, legality, and warranty impact with the manufacturer or a qualified shop before purchase or installation.
      </footer>
    </main>
  );
}
