"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

type NavItem = {
  name: string;
  href: string;
};

const defaultItems: NavItem[] = [
  { name: "Home", href: "#home" },
  { name: "Build Twin", href: "#twin" },
  { name: "Find Parts", href: "#demo" },
  { name: "Garage", href: "#garage" },
  { name: "Ask AI", href: "#ask" },
];

export default function NavHeader({ items = defaultItems }: { items?: NavItem[] }) {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      className="relative mx-auto flex w-fit items-center rounded-full border border-line bg-[#09160e]/85 p-1 shadow-[0_12px_45px_rgba(0,0,0,0.28)] backdrop-blur"
      onMouseLeave={() => setPosition((current) => ({ ...current, opacity: 0 }))}
    >
      {items.map((item) => (
        <Tab key={item.href} href={item.href} setPosition={setPosition}>
          {item.name}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  href,
  setPosition,
}: {
  children: React.ReactNode;
  href: string;
  setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>;
}) => {
  const ref = useRef<HTMLLIElement>(null);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) {
          return;
        }

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className="relative z-10 block"
    >
      <a
        href={href}
        className="block rounded-full px-3 py-2 text-xs font-semibold text-[#d8cba9] transition-colors hover:text-[#07120c] lg:px-4"
      >
        {children}
      </a>
    </li>
  );
};

const Cursor = ({ position }: { position: { left: number; width: number; opacity: number } }) => {
  return (
    <motion.li
      animate={position}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="absolute z-0 h-8 rounded-full bg-volt shadow-[0_0_26px_rgba(154,116,40,0.28)]"
    />
  );
};
