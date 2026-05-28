export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="sf-mg-app" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <rect
          x="1.5"
          y="1.5"
          width="21"
          height="21"
          rx="6"
          fill="#16161A"
          stroke="rgba(255,255,255,0.12)"
        />
        <path d="M7 8.5 12 6l5 2.5L12 11 7 8.5Z" fill="url(#sf-mg-app)" />
        <path
          d="M7 12 12 14.5 17 12"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.4"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M7 15.5 12 18 17 15.5"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="1.4"
          fill="none"
          strokeLinejoin="round"
        />
      </svg>
      {!compact ? <span className="text-sm font-semibold tracking-[-0.02em]">Simplicit</span> : null}
      {compact ? <span className="sr-only">Simplicit</span> : null}
    </div>
  );
}
