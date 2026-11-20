import os from "os";
import { NextResponse } from "next/server";
import { handleCorsOptions, withCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleCorsOptions();
}

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
      headers: withCors({
        "Cache-Control": "no-store, max-age=0",
      }),
    }
  );
}
