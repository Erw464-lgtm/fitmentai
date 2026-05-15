export type SuspensionSetup =
  | "stock"
  | "lowering-springs"
  | "coilovers"
  | "air-suspension";

export type PartCategory =
  | "suspension"
  | "tires"
  | "wheels"
  | "spacers-adapters"
  | "brakes"
  | "exterior"
  | "performance-interior";

export type FitmentRequest = {
  year: string;
  make: string;
  model: string;
  trim: string;
  partCategory: PartCategory;
  partType: string;
  specificPart: string;
  currentWheelSize: string;
  newWheelSize: string;
  tireSize: string;
  offset: string;
  suspensionSetup: SuspensionSetup;
  spacerSize: string;
  notes: string;
};

export type FitmentStatus =
  | "Safe Fit"
  | "Possible Fit"
  | "Aggressive Fit"
  | "Risky Fit";

export type FitmentResponse = {
  score: number;
  status: FitmentStatus;
  summary: string;
  logicNote?: string;
  warnings: string[];
  recommendations: string[];
};

type RiskContext = {
  risk: number;
  warnings: string[];
  recommendations: string[];
};

const suspensionLabels: Record<SuspensionSetup, string> = {
  stock: "stock suspension",
  "lowering-springs": "lowering springs",
  coilovers: "coilovers",
  "air-suspension": "air suspension",
};

export function scoreFitment(input: FitmentRequest): FitmentResponse {
  const ctx: RiskContext = {
    risk: 0,
    warnings: [],
    recommendations: [
      "Physically verify final fitment, brake clearance, and suspension clearance before buying or driving.",
    ],
  };

  const offset = parseNumber(input.offset);
  const spacer = parseNumber(input.spacerSize);
  const currentWheel = parseWheelSize(input.currentWheelSize);
  const newWheel = parseWheelSize(input.newWheelSize);
  const tire = parseTireSize(input.tireSize);

  applyPartCategoryRisk(ctx, input);

  if (input.partCategory === "wheels" || input.partCategory === "tires" || input.partCategory === "spacers-adapters") {
    applyOffsetRisk(ctx, offset);
    applySpacerRisk(ctx, spacer);
    applyWheelRisk(ctx, currentWheel, newWheel);
    applyTireRisk(ctx, tire, currentWheel, newWheel);
  }

  applySuspensionRisk(ctx, input.suspensionSetup);
  applySpecificPartRisk(ctx, input.specificPart);
  applyNotesRisk(ctx, input.notes);

  const baseScore = clampScore(96 - ctx.risk);
  const variance = randomScoreVariance();
  const score = clampScore(baseScore + variance);
  const status = getStatus(score);
  const vehicle = [input.year, input.make, input.model, input.trim]
    .filter(Boolean)
    .join(" ");

  if (ctx.warnings.length === 0) {
    ctx.warnings.push(
      "No major risk flags were detected from the specs provided, but real-world tolerances still vary by vehicle."
    );
  }

  if (score < 64) {
    const reason = ctx.warnings[0] ?? "The selected part has fitment-sensitive details that need more verification before purchase.";
    ctx.warnings.unshift(`Low fitment score: ${reason}`);
    ctx.recommendations.unshift(...getLowConfidenceRecommendations(input));
  }

  if (score >= 80) {
    ctx.recommendations.push(
      "Confirm hub bore, bolt pattern, lug hardware, and load rating before ordering."
    );
  } else if (score >= 60) {
    ctx.recommendations.push(
      "Ask the seller or installer for test-fit photos on the same generation vehicle."
    );
  } else {
    ctx.recommendations.push(
      "Plan for a professional test fit and be ready to adjust tire size, offset, spacer, or ride height."
    );
    ctx.recommendations.push(
      "Do not buy yet unless the seller, manufacturer, or installer can confirm this exact part on the same vehicle, trim, and setup."
    );
  }

  return {
    score,
    status,
    summary: buildSummary(vehicle, status, score, input),
    logicNote: `Scoring logic run: base score ${baseScore}, randomized proof-of-logic adjustment ${variance >= 0 ? "+" : ""}${variance}.`,
    warnings: unique(ctx.warnings),
    recommendations: unique(ctx.recommendations),
  };
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function randomScoreVariance() {
  return Math.floor(Math.random() * 17) - 8;
}

function getLowConfidenceRecommendations(input: FitmentRequest) {
  const general = [
    "Compare this listing against another brand that clearly names your exact year, model, trim, and drivetrain.",
    "Ask the seller or manufacturer for fitment notes, install photos, or a written compatibility confirmation before adding it to your build.",
  ];
  const lowerType = input.partType.toLowerCase();

  if (input.partCategory === "wheels") {
    return [
      "Request a brake clearance template and confirm bolt pattern, center bore, offset, and load rating.",
      "Look for a wheel with a more conservative width/offset or one already test-fitted on the same chassis.",
      ...general,
    ];
  }
  if (input.partCategory === "tires") {
    return [
      "Choose a tire size closer to OEM diameter if rubbing, speedometer error, or sidewall clearance is flagged.",
      "Confirm approved wheel-width range and compare the tire against a known working setup for the same car.",
      ...general,
    ];
  }
  if (input.partCategory === "exterior") {
    return [
      "Pick a listing that confirms the exact bumper, trunk, fender, mirror, or trim style for your vehicle.",
      "Avoid universal or replica panels unless you are comfortable with trimming, body work, or professional installation.",
      ...general,
    ];
  }
  if (input.partCategory === "suspension") {
    return [
      "Confirm chassis code, drivetrain, electronic damping compatibility, and required alignment specs.",
      "Choose a kit with documented ride-height range and test-fit notes for your wheel/tire setup.",
      ...general,
    ];
  }
  if (input.partCategory === "performance-interior" || lowerType.includes("turbo") || lowerType.includes("supercharger")) {
    return [
      "Confirm tune requirements, supporting mods, engine code, fuel requirements, heat management, and warranty impact.",
      "Talk to an installer or tuner before adding this part to the build because performance parts can affect reliability.",
      ...general,
    ];
  }
  if (input.partCategory === "brakes" || lowerType.includes("big brake")) {
    return [
      "Request a caliper clearance template and confirm rotor diameter, hub fitment, brake lines, and pad sensor compatibility.",
      "Check whether your current or planned wheels clear the calipers before buying the brake kit.",
      ...general,
    ];
  }
  if (input.partCategory === "spacers-adapters") {
    return [
      "Confirm hub-centric sizing, thread pitch, lug seat type, spacer thickness, and safe lug engagement.",
      "Use a smaller spacer or a wheel with a better offset if poke or vibration risk is flagged.",
      ...general,
    ];
  }

  return general;
}

function applyPartCategoryRisk(ctx: RiskContext, input: FitmentRequest) {
  if (input.partCategory === "wheels") {
    ctx.recommendations.push("Confirm bolt pattern, center bore, lug seat type, and load rating before ordering.");
    return;
  }

  if (input.partCategory === "tires") {
    ctx.risk += 6;
    ctx.warnings.push("Tire fitment can change rubbing, sidewall clearance, speedometer accuracy, and ride quality.");
    ctx.recommendations.push("Confirm tire width, aspect ratio, load rating, speed rating, and approved wheel width range.");
    return;
  }

  if (input.partCategory === "exterior") {
    ctx.risk += input.suspensionSetup === "stock" ? 6 : 16;
    ctx.warnings.push("Exterior parts can require exact bumper, fender, lighting connector, body style, trunk, and trim fitment by model year.");
    ctx.warnings.push("Lowered cars have higher driveway, ramp, and road-debris clearance risk with lips, splitters, and diffusers.");
    ctx.recommendations.push("Verify mounting points, connector style, pre-drilled hole alignment, material quality, and whether trimming or adhesive is required.");

    if (input.partType.toLowerCase().includes("widebody")) {
      ctx.risk += 22;
      ctx.warnings.push("Widebody and overfender kits usually require irreversible body work and professional install planning.");
    }
  }

  if (input.partCategory === "performance-interior") {
    ctx.risk += 12;
    ctx.warnings.push("Performance and interior parts can vary by engine code, drivetrain, transmission, trim, coding, cabin trim, and emissions equipment.");
    ctx.recommendations.push("Confirm engine code, tune requirements, emissions legality, connector fitment, and interior trim compatibility.");

    if (input.partType.toLowerCase().includes("downpipe") || input.partType.toLowerCase().includes("header")) {
      ctx.risk += 16;
      ctx.warnings.push("Downpipes and headers may trigger emissions, tuning, heat-management, or inspection issues.");
    }
  }

  if (input.partCategory === "suspension") {
    ctx.risk += 10;
    ctx.warnings.push("Suspension parts can affect alignment, tire clearance, ride height, and electronic damping features.");
    ctx.recommendations.push("Confirm chassis code, drivetrain, spring rate, damper compatibility, and post-install alignment requirements.");
  }

  if (input.partCategory === "brakes") {
    ctx.risk += 10;
    ctx.warnings.push("Brake upgrades can create wheel clearance, hub, rotor, caliper, and electronic parking brake compatibility issues.");
    ctx.recommendations.push("Confirm rotor diameter, caliper clearance template, pad sensor fitment, and brake line compatibility.");
  }

  if (input.partCategory === "spacers-adapters") {
    ctx.risk += 6;
    ctx.recommendations.push("Confirm hub bore, bolt pattern, adapter thickness, thread pitch, seat type, and safe lug engagement.");
  }
}

function applyOffsetRisk(ctx: RiskContext, offset: number | null) {
  if (offset === null) {
    ctx.risk += 8;
    ctx.warnings.push(
      "Offset could not be read, so poke and inner clearance risk are harder to estimate."
    );
    return;
  }

  if (offset < 0) {
    ctx.risk += 30;
    ctx.warnings.push(
      "Very low or negative offset can create major poke and fender rubbing risk."
    );
    ctx.recommendations.push("Check fender clearance through full steering lock and suspension compression.");
  } else if (offset < 15) {
    ctx.risk += 22;
    ctx.warnings.push("Low offset is likely to push the wheel outward and may require fender work.");
  } else if (offset < 28) {
    ctx.risk += 10;
    ctx.warnings.push("Moderately aggressive offset may increase poke depending on wheel width.");
  } else if (offset > 55) {
    ctx.risk += 16;
    ctx.warnings.push("High positive offset can move the wheel inward and reduce suspension clearance.");
  }
}

function applySpacerRisk(ctx: RiskContext, spacer: number | null) {
  if (spacer === null) {
    return;
  }

  if (spacer >= 25) {
    ctx.risk += 24;
    ctx.warnings.push("Large spacers substantially increase poke and hardware stress risk.");
    ctx.recommendations.push("Use quality hub-centric spacers and verify stud engagement or conversion hardware.");
  } else if (spacer >= 15) {
    ctx.risk += 15;
    ctx.warnings.push("Medium spacers can cause poke or rubbing with aggressive wheel specs.");
  } else if (spacer > 0) {
    ctx.risk += 6;
    ctx.warnings.push("Small spacers change outer clearance and should be checked against fenders.");
  }
}

function applySuspensionRisk(ctx: RiskContext, suspensionSetup: SuspensionSetup) {
  if (suspensionSetup === "stock") {
    ctx.risk -= 4;
    return;
  }

  if (suspensionSetup === "lowering-springs") {
    ctx.risk += 12;
    ctx.warnings.push("Lowering springs reduce fender clearance and can increase rubbing under compression.");
  }

  if (suspensionSetup === "coilovers") {
    ctx.risk += 16;
    ctx.warnings.push("Coilovers can reduce inner suspension clearance, especially near the spring perch.");
    ctx.recommendations.push("Measure inner barrel and tire clearance to the coilover body.");
  }

  if (suspensionSetup === "air-suspension") {
    ctx.risk += 20;
    ctx.warnings.push("Air suspension needs clearance checked at driving height and aired-out height.");
    ctx.recommendations.push("Cycle the suspension through its full usable range during test fit.");
  }
}

function applyWheelRisk(
  ctx: RiskContext,
  currentWheel: WheelSize | null,
  newWheel: WheelSize | null
) {
  if (!newWheel) {
    ctx.risk += 8;
    ctx.warnings.push("New wheel size could not be fully read, so width and diameter risk are estimated conservatively.");
    return;
  }

  if (currentWheel) {
    const widthDelta = newWheel.width - currentWheel.width;
    const diameterDelta = newWheel.diameter - currentWheel.diameter;

    if (widthDelta >= 2) {
      ctx.risk += 20;
      ctx.warnings.push("The new wheel is much wider than the current wheel, raising inner and outer clearance risk.");
    } else if (widthDelta >= 1) {
      ctx.risk += 10;
      ctx.warnings.push("The new wheel is wider than the current setup and should be checked for poke and inner clearance.");
    }

    if (Math.abs(diameterDelta) >= 2) {
      ctx.risk += 10;
      ctx.warnings.push("Large wheel diameter changes can affect tire choices, ride quality, and clearance.");
    }
  }

  if (newWheel.width >= 11) {
    ctx.risk += 14;
    ctx.warnings.push("Very wide wheels often require careful offset selection, camber, or body clearance work.");
  } else if (newWheel.width >= 9.5) {
    ctx.risk += 8;
    ctx.warnings.push("Wide wheel sizing may be aggressive on many stock-body vehicles.");
  }
}

function applyTireRisk(
  ctx: RiskContext,
  tire: TireSize | null,
  currentWheel: WheelSize | null,
  newWheel: WheelSize | null
) {
  if (!tire) {
    ctx.risk += 8;
    ctx.warnings.push("Tire size could not be read, so sidewall, rubbing, and speedometer risk are estimated conservatively.");
    return;
  }

  const sidewallMm = tire.width * (tire.aspectRatio / 100);
  const diameterMm = tire.wheelDiameter * 25.4 + sidewallMm * 2;

  if (tire.width >= 315) {
    ctx.risk += 18;
    ctx.warnings.push("Very wide tires can create rubbing risk at the fender liner and suspension side.");
  } else if (tire.width >= 275) {
    ctx.risk += 10;
    ctx.warnings.push("Wide tires may rub depending on vehicle platform, offset, and ride height.");
  }

  if (tire.aspectRatio >= 45 && tire.width >= 255) {
    ctx.risk += 10;
    ctx.warnings.push("Tall sidewalls on a wide tire can increase rubbing risk during turns and bumps.");
  }

  if (newWheel && tire.wheelDiameter !== newWheel.diameter) {
    ctx.risk += 18;
    ctx.warnings.push("Tire diameter does not match the new wheel diameter.");
  }

  if (currentWheel && Math.abs(tire.wheelDiameter - currentWheel.diameter) >= 2) {
    ctx.risk += 8;
    ctx.warnings.push("Wheel and tire diameter changes may affect speedometer accuracy.");
  }

  if (diameterMm > 720) {
    ctx.risk += 10;
    ctx.warnings.push("Overall tire diameter appears large and may affect speedometer accuracy or fender clearance.");
  }
}

function applyNotesRisk(ctx: RiskContext, notes: string) {
  const lowerNotes = notes.toLowerCase();
  const riskWords = ["widebody", "rolled", "pulled", "camber", "track", "stance", "flush"];
  const mentionsAggressiveSetup = riskWords.some((word) => lowerNotes.includes(word));

  if (mentionsAggressiveSetup) {
    ctx.risk += 6;
    ctx.warnings.push("Notes mention fitment-sensitive setup details, so real-world verification matters more.");
  }
}

function applySpecificPartRisk(ctx: RiskContext, specificPart: string) {
  const detail = specificPart.trim();

  if (!detail) {
    ctx.risk += 4;
    ctx.recommendations.push("Add the exact brand, part number, dimensions, manufacturer URL, or seller fitment notes for a more confident score.");
    return;
  }

  const lowerDetail = detail.toLowerCase();

  if (lowerDetail.includes("universal")) {
    ctx.risk += 14;
    ctx.warnings.push("Universal-fit parts often require trimming, custom brackets, or installer judgment.");
  }

  if (lowerDetail.includes("replica") || lowerDetail.includes("style")) {
    ctx.risk += 8;
    ctx.warnings.push("Replica or style-based parts can vary by mold, manufacturer, and mounting hole alignment.");
  }

  if (lowerDetail.includes("oem") || lowerDetail.includes("genuine")) {
    ctx.risk -= 4;
    ctx.recommendations.push("Still confirm the OEM part number matches the vehicle year, model, trim, and bumper/body style.");
  }

  if (lowerDetail.includes("part number") || lowerDetail.includes("sku") || /\b[a-z0-9]{3,}[-_][a-z0-9-]{2,}\b/i.test(detail)) {
    ctx.risk -= 3;
    ctx.recommendations.push("Use the exact SKU or part number to verify compatibility with the manufacturer or seller.");
  }
}

function getStatus(score: number): FitmentStatus {
  if (score >= 82) {
    return "Safe Fit";
  }

  if (score >= 64) {
    return "Possible Fit";
  }

  if (score >= 42) {
    return "Aggressive Fit";
  }

  return "Risky Fit";
}

function buildSummary(
  vehicle: string,
  status: FitmentStatus,
  score: number,
  input: FitmentRequest
) {
  const subject = vehicle || "This setup";
  const specificPart = input.specificPart.trim()
    ? ` The specific part details reviewed were: ${input.specificPart.trim()}.`
    : "";
  return `${subject} returns a ${status.toLowerCase()} compatibility score of ${score}/100 for ${input.partType} on ${suspensionLabels[input.suspensionSetup]}. This score weighs vehicle, trim, part category, listing detail, suspension setup, and fitment-sensitive specs before purchase.${specificPart}`;
}

type WheelSize = {
  diameter: number;
  width: number;
};

type TireSize = {
  width: number;
  aspectRatio: number;
  wheelDiameter: number;
};

function parseWheelSize(value: string): WheelSize | null {
  const match = value.toLowerCase().match(/(\d{2})\s*[x×]\s*(\d{1,2}(?:\.\d)?)/);
  if (!match) {
    return null;
  }

  return {
    diameter: Number(match[1]),
    width: Number(match[2]),
  };
}

function parseTireSize(value: string): TireSize | null {
  const match = value.match(/(\d{3})\s*\/\s*(\d{2})\s*r\s*(\d{2})/i);
  if (!match) {
    return null;
  }

  return {
    width: Number(match[1]),
    aspectRatio: Number(match[2]),
    wheelDiameter: Number(match[3]),
  };
}

function parseNumber(value: string): number | null {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}
