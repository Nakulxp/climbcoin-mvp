"use client";

import { useState } from "react";
import { ClimbLogoSvg } from "@/components/ClimbMark";
import { playTick } from "@/lib/buzzer";

interface NfcCardScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAnchor: "F1" | "F4";
  webNfcSupported: boolean;
  webNfcArmed: boolean;
  onArmWebNfc: () => Promise<void>;
  onTriggerCardTap: (anchor: "F1" | "F4", serial?: string) => void;
  lastTagSerial?: string | null;
}

export function NfcCardScanModal({
  isOpen,
  onClose,
  targetAnchor,
  webNfcSupported,
  webNfcArmed,
  onArmWebNfc,
  onTriggerCardTap,
  lastTagSerial,
}: NfcCardScanModalProps) {
  const [simulating, setSimulating] = useState(false);

  if (!isOpen) return null;

  const isF1 = targetAnchor === "F1";
  const themeColor = isF1 ? "#00E39D" : "#8B6FFF";

  const handleSimulateTap = () => {
    playTick();
    setSimulating(true);
    setTimeout(() => {
      onTriggerCardTap(targetAnchor, lastTagSerial || "2A:72:B5:62");
      setSimulating(false);
      onClose();
    }, 320);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4">
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          playTick();
          onClose();
        }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nfc-help-title"
        className="animate-swiggy-pop relative z-10 flex w-full max-w-[400px] flex-col rounded-t-[28px] border border-[#232B28] bg-[#101513] p-5 shadow-2xl sm:rounded-[28px]"
      >
        <div className="flex items-start justify-between">
          <div>
            <div
              className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ color: themeColor }}
            >
              How to Climb · NFC Guide
            </div>
            <h2
              id="nfc-help-title"
              className="font-display mt-1 text-xl font-extrabold text-[#E9EFEC]"
            >
              Tap Your ClimbCoin Card
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              playTick();
              onClose();
            }}
            aria-label="Close help drawer"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#232B28] bg-[#171E1B] text-xs text-[#879490] transition hover:text-[#E9EFEC] active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Compact Animated 3D Physical ID Card Visual inside Help Drawer */}
        <div className="relative my-4 flex h-[175px] w-full items-center justify-center overflow-hidden rounded-2xl border border-[#1E2723] bg-[#0A0D0C]">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className="animate-radar-sweep absolute h-20 w-20 rounded-full border border-dashed"
              style={{ borderColor: themeColor }}
            />
            <span
              className="animate-radar-sweep-delayed absolute h-32 w-32 rounded-full border"
              style={{ borderColor: themeColor, opacity: 0.5 }}
            />
          </div>

          <div
            className="animate-card-hover relative z-10 w-[216px] rounded-xl border border-[#2B3833] bg-[#141B18] p-3 shadow-2xl"
            style={{ perspective: "1000px" }}
          >
            <div className="animate-holo-shimmer pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/[0.06] to-transparent bg-[length:200%_100%]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ClimbLogoSvg size={18} />
                <span className="font-display text-[10px] font-extrabold tracking-wide text-[#E9EFEC]">
                  CLIMBCOIN PASS
                </span>
              </div>
              <span className="font-mono-tech rounded bg-[#1C2622] px-1.5 py-0.5 text-[7.5px] font-semibold text-[#00E39D]">
                READ-ONLY
              </span>
            </div>

            <div className="my-2 flex items-center justify-between">
              <div className="h-6 w-8 rounded border border-[#C5A059]/60 bg-gradient-to-br from-[#E2B96F] to-[#8C6B2F]" />
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F2A93B"
                strokeWidth="2.4"
                strokeLinecap="round"
                className="animate-nfc-wave"
              >
                <path d="M7 9a6 6 0 0 1 0 6" />
                <path d="M10 6a10 10 0 0 1 0 12" />
                <path d="M13 3a14 14 0 0 1 0 18" />
              </svg>
            </div>

            <div className="flex items-end justify-between border-t border-[#232F2A] pt-1.5">
              <span className="font-mono-tech text-[9px] font-bold text-[#E9EFEC]">
                {lastTagSerial || "2A:72:B5:62"}
              </span>
              <span
                className="font-mono-tech text-[9px] font-bold"
                style={{ color: themeColor }}
              >
                {isF1 ? "1st Tap · F1" : "2nd Tap · F4"}
              </span>
            </div>
          </div>
        </div>

        {/* Concise 2-step guide */}
        <div className="mb-4 flex flex-col gap-2 text-xs text-[#B4C0BB]">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#1B2320] bg-[#0A0D0C] px-3 py-2">
            <span className="font-mono-tech grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#00E39D]/15 text-[10px] font-bold text-[#00E39D]">
              1
            </span>
            <span>Hold card to the back of your phone on Floor 1 to start.</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-[#1B2320] bg-[#0A0D0C] px-3 py-2">
            <span className="font-mono-tech grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#8B6FFF]/20 text-[10px] font-bold text-[#8B6FFF]">
              2
            </span>
            <span>Climb to Floor 4 and tap again to verify & claim coins.</span>
          </div>
        </div>

        {/* Status & Optional Test Simulator */}
        <div className="flex flex-col gap-2">
          {webNfcSupported && !webNfcArmed && (
            <button
              type="button"
              onClick={() => void onArmWebNfc()}
              className="font-display w-full rounded-full border border-[#00E39D] bg-[#00E39D]/15 py-2.5 text-xs font-bold text-[#00E39D] transition active:scale-95"
            >
              Activate Phone NFC Reader
            </button>
          )}

          <button
            type="button"
            disabled={simulating}
            onClick={handleSimulateTap}
            className="font-display w-full rounded-full bg-[#00E39D] py-3 text-xs font-extrabold text-[#052018] transition active:scale-95 disabled:opacity-60"
          >
            {simulating
              ? "Tapping..."
              : `Simulate Card Tap (${isF1 ? "Floor 1" : "Floor 4"})`}
          </button>
        </div>
      </div>
    </div>
  );
}
