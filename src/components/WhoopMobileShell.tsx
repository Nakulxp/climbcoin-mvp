"use client";

import { useEffect, useState } from "react";
import { ClimbHubHero } from "@/components/ClimbHubHero";
import { ClimbLogoSvg } from "@/components/ClimbMark";
import { NfcCardScanModal } from "@/components/NfcCardScanModal";
import { UserLocalProfile } from "@/components/MobileOnboarding";
import { playTapIn, playTick, playVerified } from "@/lib/buzzer";
import { MovementState, TripRecord } from "@/lib/types";

interface RewardItem {
  id: string;
  title: string;
  partner: string;
  cost: number;
  tag: string;
}

const CONSUMER_REWARDS: RewardItem[] = [
  {
    id: "espresso",
    title: "Lobby Café Espresso",
    partner: "Ground Floor Roastery",
    cost: 150,
    tag: "INSTANT QR",
  },
  {
    id: "lunch",
    title: "Green Bowl Lunch Voucher",
    partner: "Tower Atrium Kitchen",
    cost: 300,
    tag: "POPULAR",
  },
  {
    id: "coldbrew",
    title: "Iced Cold Brew",
    partner: "Lobby Barista Bar",
    cost: 180,
    tag: "NEW",
  },
];

function MiniWhoopRing({
  value,
  max,
  color,
  label,
  unit,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  unit: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0.04, value / Math.max(1, max)));
  const offset = c * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-[86px] w-[86px] items-center justify-center">
        <svg width="86" height="86" viewBox="0 0 86 86" className="-rotate-90">
          <circle
            cx="43"
            cy="43"
            r={r}
            fill="none"
            stroke="#1A211E"
            strokeWidth="6.5"
          />
          <circle
            cx="43"
            cy="43"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.45s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg font-extrabold leading-none text-[#E9EFEC]">
            {value}
          </span>
          <span className="font-mono-tech mt-0.5 text-[9px] uppercase text-[#879490]">
            {unit}
          </span>
        </div>
      </div>
      <span className="font-mono-tech mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B4C0BB]">
        {label}
      </span>
    </div>
  );
}

interface WhoopMobileShellProps {
  profile: UserLocalProfile;
  onEditProfile: () => void;
  onToggleDevMode: () => void;
  muted: boolean;
  onToggleMute: () => void;
  sensorsEnabled: boolean;
  onEnableSensors: () => Promise<void>;
  isClimbing: boolean;
  verifying: boolean;
  steps: number;
  cadenceSpm: number;
  verticalBounce: number;
  liveElevationM: number;
  displayFloor: number;
  elapsedSec: number;
  movementState: MovementState;
  walletPoints: number;
  streakDays: number;
  dailyFloors: number;
  lastVerdict: TripRecord | null;
  recentTrips: TripRecord[];
  redeemedIds: string[];
  nfcBanner: string | null;
  webNfcSupported: boolean;
  webNfcArmed: boolean;
  onArmWebNfc: () => Promise<void>;
  onStartClimb: () => void;
  onFinishClimb: () => Promise<void>;
  onResetVerdict: () => void;
  onRedeem: (id: string, cost: number) => void;
  cardDetectedSignal?: {
    anchor: "F1" | "F4";
    serial: string;
    timestamp: number;
  } | null;
  onTriggerCardTap?: (anchor: "F1" | "F4", serial?: string) => void;
  lastTagSerial?: string | null;
}

export function WhoopMobileShell({
  profile,
  onEditProfile,
  onToggleDevMode,
  muted,
  onToggleMute,
  sensorsEnabled,
  onEnableSensors,
  isClimbing,
  verifying,
  steps,
  cadenceSpm,
  liveElevationM,
  displayFloor,
  elapsedSec,
  movementState,
  walletPoints,
  streakDays,
  dailyFloors,
  lastVerdict,
  recentTrips,
  redeemedIds,
  nfcBanner,
  webNfcSupported,
  webNfcArmed,
  onArmWebNfc,
  onStartClimb,
  onFinishClimb,
  onResetVerdict,
  onRedeem,
  cardDetectedSignal,
  onTriggerCardTap,
  lastTagSerial,
}: WhoopMobileShellProps) {
  const [activeTab, setActiveTab] = useState<"HOME" | "CLIMB" | "REWARDS">(
    "CLIMB"
  );
  const [nfcModalOpen, setNfcModalOpen] = useState(false);
  const [detectedSuccess, setDetectedSuccess] = useState(false);
  const [targetAnchor, setTargetAnchor] = useState<"F1" | "F4">("F1");

  // Determine which of the 3 ClimbHub screens to display
  const climbStage: "READY" | "CLIMBING" | "EARNED" | "SPOOF" = isClimbing
    ? "CLIMBING"
    : lastVerdict
    ? lastVerdict.verdict === "VERIFIED_CLIMB"
      ? "EARNED"
      : "SPOOF"
    : "READY";

  const climbProgress = Math.min(1, Math.max(0.08, liveElevationM / 10.5));

  // Sync external hardware NFC tap events to the modal with rich animation
  useEffect(() => {
    if (cardDetectedSignal) {
      setTargetAnchor(cardDetectedSignal.anchor);
      setNfcModalOpen(true);
      setDetectedSuccess(true);
      const timer = setTimeout(() => {
        setNfcModalOpen(false);
        setDetectedSuccess(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cardDetectedSignal]);

  const handleModalCardTap = (anchor: "F1" | "F4", serial = "2A:72:B5:62") => {
    setDetectedSuccess(true);
    if (anchor === "F1") {
      playTapIn();
    } else {
      playVerified();
    }
    setTimeout(() => {
      setNfcModalOpen(false);
      setDetectedSuccess(false);
      if (onTriggerCardTap) {
        onTriggerCardTap(anchor, serial);
      } else if (anchor === "F1") {
        onStartClimb();
      } else {
        void onFinishClimb();
      }
    }, 850);
  };

  const handlePrimaryClimbTap = async () => {
    if (climbStage === "READY") {
      if (!sensorsEnabled) {
        await onEnableSensors();
      }
      setTargetAnchor("F1");
      setNfcModalOpen(true);
    } else if (climbStage === "CLIMBING") {
      setTargetAnchor("F4");
      setNfcModalOpen(true);
    } else {
      playTick();
      onResetVerdict();
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-between px-4 pb-24 pt-4">
      {/* Compact Whoop-Style Top Bar */}
      <header className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            playTick();
            onEditProfile();
          }}
          className="flex items-center gap-2.5 text-left transition active:scale-95"
        >
          <ClimbLogoSvg size={30} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display truncate text-sm font-extrabold text-[#E9EFEC]">
                Hi {profile.name}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E39D]" />
            </div>
            <div className="font-mono-tech truncate text-[10px] text-[#879490]">
              {profile.buildingName} · {profile.department}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Points pill */}
          <span className="font-mono-tech rounded-full border border-[#232B28] bg-[#131816] px-2.5 py-1 text-[11px] font-bold text-[#E9EFEC]">
            <span className="text-[#00E39D]">{walletPoints}</span> pts
          </span>

          {/* Tiny SFX mute */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label="Toggle sound"
            className="grid h-7 w-7 place-items-center rounded-full border border-[#232B28] bg-[#131816] text-[11px] transition active:scale-90"
          >
            {muted ? "🔇" : "🔊"}
          </button>

          {/* Very small DEV toggle pill to switch straight back to Backend/Engineer UI */}
          <button
            type="button"
            onClick={() => {
              playTick();
              onToggleDevMode();
            }}
            title="Switch to Developer Telemetry Mode"
            className="font-mono-tech rounded-full border border-[#232B28] bg-[#131816] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#879490] transition hover:border-[#8B6FFF] hover:text-[#E9EFEC] active:scale-90"
          >
            DEV
          </button>
        </div>
      </header>

      {/* TAB 1: WHOOP-STYLE OVERVIEW HOME */}
      {activeTab === "HOME" && (
        <div className="animate-swiggy-pop flex flex-1 flex-col gap-4">
          {/* Whoop 3-Ring Telemetry Card */}
          <section className="rounded-2xl border border-[#232B28] bg-[#131816] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono-tech text-[10px] font-semibold uppercase tracking-[0.15em] text-[#879490]">
                Today&apos;s Performance
              </span>
              <span className="font-mono-tech rounded-full border border-[#0B5F45] bg-[#0B5F45]/35 px-2 py-0.5 text-[9.5px] font-bold text-[#00E39D]">
                {sensorsEnabled ? "● LIVE IMU" : "READY"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1">
              <MiniWhoopRing
                value={cadenceSpm}
                max={110}
                color="#00E39D"
                label="Cadence"
                unit="SPM"
              />
              <MiniWhoopRing
                value={dailyFloors}
                max={12}
                color="#8B6FFF"
                label="Floors"
                unit="/ 12"
              />
              <MiniWhoopRing
                value={streakDays}
                max={7}
                color="#F2A93B"
                label="Streak"
                unit="Days"
              />
            </div>
          </section>

          {/* Swiggy-Style Primary Climb CTA Card */}
          <button
            type="button"
            onClick={() => {
              playTick();
              setActiveTab("CLIMB");
            }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#00E39D]/40 bg-[#131816] p-4 text-left transition hover:border-[#00E39D] active:scale-[0.98]"
            style={{
              backgroundImage:
                "linear-gradient(125deg, rgba(0,227,157,0.12), rgba(139,111,255,0.06) 70%)",
            }}
          >
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.14em] text-[#00E39D]">
                ClimbHub Ready · {profile.buildingName.split("·")[0].trim()}
              </div>
              <div className="font-display mt-1 text-lg font-extrabold text-[#E9EFEC]">
                {isClimbing ? "Climb in Progress →" : "Tap In & Earn Points →"}
              </div>
              <div className="mt-0.5 text-xs text-[#B4C0BB]">
                Hold phone near Floor 1 NFC sticker or tap to start
              </div>
            </div>
            <ClimbLogoSvg size={44} className="shrink-0" />
          </button>

          {/* Recent Verified Climbs */}
          <section className="rounded-2xl border border-[#232B28] bg-[#131816] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono-tech text-[10px] font-semibold uppercase tracking-[0.15em] text-[#879490]">
                Recent Activity
              </span>
              <span className="font-mono-tech text-[10px] text-[#879490]">
                {recentTrips.length} logged
              </span>
            </div>

            {recentTrips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#232B28] bg-[#0A0D0C]/60 px-4 py-6 text-center text-xs text-[#879490]">
                No climbs logged this session yet. Tap <strong>Climb</strong>{" "}
                below to start!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentTrips.slice(0, 4).map((t) => {
                  const ok = t.verdict === "VERIFIED_CLIMB";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-[#1B2320] bg-[#0A0D0C] px-3 py-2.5"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#E9EFEC]">
                          Floor {t.startFloor} → Floor {t.endFloor}
                        </div>
                        <div className="font-mono-tech mt-0.5 text-[10px] text-[#879490]">
                          {t.elapsedSeconds}s · {t.avgCadenceSpm} spm ·{" "}
                          {t.tapSource}
                        </div>
                      </div>
                      <span
                        className={`font-mono-tech rounded-full px-2.5 py-1 text-xs font-bold ${
                          ok
                            ? "bg-[#0B5F45]/50 text-[#00E39D]"
                            : "bg-[#F2A93B]/15 text-[#F2A93B]"
                        }`}
                      >
                        {ok ? `+${t.pointsAwarded} pts` : "Blocked"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: 3-STAGE CLIMBHUB EXPERIENCE (INSPIRED BY UPLOADED SCREENS) */}
      {activeTab === "CLIMB" && (
        <div
          key={climbStage}
          className="animate-swiggy-pop flex flex-1 flex-col justify-between py-2"
        >
          {/* Stage Headline Copy */}
          <div className="px-1">
            {climbStage === "READY" && (
              <>
                <div className="font-mono-tech mb-1.5 text-xs font-semibold text-[#8B6FFF]">
                  Ready to Climb?
                </div>
                <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Tap the Device near a ClimbHub
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-[#879490]">
                  Tap the button below or hold your phone near the Floor 1 NFC
                  door sticker.
                </p>
              </>
            )}

            {climbStage === "CLIMBING" && (
              <>
                <div className="font-mono-tech mb-1.5 flex items-center justify-between text-xs font-semibold text-[#00E39D]">
                  <span>● Live Climb · Floor {displayFloor} of 4</span>
                  <span>+{liveElevationM.toFixed(1)}m</span>
                </div>
                <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Start Climbing...
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-[#879490]">
                  Climb up to Floor 4, then tap the Floor 4 NFC sticker or hit
                  Tap Out below.
                </p>
              </>
            )}

            {climbStage === "EARNED" && (
              <>
                <div className="font-mono-tech mb-1.5 text-xs font-semibold text-[#00E39D]">
                  ✓ 3-Signal Verified Climb
                </div>
                <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Points Earned!
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-[#B4C0BB]">
                  {lastVerdict?.reasoning ||
                    "Awesome climb! Your points have been added to your wallet."}
                </p>
              </>
            )}

            {climbStage === "SPOOF" && (
              <>
                <div className="font-mono-tech mb-1.5 text-xs font-semibold text-[#F2A93B]">
                  ⚠ {lastVerdict?.verdict || "LIFT_SPOOF"}
                </div>
                <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Nice Try — Lift Detected
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-[#B4C0BB]">
                  {lastVerdict?.reasoning ||
                    "0 climbing cadence detected. Take the stairs next time to earn points!"}
                </p>
              </>
            )}
          </div>

          {/* Centerpiece Interactive ClimbHub Emblem */}
          <div className="my-4 flex flex-col items-center">
            <ClimbHubHero
              mode={climbStage}
              progressRatio={climbProgress}
              onTap={() => void handlePrimaryClimbTap()}
            />

            {/* Live Compact Telemetry Strip during Climb or Verdict */}
            {climbStage === "CLIMBING" && (
              <div className="mt-3 grid w-full grid-cols-3 gap-2 rounded-2xl border border-[#232B28] bg-[#131816]/90 p-3">
                <div className="text-center">
                  <div className="font-mono-tech text-[9.5px] uppercase text-[#879490]">
                    Cadence
                  </div>
                  <div className="font-display text-xl font-extrabold text-[#00E39D]">
                    {cadenceSpm}
                    <span className="font-mono-tech ml-0.5 text-[10px] font-normal text-[#879490]">
                      spm
                    </span>
                  </div>
                </div>
                <div className="border-x border-[#1B2320] text-center">
                  <div className="font-mono-tech text-[9.5px] uppercase text-[#879490]">
                    Steps
                  </div>
                  <div className="font-display text-xl font-extrabold text-[#E9EFEC]">
                    {steps}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-mono-tech text-[9.5px] uppercase text-[#879490]">
                    Time
                  </div>
                  <div className="font-display text-xl font-extrabold text-[#8B6FFF]">
                    {elapsedSec}s
                  </div>
                </div>
              </div>
            )}

            {(climbStage === "EARNED" || climbStage === "SPOOF") &&
              lastVerdict && (
                <div className="animate-swiggy-pop mt-3 flex w-full flex-col gap-2 rounded-2xl border border-[#232B28] bg-[#131816] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[#879490]">
                      Reward Credited
                    </span>
                    <span
                      className={`font-display text-xl font-extrabold ${
                        climbStage === "EARNED"
                          ? "text-[#00E39D]"
                          : "text-[#F2A93B]"
                      }`}
                    >
                      +{lastVerdict.pointsAwarded} pts (
                      {lastVerdict.suggestedMultiplier}x)
                    </span>
                  </div>
                  <div className="font-mono-tech flex items-center justify-between border-t border-[#1B2320] pt-2 text-[10px]">
                    <span
                      className={
                        lastVerdict.signals.elevationPass
                          ? "text-[#00E39D]"
                          : "text-[#F2A93B]"
                      }
                    >
                      {lastVerdict.signals.elevationPass ? "✓" : "✕"} Elevation
                    </span>
                    <span
                      className={
                        lastVerdict.signals.cadencePass
                          ? "text-[#00E39D]"
                          : "text-[#F2A93B]"
                      }
                    >
                      {lastVerdict.signals.cadencePass ? "✓" : "✕"} Cadence
                    </span>
                    <span
                      className={
                        lastVerdict.signals.plausibilityPass
                          ? "text-[#00E39D]"
                          : "text-[#F2A93B]"
                      }
                    >
                      {lastVerdict.signals.plausibilityPass ? "✓" : "✕"} Time
                    </span>
                  </div>
                </div>
              )}

            {nfcBanner && (
              <div className="font-mono-tech mt-2 rounded-full border border-[#0B5F45] bg-[#0B5F45]/30 px-3 py-1 text-[10px] font-semibold text-[#00E39D]">
                ⚡ {nfcBanner}
              </div>
            )}
          </div>

          {/* Bottom Pill Action Button (Matches Uploaded Screens!) */}
          <div className="flex flex-col items-center gap-2.5">
            <button
              type="button"
              disabled={verifying}
              onClick={() => void handlePrimaryClimbTap()}
              className={`font-display w-full max-w-[280px] rounded-full border px-6 py-4 text-base font-extrabold tracking-tight shadow-lg transition active:scale-95 disabled:opacity-60 ${
                climbStage === "READY"
                  ? "border-[#232B28] bg-[#131816] text-[#E9EFEC] hover:border-[#00E39D]"
                  : climbStage === "CLIMBING"
                  ? "border-[#00E39D] bg-[#00E39D] text-[#052018] shadow-[0_8px_24px_rgba(0,227,157,0.28)]"
                  : climbStage === "EARNED"
                  ? "border-[#8B6FFF] bg-[#2E2456] text-[#E9EFEC]"
                  : "border-[#F2A93B] bg-[#F2A93B]/15 text-[#F2A93B]"
              }`}
            >
              {verifying
                ? "Verifying Climb..."
                : climbStage === "READY"
                ? "NFC Enabled · Tap In"
                : climbStage === "CLIMBING"
                ? "Tap Out · Adding Points..."
                : climbStage === "EARNED"
                ? "Climb Again"
                : "Try Stairs Again"}
            </button>

            {(climbStage === "READY" || climbStage === "CLIMBING") && (
              <button
                type="button"
                onClick={() => {
                  playTick();
                  setTargetAnchor(climbStage === "CLIMBING" ? "F4" : "F1");
                  setNfcModalOpen(true);
                }}
                className={`font-mono-tech rounded-full border px-3.5 py-1.5 text-[10.5px] font-bold transition active:scale-95 ${
                  webNfcArmed
                    ? "border-[#00E39D] bg-[#0B5F45]/40 text-[#00E39D]"
                    : "border-[#8B6FFF]/60 bg-[#2E2456]/50 text-[#E9EFEC]"
                }`}
              >
                {webNfcArmed
                  ? climbStage === "CLIMBING"
                    ? "● NFC Armed — Hold Card to Phone"
                    : "● NFC Armed — Hold Card to Phone"
                  : "⚡ Tap with Physical ID Card (Mifare 1K)"}
              </button>
            )}

            {climbStage === "CLIMBING" && (
              <span className="font-mono-tech text-[10px] text-[#879490]">
                {movementState === "WALKING"
                  ? "Flat walking detected — climb stairs for elevation"
                  : `State: ${movementState} · Floor 1 → Floor 4`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SWIGGY-STYLE REWARDS WALLET */}
      {activeTab === "REWARDS" && (
        <div className="animate-swiggy-pop flex flex-1 flex-col gap-3.5">
          <section
            className="rounded-2xl border border-[#0B5F45] bg-[#131816] p-5"
            style={{
              backgroundImage:
                "linear-gradient(145deg, rgba(0,227,157,0.14), rgba(0,227,157,0) 65%)",
            }}
          >
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.15em] text-[#00E39D]">
              Available Balance
            </div>
            <div className="font-display mt-1 text-4xl font-extrabold text-[#E9EFEC]">
              {walletPoints}{" "}
              <span className="font-mono-tech text-sm font-medium text-[#00E39D]">
                ClimbCoins
              </span>
            </div>
            <div className="font-mono-tech mt-2 text-[10.5px] text-[#B4C0BB]">
              Redeemable at {profile.buildingName.split("·")[0].trim()} lobby
              partners
            </div>
          </section>

          <div className="flex flex-col gap-2.5">
            {CONSUMER_REWARDS.map((r) => {
              const claimed = redeemedIds.includes(r.id);
              const canClaim = walletPoints >= r.cost && !claimed;
              const pct = Math.min(100, Math.round((walletPoints / r.cost) * 100));
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-[#232B28] bg-[#131816] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono-tech rounded bg-[#1A211E] px-1.5 py-0.5 text-[9px] font-bold text-[#8B6FFF]">
                        {r.tag}
                      </span>
                      <div className="font-display mt-1.5 text-sm font-bold text-[#E9EFEC]">
                        {r.title}
                      </div>
                      <div className="font-mono-tech mt-0.5 text-[10px] text-[#879490]">
                        {r.partner} · {r.cost} pts
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canClaim}
                      onClick={() => onRedeem(r.id, r.cost)}
                      className={`font-display shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition active:scale-95 ${
                        claimed
                          ? "border border-[#0B5F45] bg-[#0B5F45]/40 text-[#00E39D]"
                          : canClaim
                          ? "bg-[#00E39D] text-[#052018] shadow-[0_4px_14px_rgba(0,227,157,0.3)] hover:bg-[#2BF0B2]"
                          : "border border-[#232B28] bg-[#1A211E] text-[#879490] opacity-60"
                      }`}
                    >
                      {claimed ? "Claimed ✓" : "Claim"}
                    </button>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#1A211E]">
                    <div
                      className="h-full rounded-full bg-[#00E39D] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sleek Floating Bottom Tab Bar */}
      <nav className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 items-center justify-around rounded-full border border-[#232B28] bg-[#131816]/95 px-2 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.65)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("HOME");
          }}
          className={`font-mono-tech flex flex-1 flex-col items-center rounded-full py-1.5 text-[10px] font-bold transition active:scale-95 ${
            activeTab === "HOME"
              ? "bg-[#1A211E] text-[#00E39D]"
              : "text-[#879490]"
          }`}
        >
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("CLIMB");
          }}
          className={`font-display mx-1 flex flex-1 flex-col items-center rounded-full py-2 text-xs font-extrabold transition active:scale-95 ${
            activeTab === "CLIMB"
              ? "bg-[#00E39D] text-[#052018] shadow-[0_0_16px_rgba(0,227,157,0.35)]"
              : "bg-[#1A211E] text-[#E9EFEC]"
          }`}
        >
          <span>ClimbHub</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("REWARDS");
          }}
          className={`font-mono-tech flex flex-1 flex-col items-center rounded-full py-1.5 text-[10px] font-bold transition active:scale-95 ${
            activeTab === "REWARDS"
              ? "bg-[#1A211E] text-[#8B6FFF]"
              : "text-[#879490]"
          }`}
        >
          <span>Rewards</span>
        </button>
      </nav>

      {/* Option A Animated Physical NFC ID Card Scan Modal */}
      <NfcCardScanModal
        isOpen={nfcModalOpen}
        onClose={() => {
          setNfcModalOpen(false);
          setDetectedSuccess(false);
        }}
        targetAnchor={targetAnchor}
        isClimbing={isClimbing}
        webNfcSupported={webNfcSupported}
        webNfcArmed={webNfcArmed}
        onArmWebNfc={onArmWebNfc}
        onTriggerCardTap={handleModalCardTap}
        lastTagSerial={lastTagSerial || cardDetectedSignal?.serial || "2A:72:B5:62"}
        detectedSuccess={detectedSuccess}
        buildingName={profile.buildingName}
      />
    </main>
  );
}
