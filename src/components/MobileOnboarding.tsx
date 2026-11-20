"use client";

import { useState } from "react";
import { ClimbHubHero } from "@/components/ClimbHubHero";
import { playTapIn, playTick } from "@/lib/buzzer";
import { DepartmentName } from "@/lib/types";

export interface UserLocalProfile {
  name: string;
  buildingId: string;
  buildingName: string;
  department: DepartmentName;
}

export const SAMPLE_BUILDINGS = [
  {
    id: "one-horizon",
    name: "One Horizon Tower",
    floors: "18 Floors",
    badge: "2.5x Rush Active",
  },
  {
    id: "prestige-b",
    name: "Prestige Tech Park · B",
    floors: "12 Floors",
    badge: "Stairwell A/B",
  },
  {
    id: "rmz-4a",
    name: "RMZ Ecoworld · 4A",
    floors: "14 Floors",
    badge: "ESG Certified",
  },
  {
    id: "embassy-g2",
    name: "Embassy Manyata · G2",
    floors: "10 Floors",
    badge: "Live NFC",
  },
];

const DEPARTMENTS: DepartmentName[] = [
  "Engineering",
  "Product",
  "Operations",
  "Design",
  "Finance",
];

interface MobileOnboardingProps {
  initialProfile?: UserLocalProfile | null;
  onComplete: (profile: UserLocalProfile) => void;
}

export function MobileOnboarding({
  initialProfile,
  onComplete,
}: MobileOnboardingProps) {
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [buildingId, setBuildingId] = useState(
    initialProfile?.buildingId ?? SAMPLE_BUILDINGS[0].id
  );
  const [department, setDepartment] = useState<DepartmentName>(
    initialProfile?.department ?? "Engineering"
  );

  const selectedBuilding =
    SAMPLE_BUILDINGS.find((b) => b.id === buildingId) ?? SAMPLE_BUILDINGS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapIn();
    onComplete({
      name: name.trim() || "Climber",
      buildingId: selectedBuilding.id,
      buildingName: selectedBuilding.name,
      department,
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-between px-5 py-7">
      <div className="animate-swiggy-pop">
        <div className="mb-1 font-mono-tech text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B6FFF]">
          Welcome to ClimbCoin
        </div>
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-[#E9EFEC]">
          Set up your Tower Pass
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-[#879490]">
          Personalize your climb rings and pick your office building. Takes 10
          seconds.
        </p>

        <div className="my-2 scale-[0.72]">
          <ClimbHubHero mode="READY" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 1. First Name (strictly local-only per climbcoin-ops privacy boundary) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="climber-name"
                className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#B4C0BB]"
              >
                Your First Name
              </label>
              <span className="font-mono-tech text-[9.5px] text-[#00E39D]">
                🔒 On-device only
              </span>
            </div>
            <input
              id="climber-name"
              type="text"
              placeholder="e.g. Nakul"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#232B28] bg-[#131816] px-3.5 py-3 text-sm font-semibold text-[#E9EFEC] placeholder-[#879490]/60 outline-none transition focus:border-[#00E39D]"
            />
          </div>

          {/* 2. Building Selection */}
          <div>
            <div className="mb-1.5 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#B4C0BB]">
              Select Your Building
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_BUILDINGS.map((b) => {
                const active = b.id === buildingId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      playTick();
                      setBuildingId(b.id);
                    }}
                    className={`rounded-xl border p-2.5 text-left transition active:scale-[0.97] ${
                      active
                        ? "border-[#00E39D] bg-[#0B5F45]/30 shadow-[0_0_16px_rgba(0,227,157,0.12)]"
                        : "border-[#232B28] bg-[#131816] hover:border-[#232B28]/80"
                    }`}
                  >
                    <div className="truncate text-xs font-bold text-[#E9EFEC]">
                      {b.name}
                    </div>
                    <div className="font-mono-tech mt-1 flex items-center justify-between text-[9.5px]">
                      <span className="text-[#879490]">{b.floors}</span>
                      <span
                        className={
                          active ? "text-[#00E39D]" : "text-[#8B6FFF]"
                        }
                      >
                        {b.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Anonymous Department Pill Picker */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#B4C0BB]">
                Department (Team Leaderboard)
              </span>
              <span className="font-mono-tech text-[9.5px] text-[#879490]">
                Anonymous
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map((dept) => {
                const active = dept === department;
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => {
                      playTick();
                      setDepartment(dept);
                    }}
                    className={`font-mono-tech rounded-full border px-3 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
                      active
                        ? "border-[#8B6FFF] bg-[#2E2456] text-[#E9EFEC]"
                        : "border-[#232B28] bg-[#131816] text-[#879490]"
                    }`}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="font-display mt-2 w-full rounded-full bg-[#00E39D] py-3.5 text-base font-extrabold text-[#052018] shadow-[0_8px_24px_rgba(0,227,157,0.28)] transition hover:bg-[#2BF0B2] active:scale-[0.97]"
          >
            Enter {selectedBuilding.name.split("·")[0].trim()} →
          </button>
        </form>
      </div>
    </main>
  );
}
