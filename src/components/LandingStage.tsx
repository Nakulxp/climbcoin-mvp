"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ClimbWordmark } from "@/components/ClimbMark";
import { apiUrl } from "@/lib/api-client";

export function LandingStage() {
  const [roomCode, setRoomCode] = useState("DEMO");
  const [baseOrigin, setBaseOrigin] = useState("http://localhost:3000");
  const [lanIp, setLanIp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initOrigin = async () => {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const portSuffix = window.location.port ? `:${window.location.port}` : "";

      let resolvedOrigin = window.location.origin;
      try {
        const res = await fetch(apiUrl("/api/network-info"), { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { lanIp?: string | null };
          if (!cancelled && data.lanIp) {
            setLanIp(data.lanIp);
            if (hostname === "localhost" || hostname === "127.0.0.1") {
              resolvedOrigin = `${protocol}//${data.lanIp}${portSuffix}`;
            }
          }
        }
      } catch {
        // Fallback to window.location.origin if network info is unavailable
      }

      if (!cancelled) {
        setBaseOrigin(resolvedOrigin);
      }
    };

    void initOrigin();
    return () => {
      cancelled = true;
    };
  }, []);

  const cleanRoom = roomCode.trim().toUpperCase() || "DEMO";

  const mobileUrl = useMemo(() => {
    const trimmedBase = baseOrigin.trim().replace(/\/+$/, "");
    const safeBase = trimmedBase || "http://localhost:3000";
    return `${safeBase}/mobile?room=${encodeURIComponent(cleanRoom)}`;
  }, [baseOrigin, cleanRoom]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable in non-HTTPS contexts
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-8 lg:py-12">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1B2320] pb-5">
        <ClimbWordmark subtitle="VERIFIED MOVEMENT ENGINE" />

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 rounded border border-[#232B28] bg-[#131816] px-3 py-1.5">
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#879490]">
              Stage Room
            </span>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="font-mono-tech w-20 bg-transparent text-xs font-bold text-[#00E39D] outline-none"
            />
          </label>
          <span className="font-mono-tech hidden items-center gap-2 rounded border border-[#232B28] bg-[#131816] px-3 py-1.5 text-[11px] text-[#B4C0BB] sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-[#00E39D]" />
            GEMINI 3.6 FLASH READY
          </span>
        </div>
      </header>

      {/* Hero + Stage Switcher Cards */}
      <section className="my-auto py-8">
        <p className="eyebrow mb-4">
          Verified movement, anchored to your building
        </p>

        <h1 className="font-display mb-4 max-w-3xl text-3xl font-extrabold leading-[1.06] tracking-[-0.028em] text-[#E9EFEC] sm:text-5xl">
          Live Stage Switcher{" "}
          <span className="text-[#00E39D]">— ClimbCoin Tower Engine.</span>
        </h1>

        <p className="mb-8 max-w-2xl text-base leading-relaxed text-[#B4C0BB]">
          Launch the Facilities Command Center on the presentation screen and scan
          the QR code on a phone to stream real-time motion telemetry into room{" "}
          <code className="font-mono-tech rounded border border-[#232B28] bg-[#131816] px-1.5 py-0.5 text-xs font-bold text-[#00E39D]">
            {cleanRoom}
          </code>
          .
        </p>

        {/* Two Large Stage Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: Mobile Climber + Scannable QR Code */}
          <div className="flex flex-col justify-between rounded-lg border border-[#232B28] bg-[#131816] p-6 transition hover:border-[#00E39D]/70">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="font-mono-tech mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#00E39D]">
                  01 · Phone Edge Node
                </div>
                <h2 className="font-display mb-2 text-2xl font-bold tracking-tight text-[#E9EFEC]">
                  Mobile Climber App
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-[#B4C0BB]">
                  Live accelerometer cadence ring, floor progress bar, 3-signal
                  tap-in/out verification, points wallet, and stage backup
                  simulator.
                </p>

                <Link
                  href={`/mobile?room=${encodeURIComponent(cleanRoom)}`}
                  className="font-display inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#00E39D] px-5 py-3.5 text-sm font-bold text-[#052018] transition hover:-translate-y-0.5 hover:bg-[#2BF0B2] sm:w-auto"
                >
                  Open Mobile Climber →
                </Link>
              </div>

              {/* Scannable QR Code Frame */}
              <div className="flex shrink-0 flex-col items-center self-center sm:self-start">
                <div className="rounded-lg border border-[#232B28] bg-[#E9EFEC] p-2.5 shadow-sm">
                  <QRCodeSVG
                    value={mobileUrl}
                    size={164}
                    bgColor="#E9EFEC"
                    fgColor="#0A0D0C"
                    level="M"
                  />
                </div>
                <span className="font-mono-tech mt-2 text-[10px] uppercase tracking-[0.12em] text-[#879490]">
                  Scan on Phone Camera
                </span>
              </div>
            </div>

            {/* Editable Tunnel/LAN Base URL */}
            <div className="mt-6 border-t border-[#1B2320] pt-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#879490]">
                  Scannable URL {lanIp ? `(LAN ${lanIp})` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="font-mono-tech text-[10px] font-semibold uppercase tracking-wider text-[#00E39D] hover:underline"
                >
                  {copied ? "Copied ✓" : "Copy URL"}
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  aria-label="Mobile base origin URL"
                  value={baseOrigin}
                  onChange={(e) => setBaseOrigin(e.target.value)}
                  className="font-mono-tech w-full rounded border border-[#232B28] bg-[#0A0D0C] px-2.5 py-1.5 text-xs text-[#E9EFEC] outline-none focus:border-[#00E39D]"
                />
              </div>
              <div className="font-mono-tech mt-1.5 truncate text-[11px] text-[#00E39D]">
                {mobileUrl}
              </div>
            </div>
          </div>

          {/* Card 2: Facilities & ESG Command Center */}
          <div
            className="flex flex-col justify-between rounded-lg border border-[#232B28] bg-[#131816] p-6 transition hover:border-[#8B6FFF]/80"
            style={{
              backgroundImage:
                "linear-gradient(155deg, rgba(139,111,255,0.07), rgba(0,227,157,0.03) 45%, transparent 75%)",
            }}
          >
            <div>
              <div className="font-mono-tech mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8B6FFF]">
                02 · Laptop Stage Screen
              </div>
              <h2 className="font-display mb-2 text-2xl font-bold tracking-tight text-[#E9EFEC]">
                Facilities &amp; ESG Command Center
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-[#B4C0BB]">
                Executive building telemetry synced every 500ms: real-time
                acceleration waveform, Gemini 3.6 Flash anti-cheat verdicts,
                anonymized department standings, and dynamic demand-shaping.
              </p>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-3">
                  <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                    Anti-Cheat Guard
                  </div>
                  <div className="font-display mt-1 text-sm font-bold text-[#E9EFEC]">
                    3-Signal Gemini Audit
                  </div>
                </div>
                <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-3">
                  <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                    Demand Shaping
                  </div>
                  <div className="font-display mt-1 text-sm font-bold text-[#00E39D]">
                    0.75x – 2.5x Multipliers
                  </div>
                </div>
                <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-3">
                  <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                    Privacy Boundary
                  </div>
                  <div className="font-display mt-1 text-sm font-bold text-[#E9EFEC]">
                    Dept &amp; Floor Totals Only
                  </div>
                </div>
                <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-3">
                  <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                    ESG Reporting
                  </div>
                  <div className="font-display mt-1 text-sm font-bold text-[#8B6FFF]">
                    kWh &amp; Lift Wait Relief
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1B2320] pt-4">
              <Link
                href={`/dashboard?room=${encodeURIComponent(cleanRoom)}`}
                className="font-display inline-flex w-full items-center justify-center gap-2 rounded-[4px] border border-[#8B6FFF] bg-[#2E2456] px-5 py-3.5 text-sm font-bold text-[#E9EFEC] transition hover:-translate-y-0.5 hover:bg-[#3A2D6B]"
              >
                Open Facilities Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Compact 3-Signal Spec Footer */}
      <footer className="border-t border-[#1B2320] pt-5">
        <div className="font-mono-tech flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#879490]">
          <span>
            <strong className="text-[#00E39D]">SIGNAL 01</strong> Elevation
            ~3.5m/floor
          </span>
          <span>
            <strong className="text-[#00E39D]">SIGNAL 02</strong> Cadence ≥ 55
            spm &amp; Bounce ≥ 0.35
          </span>
          <span>
            <strong className="text-[#00E39D]">SIGNAL 03</strong> Plausibility
            6–45s/floor
          </span>
        </div>
      </footer>
    </main>
  );
}
