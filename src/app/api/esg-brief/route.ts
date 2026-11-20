import { NextRequest, NextResponse } from "next/server";
import { generateEsgBriefWithGemini } from "@/lib/gemini";
import { getRoomSnapshot, updateLiveTelemetry } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const roomCode = typeof body.roomCode === "string" ? body.roomCode : "DEMO";

    if (typeof body.peakRush === "boolean") {
      updateLiveTelemetry(roomCode, { peakRush: body.peakRush });
    }

    const snapshot = getRoomSnapshot(roomCode);

    const brief = await generateEsgBriefWithGemini({
      roomCode: snapshot.roomCode,
      verifiedTrips: snapshot.totals.verifiedTrips,
      rejectedTrips: snapshot.totals.rejectedTrips,
      totalFloors: snapshot.totals.totalFloors,
      totalPoints: snapshot.totals.totalPoints,
      peakRush: snapshot.peakRush,
      activeClimbersPerMin: snapshot.activeClimbersPerMin,
      departmentBreakdown: snapshot.departmentStats.map((d) => ({
        department: d.department,
        verifiedTrips: d.verifiedTrips,
        totalFloors: d.totalFloors,
      })),
    });

    return NextResponse.json(brief, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate ESG brief",
      },
      { status: 500 }
    );
  }
}
