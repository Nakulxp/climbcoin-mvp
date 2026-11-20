"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { ClimbLogoSvg, ClimbWordmark } from "@/components/ClimbMark";
import { HrAdminDashboard } from "@/components/HrAdminDashboard";
import {
  DepartmentStats,
  EsgBriefResult,
  LiveSensorFrame,
  MovementState,
  TapSource,
  TripRecord,
} from "@/lib/types";

interface TelemetrySnapshot {
  roomCode: string;
  phoneConnected: boolean;
  lastSeenMsAgo: number | null;
  liveFrame: LiveSensorFrame;
  accelHistory: number[];
  trips: TripRecord[];
  departmentStats: DepartmentStats[];
  floorTotals: Record<number, number>;
  totals: {
    verifiedTrips: number;
    rejectedTrips: number;
    totalFloors: number;
    totalPoints: number;
  };
  peakRush: boolean;
  activeClimbersPerMin: number;
  currentMultiplier: number;
}

function getTapSourceBadge(tapSource?: TapSource): {
  label: string;
  className: string;
} {
  if (tapSource === "NFC_TAG" || tapSource === "WEB_NFC") {
    return {
      label: tapSource === "WEB_NFC" ? "WEB NFC VERIFIED" : "NFC VERIFIED",
      className:
        "border-[#8B6FFF]/70 bg-[#2E2456]/80 text-[#E9EFEC]",
    };
  }
  if (tapSource === "QR") {
    return {
      label: "QR ANCHOR",
      className: "border-[#0B5F45] bg-[#0B5F45]/40 text-[#00E39D]",
    };
  }
  return {
    label: "MANUAL",
    className: "border-[#232B28] bg-[#1A211E] text-[#879490]",
  };
}

function WhoopKpiRingCard({
  label,
  value,
  unit,
  subtext,
  ratio,
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  subtext: string;
  ratio: number;
  accent: string;
}) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0.06, ratio));
  const offset = c * (1 - pct);

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl border border-[#232B28] bg-[#131816] p-4 transition hover:border-[#232B28]/80"
      style={{
        backgroundImage: `radial-gradient(circle at 100% 0%, ${accent}14, transparent 58%)`,
      }}
    >
      <div className="min-w-0">
        <div className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#879490]">
          {label}
        </div>
        <div
          className="font-display mt-1.5 flex items-baseline gap-1 text-3xl font-extrabold leading-none sm:text-[32px]"
          style={{ color: accent }}
        >
          <span className="font-mono-tech">{value}</span>
          {unit && (
            <span className="font-mono-tech text-xs font-medium text-[#B4C0BB]">
              {unit}
            </span>
          )}
        </div>
        <div className="font-mono-tech mt-1.5 truncate text-[10.5px] text-[#879490]">
          {subtext}
        </div>
      </div>

      <div className="relative flex h-[60px] w-[60px] shrink-0 items-center justify-center">
        <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90">
          <circle
            cx="30"
            cy="30"
            r={r}
            fill="none"
            stroke="#1A211E"
            strokeWidth="5.5"
          />
          <circle
            cx="30"
            cy="30"
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <span
          className="font-mono-tech absolute text-[10px] font-bold"
          style={{ color: accent }}
        >
          {Math.round(pct * 100)}%
        </span>
      </div>
    </div>
  );
}

function AccelWaveform({
  samples,
  isSpoofWarning,
}: {
  samples: number[];
  isSpoofWarning: boolean;
}) {
  const gradId = useId();
  const width = 640;
  const height = 160;
  const maxVal = 4.0;
  const strokeColor = isSpoofWarning ? "#F2A93B" : "#00E39D";

  const { linePoints, areaPoints, lastPoint } = useMemo(() => {
    const safeSamples = samples.length > 1 ? samples : [0, 0];
    const stepX = width / (safeSamples.length - 1);
    const coords = safeSamples.map((v, idx) => {
      const clamped = Math.max(0, Math.min(maxVal, v));
      const x = Number((idx * stepX).toFixed(1));
      const y = Number(
        (height - 14 - (clamped / maxVal) * (height - 28)).toFixed(1)
      );
      return { x, y };
    });

    const pts = coords.map((c) => `${c.x},${c.y}`).join(" ");
    const area = `0,${height} ${pts} ${width},${height}`;
    const last = coords[coords.length - 1] ?? { x: width, y: height - 14 };

    return { linePoints: pts, areaPoints: area, lastPoint: last };
  }, [samples]);

  // Step-peak threshold line (1.15 m/s^2)
  const thresholdY = Number(
    (height - 14 - (1.15 / maxVal) * (height - 28)).toFixed(1)
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-44 w-full rounded border border-[#1B2320] bg-[#0A0D0C]"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Reference grid lines */}
      <line
        x1="0"
        y1="36"
        x2={width}
        y2="36"
        stroke="#1B2320"
        strokeDasharray="4 4"
      />
      <line
        x1="0"
        y1="76"
        x2={width}
        y2="76"
        stroke="#1B2320"
        strokeDasharray="4 4"
      />
      <line
        x1="0"
        y1="116"
        x2={width}
        y2="116"
        stroke="#1B2320"
        strokeDasharray="4 4"
      />

      {/* Step Peak Detection Threshold (1.9 m/s^2) */}
      <line
        x1="0"
        y1={thresholdY}
        x2={width}
        y2={thresholdY}
        stroke="#8B6FFF"
        strokeOpacity="0.45"
        strokeDasharray="5 4"
      />

      {/* Gradient area fill */}
      <polygon points={areaPoints} fill={`url(#${gradId})`} />

      {/* Acceleration trace */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={linePoints}
      />

      {/* Rightmost live pulse dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="5"
        fill={strokeColor}
        fillOpacity="0.25"
      />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={strokeColor} />
    </svg>
  );
}

function formatClock(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function DashboardPage() {
  const [devMode, setDevMode] = useState(false);
  const [roomCode, setRoomCode] = useState("DEMO");
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [esgBrief, setEsgBrief] = useState<EsgBriefResult | null>(null);
  const [esgGeneratedAt, setEsgGeneratedAt] = useState<string | null>(null);
  const [loadingEsg, setLoadingEsg] = useState(false);
  const [nowClock, setNowClock] = useState<string>("--:--:--");

  // Live 1s tower clock
  useEffect(() => {
    setNowClock(formatClock(new Date()));
    const clockTimer = setInterval(() => {
      setNowClock(formatClock(new Date()));
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Sync optional ?room= query param on mount without needing Suspense
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramRoom = params.get("room");
    if (paramRoom && paramRoom.trim().length > 0) {
      setRoomCode(paramRoom.trim().toUpperCase());
    }
  }, []);

  // Poll GET /api/telemetry?room=DEMO every 500ms (skip overlapping in-flight polls)
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await fetch(
          `/api/telemetry?room=${encodeURIComponent(roomCode)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as TelemetrySnapshot;
        if (!cancelled) {
          setSnapshot(data);
        }
      } catch {
        // Keep last snapshot on transient fetch error
      } finally {
        inFlight = false;
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), 500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [roomCode]);

  const updateBuildingState = async (patch: {
    peakRush?: boolean;
    activeClimbersPerMin?: number;
  }) => {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, ...patch }),
    });
  };

  const togglePeakRush = async () => {
    const nextPeak = !(snapshot?.peakRush ?? false);
    await updateBuildingState({ peakRush: nextPeak });
  };

  const handleGenerateEsg = async () => {
    setLoadingEsg(true);
    try {
      const res = await fetch("/api/esg-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          peakRush: snapshot?.peakRush ?? false,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as EsgBriefResult;
        setEsgBrief(data);
        setEsgGeneratedAt(formatClock(new Date()));
      }
    } finally {
      setLoadingEsg(false);
    }
  };

  const live = snapshot?.liveFrame;
  const movementState: MovementState = live?.movementState ?? "IDLE";
  const phoneConnected = snapshot?.phoneConnected ?? false;
  const totals = snapshot?.totals ?? {
    verifiedTrips: 0,
    rejectedTrips: 0,
    totalFloors: 0,
    totalPoints: 0,
  };
  const peakRush = snapshot?.peakRush ?? false;
  const activeClimbersPerMin = snapshot?.activeClimbersPerMin ?? 8;
  const currentMultiplier = snapshot?.currentMultiplier ?? 1.0;

  const liftWaitHoursSaved = esgBrief
    ? esgBrief.liftWaitHoursSaved
    : Number(
        ((totals.verifiedTrips * 42) / 3600 + (peakRush ? 0.35 : 0)).toFixed(2)
      );
  const estKwhSaved = esgBrief
    ? esgBrief.estKwhSaved
    : Number((totals.totalFloors * 0.042).toFixed(2));

  const sortedDepartments = useMemo(() => {
    const list = [...(snapshot?.departmentStats ?? [])];
    list.sort(
      (a, b) => b.totalPoints - a.totalPoints || b.totalFloors - a.totalFloors
    );
    return list;
  }, [snapshot?.departmentStats]);

  const maxDeptPoints = useMemo(() => {
    return Math.max(10, ...sortedDepartments.map((d) => d.totalPoints));
  }, [sortedDepartments]);

  const stateBadgeClass: Record<MovementState, string> = {
    IDLE: "border-[#232B28] bg-[#1A211E] text-[#879490]",
    WALKING: "border-[#8B6FFF] bg-[#2E2456] text-[#E9EFEC]",
    STAIR_CLIMBING: "border-[#00E39D] bg-[#0B5F45]/75 text-[#00E39D]",
    STATIONARY_LIFT: "border-[#F2A93B] bg-[#F2A93B]/15 text-[#F2A93B]",
  };

  const multiplierMode =
    activeClimbersPerMin > 25
      ? {
          label: "CROWD THROTTLE",
          color: "text-[#F2A93B] border-[#F2A93B] bg-[#F2A93B]/15",
        }
      : peakRush
      ? {
          label: "PEAK RUSH SURGE",
          color: "text-[#00E39D] border-[#00E39D] bg-[#0B5F45]/60",
        }
      : {
          label: "BASELINE FLOW",
          color: "text-[#B4C0BB] border-[#232B28] bg-[#1A211E]",
        };

  if (!devMode) {
    return (
      <HrAdminDashboard
        roomCode={roomCode}
        totals={totals}
        departmentStats={sortedDepartments}
        floorTotals={snapshot?.floorTotals ?? {}}
        peakRush={peakRush}
        activeClimbersPerMin={activeClimbersPerMin}
        currentMultiplier={currentMultiplier}
        liftWaitHoursSaved={liftWaitHoursSaved}
        estKwhSaved={estKwhSaved}
        esgBrief={esgBrief}
        esgGeneratedAt={esgGeneratedAt}
        loadingEsg={loadingEsg}
        onTogglePeakRush={togglePeakRush}
        onGenerateEsg={handleGenerateEsg}
        onSwitchToDev={() => setDevMode(true)}
      />
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-5 py-6 lg:px-8">
      {/* Top Executive Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#1B2320] pb-4">
        <div className="flex items-center gap-3">
          <ClimbWordmark subtitle="DEVELOPER TELEMETRY & VERIFICATION CONSOLE" />
          <button
            type="button"
            onClick={() => setDevMode(false)}
            className="font-mono-tech rounded-full border border-[#00E39D]/60 bg-[#0B5F45]/45 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00E39D] transition hover:bg-[#0B5F45]/75 active:scale-95"
          >
            ← HR VIEW
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Tower Clock */}
          <div className="font-mono-tech flex items-center gap-2 rounded border border-[#232B28] bg-[#131816] px-3 py-1.5 text-xs text-[#B4C0BB]">
            <span className="text-[10px] uppercase tracking-wider text-[#879490]">
              Clock
            </span>
            <span className="font-bold text-[#E9EFEC]">{nowClock}</span>
          </div>

          {/* Live Phone Connection Pill */}
          <div className="font-mono-tech flex items-center gap-2 rounded border border-[#232B28] bg-[#131816] px-3 py-1.5 text-xs">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                phoneConnected
                  ? "animate-pulse bg-[#00E39D] shadow-[0_0_8px_#00E39D]"
                  : "bg-[#879490]/40"
              }`}
            />
            <span
              className={
                phoneConnected ? "font-bold text-[#00E39D]" : "text-[#879490]"
              }
            >
              {phoneConnected ? "PHONE LIVE" : "PHONE OFFLINE"}
            </span>
            {live?.updatedAt ? (
              <span className="text-[10px] text-[#879490]">
                {formatClock(live.updatedAt)}
              </span>
            ) : null}
          </div>

          {/* Room Code Selector */}
          <label className="flex items-center gap-1.5 rounded border border-[#232B28] bg-[#131816] px-2.5 py-1.5">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
              Room
            </span>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="font-mono-tech w-16 bg-transparent text-xs font-bold text-[#00E39D] outline-none"
            />
          </label>

          {/* 1-Click Stage Links */}
          <Link
            href="/"
            className="font-mono-tech rounded border border-[#232B28] bg-[#131816] px-3 py-1.5 text-xs text-[#B4C0BB] transition hover:border-[#00E39D] hover:text-[#E9EFEC]"
          >
            Stage Home
          </Link>
          <Link
            href={`/mobile?room=${encodeURIComponent(roomCode)}`}
            className="font-mono-tech rounded border border-[#8B6FFF]/60 bg-[#2E2456]/60 px-3 py-1.5 text-xs font-semibold text-[#E9EFEC] transition hover:border-[#8B6FFF] hover:bg-[#2E2456]"
          >
            Mobile Climber ↗
          </Link>
        </div>
      </header>

      {/* Top Executive KPI Bar (Whoop-Style Circular Rings) */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <WhoopKpiRingCard
          label="Lift Wait Saved"
          value={liftWaitHoursSaved}
          unit="hrs"
          subtext="42s peak queue relief / climb"
          ratio={Math.min(1, liftWaitHoursSaved / 2.5)}
          accent="#00E39D"
        />
        <WhoopKpiRingCard
          label="Active Climbers"
          value={activeClimbersPerMin}
          unit="/min"
          subtext="Crowd throttle > 25/min"
          ratio={Math.min(1, activeClimbersPerMin / 40)}
          accent={activeClimbersPerMin > 25 ? "#F2A93B" : "#8B6FFF"}
        />
        <WhoopKpiRingCard
          label="Spoofs Blocked"
          value={totals.rejectedTrips}
          subtext="0 pts leaked · 3-signal guard"
          ratio={Math.min(1, totals.rejectedTrips / 10)}
          accent="#F2A93B"
        />
        <WhoopKpiRingCard
          label="Est. kWh Saved"
          value={estKwhSaved}
          unit="kWh"
          subtext={`${totals.totalFloors} verified floors climbed`}
          ratio={Math.min(1, estKwhSaved / 2.0)}
          accent="#00E39D"
        />
      </section>

      {/* Main 3-Column Command Center */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Center-Left: Live Phone Sensor Telemetry Waveform + On-Device Triage */}
        <section className="flex flex-col gap-4 rounded-2xl border border-[#232B28] bg-[#131816] p-5 xl:col-span-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={
                  movementState === "STAIR_CLIMBING"
                    ? "animate-turbine-fast"
                    : phoneConnected
                    ? "animate-turbine-slow"
                    : ""
                }
              >
                <ClimbLogoSvg size={32} />
              </div>
              <div>
                <div className="eyebrow mb-1">Live Edge Telemetry</div>
                <h2 className="font-display text-lg font-bold text-[#E9EFEC]">
                  Phone Sensor Waveform
                </h2>
              </div>
            </div>
            <span
              className={`font-mono-tech rounded-full border px-2.5 py-1 text-[10.5px] font-bold ${stateBadgeClass[movementState]}`}
            >
              {movementState}
            </span>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                Acceleration Magnitude (m/s²)
              </span>
              <span className="font-mono-tech text-[11px] font-semibold text-[#00E39D]">
                {(live?.accelMagnitude ?? 0).toFixed(2)} m/s²
              </span>
            </div>
            <AccelWaveform
              samples={snapshot?.accelHistory ?? []}
              isSpoofWarning={movementState === "STATIONARY_LIFT"}
            />
            <div className="font-mono-tech mt-1.5 flex items-center justify-between text-[10px] text-[#879490]">
              <span>Dashed purple: 1.15 m/s² step peak</span>
              <span>500ms sync</span>
            </div>
          </div>

          {/* 2x2 Live Edge Readouts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-3">
              <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                Live Steps
              </div>
              <div className="font-mono-tech mt-1 text-2xl font-bold text-[#E9EFEC]">
                {live?.steps ?? 0}
              </div>
              <div className="font-mono-tech mt-0.5 text-[10px] text-[#879490]">
                Peak counter
              </div>
            </div>

            <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-3">
              <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                Cadence (SPM)
              </div>
              <div
                className={`font-mono-tech mt-1 text-2xl font-bold ${
                  (live?.cadenceSpm ?? 0) >= 55
                    ? "text-[#00E39D]"
                    : "text-[#E9EFEC]"
                }`}
              >
                {live?.cadenceSpm ?? 0}
              </div>
              <div className="font-mono-tech mt-0.5 text-[10px] text-[#879490]">
                {(live?.cadenceSpm ?? 0) >= 55 ? "✓ ≥ 55 spm" : "Gate ≥ 55 spm"}
              </div>
            </div>

            <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-3">
              <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                Vertical Bounce
              </div>
              <div
                className={`font-mono-tech mt-1 text-2xl font-bold ${
                  (live?.verticalBounce ?? 0) >= 0.35
                    ? "text-[#00E39D]"
                    : "text-[#8B6FFF]"
                }`}
              >
                {(live?.verticalBounce ?? 0).toFixed(2)}
              </div>
              <div className="font-mono-tech mt-0.5 text-[10px] text-[#879490]">
                {(live?.verticalBounce ?? 0) >= 0.35
                  ? "✓ ≥ 0.35 gait"
                  : "Gate ≥ 0.35"}
              </div>
            </div>

            <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-3">
              <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                Floor &amp; Anchor
              </div>
              <div className="font-mono-tech mt-1 text-2xl font-bold text-[#E9EFEC]">
                F{live?.activeFloor ?? 1}{" "}
                <span className="text-sm font-normal text-[#879490]">
                  {live?.elapsedSec ?? 0}s
                </span>
              </div>
              <div className="font-mono-tech mt-0.5 text-[10px] text-[#879490]">
                {live?.anchorId ?? "F1"} · {live?.tapSource ?? "MANUAL"}
              </div>
            </div>
          </div>
        </section>

        {/* Center-Right: Gemini Verification Feed */}
        <section className="flex flex-col rounded-2xl border border-[#232B28] bg-[#131816] p-5 xl:col-span-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="eyebrow mb-1.5">Gemini 3.6 Flash</div>
              <h2 className="font-display text-lg font-bold text-[#E9EFEC]">
                Verification Feed
              </h2>
            </div>
            <span className="font-mono-tech rounded border border-[#232B28] bg-[#0A0D0C] px-2.5 py-1 text-[11px] text-[#B4C0BB]">
              {snapshot?.trips.length ?? 0} trips
            </span>
          </div>

          {!snapshot || snapshot.trips.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded border border-dashed border-[#232B28] bg-[#0A0D0C]/60 p-8 text-center">
              <div className="font-mono-tech mb-1 text-xs font-semibold text-[#00E39D]">
                AWAITING STAIRWELL TAP-OUT
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-[#879490]">
                Tap Out on Floor 4, scan an NFC door sticker, or trigger a Stage
                Backup Simulator event in{" "}
                <code className="font-mono-tech text-[#E9EFEC]">/mobile</code>{" "}
                to stream Gemini&apos;s 3-signal verification verdict here.
              </p>
            </div>
          ) : (
            <div className="flex max-h-[560px] flex-col gap-3 overflow-y-auto pr-1">
              {snapshot.trips.map((trip) => {
                const passed = trip.verdict === "VERIFIED_CLIMB";
                const tapBadge = getTapSourceBadge(trip.tapSource);
                return (
                  <article
                    key={trip.id}
                    className={`animate-swiggy-pop rounded-xl border border-[#232B28] border-l-2 bg-[#0A0D0C] p-3.5 ${
                      passed ? "border-l-[#00E39D]" : "border-l-[#F2A93B]"
                    }`}
                  >
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`font-mono-tech rounded px-2 py-0.5 text-[11px] font-bold ${
                            passed
                              ? "bg-[#0B5F45]/75 text-[#00E39D]"
                              : "bg-[#F2A93B]/20 text-[#F2A93B]"
                          }`}
                        >
                          {trip.verdict}
                        </span>
                        <span
                          className={`font-mono-tech rounded border px-1.5 py-0.5 text-[9.5px] font-bold ${tapBadge.className}`}
                        >
                          {tapBadge.label}
                        </span>
                        <span className="font-mono-tech text-xs font-semibold text-[#E9EFEC]">
                          {trip.department} · F{trip.startFloor}→F{trip.endFloor}
                        </span>
                      </div>

                      <span
                        className={`font-mono-tech text-xs font-bold ${
                          passed ? "text-[#00E39D]" : "text-[#F2A93B]"
                        }`}
                      >
                        +{trip.pointsAwarded} pts ({trip.suggestedMultiplier}x)
                      </span>
                    </div>

                    <div className="font-mono-tech mb-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#879490]">
                      <span>
                        {trip.confidence}% confidence · engine: {trip.source} ·{" "}
                        {trip.totalSteps} steps
                        {trip.anchorId ? ` · anchor: ${trip.anchorId}` : ""}
                        {trip.tagSerial ? ` (${trip.tagSerial})` : ""}
                      </span>
                      <span className="text-[#B4C0BB]">
                        {formatClock(trip.timestamp)}
                      </span>
                    </div>

                    <p className="mb-2.5 text-xs leading-relaxed text-[#B4C0BB]">
                      {trip.reasoning}
                    </p>

                    <div className="font-mono-tech flex flex-wrap gap-1.5 text-[10px]">
                      <span
                        className={`rounded border px-2 py-0.5 ${
                          trip.signals.elevationPass
                            ? "border-[#0B5F45] bg-[#0B5F45]/35 text-[#00E39D]"
                            : "border-[#F2A93B]/50 bg-[#F2A93B]/15 text-[#F2A93B]"
                        }`}
                      >
                        {trip.signals.elevationPass ? "✓" : "✕"} Elevation{" "}
                        {trip.elevationDeltaMeters}m
                      </span>
                      <span
                        className={`rounded border px-2 py-0.5 ${
                          trip.signals.cadencePass
                            ? "border-[#0B5F45] bg-[#0B5F45]/35 text-[#00E39D]"
                            : "border-[#F2A93B]/50 bg-[#F2A93B]/15 text-[#F2A93B]"
                        }`}
                      >
                        {trip.signals.cadencePass ? "✓" : "✕"} Cadence{" "}
                        {trip.avgCadenceSpm} / {trip.verticalBounceScore}
                      </span>
                      <span
                        className={`rounded border px-2 py-0.5 ${
                          trip.signals.plausibilityPass
                            ? "border-[#0B5F45] bg-[#0B5F45]/35 text-[#00E39D]"
                            : "border-[#F2A93B]/50 bg-[#F2A93B]/15 text-[#F2A93B]"
                        }`}
                      >
                        {trip.signals.plausibilityPass ? "✓" : "✕"} Time{" "}
                        {trip.elapsedSeconds}s
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Dept Leaderboard + Dynamic Multiplier + ESG Brief */}
        <div className="flex flex-col gap-5 xl:col-span-4">
          {/* 1. Anonymized Department Leaderboard */}
          <section className="rounded-2xl border border-[#232B28] bg-[#131816] p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[#E9EFEC]">
                Department Leaderboard
              </h2>
              <span className="font-mono-tech rounded border border-[#232B28] bg-[#0A0D0C] px-2 py-0.5 text-[9.5px] uppercase tracking-wider text-[#879490]">
                Verified: {totals.verifiedTrips}
              </span>
            </div>

            <div className="font-mono-tech mb-3.5 rounded border border-[#1B2320] bg-[#0A0D0C] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.11em] text-[#879490]">
              Privacy Boundary: Dept &amp; Floor Aggregates Only
            </div>

            <div className="flex flex-col gap-2.5">
              {sortedDepartments.map((dept, idx) => {
                const barWidth = Math.max(
                  4,
                  Math.round((dept.totalPoints / maxDeptPoints) * 100)
                );
                return (
                  <div
                    key={dept.department}
                    className="rounded border border-[#1B2320] bg-[#0A0D0C] px-3 py-2"
                  >
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tech text-[10px] text-[#879490]">
                          0{idx + 1}
                        </span>
                        <span className="font-semibold text-[#E9EFEC]">
                          {dept.department}
                        </span>
                      </div>
                      <span className="font-mono-tech text-[11px] text-[#879490]">
                        {dept.totalFloors} fl ·{" "}
                        <span className="font-bold text-[#00E39D]">
                          {dept.totalPoints} pts
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A211E]">
                      <div
                        className="h-full rounded-full bg-[#00E39D] transition-all duration-300"
                        style={{
                          width: `${dept.totalPoints > 0 ? barWidth : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Dynamic Multiplier Controls (Demand-Shaping Engine) */}
          <section className="rounded-2xl border border-[#232B28] bg-[#131816] p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="eyebrow mb-1">Demand-Shaping Engine</div>
                <h2 className="font-display text-lg font-bold text-[#E9EFEC]">
                  Dynamic Multiplier
                </h2>
              </div>
              <div className="text-right">
                <div className="font-mono-tech text-3xl font-bold leading-none text-[#00E39D]">
                  {currentMultiplier}x
                </div>
                <span
                  className={`font-mono-tech mt-1 inline-block rounded border px-1.5 py-0.5 text-[9.5px] font-bold ${multiplierMode.color}`}
                >
                  {multiplierMode.label}
                </span>
              </div>
            </div>

            {/* Peak Rush Toggle */}
            <button
              type="button"
              onClick={() => void togglePeakRush()}
              className={`font-mono-tech mb-4 w-full rounded border px-3 py-2.5 text-xs font-bold transition ${
                peakRush
                  ? "border-[#00E39D] bg-[#0B5F45]/60 text-[#00E39D]"
                  : "border-[#232B28] bg-[#0A0D0C] text-[#E9EFEC] hover:border-[#00E39D]/70"
              }`}
            >
              Peak Rush Simulator: {peakRush ? "ON (Up to 2.5x)" : "OFF (1.0x)"}
            </button>

            {/* Stairwell Crowd Density Control */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                  Stairwell Density
                </span>
                <span
                  className={`font-mono-tech text-xs font-bold ${
                    activeClimbersPerMin > 25
                      ? "text-[#F2A93B]"
                      : "text-[#E9EFEC]"
                  }`}
                >
                  {activeClimbersPerMin} climbers/min
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={40}
                value={activeClimbersPerMin}
                onChange={(e) =>
                  void updateBuildingState({
                    activeClimbersPerMin: Number(e.target.value),
                  })
                }
                className="mb-2.5 w-full accent-[#00E39D]"
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void updateBuildingState({ activeClimbersPerMin: 8 })
                  }
                  className={`font-mono-tech rounded border px-2 py-1 text-[10px] transition ${
                    activeClimbersPerMin <= 12
                      ? "border-[#00E39D] bg-[#0B5F45]/40 text-[#00E39D]"
                      : "border-[#232B28] bg-[#0A0D0C] text-[#879490]"
                  }`}
                >
                  Off-Peak 8/m
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void updateBuildingState({ activeClimbersPerMin: 18 })
                  }
                  className={`font-mono-tech rounded border px-2 py-1 text-[10px] transition ${
                    activeClimbersPerMin > 12 && activeClimbersPerMin <= 25
                      ? "border-[#8B6FFF] bg-[#2E2456] text-[#E9EFEC]"
                      : "border-[#232B28] bg-[#0A0D0C] text-[#879490]"
                  }`}
                >
                  Busy 18/m
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void updateBuildingState({ activeClimbersPerMin: 30 })
                  }
                  className={`font-mono-tech rounded border px-2 py-1 text-[10px] transition ${
                    activeClimbersPerMin > 25
                      ? "border-[#F2A93B] bg-[#F2A93B]/15 text-[#F2A93B]"
                      : "border-[#232B28] bg-[#0A0D0C] text-[#879490]"
                  }`}
                >
                  Congested 30/m
                </button>
              </div>
            </div>
          </section>

          {/* 3. Gemini ESG Executive Brief Panel */}
          <section
            className="rounded-2xl border border-[#0B5F45] bg-[#131816] p-5"
            style={{
              backgroundImage:
                "linear-gradient(160deg, rgba(0,227,157,0.065), rgba(0,227,157,0) 62%)",
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#00E39D]">
                  Executive Sustainability Brief
                </div>
                <h2 className="font-display text-lg font-bold text-[#E9EFEC]">
                  Gemini ESG Report
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void handleGenerateEsg()}
                disabled={loadingEsg}
                className="font-display shrink-0 rounded-[4px] bg-[#00E39D] px-3.5 py-2 text-xs font-bold text-[#052018] transition hover:bg-[#2BF0B2] disabled:opacity-50"
              >
                {loadingEsg ? "Synthesizing..." : "Generate ESG Brief"}
              </button>
            </div>

            {esgBrief ? (
              <div>
                <p className="mb-3.5 text-xs leading-relaxed text-[#E9EFEC]">
                  {esgBrief.executiveSummary}
                </p>

                <div className="mb-3 grid grid-cols-2 gap-2.5">
                  <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-2.5">
                    <div className="font-mono-tech text-[9.5px] uppercase text-[#879490]">
                      Wait Hours Saved
                    </div>
                    <div className="font-mono-tech mt-0.5 text-lg font-bold text-[#00E39D]">
                      {esgBrief.liftWaitHoursSaved} hrs
                    </div>
                  </div>
                  <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-2.5">
                    <div className="font-mono-tech text-[9.5px] uppercase text-[#879490]">
                      Energy Delta
                    </div>
                    <div className="font-mono-tech mt-0.5 text-lg font-bold text-[#8B6FFF]">
                      {esgBrief.estKwhSaved} kWh
                    </div>
                  </div>
                </div>

                <div className="font-mono-tech mb-1.5 flex items-center justify-between text-[9.5px] uppercase tracking-wider text-[#879490]">
                  <span>
                    Recommended Multipliers ({esgBrief.source ?? "gemini"})
                  </span>
                  {esgGeneratedAt && <span>Generated {esgGeneratedAt}</span>}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-2 text-center">
                    <div className="font-mono-tech text-[9px] text-[#879490]">
                      AM PEAK
                    </div>
                    <div className="font-mono-tech text-xs font-bold text-[#00E39D]">
                      {esgBrief.recommendedMultipliers.morningPeak}x
                    </div>
                  </div>
                  <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-2 text-center">
                    <div className="font-mono-tech text-[9px] text-[#879490]">
                      MIDDAY
                    </div>
                    <div className="font-mono-tech text-xs font-bold text-[#E9EFEC]">
                      {esgBrief.recommendedMultipliers.middayOffPeak}x
                    </div>
                  </div>
                  <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-2 text-center">
                    <div className="font-mono-tech text-[9px] text-[#879490]">
                      PM RUSH
                    </div>
                    <div className="font-mono-tech text-xs font-bold text-[#00E39D]">
                      {esgBrief.recommendedMultipliers.eveningRush}x
                    </div>
                  </div>
                  <div className="rounded border border-[#1B2320] bg-[#0A0D0C] p-2 text-center">
                    <div className="font-mono-tech text-[9px] text-[#879490]">
                      CROWD
                    </div>
                    <div className="font-mono-tech text-xs font-bold text-[#F2A93B]">
                      {esgBrief.recommendedMultipliers.congestionThrottle}x
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-[#B4C0BB]">
                Synthesizes verified floor volume, blocked lift spoofs, and
                current peak-rush load into board-ready kWh savings, queue-wait
                reduction, and recommended demand-shaping multipliers.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
