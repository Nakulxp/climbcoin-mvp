import os from "os";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function findLanIpv4(): string | null {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (
        entry.family === "IPv4" &&
        !entry.internal &&
        !entry.address.startsWith("169.254.")
      ) {
        return entry.address;
      }
    }
  }
  return null;
}

export async function GET() {
  return NextResponse.json(
    { lanIp: findLanIpv4() },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
