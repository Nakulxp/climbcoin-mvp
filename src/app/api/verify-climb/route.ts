import { NextRequest, NextResponse } from "next/server";
import { verifyClimbWithGemini } from "@/lib/gemini";
import { getOrCreateRoom, recordTrip } from "@/lib/store";
import { handleCorsOptions, withCors, corsHeaders } from "@/lib/cors";
import {
  DepartmentName,
  TapSource,
  TripRecord,
  TripTelemetryInput,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleCorsOptions();
}

const VALID_DEPARTMENTS = new Set<DepartmentName>([
  "Engineering",
  "Product",
  "Operations",
  "Design",
  "Finance",
]);

const VALID_TAP_SOURCES = new Set<TapSource>([
  "NFC_TAG",
  "WEB_NFC",
  "QR",
  "MANUAL",
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TripTelemetryInput>;
    const roomCode = typeof body.roomCode === "string" ? body.roomCode : "DEMO";
    const department: DepartmentName =
      body.department && VALID_DEPARTMENTS.has(body.department)
        ? body.department
        : "Engineering";

    const startFloor = Number(body.startFloor ?? 1);
    const endFloor = Number(body.endFloor ?? 4);
    const elapsedSeconds = Math.max(1, Number(body.elapsedSeconds ?? 30));
    const totalSteps = Math.max(0, Number(body.totalSteps ?? 0));
    const avgCadenceSpm = Math.max(0, Number(body.avgCadenceSpm ?? 0));
    const verticalBounceScore = Math.max(
      0,
      Number(body.verticalBounceScore ?? 0)
    );
    const elevationDeltaMeters = Number(
      body.elevationDeltaMeters ?? Math.abs(endFloor - startFloor) * 3.5
    );

    const tapSource: TapSource =
      body.tapSource && VALID_TAP_SOURCES.has(body.tapSource)
        ? body.tapSource
        : "MANUAL";

    const anchorId: string =
      typeof body.anchorId === "string" && body.anchorId.trim().length > 0
        ? body.anchorId.trim().toUpperCase().slice(0, 12)
        : `F${endFloor}`;

    const tagSerial: string | null =
      typeof body.tagSerial === "string" && body.tagSerial.trim().length > 0
        ? body.tagSerial.trim().slice(0, 64)
        : null;

    const room = getOrCreateRoom(roomCode);

    const input: TripTelemetryInput = {
      roomCode: room.roomCode,
      department,
      startFloor,
      endFloor,
      elapsedSeconds,
      totalSteps,
      avgCadenceSpm,
      verticalBounceScore,
      elevationDeltaMeters,
      anchorId,
      tapSource,
      tagSerial,
    };

    const { result, source } = await verifyClimbWithGemini(
      input,
      room.peakRush,
      room.activeClimbersPerMin
    );

    const tripRecord: TripRecord = {
      id: `trip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      department,
      startFloor,
      endFloor,
      elapsedSeconds,
      totalSteps,
      avgCadenceSpm,
      verticalBounceScore,
      elevationDeltaMeters,
      source,
      anchorId,
      tapSource,
      tagSerial,
      ...result,
    };

    recordTrip(room.roomCode, tripRecord);

    return NextResponse.json(tripRecord, {
      headers: withCors({ "Cache-Control": "no-store" }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to verify climb",
      },
      { status: 400, headers: corsHeaders }
    );
  }
}
