import { BarChart3 } from "lucide-react";

interface LogoProps {
  size?: "sm" | "lg";
}

export default function Logo({ size = "sm" }: LogoProps) {
  const iconSize = size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const textSize = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex items-center gap-2">
      <BarChart3 className={`${iconSize} text-primary`} strokeWidth={2.5} />
      <span className={`${textSize} font-bold text-slate-900`}>FinSight AI</span>
    </div>
  );
}