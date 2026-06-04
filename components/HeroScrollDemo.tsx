"use client";

import Image from "next/image";
import { ArrowRight, BadgeCheck, Gauge, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-[#07120c]/70">
      <div className="absolute inset-x-0 top-1/3 -z-10 h-[420px] bg-[radial-gradient(circle_at_50%_50%,rgba(154,116,40,0.17),transparent_42%),radial-gradient(circle_at_70%_45%,rgba(47,138,85,0.14),transparent_34%)] blur-2xl" />
      <ContainerScroll
        titleComponent={
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-lg border border-volt/30 bg-volt/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d8cba9]">
              <Sparkles className="h-4 w-4 text-volt" />
              From listing to confident build
            </span>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-[#f3ead5] md:text-6xl">
              See the whole decision before you buy the part.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#b8ac91] md:text-lg">
              Scroll to bring a real-world part match into focus, with the vehicle, evidence, risks, and smartest next action in one view.
            </p>
          </div>
        }
      >
        <div className="relative h-full w-full overflow-hidden bg-[#07120c]">
          <Image
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=85"
            alt="Porsche driving on a mountain road"
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,18,12,0.96)_0%,rgba(7,18,12,0.63)_45%,rgba(7,18,12,0.24)_100%),linear-gradient(0deg,rgba(7,18,12,0.95),transparent_52%)]" />

          <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 md:inset-x-6 md:top-6">
            <span className="inline-flex items-center gap-2 rounded-md border border-signal/40 bg-[#07120c]/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9d9b8] backdrop-blur md:text-xs">
              <Radar className="h-4 w-4" />
              Live build intelligence
            </span>
            <span className="rounded-md border border-volt/40 bg-[#07120c]/85 px-3 py-2 text-[10px] font-semibold text-[#d8cba9] backdrop-blur md:text-xs">
              2017 Porsche Macan Turbo
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 grid gap-3 md:bottom-6 md:left-6 md:right-auto md:w-[58%] md:grid-cols-[1fr_auto]">
            <div className="rounded-lg border border-line bg-[#07120c]/90 p-4 backdrop-blur-md md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-volt md:text-xs">Matched part</p>
                  <h3 className="mt-2 text-base font-semibold text-[#f3ead5] md:text-xl">Carbon rear spoiler</h3>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-lg border border-signal/40 bg-signal/15 text-xl font-bold text-[#a9d9b8] md:h-16 md:w-16 md:text-2xl">
                  86
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniSignal icon={BadgeCheck} label="Source" value="Verified" />
                <MiniSignal icon={ShieldCheck} label="Risk" value="Low" />
                <MiniSignal icon={Gauge} label="Install" value="Medium" />
              </div>
            </div>
            <a
              href="#demo"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-volt px-5 text-sm font-semibold text-[#07120c] transition hover:bg-[#b98d31] md:self-end"
            >
              Check a part
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
}

function MiniSignal({ icon: Icon, label, value }: { icon: typeof BadgeCheck; label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#09160e]/90 p-2 md:p-3">
      <Icon className="h-3.5 w-3.5 text-volt md:h-4 md:w-4" />
      <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-[#9e9278] md:text-[10px]">{label}</p>
      <p className="mt-1 truncate text-[10px] font-semibold text-[#f3ead5] md:text-xs">{value}</p>
    </div>
  );
}
