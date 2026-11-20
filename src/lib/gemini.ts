import { GoogleGenAI, Type } from "@google/genai";
import {
  EsgBriefResult,
  TripTelemetryInput,
  VerificationResult,
} from "./types";

export const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_TIMEOUT_MS = 2500;

let cachedAiClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Gemini timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  if (!cachedAiClient || cachedApiKey !== apiKey) {
    cachedAiClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }
  return cachedAiClient;
}

export function evaluateTripDeterministic(
  input: TripTelemetryInput,
  peakRush: boolean,
  activeClimbersPerMin: number
): VerificationResult {
  const floors = Math.max(1, Math.abs(input.endFloor - input.startFloor));
  const expectedElevation = floors * 3.5;
  const elevationError = Math.abs(input.elevationDeltaMeters - expectedElevation);
  const elevationPass = elevationError <= Math.max(2.0, expectedElevation * 0.3);

  const cadencePass =
    input.avgCadenceSpm >= 55 && input.verticalBounceScore >= 0.35;

  const secPerFloor = input.elapsedSeconds / floors;
  const plausibilityPass = secPerFloor >= 6 && secPerFloor <= 45;

  const suggestedMultiplier =
    activeClimbersPerMin > 25 ? 0.75 : peakRush ? 2.5 : 1.0;

  if (!cadencePass) {
    return {
      verdict: "LIFT_SPOOF",
      confidence: 96,
      pointsAwarded: 0,
      signals: { elevationPass, cadencePass, plausibilityPass },
      reasoning: `Cadence (${input.avgCadenceSpm} spm) and vertical bounce (${input.verticalBounceScore.toFixed(
        2
      )}) fall below stair-climbing thresholds, indicating a stationary lift ride.`,
      suggestedMultiplier,
    };
  }

  if (!plausibilityPass) {
    return {
      verdict: "SPEED_ANOMALY",
      confidence: 92,
      pointsAwarded: 0,
      signals: { elevationPass, cadencePass, plausibilityPass },
      reasoning: `Elapsed time (${input.elapsedSeconds}s for ${floors} floors, ${secPerFloor.toFixed(
        1
      )}s/floor) falls outside the 6–45s/floor human stair-climbing range.`,
      suggestedMultiplier,
    };
  }

  if (!elevationPass) {
    return {
      verdict: "SPEED_ANOMALY",
      confidence: 88,
      pointsAwarded: 0,
      signals: { elevationPass, cadencePass, plausibilityPass },
      reasoning: `Barometric elevation delta (${input.elevationDeltaMeters.toFixed(
        1
      )}m) does not match the expected ~${expectedElevation.toFixed(
        1
      )}m across ${floors} floors.`,
      suggestedMultiplier,
    };
  }

  const basePoints = floors * 10;
  const pointsAwarded = Math.round(basePoints * suggestedMultiplier);

  return {
    verdict: "VERIFIED_CLIMB",
    confidence: 97,
    pointsAwarded,
    signals: { elevationPass, cadencePass, plausibilityPass },
    reasoning: `Verified ${floors}-floor climb with ${input.elevationDeltaMeters.toFixed(
      1
    )}m elevation gain, ${input.avgCadenceSpm} spm cadence, and plausible ${input.elapsedSeconds}s duration.`,
    suggestedMultiplier,
  };
}

export async function verifyClimbWithGemini(
  input: TripTelemetryInput,
  peakRush: boolean,
  activeClimbersPerMin: number
): Promise<{ result: VerificationResult; source: "gemini" | "fallback" }> {
  const ai = getClient();
  if (!ai) {
    return {
      result: evaluateTripDeterministic(input, peakRush, activeClimbersPerMin),
      source: "fallback",
    };
  }

  const systemInstruction = `You are the ClimbCoin Verification & Operations Engine for a commercial office tower.
You receive trip telemetry from a stairwell door tap-in/tap-out and mobile motion sensors:
- startFloor, endFloor, elapsedSeconds, totalSteps, avgCadenceSpm, verticalBounceScore, elevationDeltaMeters.

Evaluate 3 independent signals strictly per ClimbCoin Ops rules:
1. elevationPass: true if elevationDeltaMeters matches floor difference (~3.5m/floor)
2. cadencePass: true if avgCadenceSpm >= 55 AND verticalBounceScore >= 0.35 (a stationary lift ride has near-zero cadence/bounce)
3. plausibilityPass: true if elapsedSeconds is realistic for human stair climbing (roughly 6-45 seconds per floor)

Verdict rules:
- If cadencePass is false -> verdict MUST be "LIFT_SPOOF" and pointsAwarded MUST be 0.
- Else if plausibilityPass is false or elevationPass is false -> verdict MUST be "SPEED_ANOMALY" and pointsAwarded MUST be 0.
- Else -> verdict MUST be "VERIFIED_CLIMB", pointsAwarded = round(abs(endFloor - startFloor) * 10 * suggestedMultiplier).

Demand-shaping multiplier rules:
- If activeClimbersPerMin > 25 -> suggestedMultiplier = 0.75 (congestion throttle).
- Else if peakRush is true -> suggestedMultiplier = 2.5 (lift peak rush incentive).
- Else -> suggestedMultiplier = 1.0.

Privacy rule: Never mention or invent individual employee names.
Return ONLY valid JSON matching the schema.`;

  const prompt = JSON.stringify({
    telemetry: {
      startFloor: input.startFloor,
      endFloor: input.endFloor,
      elapsedSeconds: input.elapsedSeconds,
      totalSteps: input.totalSteps,
      avgCadenceSpm: input.avgCadenceSpm,
      verticalBounceScore: input.verticalBounceScore,
      elevationDeltaMeters: input.elevationDeltaMeters,
    },
    buildingContext: {
      peakRush,
      activeClimbersPerMin,
    },
  });

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
          maxOutputTokens: 256,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                enum: ["VERIFIED_CLIMB", "LIFT_SPOOF", "SPEED_ANOMALY"],
              },
              confidence: { type: Type.NUMBER },
              pointsAwarded: { type: Type.NUMBER },
              signals: {
                type: Type.OBJECT,
                properties: {
                  elevationPass: { type: Type.BOOLEAN },
                  cadencePass: { type: Type.BOOLEAN },
                  plausibilityPass: { type: Type.BOOLEAN },
                },
                required: ["elevationPass", "cadencePass", "plausibilityPass"],
              },
              reasoning: { type: Type.STRING },
              suggestedMultiplier: { type: Type.NUMBER },
            },
            required: [
              "verdict",
              "confidence",
              "pointsAwarded",
              "signals",
              "reasoning",
              "suggestedMultiplier",
            ],
          },
        },
      }),
      GEMINI_TIMEOUT_MS
    );

    const text = response.text;
    if (!text) {
      throw new Error("Empty Gemini response");
    }
    const parsed = JSON.parse(text) as VerificationResult;
    return { result: parsed, source: "gemini" };
  } catch (err) {
    console.error("[verifyClimbWithGemini] Falling back to deterministic engine:", err);
    return {
      result: evaluateTripDeterministic(input, peakRush, activeClimbersPerMin),
      source: "fallback",
    };
  }
}

export async function generateEsgBriefWithGemini(params: {
  roomCode: string;
  verifiedTrips: number;
  rejectedTrips: number;
  totalFloors: number;
  totalPoints: number;
  peakRush: boolean;
  activeClimbersPerMin: number;
  departmentBreakdown: Array<{
    department: string;
    verifiedTrips: number;
    totalFloors: number;
  }>;
}): Promise<EsgBriefResult> {
  const estKwhSaved = Number((params.totalFloors * 0.042 + 0.15).toFixed(2));
  const liftWaitHoursSaved = Number(
    ((params.verifiedTrips * 38) / 3600 + (params.peakRush ? 0.35 : 0.05)).toFixed(2)
  );

  const fallback: EsgBriefResult = {
    executiveSummary: `${params.verifiedTrips} verified climbs (${params.totalFloors} floors) diverted vertical traffic from elevators while blocking ${params.rejectedTrips} spoofed attempts; ${
      params.peakRush
        ? "Peak Rush demand-shaping is active at 2.5x to relieve lobby lift queues."
        : "Standard off-peak 1.0x multipliers are maintaining balanced stairwell flow."
    }`,
    liftWaitHoursSaved,
    estKwhSaved,
    recommendedMultipliers: {
      morningPeak: params.peakRush ? 2.5 : 2.0,
      middayOffPeak: 1.0,
      eveningRush: 2.25,
      congestionThrottle: 0.75,
    },
    source: "fallback",
  };

  const ai = getClient();
  if (!ai) {
    return fallback;
  }

  const systemInstruction = `You are the ClimbCoin ESG & Building Operations Analyst for a commercial office tower.
Generate an executive sustainability and vertical-traffic brief strictly from aggregated building telemetry.
Privacy rule: NEVER include or invent individual employee names—only reference department and floor aggregates.
Demand-shaping rules:
- Lift peak rush multipliers may rise up to 2.5x.
- Stairwell congestion throttle MUST be 0.75x if traffic exceeds 25 active climbers/min.
Return ONLY valid JSON matching the schema.`;

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: JSON.stringify(params),
        config: {
          systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 320,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              liftWaitHoursSaved: { type: Type.NUMBER },
              estKwhSaved: { type: Type.NUMBER },
              recommendedMultipliers: {
                type: Type.OBJECT,
                properties: {
                  morningPeak: { type: Type.NUMBER },
                  middayOffPeak: { type: Type.NUMBER },
                  eveningRush: { type: Type.NUMBER },
                  congestionThrottle: { type: Type.NUMBER },
                },
                required: [
                  "morningPeak",
                  "middayOffPeak",
                  "eveningRush",
                  "congestionThrottle",
                ],
              },
            },
            required: [
              "executiveSummary",
              "liftWaitHoursSaved",
              "estKwhSaved",
              "recommendedMultipliers",
            ],
          },
        },
      }),
      5000
    );

    const text = response.text;
    if (!text) {
      throw new Error("Empty Gemini ESG response");
    }
    const parsed = JSON.parse(text) as EsgBriefResult;
    return { ...parsed, source: "gemini" };
  } catch (err) {
    console.error("[generateEsgBriefWithGemini] Falling back:", err);
    return fallback;
  }
}
