import { NextRequest, NextResponse } from "next/server";
import { getRoomSnapshot, updateLiveTelemetry } from "@/lib/store";
import { MovementState, TapSource } from "@/lib/types";
import { handleCorsOptions, withCors, corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleCorsOptions();
}

const VALID_STATES = new Set<MovementState>([
  "IDLE",
  "WALKING",
  "STAIR_CLIMBING",
  "STATIONARY_LIFT",
]);

const VALID_TAP_SOURCES = new Set<TapSource>([
  "NFC_TAG",
  "WEB_NFC",
  "QR",
  "MANUAL",
]);

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get("room") ?? "DEMO";
  const snapshot = getRoomSnapshot(room);

  return NextResponse.json(snapshot, {
    headers: withCors({
      "Cache-Control": "no-store, max-age=0",
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomCode = typeof body.roomCode === "string" ? body.roomCode : "DEMO";

    const movementState: MovementState | undefined = VALID_STATES.has(
      body.movementState
    )
      ? body.movementState
      : undefined;

    const tapSource: TapSource | undefined = VALID_TAP_SOURCES.has(
      body.tapSource
    )
      ? body.tapSource
      : undefined;

    const anchorId: string | undefined =
      typeof body.anchorId === "string" && body.anchorId.trim().length > 0
        ? body.anchorId.trim().toUpperCase().slice(0, 12)
        : undefined;

    const tagSerial: string | null | undefined =
      body.tagSerial === null
        ? null
        : typeof body.tagSerial === "string"
        ? body.tagSerial.trim().slice(0, 64)
        : undefined;

    const room = updateLiveTelemetry(roomCode, {
      steps: typeof body.steps === "number" ? body.steps : undefined,
      cadenceSpm:
        typeof body.cadenceSpm === "number" ? body.cadenceSpm : undefined,
      verticalBounce:
        typeof body.verticalBounce === "number"
          ? body.verticalBounce
          : undefined,
      movementState,
      activeFloor:
        typeof body.activeFloor === "number" ? body.activeFloor : undefined,
      elapsedSec:
        typeof body.elapsedSec === "number" ? body.elapsedSec : undefined,
      accelMagnitude:
        typeof body.accelMagnitude === "number"
          ? body.accelMagnitude
          : undefined,
      peakRush:
        typeof body.peakRush === "boolean" ? body.peakRush : undefined,
      activeClimbersPerMin:
        typeof body.activeClimbersPerMin === "number"
          ? body.activeClimbersPerMin
          : undefined,
      anchorId,
      tapSource,
      tagSerial,
    });

    return NextResponse.json(
      {
        ok: true,
        roomCode: room.roomCode,
        peakRush: room.peakRush,
        activeClimbersPerMin: room.activeClimbersPerMin,
        currentMultiplier: room.currentMultiplier,
        anchorId: room.liveFrame.anchorId,
        tapSource: room.liveFrame.tapSource,
      },
      { headers: withCors({ "Cache-Control": "no-store" }) }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Invalid telemetry payload",
      },
      { status: 400, headers: corsHeaders }
    );
  }
}
