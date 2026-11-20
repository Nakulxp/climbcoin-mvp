"use client";

export interface AvatarPreset {
  id: string;
  bg: string;
  ring: string;
  text: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "emerald",
    bg: "linear-gradient(135deg, #00E39D, #0B5F45)",
    ring: "rgba(0,227,157,0.45)",
    text: "#052018",
  },
  {
    id: "violet",
    bg: "linear-gradient(135deg, #8B6FFF, #43328E)",
    ring: "rgba(139,111,255,0.45)",
    text: "#F5F3FF",
  },
  {
    id: "amber",
    bg: "linear-gradient(135deg, #F2A93B, #9A5B13)",
    ring: "rgba(242,169,59,0.45)",
    text: "#1B1205",
  },
  {
    id: "cyan",
    bg: "linear-gradient(135deg, #38BDF8, #0369A1)",
    ring: "rgba(56,189,248,0.45)",
    text: "#041A27",
  },
  {
    id: "rose",
    bg: "linear-gradient(135deg, #FB7185, #9F1239)",
    ring: "rgba(251,113,133,0.45)",
    text: "#FFF1F2",
  },
];

function getInitials(name: string): string {
  const cleaned = (name || "C").trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function ProfileAvatar({
  name,
  avatarId = "emerald",
  size = 34,
}: {
  name: string;
  avatarId?: string;
  size?: number;
}) {
  const preset =
    AVATAR_PRESETS.find((p) => p.id === avatarId) ?? AVATAR_PRESETS[0];

  return (
    <span
      className="font-display inline-flex shrink-0 items-center justify-center rounded-full font-extrabold select-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.max(10, Math.round(size * 0.36))}px`,
        background: preset.bg,
        color: preset.text,
        boxShadow: `0 0 0 2px ${preset.ring}`,
      }}
    >
      {getInitials(name)}
    </span>
  );
}
