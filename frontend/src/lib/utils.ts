import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

export function getStatusConfig(status: string) {
  const configs: Record<
    string,
    { label: string; className: string; dotColor: string }
  > = {
    on_track: {
      label: "En tiempo",
      className: "bg-success-50 text-success-500",
      dotColor: "bg-success-500",
    },
    at_risk: {
      label: "Alerta costo",
      className: "bg-warning-50 text-warning-500",
      dotColor: "bg-warning-500",
    },
    delayed: {
      label: "Retrasada",
      className: "bg-danger-50 text-danger-500",
      dotColor: "bg-danger-500",
    },
    completed: {
      label: "Completado",
      className: "bg-info-50 text-info-500",
      dotColor: "bg-info-500",
    },
    paused: {
      label: "Pausada",
      className: "bg-gray-100 text-gray-500",
      dotColor: "bg-gray-400",
    },
  };
  return configs[status] || configs.on_track;
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return "bg-success-500";
  if (progress >= 50) return "bg-info-500";
  if (progress >= 30) return "bg-brand-500";
  return "bg-danger-500";
}

export function getBudgetColor(percentage: number): string {
  if (percentage >= 100) return "bg-danger-500";
  if (percentage >= 85) return "bg-danger-500";
  if (percentage >= 70) return "bg-brand-500";
  if (percentage >= 50) return "bg-info-500";
  return "bg-success-500";
}
