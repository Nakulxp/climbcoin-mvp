"use client";

import { playTapIn } from "@/lib/buzzer";

export interface QuirkyAlert {
  id: string;
  tag: string;
  title: string;
  body: string;
  multiplier: number;
  accent: string;
}

const PEAK_RUSH_ALERTS: Omit<QuirkyAlert, "id">[] = [
  {
    tag: "2.5x PEAK RUSH",
    title: "🔥 2.5x ClimbCoins Live!",
    body: "The elevator has trust issues today. Take the stairs & flex on your calves for 2.5x points.",
    multiplier: 2.5,
    accent: "#00E39D",
  },
  {
    tag: "2.5x LUNCH RUSH",
    title: "⚡ Double-Plus Coins Active!",
    body: "Burn that lunch before it even lands. 4 floors right now = fastest route to a free iced latte.",
    multiplier: 2.5,
    accent: "#00E39D",
  },
  {
    tag: "2.5x SURGE",
    title: "🚀 Elevator queue? Couldn't be you.",
    body: "2.5x multiplier is ON in the stairwell. Skip the awkward lift silence & stack ClimbCoins!",
    multiplier: 2.5,
    accent: "#00E39D",
  },
];

const BASELINE_ALERTS: Omit<QuirkyAlert, "id">[] = [
  {
    tag: "STREAK NUDGE",
    title: "☕ Your coffee is 4 floors away",
    body: "1 quick stair climb keeps your streak glowing and drops another batch of ClimbCoins in your wallet.",
    multiplier: 1.0,
    accent: "#8B6FFF",
  },
  {
    tag: "CLIMBCLUB",
    title: "👀 Your streak is sweating...",
    body: "One 30-second climb from Floor 1 to 4 keeps your leaderboard rank safe today!",
    multiplier: 1.0,
    accent: "#8B6FFF",
  },
];

const THROTTLE_ALERT: Omit<QuirkyAlert, "id"> = {
  tag: "0.75x CROWD GUARDRAIL",
  title: "🚦 Stairwell is popping off!",
  body: "Over 25 climbers/min right now — multiplier throttled to 0.75x for smooth traffic. Give it 2 mins!",
  multiplier: 0.75,
  accent: "#F2A93B",
};

export function pickQuirkyAlert(multiplier: number): QuirkyAlert {
  const id = `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  if (multiplier <= 0.8) {
    return { id, ...THROTTLE_ALERT };
  }
  if (multiplier >= 1.5) {
    const pick =
      PEAK_RUSH_ALERTS[Math.floor(Math.random() * PEAK_RUSH_ALERTS.length)];
    return { id, ...pick, multiplier };
  }
  const pick =
    BASELINE_ALERTS[Math.floor(Math.random() * BASELINE_ALERTS.length)];
  return { id, ...pick, multiplier };
}

export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function fireQuirkyBrowserNotification(alert: QuirkyAlert): void {
  playTapIn();
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      new Notification(alert.title, {
        body: alert.body,
        tag: "climbcoin-multiplier",
      });
    } catch {
      // Some mobile browsers require ServiceWorkerRegistration.showNotification;
      // in-app Zomato-style toast still displays cleanly as fallback.
    }
  }
}
