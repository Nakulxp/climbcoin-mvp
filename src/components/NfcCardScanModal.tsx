"use client";

import { useEffect, useState } from "react";
import { ClimbLogoSvg } from "@/components/ClimbMark";
import { playTapIn, playTick, playVerified } from "@/lib/buzzer";

interface NfcCardScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAnchor: "F1" | "F4";
  isClimbing: boolean;
  webNfcSupported: boolean;
  webNfcArmed: boolean;
  onArmWebNfc: () => Promise<void>;
  onTriggerCardTap: (anchor: "F1" | "F4", serial?: string) => void;
  lastTagSerial?: string | null;
  detectedSuccess: boolean;
  buildingName: string;
}

export function NfcCardScanModal({
  isOpen,
  onClose,
  targetAnchor,
  isClimbing,
  webNfcSupported,
  webNfcArmed,
  onArmWebNfc,
  onTriggerCardTap,
  lastTagSerial,
  detectedSuccess,
  buildingName,
}: NfcCardScanModalProps) {
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (isOpen && !webNfcArmed && webNfcSupported) {
      // Auto-arm NFC reader when the scan modal opens
      void onArmWebNfc();
    }
  }, [isOpen, webNfcArmed, webNfcSupported, onArmWebNfc]);

  if (!isOpen) return null;

  const isF1 = targetAnchor === "F1";
  const themeColor = isF1 ? "#00E39D" : "#8B6FFF";
  const glowColor = isF1 ? "rgba(0,227,157,0.3)" : "rgba(139,111,255,0.3)";

  const handleSimulateTap = () => {
    playTick();
    setSimulating(true);
    // Trigger simulated physical card detection with user's Mifare Classic UID
    setTimeout(() => {
      onTriggerCardTap(targetAnchor, "2A:72:B5:62");
      setSimulating(false);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 sm:items-center sm:p-4">
      {/* Tap backdrop to dismiss */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          playTick();
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nfc-modal-title"
        className="animate-swiggy-pop relative z-10 flex w-full max-w-[420px] flex-col rounded-t-[32px] border border-[#232B28] bg-[#101513] p-6 shadow-2xl sm:rounded-[32px]"
        style={{
          boxShadow: `0 -10px 40px ${glowColor}, 0 20px 50px rgba(0,0,0,0.85)`,
        }}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-start justify-between">
          <div>
            <div
              className="font-mono-tech flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: themeColor }}
            >
              <span
                className="h-2 w-2 rounded-full animate-ping"
                style={{ backgroundColor: themeColor }}
              />
              {isF1 ? "Step 1 of 2 · Stairwell Tap In" : "Step 2 of 2 · Summit Tap Out"}
            </div>
            <h2
              id="nfc-modal-title"
              className="font-display mt-1 text-2xl font-extrabold text-[#E9EFEC]"
            >
              {isF1 ? "Hold Card to Phone" : "Tap Card at Floor 4"}
            </h2>
            <p className="mt-1 text-xs text-[#879490]">
              {isF1
                ? "Hold your ClimbCoin ID card against the back top antenna of your phone."
                : "Hold your card against the back of your phone to lock Floor 4 and claim coins."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playTick();
              onClose();
            }}
            aria-label="Close NFC Scanner"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#232B28] bg-[#171E1B] text-[#879490] transition hover:text-[#E9EFEC] active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Center Animated Stage: Phone Antenna + Floating Physical Card */}
        <div className="relative my-6 flex h-[210px] w-full items-center justify-center overflow-hidden rounded-2xl border border-[#1E2723] bg-[#0A0D0C]/80">
          {/* Concentric Radar Waves emanating from antenna location */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className="animate-radar-sweep absolute h-24 w-24 rounded-full border border-dashed"
              style={{ borderColor: themeColor }}
            />
            <span
              className="animate-radar-sweep-delayed absolute h-36 w-36 rounded-full border"
              style={{ borderColor: themeColor, opacity: 0.6 }}
            />
            <span
              className="animate-halo-ripple absolute h-52 w-52 rounded-full"
              style={{
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              }}
            />
          </div>

          {/* Floating Physical ID Card Graphic */}
          <div
            className={`relative z-10 w-[240px] rounded-xl border p-3.5 shadow-2xl transition-all duration-500 ${
              detectedSuccess
                ? "animate-card-contact scale-100 border-[#00E39D] bg-[#0E1A15]"
                : "animate-card-hover border-[#2B3833] bg-[#141B18]"
            }`}
            style={{
              perspective: "1000px",
              boxShadow: detectedSuccess
                ? "0 0 35px rgba(0,227,157,0.5)"
                : "0 14px 28px rgba(0,0,0,0.6)",
            }}
          >
            {/* Metallic / Holographic gleam overlay */}
            <div className="animate-holo-shimmer pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/[0.07] to-transparent bg-[length:200%_100%]" />

            {/* Top row: Logo + Card Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ClimbLogoSvg size={20} />
                <span className="font-display text-[11px] font-extrabold tracking-wide text-[#E9EFEC]">
                  CLIMBCOIN PASS
                </span>
              </div>
              <span className="font-mono-tech rounded bg-[#1C2622] px-1.5 py-0.5 text-[8px] font-semibold uppercase text-[#00E39D]">
                Mifare 1K
              </span>
            </div>

            {/* Middle: Gold NFC Chip Emblem */}
            <div className="my-2.5 flex items-center justify-between">
              <div className="relative flex h-7 w-9 items-center justify-center rounded-md border border-[#C5A059]/60 bg-gradient-to-br from-[#E2B96F] to-[#8C6B2F] p-1 shadow-inner">
                {/* Chip circuit lines */}
                <div className="grid h-full w-full grid-cols-2 gap-0.5 rounded border border-[#6E501C]/50">
                  <div className="border-b border-r border-[#6E501C]/40" />
                  <div className="border-b border-[#6E501C]/40" />
                  <div className="border-r border-[#6E501C]/40" />
                  <div />
                </div>
              </div>

              {/* NFC Wireless Wave Graphic */}
              <div className="flex items-center gap-0.5 text-[#F2A93B]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  className="animate-nfc-wave"
                >
                  <path d="M7 9a6 6 0 0 1 0 6" />
                  <path d="M10 6a10 10 0 0 1 0 12" />
                  <path d="M13 3a14 14 0 0 1 0 18" />
                </svg>
              </div>
            </div>

            {/* Bottom info: Physical Card UID from NFC Tools + Building */}
            <div className="mt-1 flex items-end justify-between border-t border-[#232F2A] pt-1.5">
              <div>
                <div className="font-mono-tech text-[7.5px] uppercase tracking-wider text-[#879490]">
                  Hardware UID
                </div>
                <div className="font-mono-tech text-[9.5px] font-bold text-[#E9EFEC]">
                  {lastTagSerial || "2A:72:B5:62"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono-tech text-[7.5px] uppercase tracking-wider text-[#879490]">
                  Location Anchor
                </div>
                <div className="font-mono-tech text-[9.5px] font-bold" style={{ color: themeColor }}>
                  {isF1 ? "Floor 1 (Entry)" : "Floor 4 (Exit)"}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Success Overlay with Spring Pop Checkmark */}
          {detectedSuccess && (
            <div className="animate-spring-check absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00E39D] text-3xl font-extrabold text-[#052018] shadow-[0_0_30px_rgba(0,227,157,0.8)]">
                ✓
              </div>
              <div className="font-display mt-2 text-base font-extrabold text-[#E9EFEC]">
                {isF1 ? "Floor 1 Tap-In Confirmed!" : "Floor 4 Tap-Out Verified!"}
              </div>
              <div className="font-mono-tech text-[10.5px] text-[#00E39D]">
                Physical UID: {lastTagSerial || "2A:72:B5:62"}
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Detection Status Banner */}
        <div className="mb-4 rounded-xl border border-[#1E2723] bg-[#0A0D0C] p-3 text-center">
          {detectedSuccess ? (
            <div className="font-mono-tech text-xs font-bold text-[#00E39D]">
              ⚡ Tag Read Successfully! Initializing Stair Climb...
            </div>
          ) : webNfcArmed ? (
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00E39D] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00E39D]" />
              </span>
              <span className="font-mono-tech text-xs font-semibold text-[#E9EFEC]">
                Hardware NFC Antenna Active — Awaiting Contact
              </span>
            </div>
          ) : webNfcSupported ? (
            <button
              type="button"
              onClick={() => void onArmWebNfc()}
              className="font-mono-tech text-xs font-bold text-[#00E39D] underline underline-offset-2 hover:text-[#2BF0B2]"
            >
              Tap here to Arm Chrome NFC Scanner
            </button>
          ) : (
            <span className="font-mono-tech text-[11px] text-[#879490]">
              Web NFC not active on this browser · Use one-tap simulation below:
            </span>
          )}
        </div>

        {/* Action Buttons: 1-Tap Physical Simulation for quick testing */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={detectedSuccess || simulating}
            onClick={handleSimulateTap}
            className={`font-display flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-extrabold transition active:scale-95 disabled:opacity-60 ${
              detectedSuccess
                ? "bg-[#0B5F45] text-[#00E39D]"
                : "border border-[#00E39D] bg-[#00E39D] text-[#052018] shadow-[0_4px_20px_rgba(0,227,157,0.25)] hover:bg-[#2BF0B2]"
            }`}
          >
            {detectedSuccess ? (
              <span>✓ Contact Verified!</span>
            ) : simulating ? (
              <span>Detecting Card Antenna...</span>
            ) : (
              <span>⚡ Tap Physical ID Card ({isF1 ? "Floor 1" : "Floor 4"})</span>
            )}
          </button>

          <p className="font-mono-tech text-center text-[10px] text-[#879490]">
            🔒 Zero-Write Safe: Your physical Mifare 1K card memory is never erased or overwritten.
          </p>
        </div>
      </div>
    </div>
  );
}
