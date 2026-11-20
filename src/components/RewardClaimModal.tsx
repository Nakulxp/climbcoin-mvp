"use client";

import { useState } from "react";
import { playTick, playVerified } from "@/lib/buzzer";

export interface ClaimableReward {
  id: string;
  title: string;
  partner: string;
  cost: number;
  tag: string;
  image: string;
  discountLabel?: string;
  codePrefix: string;
  description: string;
}

interface RewardClaimModalProps {
  reward: ClaimableReward | null;
  walletPoints: number;
  existingCode: string | null;
  onClose: () => void;
  onConfirmClaim: (reward: ClaimableReward, generatedCode: string) => void;
}

function generateCouponCode(prefix: string): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CLIMB-${prefix}-${num}`;
}

export function RewardClaimModal({
  reward,
  walletPoints,
  existingCode,
  onClose,
  onConfirmClaim,
}: RewardClaimModalProps) {
  const [unlockedCode, setUnlockedCode] = useState<string | null>(existingCode);
  const [copied, setCopied] = useState(false);

  if (!reward) return null;

  const activeCode = existingCode || unlockedCode;
  const canAfford = walletPoints >= reward.cost;

  const handleConfirm = () => {
    if (!canAfford) return;
    const code = generateCouponCode(reward.codePrefix);
    playVerified();
    setUnlockedCode(code);
    onConfirmClaim(reward, code);
  };

  const handleCopy = async () => {
    if (!activeCode) return;
    playTick();
    try {
      await navigator.clipboard.writeText(activeCode);
    } catch {
      // Fallback ignored if clipboard blocked
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        className="animate-swiggy-pop relative z-10 w-full max-w-[400px] overflow-hidden rounded-t-[28px] border border-[#232B28] bg-[#101513] shadow-2xl sm:rounded-[28px]"
      >
        {/* Hero Photo Banner */}
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={reward.image}
            alt={reward.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101513] via-[#101513]/40 to-transparent" />
          <button
            type="button"
            onClick={() => {
              playTick();
              onClose();
            }}
            aria-label="Close"
            className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-xs text-[#E9EFEC] backdrop-blur-md transition active:scale-90"
          >
            ✕
          </button>
          <span className="font-mono-tech absolute bottom-3 left-4 rounded-full bg-[#00E39D]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#00E39D] backdrop-blur-md">
            {reward.tag}
          </span>
        </div>

        <div className="p-5 pt-2">
          {!activeCode ? (
            /* STEP 1: Confirmation Screen */
            <>
              <h3 className="font-display text-xl font-extrabold text-[#E9EFEC]">
                {reward.title}
              </h3>
              <p className="mt-1 text-xs text-[#879490]">
                {reward.partner} · {reward.description}
              </p>

              <div className="my-4 flex items-center justify-between rounded-2xl border border-[#1E2723] bg-[#0A0D0C] px-4 py-3">
                <div>
                  <div className="font-mono-tech text-[10px] uppercase text-[#879490]">
                    Cost
                  </div>
                  <div className="font-display text-lg font-extrabold text-[#00E39D]">
                    {reward.cost} coins
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono-tech text-[10px] uppercase text-[#879490]">
                    After Claim
                  </div>
                  <div className="font-mono-tech text-sm font-bold text-[#E9EFEC]">
                    {Math.max(0, walletPoints - reward.cost)} coins
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    onClose();
                  }}
                  className="font-display flex-1 rounded-full border border-[#232B28] bg-[#161C1A] py-3 text-xs font-bold text-[#B4C0BB] transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={handleConfirm}
                  className="font-display flex-[1.5] rounded-full bg-[#00E39D] py-3 text-xs font-extrabold text-[#052018] shadow-[0_6px_20px_rgba(0,227,157,0.3)] transition active:scale-95 disabled:opacity-40"
                >
                  Confirm & Claim
                </button>
              </div>
            </>
          ) : (
            /* STEP 2: Unlocked Coupon Code Screen */
            <div className="animate-swiggy-pop flex flex-col items-center text-center">
              <div className="animate-spring-check mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#00E39D] text-xl font-black text-[#052018] shadow-[0_0_24px_rgba(0,227,157,0.5)]">
                ✓
              </div>
              <h3 className="font-display text-xl font-extrabold text-[#E9EFEC]">
                Voucher Unlocked
              </h3>
              <p className="mt-0.5 text-xs text-[#879490]">
                {reward.title} · {reward.partner}
              </p>

              {/* Coupon Code Box */}
              <div className="mt-4 w-full rounded-2xl border border-dashed border-[#00E39D]/60 bg-[#0A0D0C] p-4">
                <div className="font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-[#879490]">
                  Redemption Code
                </div>
                <div className="font-mono-tech mt-1 text-2xl font-extrabold tracking-[0.14em] text-[#00E39D]">
                  {activeCode}
                </div>

                {/* Minimal barcode visual */}
                <div className="mx-auto mt-3 flex h-7 w-4/5 items-center justify-center gap-[3px] opacity-60">
                  {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 2].map(
                    (w, i) => (
                      <span
                        key={i}
                        className="h-full rounded-xs bg-[#E9EFEC]"
                        style={{ width: `${w * 2}px` }}
                      />
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="font-mono-tech mt-3.5 w-full rounded-full border border-[#232B28] bg-[#161C1A] py-2 text-[11px] font-bold text-[#E9EFEC] transition hover:border-[#00E39D] active:scale-95"
                >
                  {copied ? "✓ Copied to Clipboard" : "Copy Coupon Code"}
                </button>
              </div>

              <p className="mt-3 text-[11px] text-[#879490]">
                Show this code at the counter or paste it at checkout.
              </p>

              <button
                type="button"
                onClick={() => {
                  playTick();
                  onClose();
                }}
                className="font-display mt-3 w-full rounded-full bg-[#1B2320] py-3 text-xs font-bold text-[#E9EFEC] transition active:scale-95"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
