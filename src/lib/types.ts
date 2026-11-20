export type MovementState =
  | "IDLE"
  | "WALKING"
  | "STAIR_CLIMBING"
  | "STATIONARY_LIFT";

export type ClimbVerdict = "VERIFIED_CLIMB" | "LIFT_SPOOF" | "SPEED_ANOMALY";

export type DepartmentName =
  | "Engineering"
  | "Product"
  | "Operations"
  | "Design"
  | "Finance";

export type TapSource = "NFC_TAG" | "WEB_NFC" | "QR" | "MANUAL";

export interface LiveSensorFrame {
  steps: number;
  cadenceSpm: number;
  verticalBounce: number;
  movementState: MovementState;
  activeFloor: number;
  elapsedSec: number;
  accelMagnitude: number;
  updatedAt: number;
  anchorId?: string;
  tapSource?: TapSource;
  tagSerial?: string | null;
}

export interface TripTelemetryInput {
  roomCode?: string;
  department?: DepartmentName;
  startFloor: number;
  endFloor: number;
  elapsedSeconds: number;
  totalSteps: number;
  avgCadenceSpm: number;
  verticalBounceScore: number;
  elevationDeltaMeters: number;
  simulated?: boolean;
  anchorId?: string;
  tapSource?: TapSource;
  tagSerial?: string | null;
}

export interface VerificationSignals {
  elevationPass: boolean;
  cadencePass: boolean;
  plausibilityPass: boolean;
}

export interface VerificationResult {
  verdict: ClimbVerdict;
  confidence: number;
  pointsAwarded: number;
  signals: VerificationSignals;
  reasoning: string;
  suggestedMultiplier: number;
}

export interface TripRecord extends VerificationResult {
  id: string;
  timestamp: string;
  department: DepartmentName;
  startFloor: number;
  endFloor: number;
  elapsedSeconds: number;
  totalSteps: number;
  avgCadenceSpm: number;
  verticalBounceScore: number;
  elevationDeltaMeters: number;
  source: "gemini" | "fallback";
  anchorId?: string;
  tapSource: TapSource;
  tagSerial?: string | null;
}

export interface DepartmentStats {
  department: DepartmentName;
  verifiedTrips: number;
  rejectedTrips: number;
  totalFloors: number;
  totalPoints: number;
}

export interface EsgBriefResult {
  executiveSummary: string;
  liftWaitHoursSaved: number;
  estKwhSaved: number;
  recommendedMultipliers: {
    morningPeak: number;
    middayOffPeak: number;
    eveningRush: number;
    congestionThrottle: number;
  };
  source?: "gemini" | "fallback";
}

export interface RoomState {
  roomCode: string;
  liveFrame: LiveSensorFrame;
  accelHistory: number[];
  trips: TripRecord[];
  departmentStats: Record<DepartmentName, DepartmentStats>;
  floorTotals: Record<number, number>;
  peakRush: boolean;
  activeClimbersPerMin: number;
  currentMultiplier: number;
}
