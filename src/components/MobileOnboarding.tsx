"use client";

import { useEffect, useState } from "react";
import { ClimbLogoSvg } from "@/components/ClimbMark";
import { AVATAR_PRESETS, ProfileAvatar } from "@/components/ProfileAvatar";
import { playTapIn, playTick } from "@/lib/buzzer";
import { DepartmentName } from "@/lib/types";

export interface UserLocalProfile {
  name: string;
  avatarId?: string;
  buildingId: string;
  buildingName: string;
  department: DepartmentName;
}

export const SAMPLE_BUILDINGS = [
  {
    id: "one-horizon",
    name: "One Horizon Tower",
    floors: "18 Floors",
    badge: "2.5x Rush",
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
    badge: "ESG Tower",
  },
  {
    id: "embassy-g2",
    name: "Embassy Manyata · G2",
    floors: "10 Floors",
    badge: "Live NFC",
  },
];

export const DEPARTMENTS: DepartmentName[] = [
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
  // Step 0 = Quick splash screen, Step 1 = Name + Avatar, Step 2 = Building, Step 3 = Department
  const [step, setStep] = useState<0 | 1 | 2 | 3>(initialProfile ? 1 : 0);
  const [name, setName] = useState(
    initialProfile?.name && initialProfile.name !== "Climber"
      ? initialProfile.name
      : ""
  );
  const [avatarId, setAvatarId] = useState(
    initialProfile?.avatarId ?? AVATAR_PRESETS[0].id
  );
  const [buildingId, setBuildingId] = useState(
    initialProfile?.buildingId ?? SAMPLE_BUILDINGS[0].id
  );
  const [department, setDepartment] = useState<DepartmentName>(
    initialProfile?.department ?? "Engineering"
  );

  // Quick 1.1s animated splash intro for first-time users
  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), 1150);
    return () => clearTimeout(t);
  }, [step]);

  const selectedBuilding =
    SAMPLE_BUILDINGS.find((b) => b.id === buildingId) ?? SAMPLE_BUILDINGS[0];

  const handleFinish = () => {
    playTapIn();
    onComplete({
      name: name.trim() || "Climber",
      avatarId,
      buildingId: selectedBuilding.id,
      buildingName: selectedBuilding.name,
      department,
    });
  };

  if (step === 0) {
    return (
      <main
        onClick={() => setStep(1)}
        className="mx-auto flex h-[100dvh] max-w-[430px] cursor-pointer flex-col items-center justify-center overflow-hidden px-6"
      >
        <div className="animate-splash flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <span className="animate-halo-ripple absolute h-32 w-32 rounded-full border border-[#00E39D]/50" />
            <ClimbLogoSvg size={82} />
          </div>
          <div className="font-display mt-5 text-2xl font-extrabold tracking-tight text-[#E9EFEC]">
            ClimbCoin
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[100dvh] max-w-[430px] flex-col justify-between overflow-hidden px-6 py-8">
      {/* Top Progress Dots + Back */}
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              playTick();
              setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : 1));
            }}
            className="font-mono-tech text-xs text-[#879490] transition hover:text-[#E9EFEC]"
          >
            ← Back
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === dot
                  ? "w-6 bg-[#00E39D]"
                  : step > dot
                  ? "w-2 bg-[#00E39D]/50"
                  : "w-2 bg-[#232B28]"
              }`}
            />
          ))}
        </div>

        <div className="w-10" />
      </div>

      {/* Step Content */}
      <div key={step} className="animate-tab-fade my-auto flex flex-col gap-6">
        {step === 1 && (
          <>
            <div className="flex flex-col items-center text-center">
              <ProfileAvatar name={name || "You"} avatarId={avatarId} size={68} />
              <h1 className="font-display mt-5 text-[28px] font-extrabold leading-tight text-[#E9EFEC]">
                What&apos;s your name?
              </h1>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  playTick();
                  setStep(2);
                }
              }}
              className="w-full rounded-2xl border border-[#232B28] bg-[#131816] px-4 py-4 text-center text-base font-bold text-[#E9EFEC] placeholder-[#879490]/50 outline-none transition focus:border-[#00E39D]"
            />

            {/* Minimal Avatar Color Picker */}
            <div className="flex items-center justify-center gap-3">
              {AVATAR_PRESETS.map((preset) => {
                const active = preset.id === avatarId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={`Select ${preset.id} avatar`}
                    onClick={() => {
                      playTick();
                      setAvatarId(preset.id);
                    }}
                    className={`h-8 w-8 rounded-full transition active:scale-90 ${
                      active ? "scale-110 ring-2 ring-white" : "opacity-65"
                    }`}
                    style={{ background: preset.bg }}
                  />
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-center text-[28px] font-extrabold leading-tight text-[#E9EFEC]">
              Select your building
            </h1>

            <div className="flex flex-col gap-2.5">
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
                    className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition active:scale-[0.98] ${
                      active
                        ? "border-[#00E39D] bg-[#0B5F45]/30"
                        : "border-[#232B28] bg-[#131816]"
                    }`}
                  >
                    <span className="font-display text-sm font-extrabold text-[#E9EFEC]">
                      {b.name}
                    </span>
                    <span className="font-mono-tech text-[10.5px] text-[#879490]">
                      {b.floors}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-center text-[28px] font-extrabold leading-tight text-[#E9EFEC]">
              Your department
            </h1>

            <div className="flex flex-wrap justify-center gap-2.5">
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
                    className={`font-display rounded-full border px-5 py-3 text-sm font-bold transition active:scale-95 ${
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
          </>
        )}
      </div>

      {/* Bottom Action Button */}
      <button
        type="button"
        onClick={() => {
          if (step === 1) {
            playTick();
            setStep(2);
          } else if (step === 2) {
            playTick();
            setStep(3);
          } else {
            handleFinish();
          }
        }}
        className="font-display w-full rounded-full bg-[#00E39D] py-4 text-base font-extrabold text-[#052018] shadow-[0_8px_24px_rgba(0,227,157,0.28)] transition active:scale-95"
      >
        {step === 3 ? "Start Climbing" : "Continue"}
      </button>
    </main>
  );
}
