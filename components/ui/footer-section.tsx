"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  BadgeCheck,
  Database,
  Gauge,
  Github,
  Instagram,
  Mail,
  MessageCircle,
  ShieldCheck,
  Wrench,
} from "lucide-react";

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

const footerLinks: FooterSection[] = [
  {
    label: "Product",
    links: [
      { title: "Find Parts", href: "#demo", icon: Gauge },
      { title: "Build Twin", href: "#twin", icon: Wrench },
      { title: "Parts Database", href: "#database", icon: Database },
      { title: "Verified Setups", href: "#verified", icon: BadgeCheck },
    ],
  },
  {
    label: "Your Build",
    links: [
      { title: "My Garage", href: "#garage" },
      { title: "Ask FitmentAI", href: "#ask", icon: MessageCircle },
      { title: "Product Roadmap", href: "#how" },
      { title: "Join Waitlist", href: "#waitlist" },
    ],
  },
  {
    label: "Company",
    links: [
      { title: "Contact", href: "#contact", icon: Mail },
      { title: "Early Access", href: "#waitlist" },
      { title: "Admin Dashboard", href: "#admin" },
      { title: "Fitment Safety", href: "#demo", icon: ShieldCheck },
    ],
  },
  {
    label: "Follow",
    links: [
      { title: "GitHub", href: "https://github.com/Erw464-lgtm/fitmentai", icon: Github },
      { title: "Instagram", href: "#contact", icon: Instagram },
      { title: "Product Updates", href: "#waitlist", icon: Mail },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center overflow-hidden rounded-t-lg border-x border-t border-line bg-[radial-gradient(35%_128px_at_50%_0%,rgba(154,116,40,0.2),transparent),linear-gradient(180deg,rgba(13,29,19,0.98),rgba(7,18,12,0.98))] px-6 py-12 lg:py-16">
      <div className="absolute left-1/2 top-0 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt blur" />

      <div className="grid w-full gap-10 xl:grid-cols-[0.85fr_2.15fr] xl:gap-12">
        <AnimatedContainer className="space-y-5">
          <a href="#home" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg border border-volt/50 bg-[#111f15] text-volt">
              <Gauge className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-[#f3ead5]">FitmentAI</span>
              <span className="block text-xs text-[#9e9278]">Aftermarket fitment OS</span>
            </span>
          </a>
          <p className="max-w-sm text-sm leading-6 text-[#b8ac91]">
            Find parts across trusted sources, understand fitment risk, and plan the whole build before buying.
          </p>
          <a
            href="#waitlist"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-volt px-5 text-sm font-semibold text-[#07120c] transition hover:bg-[#b98d31]"
          >
            Get early access
          </a>
        </AnimatedContainer>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-volt">{section.label}</h3>
                <ul className="mt-4 space-y-3 text-sm text-[#9e9278]">
                  {section.links.map((link) => (
                    <li key={`${section.label}-${link.title}`}>
                      <a
                        href={link.href}
                        className="inline-flex items-center transition-colors duration-300 hover:text-[#f3ead5]"
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                      >
                        {link.icon ? <link.icon className="me-2 h-4 w-4 text-[#b8ac91]" /> : null}
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>

      <AnimatedContainer delay={0.45} className="mt-12 w-full border-t border-line pt-6">
        <div className="flex flex-col gap-3 text-xs leading-5 text-[#9e9278] md:flex-row md:items-start md:justify-between">
          <p>© {new Date().getFullYear()} FitmentAI. All rights reserved.</p>
          <p className="max-w-3xl md:text-right">
            FitmentAI is an early build-planning platform. Always verify final fitment, safety, legality, and warranty impact with the manufacturer or a qualified shop before purchase or installation.
          </p>
        </div>
      </AnimatedContainer>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
