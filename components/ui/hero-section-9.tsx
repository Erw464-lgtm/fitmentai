"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
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
  const heroRef = useRef<HTMLElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end 35%"] });
  const { scrollYProgress: dashboardProgress } = useScroll({
    target: dashboardRef,
    offset: ["start 86%", "end 18%"],
  });
  const smoothDashboardProgress = useSpring(dashboardProgress, { stiffness: 120, damping: 24, mass: 0.25 });
  const dashboardY = useTransform(smoothDashboardProgress, [0, 1], [shouldReduceMotion ? 0 : -24, shouldReduceMotion ? 0 : 54]);
  const dashboardScale = useTransform(scrollYProgress, [0, 1], [1, shouldReduceMotion ? 1 : 0.96]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.65], [1, shouldReduceMotion ? 1 : 0.35]);
  const dashboardRotate = useTransform(smoothDashboardProgress, [0, 1], [shouldReduceMotion ? 0 : 16, shouldReduceMotion ? 0 : 2]);
  const imageScale = useTransform(smoothDashboardProgress, [0, 1], [shouldReduceMotion ? 1 : 1.1, 1]);
  const imageY = useTransform(smoothDashboardProgress, [0, 1], [shouldReduceMotion ? 0 : -22, shouldReduceMotion ? 0 : 18]);
  const profileX = useTransform(smoothDashboardProgress, [0, 0.5, 1], [shouldReduceMotion ? 0 : -34, 0, shouldReduceMotion ? 0 : 34]);
  const scanX = useTransform(smoothDashboardProgress, [0, 1], [shouldReduceMotion ? "0%" : "-130%", shouldReduceMotion ? "0%" : "130%"]);
  const scoreScale = useTransform(smoothDashboardProgress, [0, 0.45, 1], [1, shouldReduceMotion ? 1 : 1.12, 1]);

  return (
    <section id="home" ref={heroRef} className="relative overflow-hidden border-b border-line bg-[#07120c]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ opacity: glowOpacity }}
          className="absolute -left-48 -top-64 h-[58rem] w-[28rem] -rotate-45 rounded-full bg-[radial-gradient(circle,rgba(154,116,40,0.15),transparent_68%)]"
        />
        <motion.div
          style={{ opacity: glowOpacity }}
          className="absolute right-0 top-12 h-[36rem] w-[28rem] bg-[radial-gradient(circle,rgba(47,138,85,0.13),transparent_68%)]"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 text-center md:px-8 md:pb-16 md:pt-16">
        <motion.div
          className="relative z-10 mx-auto max-w-4xl"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-lg border border-volt/30 bg-volt/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d8cba9]">
            <Radar className="h-4 w-4 text-volt" />
            Parts discovery + fitment intelligence
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.04] text-[#f3ead5] md:text-6xl lg:text-7xl">
            Build the car you want.
            <span className="block text-[#d7c28b]">Know what fits first.</span>
          </h1>
          <p className="mx-auto my-6 max-w-2xl text-base leading-8 text-[#b8ac91] md:text-xl">
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
        </motion.div>

        <motion.div
          style={{ y: dashboardY, scale: dashboardScale }}
          className="mx-auto mt-12 max-w-7xl [mask-image:linear-gradient(to_bottom,black_76%,transparent_100%)] md:mt-14"
        >
          <div ref={dashboardRef} className="[perspective:1200px] md:px-10">
            <motion.div style={{ rotateX: dashboardRotate, transformStyle: "preserve-3d" }}>
              <div className="relative mx-auto min-h-[27rem] max-w-6xl overflow-hidden rounded-lg border border-volt/30 bg-[#09160e] shadow-[0_30px_90px_rgba(0,0,0,0.54),0_0_52px_rgba(154,116,40,0.1)] md:min-h-[38rem]">
                <motion.div style={{ scale: imageScale, y: imageY }} className="absolute inset-0">
                  <Image
                    src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1800&q=85"
                    alt="Performance car used for a FitmentAI build preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="object-cover"
                    priority
                  />
                </motion.div>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,18,12,0.98)_0%,rgba(7,18,12,0.72)_52%,rgba(7,18,12,0.2)_100%),linear-gradient(0deg,rgba(7,18,12,0.95),transparent_56%)]" />

                <motion.div
                  aria-hidden
                  style={{ scaleX: smoothDashboardProgress }}
                  className="absolute inset-x-0 top-0 h-1 origin-left bg-gradient-to-r from-signal via-volt to-signal"
                />
                <motion.div
                  aria-hidden
                  style={{ x: scanX }}
                  className="absolute top-0 h-full w-1/3 bg-[linear-gradient(90deg,transparent,rgba(154,116,40,0.16),transparent)]"
                />

                <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 md:inset-x-7 md:top-7">
                  <motion.span
                    style={{ x: profileX }}
                    className="inline-flex items-center gap-2 rounded-md border border-signal/40 bg-[#07120c]/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9d9b8] shadow-[0_0_26px_rgba(47,138,85,0.16)] backdrop-blur md:text-xs"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    Vehicle profile active
                  </motion.span>
                  <span className="rounded-md border border-line bg-[#07120c]/85 px-3 py-2 text-[10px] font-semibold text-[#d8cba9] backdrop-blur md:text-xs">
                    2017 Porsche Macan Turbo
                  </span>
                </div>

                <motion.div
                  className="absolute bottom-7 left-4 right-4 text-left md:bottom-10 md:left-8 md:right-auto md:w-[56%]"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="rounded-lg border border-line bg-[#07120c]/90 p-4 backdrop-blur-md md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-volt md:text-xs">Live part match</p>
                        <h2 className="mt-2 text-xl font-semibold text-[#f3ead5] md:text-3xl">Carbon rear spoiler</h2>
                        <p className="mt-2 text-xs leading-5 text-[#b8ac91] md:text-sm">Source evidence, body-panel tolerance, and install risk analyzed together.</p>
                      </div>
                      <motion.div
                        style={{ scale: scoreScale }}
                        className="shrink-0 rounded-lg border border-signal/45 bg-signal/15 px-3 py-2 text-center shadow-[0_0_24px_rgba(47,138,85,0.18)]"
                      >
                        <p className="text-[9px] uppercase tracking-[0.12em] text-[#a9d9b8] md:text-[10px]">Score</p>
                        <p className="text-2xl font-bold text-[#c9e7d1] md:text-4xl">86</p>
                      </motion.div>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <DashboardSignal icon={Search} label="Source" value="Manufacturer" />
                      <DashboardSignal icon={Gauge} label="Risk" value="Low" />
                      <DashboardSignal icon={Car} label="Build" value="OEM+ Daily" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="relative z-10 mx-auto -mt-3 grid max-w-4xl gap-3 sm:grid-cols-3 md:-mt-10">
          {proofSignals.map((signal, index) => (
            <motion.div
              key={signal.label}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: index * 0.08, duration: 0.55 }}
              className="flex items-center gap-3 rounded-lg border border-line bg-panel/95 p-4 text-left shadow-glow"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-volt/25 bg-volt/10 text-volt">
                <signal.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs text-[#9e9278]">{signal.label}</span>
                <span className="mt-1 block text-sm font-semibold text-[#f3ead5]">{signal.value}</span>
              </span>
            </motion.div>
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
