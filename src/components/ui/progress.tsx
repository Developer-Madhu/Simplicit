interface ProgressProps {
  value: number;
  colorClassName?: string;
}

export function Progress({ value, colorClassName = "bg-zinc-100" }: ProgressProps) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClassName}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

