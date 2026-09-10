// Demo irrigation decision engine for AquaCrop Phase 1.
// This is a transparent rule-based model, not a calibrated agricultural model.

const CROP_FACTORS = {
  Tomato: 1.00,
  Rice: 1.20,
  Chilli: 0.95,
  Cotton: 1.05,
  Groundnut: 0.90,
  Maize: 1.00,
  Vegetables: 0.95,
};

const STAGE_FACTORS = {
  Seedling: 0.70,
  Vegetative: 0.90,
  Flowering: 1.10,
  Fruiting: 1.15,
  Harvesting: 0.80,
};

export function calculateIrrigation(field = {}) {
  const acres = Math.max(0.1, Number(field.acres) || 1);
  const soil = Math.min(100, Math.max(0, Number(field.soil) || 0));
  const temperature = Number(field.temperature) || 25;
  const rainfall = Math.max(0, Number(field.rainfall) || 0);
  const water = field.water || "Good";
  const cropFactor = CROP_FACTORS[field.crop] || 1;
  const stageFactor = STAGE_FACTORS[field.stage] || 1;

  // Rainfall can postpone irrigation when enough rain has occurred.
  if (rainfall >= 10) {
    return {
      required: false,
      priority: "LOW",
      priorityClass: "low",
      waterLiters: 0,
      durationMinutes: 0,
      bestTime: "Monitor",
      title: "Irrigation Can Be Delayed",
      summary: `Recent rainfall of ${rainfall} mm is enough to postpone irrigation for now.`,
      reasons: [
        `Rainfall is ${rainfall} mm`,
        "Avoiding unnecessary irrigation saves water",
        `Soil moisture is currently ${soil}%`,
      ],
    };
  }

  if (soil >= 45) {
    return {
      required: false,
      priority: "LOW",
      priorityClass: "low",
      waterLiters: 0,
      durationMinutes: 0,
      bestTime: "Monitor",
      title: "No Irrigation Required",
      summary: `Soil moisture is ${soil}%, which is currently adequate for the demo decision.`,
      reasons: [
        `Soil moisture is ${soil}%`,
        rainfall > 0 ? `Rainfall recorded: ${rainfall} mm` : "No significant rainfall",
        "Wait and monitor before adding more water",
      ],
    };
  }

  // Water requirement is based on area + moisture deficit + crop/stage factors.
  // 225 L/acre is a demo base amount at 30% soil moisture.
  const moistureDeficit = Math.max(0, 40 - soil);
  let liters = acres * 225 * (moistureDeficit / 10) * cropFactor * stageFactor;

  if (temperature >= 35) liters *= 1.12;
  else if (temperature >= 32) liters *= 1.06;

  if (rainfall > 0 && rainfall < 10) liters *= 0.85;

  // Limited water: recommend a smaller operational amount.
  if (water === "Limited") liters *= 0.80;
  if (water === "Very Limited") liters *= 0.65;

  liters = Math.round(Math.max(80, liters) / 10) * 10;

  // Demo pump flow assumption: 25 L/min/acre.
  const flowPerAcre = 25;
  const durationMinutes = Math.max(5, Math.round(liters / (flowPerAcre * acres)));

  let priority = "MEDIUM";
  let priorityClass = "medium";

  if (soil <= 20 || temperature >= 37) {
    priority = "HIGH";
    priorityClass = "high";
  } else if (soil <= 30 || temperature >= 34) {
    priority = "HIGH";
    priorityClass = "high";
  }

  if (water === "Very Limited" && priority === "HIGH") {
    priority = "HIGH";
    priorityClass = "high";
  }

  const bestTime = temperature >= 32 ? "6:00 AM" : "6:00–8:00 AM";

  const reasons = [
    `Soil moisture is ${soil}%`,
    `Temperature is ${temperature}°C`,
    rainfall > 0 ? `Rainfall is ${rainfall} mm` : "No significant rainfall detected",
    field.crop ? `${field.crop} is in ${field.stage || "current"} stage` : "Crop/stage factor applied",
  ];

  return {
    required: true,
    priority,
    priorityClass,
    waterLiters: liters,
    durationMinutes,
    bestTime,
    title: "Irrigation Required",
    summary: `The field needs approximately ${liters} L of water for about ${durationMinutes} minutes.`,
    reasons,
  };
}
