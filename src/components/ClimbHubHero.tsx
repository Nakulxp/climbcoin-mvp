"use client";

interface ClimbHubHeroProps {
  mode: "READY" | "CLIMBING" | "EARNED" | "SPOOF";
  progressRatio?: number; // 0..1 controls how many petals fill purple while climbing
  onTap?: () => void;
}

const PETAL_PATHS = [
  "M59.0957 89.1534C66.959 86.7281 67.7069 62.7994 67.7069 62.7994C67.7069 62.7994 63.8986 75.4546 55.9927 77.573C48.0869 79.6913 51.2324 91.5786 59.0957 89.1534Z",
  "M81.2278 87.5236C85.0731 80.2485 68.6817 62.7995 68.6817 62.7995C68.6817 62.7995 74.9374 74.441 70.8451 81.5292C66.7527 88.6173 77.3825 94.7987 81.2278 87.5236Z",
  "M95.0358 70.4304C92.6106 62.5671 68.6819 61.8192 68.6819 61.8192C68.6819 61.8192 81.3371 65.6275 83.4554 73.5334C85.5738 81.4392 97.4611 78.2937 95.0358 70.4304Z",
  "M93.4061 48.2902C86.131 44.4449 68.682 60.8362 68.682 60.8362C68.682 60.8362 80.3234 54.5805 87.4116 58.6729C94.4998 62.7652 100.681 52.1355 93.4061 48.2902Z",
  "M76.3201 34.4821C68.4567 36.9073 67.7089 60.8361 67.7089 60.8361C67.7089 60.8361 71.5172 48.1809 79.423 46.0625C87.3289 43.9441 84.1834 32.0568 76.3201 34.4821Z",
  "M54.1798 36.1119C50.3345 43.387 66.7259 60.8359 66.7259 60.8359C66.7259 60.8359 60.4702 49.1945 64.5625 42.1063C68.6549 35.0181 58.0251 28.8367 54.1798 36.1119Z",
  "M40.3718 53.2108C42.797 61.0742 66.7257 61.822 66.7257 61.822C66.7257 61.822 54.0705 58.0137 51.9522 50.1079C49.8338 42.202 37.9465 45.3475 40.3718 53.2108Z",
  "M42.0015 75.3453C49.2766 79.1906 66.7256 62.7993 66.7256 62.7993C66.7256 62.7993 55.0842 69.055 47.996 64.9626C40.9078 60.8702 34.7264 71.5 42.0015 75.3453Z",
];

export function ClimbHubHero({
  mode,
  progressRatio = 0,
  onTap,
}: ClimbHubHeroProps) {
  const outerColor =
    mode === "EARNED"
      ? "#8B6FFF"
      : mode === "SPOOF"
      ? "#F2A93B"
      : "#00E39D";

  const glowRgba =
    mode === "EARNED"
      ? "rgba(139,111,255,0.32)"
      : mode === "SPOOF"
      ? "rgba(242,169,59,0.26)"
      : "rgba(0,227,157,0.24)";

  // Smoothly fills from 1 purple leaf up to all 8 leaves during the 4-floor climb
  const purplePetalsCount =
    mode === "EARNED"
      ? 8
      : mode === "CLIMBING"
      ? Math.max(1, Math.min(8, Math.ceil(progressRatio * 8)))
      : 0;

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label="ClimbHub interactive emblem"
      className="group relative mx-auto flex h-[252px] w-[252px] items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
    >
      {/* Expanding ambient radar halo */}
      <span
        className="animate-halo-ripple pointer-events-none absolute inset-4 rounded-[68px] border"
        style={{ borderColor: outerColor }}
      />
      <span
        className="pointer-events-none absolute inset-5 rounded-full blur-2xl transition-colors duration-500"
        style={{ background: glowRgba }}
      />

      {/* Exact ClimbCoin interlocking frame + 8-petal turbine SVG */}
      <svg
        width="242"
        height="240"
        viewBox="0 0 135 134"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_14px_32px_rgba(0,0,0,0.65)]"
      >
        <path
          d="M33.0349 26.6746C32.5637 27.5962 32.1373 28.5452 31.7589 29.5193C29.6854 34.8562 29.6851 41.5693 29.6851 54.9949C29.6851 68.4205 29.6854 75.1335 31.7589 80.4704C34.8629 88.4601 41.1805 94.7786 49.1702 97.8827C54.5071 99.9562 61.2202 99.9565 74.6458 99.9565C88.0713 99.9565 94.7844 99.9561 100.121 97.8827C100.611 97.6924 101.095 97.4887 101.572 97.2745C98.1779 103.912 92.4521 109.116 85.4363 111.842C80.0993 113.916 73.3864 113.916 59.9607 113.916C46.5351 113.916 39.8221 113.916 34.4851 111.842C26.4956 108.738 20.1779 102.42 17.0738 94.4309C15.0003 89.0939 15 82.3808 15 68.9553C15 55.5296 15.0004 48.8167 17.0738 43.4797C19.9876 35.9799 25.7329 29.9529 33.0349 26.6746Z"
          fill={outerColor}
          style={{ transition: "fill 0.5s ease" }}
        />
        <path
          d="M101.595 97.2413C102.066 96.3198 102.492 95.3707 102.871 94.3967C104.944 89.0597 104.945 82.3467 104.945 68.9211C104.945 55.4955 104.944 48.7825 102.871 43.4455C99.7666 35.4558 93.4491 29.1374 85.4594 26.0333C80.1224 23.9598 73.4094 23.9595 59.9838 23.9595C46.5583 23.9595 39.8452 23.9599 34.5082 26.0333C34.0183 26.2236 33.535 26.4273 33.058 26.6415C36.4516 20.0037 42.1775 14.7995 49.1933 12.0738C54.5303 10.0004 61.2432 10 74.6689 10C88.0944 10 94.8075 10.0003 100.144 12.0738C108.134 15.1779 114.452 21.4956 117.556 29.4851C119.629 34.8221 119.63 41.5351 119.63 54.9607C119.63 68.3864 119.629 75.0993 117.556 80.4363C114.642 87.9361 108.897 93.963 101.595 97.2413Z"
          fill={outerColor}
          style={{ transition: "fill 0.5s ease" }}
        />

        {/* Center Iconography by Stage */}
        {mode === "READY" ? (
          <g
            className="animate-nfc-wave"
            style={{ transformOrigin: "67.5px 62px" }}
          >
            {/* Left NFC Arcs */}
            <path
              d="M55 54 C50.5 58 50.5 66 55 70"
              stroke="#F2A93B"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M49.5 49.5 C43.5 56 43.5 68 49.5 74.5"
              stroke="#F2A93B"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.82"
            />
            <path
              d="M44 45 C36.5 53.5 36.5 70.5 44 79"
              stroke="#F2A93B"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.58"
            />
            {/* Right NFC Arcs */}
            <path
              d="M80 54 C84.5 58 84.5 66 80 70"
              stroke="#F2A93B"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M85.5 49.5 C91.5 56 91.5 68 85.5 74.5"
              stroke="#F2A93B"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.82"
            />
            <path
              d="M91 45 C98.5 53.5 98.5 70.5 91 79"
              stroke="#F2A93B"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.58"
            />
          </g>
        ) : (
          <g
            className={
              mode === "CLIMBING"
                ? "animate-turbine-fast"
                : "animate-turbine-slow"
            }
            style={{ transformOrigin: "67.5px 62px" }}
          >
            {PETAL_PATHS.map((d, idx) => {
              const isPurple = mode !== "SPOOF" && idx < purplePetalsCount;
              const petalFill =
                mode === "SPOOF"
                  ? "#F2A93B"
                  : isPurple
                  ? "#8B6FFF"
                  : "#00E39D";
              return (
                <path
                  key={idx}
                  d={d}
                  fill={petalFill}
                  style={{
                    transition: "fill 0.45s ease, filter 0.45s ease",
                    filter: isPurple
                      ? "drop-shadow(0 0 4px rgba(139,111,255,0.65))"
                      : "none",
                  }}
                />
              );
            })}
          </g>
        )}
      </svg>
    </button>
  );
}
