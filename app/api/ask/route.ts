import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type AskPayload = {
  question?: string;
  mode?: "fitment-risk" | "power-gains" | "daily-driver" | "next-part" | "budget-plan";
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

export function GET() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json({
    provider: geminiConfigured ? "gemini" : "mock",
    label: geminiConfigured ? "Gemini live" : "Local fallback",
    model: geminiConfigured ? normalizeGeminiModel(process.env.GEMINI_MODEL) : null,
  });
}

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
    const confidence = getConfidence(body);
    const confidenceReason = getConfidenceReason(body);
    const followUps = getFollowUps(body);

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const mockAnswer = buildMockAnswer(body);
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({
        answer: mockAnswer,
        provider: "mock",
        confidence,
        confidenceReason,
        followUps,
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
        confidence,
        confidenceReason,
        followUps,
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
      confidence,
      confidenceReason,
      followUps,
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
    "You are FitmentAI, a concise automotive garage, sourcing, and build-planning assistant.",
    "Sound like a practical enthusiast advisor: specific, calm, and useful. Use the provided garage context first, then general automotive knowledge where appropriate.",
    "The MVP is especially focused on Porsche Macan-style demo flows, live source inspection, planned parts, fitment checks, and build priority.",
    "Do not invent exact manufacturer fitment claims, part numbers, dyno numbers, prices, or compatibility guarantees. If exact data is missing, say what data is missing and how to verify it.",
    "When the user asks about horsepower, explain realistic dependency factors instead of refusing. Use ranges only if clearly described as broad estimates.",
    "When the user asks about a part, always tell them what source/listing details to verify before saving or buying.",
    "Format every answer exactly with these labels: Short answer, Confidence, Biggest risk, Verify before buying, Next step.",
    "Keep the answer under 190 words.",
    "",
    `User question: ${body.question}`,
    `Answer mode: ${body.mode || "general"}`,
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

function getConfidence(body: AskPayload) {
  const parts = body.plannedParts || [];

  if (body.vehicle && parts.some((part) => part.fitment_score !== null && part.fitment_score !== undefined)) {
    return "High confidence";
  }

  if (body.vehicle) {
    return "Medium confidence";
  }

  return "Low confidence";
}

function getConfidenceReason(body: AskPayload) {
  const parts = body.plannedParts || [];
  const checkedParts = parts.filter((part) => part.fitment_score !== null && part.fitment_score !== undefined);

  if (!body.vehicle) {
    return "Low because no saved vehicle is attached yet. Add/select a garage car so FitmentAI can use year, make, model, trim, setup, and planned parts.";
  }

  if (checkedParts.length > 0) {
    return `High because FitmentAI has a saved vehicle and ${checkedParts.length} checked part${checkedParts.length === 1 ? "" : "s"} with fitment results.`;
  }

  if (parts.length > 0) {
    return `Medium because FitmentAI has your saved vehicle and ${parts.length} planned part${parts.length === 1 ? "" : "s"}, but no saved fitment score yet.`;
  }

  return "Medium because FitmentAI has your saved vehicle, but no planned parts or saved fitment checks yet.";
}

function getFollowUps(body: AskPayload) {
  switch (body.mode) {
    case "power-gains":
      return ["What supporting mods do I need?", "What could break first?", "Make this safer for daily driving"];
    case "daily-driver":
      return ["What setup is most comfortable?", "What should I avoid?", "Rank my next parts"];
    case "budget-plan":
      return ["Build a staged parts list", "What should I buy first?", "What can wait?"];
    case "fitment-risk":
      return ["What could rub?", "What specs should I change?", "Find a safer option"];
    case "next-part":
      return ["Why that part first?", "What is the risk?", "Save this plan"];
    default:
      return ["What supporting mods do I need?", "What could go wrong?", "What should I buy next?"];
  }
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
    return `Short answer\nA turbo upgrade can add meaningful power, but the real gain depends on the exact turbo, tune, fuel, intercooler, exhaust flow, and engine health.\n\nConfidence\nMedium for planning, lower for exact horsepower until a specific kit or dyno sheet is saved.\n\nBiggest risk\nHeat, tune reliability, warranty/emissions impact, and drivetrain stress.\n\nVerify before buying\nAsk for Macan Turbo-specific dyno data, required supporting mods, ECU/TCU tuning, install hardware, and shop experience.\n\nNext step\nSave the exact turbo kit or performance listing, then ask FitmentAI to compare supporting mods.`;
  }

  if (lowerQuestion.includes("risk") || lowerQuestion.includes("warning") || lowerQuestion.includes("fit")) {
    if (riskyParts.length === 0 && uncheckedParts.length === 0) {
      return `Short answer\nNo unresolved fitment warnings are saved right now.\n\nConfidence\nMedium: ${contextLine}\n\nBiggest risk\nThe app cannot prove the listing until the exact source, part number, and install notes are saved.\n\nVerify before buying\nExact trim, drivetrain, mounting points, brake clearance, seller fitment notes, and return policy.\n\nNext step\nSave the listing to My Garage, then run a fitment check before buying.`;
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

    return `Short answer\nThese are the main parts to review before buying:\n${riskSummary}\n\nConfidence\nMedium: ${contextLine}\n\nBiggest risk\nUnchecked parts may have broad fitment claims without proof for your exact trim.\n\nVerify before buying\nPart number, year range, mounting points, tire/wheel clearance, and install photos on the same generation.\n\nNext step\nRun checks on unchecked parts first, then replace or fix anything with a low score.`;
  }

  if (lowerQuestion.includes("next") || lowerQuestion.includes("buy") || lowerQuestion.includes("recommend")) {
    if (!nextPart) {
      return `Short answer\nNo planned parts are saved yet, so the smartest move is to add 2 or 3 real listings you are considering.\n\nConfidence\nMedium: ${contextLine}\n\nBiggest risk\nBuying from a broad compatibility claim without part-specific proof.\n\nVerify before buying\nSource, part number, vehicle selector fitment, install notes, and return policy.\n\nNext step\nUse live source search, save a listing, then run a fitment check.`;
    }

    return `Short answer\nFocus on ${nextPart.name} next.\n\nConfidence\nMedium: ${contextLine}\n\nBiggest risk\n${nextPart.fitment_warning || "The exact listing still needs proof for your vehicle."}\n\nVerify before buying\nCategory: ${nextPart.category}${nextPart.source ? `\nSource: ${nextPart.source}` : ""}${nextPart.price ? `\nPrice: ${nextPart.price}` : ""}\nConfirm exact trim compatibility, included hardware, return policy, and at least one same-generation install.\n\nNext step\nRun or review its fitment check, then compare one backup source before buying.`;
  }

  return `Short answer\nYour garage has ${plannedParts.length} saved part${plannedParts.length === 1 ? "" : "s"}, ${checkedParts.length} checked, ${uncheckedParts.length} unchecked, and ${riskyParts.length} risk flag${riskyParts.length === 1 ? "" : "s"}.\n\nConfidence\n${getConfidence(body)}: ${contextLine}\n\nBiggest risk\nBuying an unchecked part before the listing has vehicle-specific proof.\n\nVerify before buying\nExact trim fitment, part number, install hardware, source reputation, and return policy.\n\nNext step\nRun fitment checks on unchecked parts first, then buy the parts with the clearest evidence.`;
}
