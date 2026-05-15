import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type AskPayload = {
  question?: string;
  profile?: {
    email?: string;
    display_name?: string | null;
    role?: string | null;
  } | null;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
    trim?: string | null;
    current_setup?: string | null;
    suspension_setup?: string | null;
    dream_setup?: string | null;
    parts_to_buy?: string | null;
  } | null;
  plannedParts?: Array<{
    name?: string;
    category?: string;
    source?: string | null;
    price?: string | null;
    status?: string;
    fitment_score?: number | null;
    fitment_status?: string | null;
    fitment_warning?: string | null;
    fitment_recommendation?: string | null;
    notes?: string | null;
  }>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `ask:${getClientIp(request)}`,
      limit: 30,
      windowMs: 60_000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many Ask FitmentAI requests. Try again soon." }, { status: 429 });
    }

    const body = (await request.json()) as AskPayload;
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const mockAnswer = buildMockAnswer(body);
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({
        answer: mockAnswer,
        provider: "mock",
        message: "GEMINI_API_KEY is not configured, so Ask FitmentAI used the local MVP response.",
      });
    }

    const model = normalizeGeminiModel(process.env.GEMINI_MODEL);
    const prompt = buildPrompt(body);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 420,
          },
        }),
        cache: "no-store",
      }
    );

    const data = (await response.json()) as GeminiResponse & { error?: { message?: string } };

    if (!response.ok) {
      return NextResponse.json({
        answer: mockAnswer,
        provider: "mock",
        message: data.error?.message || "Gemini request failed, so Ask FitmentAI used the local MVP response.",
      });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim();

    return NextResponse.json({
      answer: answer || mockAnswer,
      provider: answer ? "gemini" : "mock",
      message: answer ? "Generated with Gemini." : "Gemini returned no text, so Ask FitmentAI used the local MVP response.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid Ask FitmentAI request." }, { status: 400 });
  }
}

function buildPrompt(body: AskPayload) {
  const vehicle = body.vehicle;
  const vehicleLabel = vehicle
    ? [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ")
    : "No saved vehicle";
  const parts = (body.plannedParts || []).slice(0, 8);

  return [
    "You are FitmentAI, a concise automotive build planning assistant.",
    "Use only the provided garage context. Do not pretend to know exact manufacturer fitment if the context does not include it.",
    "Give practical enthusiast advice: fitment risk, what to verify before buying, and the next action.",
    "Keep the answer under 160 words.",
    "",
    `User question: ${body.question}`,
    `Profile: ${body.profile?.display_name || body.profile?.email || "not signed in"}`,
    `Vehicle: ${vehicleLabel}`,
    `Current setup: ${vehicle?.current_setup || "not saved"}`,
    `Suspension: ${vehicle?.suspension_setup || "not saved"}`,
    `Dream setup: ${vehicle?.dream_setup || "not saved"}`,
    `Parts to buy: ${vehicle?.parts_to_buy || "not saved"}`,
    "",
    "Planned parts:",
    parts.length
      ? parts
          .map((part) =>
            [
              `- ${part.name || "Unnamed part"}`,
              `category: ${part.category || "unknown"}`,
              part.source ? `source: ${part.source}` : "",
              part.price ? `price: ${part.price}` : "",
              part.status ? `status: ${part.status}` : "",
              part.fitment_score !== null && part.fitment_score !== undefined ? `score: ${part.fitment_score}/100` : "score: unchecked",
              part.fitment_warning ? `warning: ${part.fitment_warning}` : "",
              part.fitment_recommendation ? `recommendation: ${part.fitment_recommendation}` : "",
            ]
              .filter(Boolean)
              .join(", ")
          )
          .join("\n")
      : "- none saved",
  ].join("\n");
}

function normalizeGeminiModel(model?: string) {
  return (model || "gemini-2.5-flash-lite").trim().replace(/^models\//, "");
}

function buildMockAnswer(body: AskPayload) {
  const vehicle = body.vehicle;

  if (!body.profile) {
    return "Sign in from My Garage first so I can use your saved cars and planned parts. After that, I can answer with garage context instead of generic advice.";
  }

  if (!vehicle) {
    return "I do not see a saved vehicle under this profile yet. Add a car in My Garage, then I can help plan parts, fitment checks, and next steps.";
  }

  const plannedParts = body.plannedParts || [];
  const lowerQuestion = (body.question || "").toLowerCase();
  const riskyParts = plannedParts.filter((part) => (part.fitment_score ?? 100) < 70 || Boolean(part.fitment_warning));
  const uncheckedParts = plannedParts.filter((part) => part.fitment_score === null || part.fitment_score === undefined);
  const checkedParts = plannedParts.filter((part) => part.fitment_score !== null && part.fitment_score !== undefined);
  const nextPart = uncheckedParts[0] || riskyParts[0] || plannedParts.find((part) => part.status === "planned");
  const vehicleLabel = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
  const contextLine = `${vehicleLabel} | current: ${vehicle.current_setup || "not saved"} | suspension: ${vehicle.suspension_setup || "not saved"}`;

  if (
    lowerQuestion.includes("horsepower") ||
    lowerQuestion.includes("hp") ||
    lowerQuestion.includes("turbo") ||
    lowerQuestion.includes("tune") ||
    lowerQuestion.includes("power") ||
    lowerQuestion.includes("performance")
  ) {
    return `Performance estimate\n${contextLine}\n\nA turbo upgrade can add meaningful horsepower, but the exact gain depends on the turbo size, tune, fuel, intercooler, downpipe/exhaust flow, and engine health. For a 2017 Porsche Macan Turbo, I would treat this as a high-impact performance mod that needs supporting parts and professional tuning, not a simple bolt-on estimate.\n\nNext step: compare manufacturer dyno charts for the exact turbo kit, confirm ECU tuning support, and check heat management before buying.`;
  }

  if (lowerQuestion.includes("risk") || lowerQuestion.includes("warning") || lowerQuestion.includes("fit")) {
    if (riskyParts.length === 0 && uncheckedParts.length === 0) {
      return `Garage readout\n${contextLine}\n\nNo unresolved fitment warnings are saved right now. I would still verify exact trim, drivetrain, mounting points, brake clearance, and seller fitment notes before purchase.`;
    }

    const riskSummary = [...riskyParts, ...uncheckedParts]
      .slice(0, 3)
      .map((part) => {
        if (part.fitment_score !== null && part.fitment_score !== undefined) {
          return `- ${part.name}: ${part.fitment_score}/100, ${part.fitment_warning || "review recommended"}`;
        }
        return `- ${part.name}: not checked yet`;
      })
      .join("\n");

    return `Fitment risk readout\n${contextLine}\n\nMain review items:\n${riskSummary}\n\nRecommendation: run checks on unchecked parts first, then fix or replace anything with a low score before buying more parts.`;
  }

  if (lowerQuestion.includes("next") || lowerQuestion.includes("buy") || lowerQuestion.includes("recommend")) {
    if (!nextPart) {
      return `Next move\n${contextLine}\n\nNo planned parts are saved yet. Add 2 or 3 parts you are considering, then I can rank them by fitment risk, install priority, and build impact.`;
    }

    return `Next buy recommendation\n${contextLine}\n\nFocus on: ${nextPart.name}\nCategory: ${nextPart.category}${nextPart.source ? `\nSource: ${nextPart.source}` : ""}${nextPart.price ? `\nPrice: ${nextPart.price}` : ""}\n\nWhy: it is the next unresolved item in the build plan. Before buying, run or review its fitment check, confirm exact trim compatibility, and compare it against at least one verified install on the same generation.`;
  }

  return `Garage recommendation\n${contextLine}\n\nSaved parts: ${plannedParts.length}\nChecked parts: ${checkedParts.length}\nUnchecked parts: ${uncheckedParts.length}\nRisk flags: ${riskyParts.length}\n\nBest next step: run fitment checks on unchecked parts first, resolve low-score warnings, then buy the parts with the clearest vehicle-specific fitment evidence.`;
}
