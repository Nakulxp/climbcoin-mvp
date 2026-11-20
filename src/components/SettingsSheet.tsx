"use client";

import { useEffect, useState } from "react";
import {
  DEPARTMENTS,
  SAMPLE_BUILDINGS,
  UserLocalProfile,
} from "@/components/MobileOnboarding";
import { AVATAR_PRESETS, ProfileAvatar } from "@/components/ProfileAvatar";
import { playTapIn, playTick } from "@/lib/buzzer";
import { DepartmentName } from "@/lib/types";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserLocalProfile;
  onSaveProfile: (next: UserLocalProfile) => void;
  muted: boolean;
  onToggleMute: () => void;
  onTestNotification: () => Promise<void>;
  onToggleDevMode: () => void;
  onReplayOnboarding: () => void;
}

export function SettingsSheet({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  muted,
  onToggleMute,
  onTestNotification,
  onToggleDevMode,
  onReplayOnboarding,
}: SettingsSheetProps) {
  const [name, setName] = useState(profile.name);
  const [avatarId, setAvatarId] = useState(profile.avatarId ?? "emerald");
  const [buildingId, setBuildingId] = useState(profile.buildingId);
  const [department, setDepartment] = useState<DepartmentName>(
    profile.department
  );

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setAvatarId(profile.avatarId ?? "emerald");
      setBuildingId(profile.buildingId);
      setDepartment(profile.department);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSave = () => {
    const b =
      SAMPLE_BUILDINGS.find((x) => x.id === buildingId) ?? SAMPLE_BUILDINGS[0];
    playTapIn();
    onSaveProfile({
      name: name.trim() || "Climber",
      avatarId,
      buildingId: b.id,
      buildingName: b.name,
      department,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={() => {
          playTick();
          onClose();
        }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="animate-tab-fade relative z-10 max-h-[88dvh] w-full max-w-[410px] overflow-y-auto rounded-t-[28px] border border-[#232B28] bg-[#101513] p-5 shadow-2xl sm:rounded-[28px]"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-[#E9EFEC]">
            Profile & Settings
          </h2>
          <button
            type="button"
            onClick={() => {
              playTick();
              onClose();
            }}
            aria-label="Close settings"
            className="grid h-8 w-8 place-items-center rounded-full border border-[#232B28] bg-[#171E1B] text-xs text-[#879490]"
          >
            ✕
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="mb-4 flex items-center gap-3.5 rounded-2xl border border-[#1E2723] bg-[#0A0D0C] p-3.5">
          <ProfileAvatar name={name || "You"} avatarId={avatarId} size={50} />
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-[#232B28] bg-[#131816] px-3 py-2 text-sm font-bold text-[#E9EFEC] outline-none focus:border-[#00E39D]"
            />
            <div className="mt-2 flex items-center gap-2">
              {AVATAR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    playTick();
                    setAvatarId(p.id);
                  }}
                  className={`h-5 w-5 rounded-full transition ${
                    avatarId === p.id ? "scale-110 ring-2 ring-white" : "opacity-60"
                  }`}
                  style={{ background: p.bg }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Building & Department */}
        <div className="mb-4 flex flex-col gap-3">
          <div>
            <label className="font-mono-tech mb-1 block text-[10px] uppercase tracking-wider text-[#879490]">
              Building
            </label>
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              className="w-full rounded-xl border border-[#232B28] bg-[#131816] px-3 py-2.5 text-xs font-bold text-[#E9EFEC] outline-none focus:border-[#00E39D]"
            >
              {SAMPLE_BUILDINGS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono-tech mb-1 block text-[10px] uppercase tracking-wider text-[#879490]">
              Department
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => {
                    playTick();
                    setDepartment(dept);
                  }}
                  className={`font-mono-tech rounded-full border px-3 py-1.5 text-[10.5px] font-bold transition ${
                    department === dept
                      ? "border-[#8B6FFF] bg-[#2E2456] text-[#E9EFEC]"
                      : "border-[#232B28] bg-[#131816] text-[#879490]"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="font-display mb-4 w-full rounded-full bg-[#00E39D] py-3 text-xs font-extrabold text-[#052018] transition active:scale-95"
        >
          Save Profile
        </button>

        {/* App Controls (Sound, Alerts, Dev Mode, Replay Onboarding) */}
        <div className="flex flex-col gap-2 border-t border-[#1E2723] pt-4">
          <button
            type="button"
            onClick={onToggleMute}
            className="flex items-center justify-between rounded-xl border border-[#1E2723] bg-[#0A0D0C] px-3.5 py-2.5 text-xs font-semibold text-[#E9EFEC]"
          >
            <span>Sound & Haptics</span>
            <span className="font-mono-tech text-[11px] text-[#00E39D]">
              {muted ? "Muted" : "On"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              void onTestNotification();
            }}
            className="flex items-center justify-between rounded-xl border border-[#1E2723] bg-[#0A0D0C] px-3.5 py-2.5 text-xs font-semibold text-[#E9EFEC]"
          >
            <span>Multiplier Alerts</span>
            <span className="font-mono-tech text-[11px] text-[#8B6FFF]">
              Test Alert →
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTick();
              onClose();
              onToggleDevMode();
            }}
            className="flex items-center justify-between rounded-xl border border-[#1E2723] bg-[#0A0D0C] px-3.5 py-2.5 text-xs font-semibold text-[#E9EFEC]"
          >
            <span>Developer Telemetry Mode</span>
            <span className="font-mono-tech text-[11px] text-[#879490]">
              DEV →
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTick();
              onClose();
              onReplayOnboarding();
            }}
            className="font-mono-tech mt-1 text-center text-[10.5px] text-[#879490] underline underline-offset-2"
          >
            Replay Intro Onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
