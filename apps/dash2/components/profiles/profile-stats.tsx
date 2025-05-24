import { Users, UserCheck, RotateCcw, Eye } from "lucide-react";

interface ProfileStatsProps {
  totalVisitors: number;
  returningVisitors: number;
  returningRate: number;
  totalPageViews: number;
}

export function ProfileStats({ totalVisitors, returningVisitors, returningRate, totalPageViews }: ProfileStatsProps) {
  const stats = [
    {
      label: "Total Visitors",
      value: totalVisitors.toLocaleString(),
      icon: Users,
    },
    {
      label: "Returning Visitors",
      value: returningVisitors.toLocaleString(),
      icon: UserCheck,
    },
    {
      label: "Return Rate",
      value: `${returningRate.toFixed(1)}%`,
      icon: RotateCcw,
    },
    {
      label: "Total Page Views",
      value: totalPageViews.toLocaleString(),
      icon: Eye,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-background border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg flex-shrink-0">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
              <p className="text-lg font-semibold">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 