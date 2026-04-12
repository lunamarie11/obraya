import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({ initials, color, size = "md" }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shrink-0",
        size === "sm" && "w-6 h-6 text-[9px]",
        size === "md" && "w-8 h-8 text-xs",
        size === "lg" && "w-12 h-12 text-base",
        color
      )}
    >
      {initials}
    </div>
  );
}
