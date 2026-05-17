"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

type WaitlistState = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const [state, setState] = useState<WaitlistState>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Car enthusiast",
    note: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
        demoMode?: boolean;
      };

      if (!response.ok) {
        throw new Error(result.error || result.message || "The waitlist form could not save right now.");
      }

      setState("success");
      setMessage(
        result.demoMode
          ? "Demo mode: your form works, but Supabase env vars are not connected yet."
          : result.message || "Thanks. You are on the FitmentAI private beta waitlist."
      );
      setForm({ name: "", email: "", role: "Car enthusiast", note: "" });
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The waitlist form could not save right now.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Name"
          value={form.name}
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          required
        />
      </div>
      <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
        I am a
        <select
          value={form.role}
          onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
          className="h-12 rounded-lg border border-line bg-[#09160e] px-4 text-[#f3ead5] outline-none ring-volt/20 transition focus:border-volt focus:ring-4"
        >
          <option>Car enthusiast</option>
          <option>Wheel shop</option>
          <option>Detailing shop</option>
          <option>Used car dealer</option>
          <option>Aftermarket part seller</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
        Feature you want most
        <textarea
          value={form.note}
          onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
          rows={4}
          className="rounded-lg border border-line bg-[#09160e] px-4 py-3 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
          placeholder="Example: web part search, garage saving, AI fitment advice, verified setups, VIN lookup..."
        />
      </label>
      <button
        type="submit"
        disabled={state === "loading"}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-volt px-5 font-semibold text-[#07120c] transition hover:bg-[#b98d31] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Get Early Access
      </button>
      {message ? (
        <p
          className={`rounded-lg border p-3 text-sm ${
            state === "error"
              ? "border-warning/35 bg-warning/10 text-orange-200"
              : "border-signal/30 bg-signal/10 text-[#bfe5c6]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#b8ac91]">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-lg border border-line bg-[#09160e] px-4 text-[#f3ead5] outline-none ring-volt/20 transition placeholder:text-[#72684f] focus:border-volt focus:ring-4"
      />
    </label>
  );
}
