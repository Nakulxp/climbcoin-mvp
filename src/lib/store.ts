import {
  DepartmentName,
  DepartmentStats,
  LiveSensorFrame,
  RoomState,
  TripRecord,
} from "./types";

const MAX_WAVEFORM_SAMPLES = 60;
const MAX_TRIPS = 50;
const CONNECTION_TTL_MS = 3500;

const DEPARTMENTS: DepartmentName[] = [
  "Engineering",
  "Product",
  "Operations",
  "Design",
  "Finance",
];

function createEmptyDepartmentStats(): Record<DepartmentName, DepartmentStats> {
  const stats = {} as Record<DepartmentName, DepartmentStats>;
  for (const dept of DEPARTMENTS) {
    stats[dept] = {
      department: dept,
      verifiedTrips: 0,
      rejectedTrips: 0,
      totalFloors: 0,
      totalPoints: 0,
    };
  }
  return stats;
}

function createInitialRoom(roomCode: string): RoomState {
  return {
    roomCode,
    liveFrame: {
      steps: 0,
      cadenceSpm: 0,
      verticalBounce: 0,
      movementState: "IDLE",
      activeFloor: 1,
      elapsedSec: 0,
      accelMagnitude: 0,
      updatedAt: 0,
      anchorId: "F1",
      tapSource: "MANUAL",
      tagSerial: null,
    },
    accelHistory: new Array(MAX_WAVEFORM_SAMPLES).fill(0),
    trips: [],
    departmentStats: createEmptyDepartmentStats(),
    floorTotals: {},
    peakRush: false,
    activeClimbersPerMin: 8,
    currentMultiplier: 1.0,
  };
}

export function normalizeRoomCode(code?: string | null): string {
  const cleaned = (code || "DEMO").trim().toUpperCase();
  return cleaned.length > 0 ? cleaned.slice(0, 24) : "DEMO";
}

export function computeActiveMultiplier(
  peakRush: boolean,
  activeClimbersPerMin: number
): number {
  // climbcoin-ops rule: throttle to 0.75x if stairwell exceeds 25 active climbers/min
  if (activeClimbersPerMin > 25) {
    return 0.75;
  }
  // climbcoin-ops rule: raise up to 2.5x during lift peak rush
  if (peakRush) {
    return 2.5;
  }
  return 1.0;
}

const globalForStore = globalThis as unknown as {
  __climbCoinRooms?: Map<string, RoomState>;
};

const rooms: Map<string, RoomState> =
  globalForStore.__climbCoinRooms ?? new Map<string, RoomState>();

if (!globalForStore.__climbCoinRooms) {
  globalForStore.__climbCoinRooms = rooms;
}

export function getOrCreateRoom(roomCode?: string | null): RoomState {
  const key = normalizeRoomCode(roomCode);
  let room = rooms.get(key);
  if (!room) {
    room = createInitialRoom(key);
    rooms.set(key, room);
  }
  return room;
}

export function updateLiveTelemetry(
  roomCode: string | null | undefined,
  patch: Partial<LiveSensorFrame> & {
    peakRush?: boolean;
    activeClimbersPerMin?: number;
  }
): RoomState {
  const room = getOrCreateRoom(roomCode);

  if (typeof patch.peakRush === "boolean") {
    room.peakRush = patch.peakRush;
  }
  if (typeof patch.activeClimbersPerMin === "number") {
    room.activeClimbersPerMin = Math.max(0, Math.round(patch.activeClimbersPerMin));
  }

  room.currentMultiplier = computeActiveMultiplier(
    room.peakRush,
    room.activeClimbersPerMin
  );

  const hasSensorData =
    patch.steps !== undefined ||
    patch.cadenceSpm !== undefined ||
    patch.verticalBounce !== undefined ||
    patch.movementState !== undefined ||
    patch.activeFloor !== undefined ||
    patch.elapsedSec !== undefined ||
    patch.accelMagnitude !== undefined ||
    patch.anchorId !== undefined ||
    patch.tapSource !== undefined ||
    patch.tagSerial !== undefined;

  if (hasSensorData) {
    const accel =
      typeof patch.accelMagnitude === "number" && Number.isFinite(patch.accelMagnitude)
        ? patch.accelMagnitude
        : typeof patch.verticalBounce === "number"
        ? Number((patch.verticalBounce * 3.5).toFixed(2))
        : room.liveFrame.accelMagnitude;

    room.liveFrame = {
      steps: patch.steps ?? room.liveFrame.steps,
      cadenceSpm: patch.cadenceSpm ?? room.liveFrame.cadenceSpm,
      verticalBounce: patch.verticalBounce ?? room.liveFrame.verticalBounce,
      movementState: patch.movementState ?? room.liveFrame.movementState,
      activeFloor: patch.activeFloor ?? room.liveFrame.activeFloor,
      elapsedSec: patch.elapsedSec ?? room.liveFrame.elapsedSec,
      accelMagnitude: accel,
      updatedAt: Date.now(),
      anchorId: patch.anchorId ?? room.liveFrame.anchorId,
      tapSource: patch.tapSource ?? room.liveFrame.tapSource,
      tagSerial:
        patch.tagSerial !== undefined
          ? patch.tagSerial
          : room.liveFrame.tagSerial,
    };

    room.accelHistory = [...room.accelHistory.slice(1), accel];
  }

  return room;
}

export function recordTrip(
  roomCode: string | null | undefined,
  trip: TripRecord
): RoomState {
  const room = getOrCreateRoom(roomCode);

  room.trips = [trip, ...room.trips].slice(0, MAX_TRIPS);

  const deptStat =
    room.departmentStats[trip.department] ?? room.departmentStats.Engineering;

  const floorsClimbed = Math.max(0, Math.abs(trip.endFloor - trip.startFloor));

  if (trip.verdict === "VERIFIED_CLIMB") {
    deptStat.verifiedTrips += 1;
    deptStat.totalFloors += floorsClimbed;
    deptStat.totalPoints += trip.pointsAwarded;
    room.floorTotals[trip.endFloor] =
      (room.floorTotals[trip.endFloor] ?? 0) + floorsClimbed;
  } else {
    deptStat.rejectedTrips += 1;
  }

  return room;
}

export function getRoomSnapshot(roomCode?: string | null) {
  const room = getOrCreateRoom(roomCode);
  const now = Date.now();
  const phoneConnected =
    room.liveFrame.updatedAt > 0 &&
    now - room.liveFrame.updatedAt <= CONNECTION_TTL_MS;

  const totals = Object.values(room.departmentStats).reduce(
    (acc, d) => {
      acc.verifiedTrips += d.verifiedTrips;
      acc.rejectedTrips += d.rejectedTrips;
      acc.totalFloors += d.totalFloors;
      acc.totalPoints += d.totalPoints;
      return acc;
    },
    { verifiedTrips: 0, rejectedTrips: 0, totalFloors: 0, totalPoints: 0 }
  );

  return {
    roomCode: room.roomCode,
    phoneConnected,
    lastSeenMsAgo:
      room.liveFrame.updatedAt > 0 ? now - room.liveFrame.updatedAt : null,
    liveFrame: room.liveFrame,
    accelHistory: room.accelHistory,
    trips: room.trips,
    departmentStats: Object.values(room.departmentStats),
    floorTotals: room.floorTotals,
    totals,
    peakRush: room.peakRush,
    activeClimbersPerMin: room.activeClimbersPerMin,
    currentMultiplier: room.currentMultiplier,
  };
}
