import { AlertTriangle, AlertCircle, Info } from "lucide-react";

type Severity = "ALTA" | "MEDIA" | "BAJA";

interface AlertCardProps {
  severity: Severity;
  message: string;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; classes: string; icon: typeof AlertTriangle }> = {
  ALTA: { label: "High", classes: "border-red-200 bg-red-50 text-red-700", icon: AlertTriangle },
  MEDIA: { label: "Medium", classes: "border-amber-200 bg-amber-50 text-amber-700", icon: AlertCircle },
  BAJA: { label: "Low", classes: "border-blue-200 bg-blue-50 text-blue-700", icon: Info },
};

export default function AlertCard({ severity, message }: AlertCardProps) {
  const config = SEVERITY_CONFIG[severity];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${config.classes}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <span className="text-xs font-bold uppercase tracking-wide">{config.label} severity</span>
        <p className="mt-1 text-sm">{message}</p>
      </div>
    </div>
  );
}