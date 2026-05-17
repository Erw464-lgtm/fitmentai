"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, Download, Loader2, LockKeyhole, RefreshCw, Users } from "lucide-react";

type WaitlistLead = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  needed_feature?: string;
  note?: string | null;
  source?: string | null;
  created_at?: string;
};

type LoadState = "idle" | "loading" | "success" | "error";

export function AdminDashboard() {
  const [pin, setPin] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");
  const [leads, setLeads] = useState<WaitlistLead[]>([]);

  const roleCounts = useMemo(() => {
    return leads.reduce<Record<string, number>>((counts, lead) => {
      const role = lead.role || "Unknown";
      counts[role] = (counts[role] || 0) + 1;
      return counts;
    }, {});
  }, [leads]);

  const csv = useMemo(() => buildCsv(leads), [leads]);
  const topRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0];

  async function loadWaitlist() {
    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        cache: "no-store",
        headers: {
          "x-admin-pin": pin,
        },
      });
      const result = (await response.json()) as { waitlist?: WaitlistLead[]; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Waitlist could not be loaded.");
      }

      setLeads(result.waitlist ?? []);
      setState("success");
      setMessage(`Loaded ${result.waitlist?.length ?? 0} waitlist lead${result.waitlist?.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Waitlist could not be loaded.");
    }
  }

  async function copyCsv() {
    if (!csv) {
      setMessage("Load waitlist leads before copying CSV.");
      return;
    }

    try {
      await navigator.clipboard.writeText(csv);
      setMessage("Waitlist CSV copied.");
    } catch {
      setMessage("Clipboard blocked. Select and copy from the export preview instead.");
    }
  }

  return (
    <section id="admin" className="relative mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="absolute inset-x-5 top-0 -z-10 h-[520px] rounded-[40px] bg-[radial-gradient(circle_at_20%_20%,rgba(154,116,40,0.18),transparent_34%),radial-gradient(circle_at_80%_45%,rgba(47,138,85,0.14),transparent_34%)] blur-2xl" />
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-lg border border-line bg-panel/95 p-5 shadow-glow md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Admin</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#f3ead5]">Waitlist command center.</h2>
              <p className="mt-4 leading-7 text-[#b8ac91]">
                Review early-access demand, copy leads into a spreadsheet, and see which user groups are asking for FitmentAI first.
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-volt/30 bg-volt/10 text-volt">
              <LockKeyhole className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-6 rounded-lg border border-volt/15 bg-volt/5 p-4">
            <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
              Admin PIN
              <input
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="Set ADMIN_DASHBOARD_PIN in Vercel"
                className="h-12 rounded-lg border border-line bg-[#09160e] px-4 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadWaitlist()}
              disabled={state === "loading"}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Load waitlist dashboard
            </button>
            {message ? (
              <p className={`mt-3 rounded-lg border p-3 text-sm ${state === "error" ? "border-warning/35 bg-warning/10 text-orange-200" : "border-volt/25 bg-volt/10 text-[#d8cba9]"}`}>
                {message}
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <AdminMetric label="Leads" value={String(leads.length)} />
            <AdminMetric label="Top role" value={topRole ? topRole[0] : "None"} />
            <AdminMetric label="Sources" value={String(new Set(leads.map((lead) => lead.source || "unknown")).size || 0)} />
          </div>

          <div className="mt-5 rounded-lg border border-line bg-[#07120c] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Export</p>
                <p className="mt-1 text-sm text-[#9e9278]">Copy the waitlist into Sheets, Excel, or a CRM.</p>
              </div>
              <button
                type="button"
                onClick={() => void copyCsv()}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
              >
                <ClipboardCopy className="h-4 w-4" />
                Copy CSV
              </button>
            </div>
            <textarea
              readOnly
              value={csv}
              rows={6}
              className="mt-3 w-full rounded-lg border border-line bg-[#09160e] px-3 py-3 text-xs text-[#b8ac91] outline-none"
              placeholder="Load waitlist leads to generate CSV."
            />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel/95 p-4 shadow-glow md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">Leads</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#f3ead5]">Private beta waitlist</h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-volt/20 bg-volt/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#d8cba9]">
              <Users className="h-4 w-4 text-volt" />
              {leads.length} total
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {leads.map((lead) => (
              <div key={lead.id || lead.email} className="rounded-lg border border-line bg-[#07120c] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#f3ead5]">{lead.name || "Unnamed lead"}</p>
                    <p className="mt-1 text-sm text-[#d8cba9]">{lead.email || "No email"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md border border-volt/20 bg-volt/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8cba9]">
                        {lead.role || "Unknown role"}
                      </span>
                      <span className="rounded-md border border-line bg-[#09160e] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9e9278]">
                        {formatDate(lead.created_at)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`mailto:${lead.email || ""}`}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-[#d8cba9] transition hover:border-volt hover:text-volt"
                  >
                    <Download className="h-4 w-4 rotate-[-90deg]" />
                    Email
                  </a>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#b8ac91]">
                  <span className="font-semibold text-[#d7c28b]">Wanted:</span> {lead.needed_feature || "Private beta access"}
                </p>
                {lead.note ? <p className="mt-2 text-sm leading-6 text-[#9e9278]">{lead.note}</p> : null}
              </div>
            ))}
            {leads.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line bg-[#07120c] p-6 text-sm leading-6 text-[#9e9278]">
                Load the dashboard to see Supabase waitlist submissions here.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-[#07120c] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9e9278]">{label}</p>
      <p className="mt-2 truncate text-xl font-semibold text-[#f3ead5]">{value}</p>
    </div>
  );
}

function buildCsv(leads: WaitlistLead[]) {
  if (!leads.length) return "";

  const rows = [
    ["Name", "Email", "Role", "Needed Feature", "Note", "Source", "Created At"],
    ...leads.map((lead) => [
      lead.name || "",
      lead.email || "",
      lead.role || "",
      lead.needed_feature || "",
      lead.note || "",
      lead.source || "",
      lead.created_at || "",
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function formatDate(value?: string) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
