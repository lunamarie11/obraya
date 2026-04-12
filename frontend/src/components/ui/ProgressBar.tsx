import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  color?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  color,
  size = "sm",
  showLabel = false,
}: ProgressBarProps) {
  const barColor =
    color ||
    (value >= 80
      ? "bg-success-500"
      : value >= 50
        ? "bg-info-500"
        : value >= 30
          ? "bg-brand-500"
          : "bg-danger-500");

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex-1 bg-gray-100 rounded-full overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-bold text-dark-800 w-10 text-right">
          {value}%
        </span>
      )}
    </div>
  );
}
