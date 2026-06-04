"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  Database,
  Gauge,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const proofSignals = [
  { icon: Database, label: "Real parts sources", value: "10+" },
  { icon: ShieldCheck, label: "Fitment evidence", value: "Explained" },
  { icon: Sparkles, label: "Build planning", value: "AI-assisted" },
];

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden border-b border-line bg-[#07120c]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-48 -top-64 h-[58rem] w-[28rem] -rotate-45 rounded-full bg-[radial-gradient(circle,rgba(154,116,40,0.16),transparent_68%)]" />
        <div className="absolute right-0 top-12 h-[36rem] w-[28rem] bg-[radial-gradient(circle,rgba(47,138,85,0.14),transparent_68%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-12 text-center md:px-8 md:pb-20 md:pt-20">
        <div className="relative z-10 mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-lg border border-volt/30 bg-volt/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d8cba9]">
            <Radar className="h-4 w-4 text-volt" />
            Parts discovery + fitment intelligence
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.04] text-[#f3ead5] md:text-6xl lg:text-7xl">
            Build the car you want.
            <span className="block text-[#d7c28b]">Know what fits first.</span>
          </h1>
          <p className="mx-auto my-7 max-w-2xl text-base leading-8 text-[#b8ac91] md:text-xl">
            Search real aftermarket sources, understand compatibility risk, and plan every upgrade around your exact vehicle.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="#demo">
                Find parts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#twin">Open Build Twin</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]">
          <div className="[perspective:1200px] md:px-10">
            <div className="[transform:rotateX(15deg)]">
              <div className="relative mx-auto min-h-[30rem] max-w-6xl overflow-hidden rounded-lg border border-volt/35 bg-[#09160e] shadow-[0_38px_120px_rgba(0,0,0,0.6),0_0_70px_rgba(154,116,40,0.12)] md:min-h-[42rem]">
                <Image
                  src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1800&q=85"
                  alt="Performance car used for a FitmentAI build preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,18,12,0.98)_0%,rgba(7,18,12,0.72)_52%,rgba(7,18,12,0.2)_100%),linear-gradient(0deg,rgba(7,18,12,0.95),transparent_56%)]" />

                <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 md:inset-x-7 md:top-7">
                  <span className="inline-flex items-center gap-2 rounded-md border border-signal/40 bg-[#07120c]/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9d9b8] backdrop-blur md:text-xs">
                    <BadgeCheck className="h-4 w-4" />
                    Vehicle profile active
                  </span>
                  <span className="rounded-md border border-line bg-[#07120c]/85 px-3 py-2 text-[10px] font-semibold text-[#d8cba9] backdrop-blur md:text-xs">
                    2017 Porsche Macan Turbo
                  </span>
                </div>

                <div className="absolute bottom-8 left-4 right-4 text-left md:bottom-12 md:left-8 md:right-auto md:w-[58%]">
                  <div className="rounded-lg border border-line bg-[#07120c]/90 p-4 backdrop-blur-md md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-volt md:text-xs">Live part match</p>
                        <h2 className="mt-2 text-xl font-semibold text-[#f3ead5] md:text-3xl">Carbon rear spoiler</h2>
                        <p className="mt-2 text-xs leading-5 text-[#b8ac91] md:text-sm">Source evidence, body-panel tolerance, and install risk analyzed together.</p>
                      </div>
                      <div className="shrink-0 rounded-lg border border-signal/45 bg-signal/15 px-3 py-2 text-center">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-[#a9d9b8] md:text-[10px]">Score</p>
                        <p className="text-2xl font-bold text-[#c9e7d1] md:text-4xl">86</p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <DashboardSignal icon={Search} label="Source" value="Manufacturer" />
                      <DashboardSignal icon={Gauge} label="Risk" value="Low" />
                      <DashboardSignal icon={Car} label="Build" value="OEM+ Daily" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-4 grid max-w-4xl gap-3 sm:grid-cols-3 md:-mt-12">
          {proofSignals.map((signal) => (
            <div key={signal.label} className="flex items-center gap-3 rounded-lg border border-line bg-panel/95 p-4 text-left shadow-glow">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-volt/25 bg-volt/10 text-volt">
                <signal.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs text-[#9e9278]">{signal.label}</span>
                <span className="mt-1 block text-sm font-semibold text-[#f3ead5]">{signal.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardSignal({ icon: Icon, label, value }: { icon: typeof Search; label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#09160e]/90 p-2 md:p-3">
      <Icon className="h-3.5 w-3.5 text-volt md:h-4 md:w-4" />
      <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-[#9e9278] md:text-[10px]">{label}</p>
      <p className="mt-1 truncate text-[10px] font-semibold text-[#f3ead5] md:text-xs">{value}</p>
    </div>
  );
}
