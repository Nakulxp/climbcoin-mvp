"use client";

import { useEffect, useMemo, useState } from "react";
import { ClimbHubHero } from "@/components/ClimbHubHero";
import { ClimbLogoSvg } from "@/components/ClimbMark";
import { NfcCardScanModal } from "@/components/NfcCardScanModal";
import { UserLocalProfile } from "@/components/MobileOnboarding";
import {
  ClaimableReward,
  RewardClaimModal,
} from "@/components/RewardClaimModal";
import { playTick } from "@/lib/buzzer";
import { MovementState, TripRecord } from "@/lib/types";

const CAFE_REWARDS: ClaimableReward[] = [
  {
    id: "espresso",
    title: "Specialty Iced Latte & Espresso",
    partner: "Ground Floor Roastery",
    cost: 150,
    tag: "BARISTA PICK",
    image: "/rewards/cafe-espresso.jpg",
    codePrefix: "ESP",
    description: "Any handcrafted espresso or iced latte at the lobby coffee bar.",
  },
  {
    id: "croissant-combo",
    title: "Cold Brew & Butter Croissant",
    partner: "Lobby Artisan Bakery",
    cost: 220,
    tag: "MORNING FUEL",
    image: "/rewards/bakery-croissant.jpg",
    codePrefix: "CBW",
    description: "Freshly baked flaky butter croissant paired with craft cold brew.",
  },
  {
    id: "healthy-bowl",
    title: "Avocado Protein Grain Bowl",
    partner: "Tower Atrium Kitchen",
    cost: 300,
    tag: "POPULAR",
    image: "/rewards/healthy-bowl.jpg",
    codePrefix: "BWL",
    description: "Chef-crafted warm quinoa, avocado & roasted sweet potato bowl.",
  },
];

const CASHBACK_TIERS: ClaimableReward[] = [
  {
    id: "disc-50",
    title: "₹50 Instant Café Discount",
    partner: "Any Tower Partner",
    cost: 100,
    tag: "100 COINS",
    discountLabel: "₹50 OFF",
    image: "/rewards/cashback-card.jpg",
    codePrefix: "OFF50",
    description: "Apply at checkout at any lobby café or kiosk for ₹50 instant off.",
  },
  {
    id: "cashback-150",
    title: "₹150 Wallet Cashback",
    partner: "Direct Store Credit",
    cost: 250,
    tag: "250 COINS",
    discountLabel: "₹150 BACK",
    image: "/rewards/cashback-card.jpg",
    codePrefix: "CB150",
    description: "Redeemable as ₹150 cashback on food court & wellness partners.",
  },
  {
    id: "disc-25pct",
    title: "25% Off Bistro & Merch",
    partner: "Tower Lifestyle Pass",
    cost: 400,
    tag: "400 COINS",
    discountLabel: "25% OFF",
    image: "/rewards/cashback-card.jpg",
    codePrefix: "VIP25",
    description: "Flat 25% discount on your next atrium bistro order or gym pass.",
  },
];

interface LeaderboardRow {
  id: string;
  name: string;
  dept: string;
  floors: number;
  streak: number;
  isUser?: boolean;
}

const SEED_LEADERBOARD: Omit<LeaderboardRow, "isUser">[] = [
  { id: "l1", name: "Aarav M.", dept: "Engineering", floors: 24, streak: 12 },
  { id: "l2", name: "Priya S.", dept: "Product", floors: 19, streak: 9 },
  { id: "l3", name: "Rohan K.", dept: "Design", floors: 15, streak: 7 },
  { id: "l4", name: "Meera T.", dept: "Operations", floors: 11, streak: 4 },
];

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
  onArmWebNfc: (opts?: { silent?: boolean }) => Promise<void>;
  onStartClimb: () => void;
  onFinishClimb: () => Promise<void>;
  onResetVerdict: () => void;
  onRedeem: (id: string, cost: number) => void;
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
  liveElevationM,
  elapsedSec,
  walletPoints,
  streakDays,
  dailyFloors,
  lastVerdict,
  recentTrips,
  redeemedIds,
  webNfcSupported,
  webNfcArmed,
  onArmWebNfc,
  onStartClimb,
  onFinishClimb,
  onResetVerdict,
  onRedeem,
  onTriggerCardTap,
  lastTagSerial,
}: WhoopMobileShellProps) {
  const [activeTab, setActiveTab] = useState<"HOME" | "CLIMB" | "REWARDS">(
    "CLIMB"
  );
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<ClaimableReward | null>(
    null
  );
  const [claimedCodes, setClaimedCodes] = useState<Record<string, string>>({});

  // Determine which of the ClimbHub stages to display
  const climbStage: "READY" | "CLIMBING" | "EARNED" | "SPOOF" = isClimbing
    ? "CLIMBING"
    : lastVerdict
    ? lastVerdict.verdict === "VERIFIED_CLIMB"
      ? "EARNED"
      : "SPOOF"
    : "READY";

  // Smoothly fill the 8 purple leaves based on average 4-floor climb time (~32s) or real elevation
  const timeProgress = Math.min(1, elapsedSec / 32);
  const elevProgress = Math.min(1, liveElevationM / 10.5);
  const climbProgress = Math.min(
    1,
    Math.max(0.125, Math.max(timeProgress, elevProgress))
  );

  // Auto-arm NFC by default when on the ClimbHub page (and on first touch if browser requires gesture)
  useEffect(() => {
    if (activeTab !== "CLIMB" || !webNfcSupported || webNfcArmed) return;

    // Attempt silent immediate arming
    void onArmWebNfc({ silent: true });

    // Also silently arm on the very first touch anywhere on screen (Chrome gesture requirement)
    const onFirstGesture = () => {
      if (!webNfcArmed) {
        void onArmWebNfc({ silent: true });
      }
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstGesture);
  }, [activeTab, webNfcSupported, webNfcArmed, onArmWebNfc]);

  // Build live Tower Leaderboard incorporating current user
  const leaderboard = useMemo<LeaderboardRow[]>(() => {
    const userRow: LeaderboardRow = {
      id: "you",
      name: profile.name || "You",
      dept: profile.department,
      floors: Math.max(dailyFloors, 8),
      streak: streakDays,
      isUser: true,
    };
    return [...SEED_LEADERBOARD, userRow].sort((a, b) => b.floors - a.floors);
  }, [profile.name, profile.department, dailyFloors, streakDays]);

  const userRank = leaderboard.findIndex((r) => r.isUser) + 1;

  const handlePrimaryClimbTap = async () => {
    if (climbStage === "READY") {
      if (!sensorsEnabled) {
        await onEnableSensors();
      }
      onStartClimb();
    } else if (climbStage === "CLIMBING") {
      await onFinishClimb();
    } else {
      playTick();
      onResetVerdict();
    }
  };

  const handleConfirmRewardClaim = (
    reward: ClaimableReward,
    generatedCode: string
  ) => {
    setClaimedCodes((prev) => ({ ...prev, [reward.id]: generatedCode }));
    onRedeem(reward.id, reward.cost);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-between px-5 pb-28 pt-5">
      {/* Minimal Top Utility Bar: Ultra-discrete icons only on CLIMB; clean bar on HOME/REWARDS */}
      <header className="mb-3 flex items-center justify-between">
        {activeTab === "CLIMB" ? (
          <div className="h-7" />
        ) : (
          <button
            type="button"
            onClick={() => {
              playTick();
              onEditProfile();
            }}
            className="flex items-center gap-2 text-left transition active:scale-95"
          >
            <ClimbLogoSvg size={26} />
            <div className="min-w-0">
              <div className="font-display truncate text-sm font-extrabold text-[#E9EFEC]">
                {profile.name}
              </div>
              <div className="font-mono-tech truncate text-[10px] text-[#879490]">
                {profile.buildingName.split("·")[0].trim()}
              </div>
            </div>
          </button>
        )}

        {/* Minimal Basal Utility Icons */}
        <div className="flex items-center gap-1.5">
          {/* Help (?) Icon -> Opens NFC How-To & 3D Card Drawer */}
          <button
            type="button"
            onClick={() => {
              playTick();
              setHelpDrawerOpen(true);
            }}
            aria-label="How NFC works"
            title="NFC Guide & Simulator"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] bg-[#131816]/80 text-[#879490] transition hover:border-[#00E39D]/50 hover:text-[#E9EFEC] active:scale-90"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          {/* Mute/Unmute Icon */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label="Toggle sound"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] bg-[#131816]/80 text-[#879490] transition hover:text-[#E9EFEC] active:scale-90"
          >
            {muted ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Subtle DEV icon */}
          <button
            type="button"
            onClick={() => {
              playTick();
              onToggleDevMode();
            }}
            aria-label="Developer mode"
            title="Switch to Developer Telemetry Mode"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] bg-[#131816]/80 text-[#879490] transition hover:border-[#8B6FFF] hover:text-[#E9EFEC] active:scale-90"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
        </div>
      </header>

      {/* TAB 1: HOME OVERVIEW — STREAK, STATS & TOWER LEADERBOARD (NO LIVE CADENCE) */}
      {activeTab === "HOME" && (
        <div className="animate-swiggy-pop flex flex-1 flex-col gap-4">
          {/* Clean 3-Stat Strip: Streak, Floors, Coins */}
          <section className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-[#232B28] bg-[#131816] p-3.5 text-center">
              <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#F2A93B]">
                Streak
              </div>
              <div className="font-display mt-1 text-2xl font-extrabold text-[#E9EFEC]">
                {streakDays}
                <span className="font-mono-tech ml-0.5 text-xs font-normal text-[#879490]">
                  d
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#232B28] bg-[#131816] p-3.5 text-center">
              <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#8B6FFF]">
                Floors
              </div>
              <div className="font-display mt-1 text-2xl font-extrabold text-[#E9EFEC]">
                {dailyFloors}
              </div>
            </div>

            <div className="rounded-2xl border border-[#232B28] bg-[#131816] p-3.5 text-center">
              <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[#00E39D]">
                Coins
              </div>
              <div className="font-display mt-1 text-2xl font-extrabold text-[#00E39D]">
                {walletPoints}
              </div>
            </div>
          </section>

          {/* Tower Leaderboard / Ranking Board */}
          <section className="rounded-2xl border border-[#232B28] bg-[#131816] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-mono-tech text-[10px] font-semibold uppercase tracking-[0.14em] text-[#879490]">
                  Tower Leaderboard
                </div>
                <div className="font-display text-base font-extrabold text-[#E9EFEC]">
                  {profile.buildingName.split("·")[0].trim()}
                </div>
              </div>
              <span className="font-mono-tech rounded-full border border-[#8B6FFF]/40 bg-[#2E2456]/60 px-2.5 py-1 text-[10px] font-bold text-[#E9EFEC]">
                Rank #{userRank}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {leaderboard.map((row, idx) => {
                const rank = idx + 1;
                const medalColor =
                  rank === 1
                    ? "text-[#F2A93B] bg-[#F2A93B]/15 border-[#F2A93B]/40"
                    : rank === 2
                    ? "text-[#E9EFEC] bg-white/10 border-white/20"
                    : rank === 3
                    ? "text-[#D98B5F] bg-[#D98B5F]/15 border-[#D98B5F]/35"
                    : "text-[#879490] bg-[#1A211E] border-[#232B28]";

                return (
                  <div
                    key={row.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                      row.isUser
                        ? "border-[#00E39D]/50 bg-[#0B5F45]/25"
                        : "border-[#1B2320] bg-[#0A0D0C]/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono-tech grid h-7 w-7 place-items-center rounded-full border text-[11px] font-extrabold ${medalColor}`}
                      >
                        {rank}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-[#E9EFEC]">
                          {row.name}{" "}
                          {row.isUser && (
                            <span className="font-mono-tech ml-1 text-[9.5px] font-semibold text-[#00E39D]">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="font-mono-tech text-[10px] text-[#879490]">
                          {row.dept} · {row.streak}d streak
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-display text-sm font-extrabold text-[#E9EFEC]">
                        {row.floors}
                      </div>
                      <div className="font-mono-tech text-[9px] uppercase text-[#879490]">
                        floors
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Compact Recent Climbs */}
          {recentTrips.length > 0 && (
            <section className="rounded-2xl border border-[#232B28] bg-[#131816] p-4">
              <div className="font-mono-tech mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#879490]">
                Recent Climbs
              </div>
              <div className="flex flex-col gap-2">
                {recentTrips.slice(0, 3).map((t) => {
                  const ok = t.verdict === "VERIFIED_CLIMB";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-[#1B2320] bg-[#0A0D0C] px-3 py-2"
                    >
                      <span className="text-xs font-semibold text-[#E9EFEC]">
                        Floor {t.startFloor} → {t.endFloor}
                      </span>
                      <span
                        className={`font-mono-tech text-xs font-bold ${
                          ok ? "text-[#00E39D]" : "text-[#F2A93B]"
                        }`}
                      >
                        {ok ? `+${t.pointsAwarded} pts` : "Lift"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* TAB 2: ULTRA-CLEAN 3-STAGE CLIMBHUB (ZERO CLUTTER, AUTO-ARMED NFC) */}
      {activeTab === "CLIMB" && (
        <div
          key={climbStage}
          className="animate-swiggy-pop flex flex-1 flex-col justify-between py-2"
        >
          {/* Minimal Clean Headline Only */}
          <div className="px-1">
            {climbStage === "READY" && (
              <>
                <div className="font-mono-tech mb-1.5 text-xs font-medium text-[#8B6FFF]">
                  Ready to Climb?
                </div>
                <h1 className="font-display text-[30px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Tap the Device near a ClimbHub
                </h1>
              </>
            )}

            {climbStage === "CLIMBING" && (
              <h1 className="font-display mt-3 text-[30px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                Start Climbing...
              </h1>
            )}

            {climbStage === "EARNED" && (
              <>
                <div className="font-mono-tech mb-1.5 text-xs font-semibold text-[#00E39D]">
                  +{lastVerdict?.pointsAwarded ?? 0} ClimbCoins
                </div>
                <h1 className="font-display text-[30px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Tap out
                </h1>
              </>
            )}

            {climbStage === "SPOOF" && (
              <>
                <div className="font-mono-tech mb-1.5 text-xs font-semibold text-[#F2A93B]">
                  Lift Detected
                </div>
                <h1 className="font-display text-[30px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Take the Stairs
                </h1>
              </>
            )}
          </div>

          {/* Centerpiece Interactive ClimbHub Emblem */}
          <div className="my-6 flex flex-col items-center justify-center">
            <ClimbHubHero
              mode={climbStage}
              progressRatio={climbProgress}
              onTap={() => void handlePrimaryClimbTap()}
            />
          </div>

          {/* Bottom Pill Action + Low-Opacity NFC Active Micro-Text */}
          <div className="flex flex-col items-center gap-3 pb-2">
            <button
              type="button"
              disabled={verifying}
              onClick={() => void handlePrimaryClimbTap()}
              className={`font-display w-full max-w-[260px] rounded-full border px-6 py-4 text-[17px] font-extrabold tracking-tight shadow-lg transition active:scale-95 disabled:opacity-60 ${
                climbStage === "READY"
                  ? "border-white/[0.08] bg-[#131816] text-[#E9EFEC]"
                  : climbStage === "CLIMBING"
                  ? "border-white/[0.08] bg-[#131816] text-[#E9EFEC]"
                  : climbStage === "EARNED"
                  ? "border-[#8B6FFF]/50 bg-[#181426] text-[#E9EFEC]"
                  : "border-[#F2A93B]/50 bg-[#1B1710] text-[#F2A93B]"
              }`}
            >
              {verifying
                ? "Verifying..."
                : climbStage === "READY"
                ? "NFC Enabled"
                : climbStage === "CLIMBING"
                ? "Adding points..."
                : climbStage === "EARNED"
                ? "Points Earned"
                : "Try Again"}
            </button>

            {/* Subtle, low-opacity NFC status line at bottom center */}
            <p className="font-mono-tech text-center text-[10px] text-[#879490]/55">
              {webNfcArmed
                ? "NFC card reader is on"
                : webNfcSupported
                ? "NFC ready · tap anywhere to turn on"
                : "Tap emblem or use ? for card simulator"}
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: JUICED-UP REWARDS WITH EDITORIAL CAFE PHOTOS + CASHBACK & COUPON CODES */}
      {activeTab === "REWARDS" && (
        <div className="animate-swiggy-pop flex flex-1 flex-col gap-4">
          {/* Compact Balance Banner */}
          <section
            className="flex items-center justify-between rounded-2xl border border-[#0B5F45]/70 bg-[#131816] px-4 py-3.5"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(0,227,157,0.14), rgba(139,111,255,0.06) 75%)",
            }}
          >
            <div>
              <div className="font-mono-tech text-[9.5px] uppercase tracking-[0.15em] text-[#00E39D]">
                Your Balance
              </div>
              <div className="font-display text-3xl font-extrabold text-[#E9EFEC]">
                {walletPoints}{" "}
                <span className="font-mono-tech text-xs font-medium text-[#879490]">
                  coins
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono-tech text-[10px] text-[#B4C0BB]">
                {Object.keys(claimedCodes).length} active
              </div>
              <div className="font-mono-tech text-[9.5px] text-[#879490]">
                vouchers
              </div>
            </div>
          </section>

          {/* Instant Coin-to-Cashback & Discount Tiers */}
          <div>
            <div className="font-mono-tech mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#879490]">
              Instant Discounts & Cashback
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CASHBACK_TIERS.map((tier) => {
                const claimed =
                  Boolean(claimedCodes[tier.id]) ||
                  redeemedIds.includes(tier.id);
                const canClaim = walletPoints >= tier.cost || claimed;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      playTick();
                      setSelectedReward(tier);
                    }}
                    disabled={!canClaim}
                    className={`flex flex-col items-center rounded-2xl border p-2.5 text-center transition active:scale-95 disabled:opacity-45 ${
                      claimed
                        ? "border-[#00E39D]/60 bg-[#0B5F45]/30"
                        : "border-[#232B28] bg-[#131816] hover:border-[#8B6FFF]/60"
                    }`}
                  >
                    <span className="font-display text-sm font-extrabold text-[#E9EFEC]">
                      {tier.discountLabel}
                    </span>
                    <span className="font-mono-tech mt-1 rounded-full bg-[#1A211E] px-2 py-0.5 text-[9px] font-bold text-[#00E39D]">
                      {claimed ? "VIEW CODE" : `${tier.cost} pts`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo-Rich Café & Dining Reward Cards */}
          <div className="flex flex-col gap-3">
            <div className="font-mono-tech text-[10px] font-semibold uppercase tracking-[0.14em] text-[#879490]">
              Lobby Café & Kitchen Perks
            </div>

            {CAFE_REWARDS.map((r) => {
              const code = claimedCodes[r.id];
              const claimed = Boolean(code) || redeemedIds.includes(r.id);
              const canClaim = walletPoints >= r.cost;

              return (
                <div
                  key={r.id}
                  className="group overflow-hidden rounded-2xl border border-[#232B28] bg-[#131816] shadow-lg transition hover:border-[#2F3B36]"
                >
                  {/* Editorial Café Photo */}
                  <div className="relative h-32 w-full overflow-hidden">
                    <img
                      src={r.image}
                      alt={r.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131816] via-[#131816]/25 to-transparent" />
                    <span className="font-mono-tech absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#00E39D] backdrop-blur-md">
                      {r.tag}
                    </span>
                    <span className="font-mono-tech absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-bold text-[#E9EFEC] backdrop-blur-md">
                      {r.cost} pts
                    </span>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <div className="min-w-0">
                      <div className="font-display truncate text-sm font-extrabold text-[#E9EFEC]">
                        {r.title}
                      </div>
                      <div className="font-mono-tech truncate text-[10px] text-[#879490]">
                        {r.partner}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!claimed && !canClaim}
                      onClick={() => {
                        playTick();
                        setSelectedReward(r);
                      }}
                      className={`font-display shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition active:scale-95 ${
                        claimed
                          ? "border border-[#00E39D]/50 bg-[#0B5F45]/40 text-[#00E39D]"
                          : canClaim
                          ? "bg-[#00E39D] text-[#052018] shadow-[0_4px_14px_rgba(0,227,157,0.28)]"
                          : "border border-[#232B28] bg-[#1A211E] text-[#879490]"
                      }`}
                    >
                      {claimed
                        ? "View Code"
                        : canClaim
                        ? "Claim"
                        : `-${r.cost - walletPoints}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FLOATING MINIMAL BASAL-ICON NAV BAR */}
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/[0.1] bg-[#131816]/85 p-1.5 shadow-[0_14px_38px_rgba(0,0,0,0.75)] backdrop-blur-xl"
      >
        {/* Overview / Leaderboard Icon */}
        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("HOME");
          }}
          aria-label="Overview & Leaderboard"
          className={`grid h-11 w-14 place-items-center rounded-full transition active:scale-90 ${
            activeTab === "HOME"
              ? "bg-[#1F2925] text-[#00E39D]"
              : "text-[#879490] hover:text-[#E9EFEC]"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </button>

        {/* Center ClimbHub Icon */}
        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("CLIMB");
          }}
          aria-label="ClimbHub"
          className={`grid h-11 w-16 place-items-center rounded-full transition active:scale-90 ${
            activeTab === "CLIMB"
              ? "bg-[#00E39D] text-[#052018] shadow-[0_0_20px_rgba(0,227,157,0.4)]"
              : "bg-[#1A211E] text-[#E9EFEC]"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 20h4v-4h4v-4h4V8h4" />
            <path d="M14 4h6v6" />
          </svg>
        </button>

        {/* Rewards & Coupons Icon */}
        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("REWARDS");
          }}
          aria-label="Rewards"
          className={`grid h-11 w-14 place-items-center rounded-full transition active:scale-90 ${
            activeTab === "REWARDS"
              ? "bg-[#1F2925] text-[#8B6FFF]"
              : "text-[#879490] hover:text-[#E9EFEC]"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13" />
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
          </svg>
        </button>
      </nav>

      {/* Help (?) Drawer: NFC How-To + 3D Card Visual + Optional Simulator */}
      <NfcCardScanModal
        isOpen={helpDrawerOpen}
        onClose={() => setHelpDrawerOpen(false)}
        targetAnchor={isClimbing ? "F4" : "F1"}
        webNfcSupported={webNfcSupported}
        webNfcArmed={webNfcArmed}
        onArmWebNfc={() => onArmWebNfc({ silent: false })}
        onTriggerCardTap={(anchor, serial) => {
          if (onTriggerCardTap) {
            onTriggerCardTap(anchor, serial);
          } else if (anchor === "F1") {
            onStartClimb();
          } else {
            void onFinishClimb();
          }
        }}
        lastTagSerial={lastTagSerial}
      />

      {/* Reward Claim Confirmation & Live Coupon Code Modal */}
      <RewardClaimModal
        reward={selectedReward}
        walletPoints={walletPoints}
        existingCode={
          selectedReward ? claimedCodes[selectedReward.id] ?? null : null
        }
        onClose={() => setSelectedReward(null)}
        onConfirmClaim={handleConfirmRewardClaim}
      />
    </main>
  );
}
