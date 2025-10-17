"use client";

interface TransactionLoaderProps {
  count: number;
}

export function TransactionLoader({ count }: TransactionLoaderProps) {
  if (count === 0) return null;

  return (
    <div className="relative flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10">
      {/* Spinning circle */}
      <svg
        className="absolute inset-0 w-7 h-7 sm:w-10 sm:h-10 animate-spin"
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="80"
          strokeDashoffset="20"
          opacity="0.5"
        />
      </svg>

      {/* Transaction count */}
      <span className="relative z-10 text-xs sm:text-sm font-semibold">
        {count}
      </span>
    </div>
  );
}
