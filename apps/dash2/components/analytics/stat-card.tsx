import type { LucideIcon } from "lucide-react";
import { 
  Card, 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMetricNumber } from "@/lib/formatters";
import TrendArrow from "@/components/atomic/TrendArrow";
import TrendPercentage from "@/components/atomic/TrendPercentage";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  isLoading?: boolean;
  className?: string;
  variant?: "default" | "success" | "info" | "warning" | "danger";
  // Flag to indicate if decreasing values are positive (e.g., bounce rate, page load time)
  invertTrend?: boolean;
  id?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  isLoading = false,
  className,
  variant = "default",
  invertTrend = false,
  id,
}: StatCardProps) {
  // Determine color based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
      case "info":
        return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900";
      case "danger":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)} id={id}>
        <div className="p-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            {Icon && <Skeleton className="h-4 w-4 rounded-full" />}
          </div>
          <Skeleton className="h-7 w-20 mt-2" />
          <Skeleton className="h-3 w-16 mt-2" />
        </div>
      </Card>
    );
  }

  // Check if value is a time string (like "5h 9m 23s")
  const isTimeValue = typeof value === 'string' && /\d+[hm]\s+\d+[ms]/.test(value);

  // Use formatMetricNumber for value display, unless it's a pre-formatted string (like time or already has %)
  const displayValue = (typeof value === 'number' || (typeof value === 'string' && !value.endsWith('%') && !isTimeValue))
    ? formatMetricNumber(Number(value)) // Ensure value is number for formatMetricNumber
    : value.toString();

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md py-1 sm:py-2", getVariantClasses(), className)} id={id}>
      <div className="p-1 sm:p-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-tight line-clamp-1 pl-2">{title}</p>
          {Icon && (
            <Icon className="h-4 w-4 text-muted-foreground ml-1 flex-shrink-0" />
          )}
        </div>
        <div className={cn(
          "font-bold leading-none mt-1 sm:mt-1.5 pl-2",
          isTimeValue ? "text-sm sm:text-base" : "text-lg sm:text-xl",
          typeof value === 'string' && value.length > 8 ? "text-sm sm:text-base" : ""
        )}>
          {displayValue}
        </div>
        <div className="flex items-center text-[10px] sm:text-xs mt-1 leading-none pl-2">
          {trend !== undefined && !Number.isNaN(trend) && (
            <>
              <TrendArrow value={trend} invertColor={invertTrend} />
              <TrendPercentage value={trend} invertColor={invertTrend} className="ml-0.5" />
            </>
          )}
          {trendLabel && trend !== undefined && !Number.isNaN(trend) && (
            <span className="text-muted-foreground ml-1 hidden xs:inline">
              {trendLabel}
            </span>
          )}
          {description && (trend === undefined || Number.isNaN(trend)) && (
            <span className="text-muted-foreground line-clamp-1">
              {description}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
} 