import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Router, AlertTriangle, TrendingUp, Bot, Signal, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: "router" | "alert" | "chart" | "robot" | "signal" | "clock" | "trending-up";
  color: "success" | "error" | "warning" | "info";
  isLoading?: boolean;
}

const iconMap = {
  router: Router,
  alert: AlertTriangle,
  chart: TrendingUp,
  robot: Bot,
  signal: Signal,
  clock: Clock,
  "trending-up": TrendingUp,
};

const colorMap = {
  success: "text-success bg-success/20",
  error: "text-error bg-error/20",
  warning: "text-warning bg-warning/20",
  info: "text-info bg-info/20",
};

const trendColorMap = {
  up: "text-success",
  down: "text-success", // Down can be good (like failure rate going down)
  neutral: "text-info",
};

export default function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  color,
  isLoading = false,
}: MetricCardProps) {
  const Icon = iconMap[icon];

  if (isLoading) {
    return (
      <Card className="bg-dark-card border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-gray-700" />
              <Skeleton className="h-8 w-20 bg-gray-700" />
              <Skeleton className="h-4 w-40 bg-gray-700" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-card border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            <p className={cn("text-sm mt-1", trendColorMap[trend])}>
              <i className={`fas fa-arrow-${trend === "up" ? "up" : trend === "down" ? "down" : "right"} mr-1`}></i>
              {change}
            </p>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", colorMap[color])}>
            <Icon className="text-xl w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}