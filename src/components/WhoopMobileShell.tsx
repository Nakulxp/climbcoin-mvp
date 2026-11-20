"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ClimbHubHero } from "@/components/ClimbHubHero";
import { ClimbLogoSvg } from "@/components/ClimbMark";
import { NfcCardScanModal } from "@/components/NfcCardScanModal";
import { UserLocalProfile } from "@/components/MobileOnboarding";
import {
  ClaimableReward,
  RewardClaimModal,
} from "@/components/RewardClaimModal";
import { playTick } from "@/lib/buzzer";
import {
  fireQuirkyBrowserNotification,
  pickQuirkyAlert,
  QuirkyAlert,
  requestBrowserNotificationPermission,
} from "@/lib/notifications";
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
  { id: "l5", name: "Kabir D.", dept: "Finance", floors: 7, streak: 3 },
];

type MobileTab = "HOME" | "LEADERBOARD" | "CLIMB" | "REWARDS";

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
  liveMultiplier: number;
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
  liveMultiplier,
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
  const [activeTab, setActiveTab] = useState<MobileTab>("CLIMB");
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<ClaimableReward | null>(
    null
  );
  const [claimedCodes, setClaimedCodes] = useState<Record<string, string>>({});
  const [activeToast, setActiveToast] = useState<QuirkyAlert | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const prevMultiplierRef = useRef<number>(liveMultiplier);

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

  // Auto-arm NFC by default when on the ClimbHub page
  useEffect(() => {
    if (activeTab !== "CLIMB" || !webNfcSupported || webNfcArmed) return;

    void onArmWebNfc({ silent: true });

    const onFirstGesture = () => {
      if (!webNfcArmed) {
        void onArmWebNfc({ silent: true });
      }
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstGesture);
  }, [activeTab, webNfcSupported, webNfcArmed, onArmWebNfc]);

  // Trigger Zomato-style quirky multiplier notification whenever building multiplier changes!
  useEffect(() => {
    if (prevMultiplierRef.current !== liveMultiplier) {
      prevMultiplierRef.current = liveMultiplier;
      if (liveMultiplier >= 1.5 || liveMultiplier <= 0.8) {
        const alert = pickQuirkyAlert(liveMultiplier);
        setActiveToast(alert);
        fireQuirkyBrowserNotification(alert);
      }
    }
  }, [liveMultiplier]);

  // Auto-dismiss in-app Zomato-style toast after 5.5s
  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => setActiveToast(null), 5500);
    return () => clearTimeout(t);
  }, [activeToast]);

  const handleBellClick = async () => {
    playTick();
    const perm = await requestBrowserNotificationPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
    }
    const previewMultiplier = liveMultiplier >= 1.5 ? liveMultiplier : 2.5;
    const alert = pickQuirkyAlert(previewMultiplier);
    setActiveToast(alert);
    fireQuirkyBrowserNotification(alert);
  };

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

  // Lock viewport strictly to 100dvh with zero scroll on CLIMB page
  const isLockedViewport = activeTab === "CLIMB";

  return (
    <main
      className={
        isLockedViewport
          ? "mx-auto flex h-[100dvh] max-w-[430px] flex-col justify-between overflow-hidden px-5 pb-24 pt-4"
          : "mx-auto flex min-h-[100dvh] max-w-[430px] flex-col justify-between px-5 pb-28 pt-5"
      }
    >
      {/* Zomato-Style Quirky Multiplier Floating Toast Banner */}
      {activeToast && (
        <div className="animate-swiggy-pop fixed left-1/2 top-4 z-50 w-[calc(100%-28px)] max-w-[400px] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#121916]/95 p-3.5 shadow-[0_14px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <div
                className="font-mono-tech text-[9.5px] font-extrabold uppercase tracking-[0.16em]"
                style={{ color: activeToast.accent }}
              >
                {activeToast.tag}
              </div>
              <div className="font-display mt-0.5 text-sm font-extrabold text-[#E9EFEC]">
                {activeToast.title}
              </div>
              <p className="mt-0.5 text-[11.5px] leading-snug text-[#B4C0BB]">
                {activeToast.body}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              aria-label="Dismiss notification"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-[10px] text-[#879490]"
            >
              ✕
            </button>
          </div>
          {activeTab !== "CLIMB" && (
            <button
              type="button"
              onClick={() => {
                playTick();
                setActiveTab("CLIMB");
                setActiveToast(null);
              }}
              className="font-mono-tech mt-2.5 w-full rounded-full bg-[#00E39D] py-1.5 text-[10.5px] font-extrabold text-[#052018]"
            >
              Climb Now →
            </button>
          )}
        </div>
      )}

      {/* Minimal Top Utility Bar: Discrete Icons Only on CLIMB; Clean Bar on Other Tabs */}
      <header className="mb-2 flex shrink-0 items-center justify-between">
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
          {/* Zomato-Style Multiplier Alert Bell Icon */}
          <button
            type="button"
            onClick={() => void handleBellClick()}
            aria-label="Multiplier alerts"
            title="Enable / Preview Quirky Multiplier Notification"
            className={`relative grid h-8 w-8 place-items-center rounded-full border bg-[#131816]/80 transition active:scale-90 ${
              notifEnabled || liveMultiplier >= 1.5
                ? "border-[#00E39D]/50 text-[#00E39D]"
                : "border-white/[0.08] text-[#879490] hover:text-[#E9EFEC]"
            }`}
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
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {liveMultiplier >= 1.5 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#00E39D]" />
            )}
          </button>

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

          {/* Subtle DEV Icon */}
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

      {/* PAGE 1: HOME — PERSONAL STREAK, DAILY GOAL & MULTIPLIER STATUS */}
      {activeTab === "HOME" && (
        <div className="animate-swiggy-pop flex flex-1 flex-col gap-4">
          {/* Multiplier Live Pill Card */}
          <button
            type="button"
            onClick={() => {
              playTick();
              setActiveTab("CLIMB");
            }}
            className="flex items-center justify-between rounded-2xl border border-[#00E39D]/35 bg-[#131816] p-4 text-left transition active:scale-[0.98]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(0,227,157,0.14), rgba(139,111,255,0.06) 75%)",
            }}
          >
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.14em] text-[#00E39D]">
                {liveMultiplier >= 1.5
                  ? `🔥 ${liveMultiplier.toFixed(1)}x Peak Rush Live`
                  : "● ClimbHub Active"}
              </div>
              <div className="font-display mt-1 text-lg font-extrabold text-[#E9EFEC]">
                {isClimbing ? "Climb in Progress →" : "Ready for Floor 1 →"}
              </div>
            </div>
            <ClimbLogoSvg size={40} className="shrink-0" />
          </button>

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

          {/* Daily Goal Progress Card */}
          <section className="rounded-2xl border border-[#232B28] bg-[#131816] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[10px] font-semibold uppercase tracking-[0.14em] text-[#879490]">
                Daily Stair Goal
              </span>
              <span className="font-mono-tech text-xs font-bold text-[#00E39D]">
                {Math.min(12, dailyFloors)} / 12 floors
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#0A0D0C]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00E39D] to-[#8B6FFF] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(10, Math.round((dailyFloors / 12) * 100))
                  )}%`,
                }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#879490]">
              <span>Tower Rank #{userRank}</span>
              <button
                type="button"
                onClick={() => {
                  playTick();
                  setActiveTab("LEADERBOARD");
                }}
                className="font-mono-tech font-semibold text-[#8B6FFF]"
              >
                View Rankings →
              </button>
            </div>
          </section>

          {/* Recent Climbs */}
          <section className="rounded-2xl border border-[#232B28] bg-[#131816] p-4">
            <div className="font-mono-tech mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#879490]">
              Recent Activity
            </div>
            {recentTrips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#232B28] bg-[#0A0D0C]/60 px-4 py-5 text-center text-xs text-[#879490]">
                No climbs logged yet. Tap your card at Floor 1 to start!
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
                      <span className="text-xs font-semibold text-[#E9EFEC]">
                        Floor {t.startFloor} → Floor {t.endFloor}
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
            )}
          </section>
        </div>
      )}

      {/* PAGE 2: DEDICATED LEADERBOARD & TOWER RANKINGS */}
      {activeTab === "LEADERBOARD" && (
        <div className="animate-swiggy-pop flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono-tech text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8B6FFF]">
                Weekly Standings
              </div>
              <h1 className="font-display text-2xl font-extrabold text-[#E9EFEC]">
                Tower Leaderboard
              </h1>
            </div>
            <span className="font-mono-tech rounded-full border border-[#00E39D]/40 bg-[#0B5F45]/40 px-3 py-1 text-xs font-bold text-[#00E39D]">
              #{userRank}
            </span>
          </div>

          {/* Top-3 Visual Podium */}
          <section className="grid grid-cols-3 items-end gap-2 pt-2">
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((p, i) => {
              if (!p) return null;
              const isFirst = i === 1;
              const rankNum = isFirst ? 1 : i === 0 ? 2 : 3;
              const borderCol = isFirst
                ? "border-[#F2A93B]/60 bg-[#F2A93B]/10"
                : i === 0
                ? "border-white/20 bg-[#131816]"
                : "border-[#D98B5F]/40 bg-[#131816]";
              return (
                <div
                  key={p.id}
                  className={`flex flex-col items-center rounded-2xl border p-3 text-center ${borderCol} ${
                    isFirst ? "py-4" : "py-3"
                  }`}
                >
                  <span className="font-mono-tech text-[10px] font-extrabold text-[#F2A93B]">
                    #{rankNum}
                  </span>
                  <div className="font-display mt-1 truncate text-xs font-extrabold text-[#E9EFEC]">
                    {p.name}
                  </div>
                  <div className="font-mono-tech text-[9px] text-[#879490]">
                    {p.dept}
                  </div>
                  <div className="font-display mt-2 text-lg font-extrabold text-[#00E39D]">
                    {p.floors}
                  </div>
                  <div className="font-mono-tech text-[8.5px] uppercase text-[#879490]">
                    floors
                  </div>
                </div>
              );
            })}
          </section>

          {/* Full Ranked List */}
          <section className="rounded-2xl border border-[#232B28] bg-[#131816] p-3.5">
            <div className="flex flex-col gap-2">
              {leaderboard.map((row, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={row.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                      row.isUser
                        ? "border-[#00E39D]/55 bg-[#0B5F45]/25"
                        : "border-[#1B2320] bg-[#0A0D0C]/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tech grid h-7 w-7 place-items-center rounded-full bg-[#1A211E] text-[11px] font-bold text-[#E9EFEC]">
                        {rank}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-[#E9EFEC]">
                          {row.name}
                          {row.isUser && (
                            <span className="font-mono-tech ml-1.5 text-[9px] font-bold text-[#00E39D]">
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
        </div>
      )}

      {/* PAGE 3: CLIMBHUB — NON-SCROLLING VIEWPORT-LOCKED TAP-IN / TAP-OUT */}
      {activeTab === "CLIMB" && (
        <div
          key={climbStage}
          className="animate-swiggy-pop flex flex-1 flex-col justify-between overflow-hidden py-1"
        >
          {/* Minimal Clean Headline Only */}
          <div className="shrink-0 px-1">
            {climbStage === "READY" && (
              <>
                <div className="font-mono-tech mb-1 text-xs font-medium text-[#8B6FFF]">
                  Ready to Climb?
                </div>
                <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Tap the Device near a ClimbHub
                </h1>
              </>
            )}

            {climbStage === "CLIMBING" && (
              <h1 className="font-display mt-2 text-[28px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                Start Climbing...
              </h1>
            )}

            {climbStage === "EARNED" && (
              <>
                <div className="font-mono-tech mb-1 text-xs font-semibold text-[#00E39D]">
                  +{lastVerdict?.pointsAwarded ?? 0} ClimbCoins
                </div>
                <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Tap out
                </h1>
              </>
            )}

            {climbStage === "SPOOF" && (
              <>
                <div className="font-mono-tech mb-1 text-xs font-semibold text-[#F2A93B]">
                  Lift Detected
                </div>
                <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-tight text-[#E9EFEC]">
                  Take the Stairs
                </h1>
              </>
            )}
          </div>

          {/* Centerpiece Interactive ClimbHub Emblem */}
          <div className="flex flex-1 items-center justify-center">
            <ClimbHubHero
              mode={climbStage}
              progressRatio={climbProgress}
              onTap={() => void handlePrimaryClimbTap()}
            />
          </div>

          {/* Bottom Pill Action + Low-Opacity NFC Active Micro-Text */}
          <div className="flex shrink-0 flex-col items-center gap-2.5 pb-1">
            <button
              type="button"
              disabled={verifying}
              onClick={() => void handlePrimaryClimbTap()}
              className={`font-display w-full max-w-[260px] rounded-full border px-6 py-3.5 text-[17px] font-extrabold tracking-tight shadow-lg transition active:scale-95 disabled:opacity-60 ${
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

      {/* PAGE 4: REWARDS — EDITORIAL CAFE PHOTOS + CASHBACK & COUPON CODES */}
      {activeTab === "REWARDS" && (
        <div className="animate-swiggy-pop flex flex-1 flex-col gap-4">
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

      {/* 4-PAGE FLOATING MINIMAL BASAL-ICON NAV BAR */}
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#131816]/85 p-1.5 shadow-[0_14px_38px_rgba(0,0,0,0.75)] backdrop-blur-xl"
      >
        {/* 1. Home Icon */}
        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("HOME");
          }}
          aria-label="Home"
          className={`grid h-11 w-12 place-items-center rounded-full transition active:scale-90 ${
            activeTab === "HOME"
              ? "bg-[#1F2925] text-[#00E39D]"
              : "text-[#879490] hover:text-[#E9EFEC]"
          }`}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
          </svg>
        </button>

        {/* 2. Leaderboard Icon */}
        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("LEADERBOARD");
          }}
          aria-label="Leaderboard"
          className={`grid h-11 w-12 place-items-center rounded-full transition active:scale-90 ${
            activeTab === "LEADERBOARD"
              ? "bg-[#1F2925] text-[#F2A93B]"
              : "text-[#879490] hover:text-[#E9EFEC]"
          }`}
        >
          <svg
            width="19"
            height="19"
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

        {/* 3. ClimbCoin Emblem Icon (Main Tap-In / Tap-Out Page) */}
        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("CLIMB");
          }}
          aria-label="ClimbHub"
          className={`grid h-11 w-14 place-items-center rounded-full transition active:scale-90 ${
            activeTab === "CLIMB"
              ? "bg-[#00E39D]/20 ring-1 ring-[#00E39D] shadow-[0_0_18px_rgba(0,227,157,0.35)]"
              : "bg-[#1A211E] opacity-80 hover:opacity-100"
          }`}
        >
          <ClimbLogoSvg size={24} />
        </button>

        {/* 4. Rewards Icon */}
        <button
          type="button"
          onClick={() => {
            playTick();
            setActiveTab("REWARDS");
          }}
          aria-label="Rewards"
          className={`grid h-11 w-12 place-items-center rounded-full transition active:scale-90 ${
            activeTab === "REWARDS"
              ? "bg-[#1F2925] text-[#8B6FFF]"
              : "text-[#879490] hover:text-[#E9EFEC]"
          }`}
        >
          <svg
            width="19"
            height="19"
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
