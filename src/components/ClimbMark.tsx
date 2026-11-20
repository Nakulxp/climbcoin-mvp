interface ClimbWordmarkProps {
  subtitle?: string;
  compact?: boolean;
}

export function ClimbWordmark({ subtitle, compact = false }: ClimbWordmarkProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid shrink-0 place-items-center rounded-[9px] bg-[#00E39D] ${
          compact ? "h-7 w-7" : "h-[30px] w-[30px]"
        }`}
        aria-hidden="true"
      >
        <svg
          width={compact ? 15 : 17}
          height={compact ? 15 : 17}
          viewBox="0 0 17 17"
          fill="none"
        >
          <path
            d="M8.5 1.6c1.1 1.9.8 3.6-.9 5 .3-2.2-.6-3.8-2.4-4.6.6 2.3 0 3.9-1.8 5.1C4.6 5 4 3.5 2.2 3.1c1 2.1.7 3.8-1 5.4h8.6c2.3 0 4-1.3 4.4-3.5-1.7 1.2-3.3 1.2-4.8-.1 2-.6 3-1.9 3-3.8-1.4 1.2-2.7 1.5-3.9.5z"
            fill="#052018"
          />
          <circle cx="8.5" cy="11.6" r="2.1" fill="#052018" />
        </svg>
      </span>
      <div className="flex flex-col leading-none">
        <span
          className={`font-display font-extrabold tracking-[-0.02em] text-[#E9EFEC] ${
            compact ? "text-base" : "text-[1.25rem]"
          }`}
        >
          ClimbCoin
        </span>
        {subtitle && (
          <span className="font-mono-tech mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#879490]">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
