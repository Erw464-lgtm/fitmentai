"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

type TabId = "home" | "demo" | "garage" | "verified" | "ask" | "how" | "waitlist" | "admin" | "contact";

type TabbedPanelsProps = {
  home: ReactNode;
  demo: ReactNode;
  garage: ReactNode;
  verified: ReactNode;
  ask: ReactNode;
  how: ReactNode;
  waitlist: ReactNode;
  admin: ReactNode;
  contact: ReactNode;
};

const validTabs = new Set<TabId>(["home", "demo", "garage", "verified", "ask", "how", "waitlist", "admin", "contact"]);

export function TabbedPanels({ home, demo, garage, verified, ask, how, waitlist, admin, contact }: TabbedPanelsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const panels = useMemo(
    () => ({
      home,
      demo,
      garage,
      verified,
      ask,
      how,
      waitlist,
      admin,
      contact,
    }),
    [admin, ask, contact, demo, garage, home, how, verified, waitlist]
  );

  useEffect(() => {
    function syncTabFromHash() {
      const hash = window.location.hash.replace("#", "") || "home";
      const nextTab = validTabs.has(hash as TabId) ? (hash as TabId) : "home";

      setActiveTab(nextTab);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);

    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  return (
    <div className="min-h-[calc(100vh-74px)]">
      {panels[activeTab]}
    </div>
  );
}
