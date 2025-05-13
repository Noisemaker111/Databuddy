"use client";

import { useTheme } from 'next-themes';
import { useMiniChartData } from '@/hooks/use-analytics';
import type { MiniChartDataPoint } from '@/hooks/use-analytics';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniChartProps {
  websiteId: string;
  className?: string;
  data?: MiniChartDataPoint[];
  isLoading?: boolean;
  isError?: boolean;
}

export function MiniChart({ 
  websiteId, 
  className = "",
  data,
  isLoading: externalLoading,
  isError: externalError
}: MiniChartProps) {
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  
  // Only fetch data if not provided externally
  const { 
    data: chartData, 
    isLoading: internalLoading, 
    isError: internalError 
  } = useMiniChartData(websiteId, { 
    enabled: !data // Only run query if external data is not provided
  });
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Use external data if provided, otherwise use data from the hook
  const displayData = data || chartData?.data;
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
  const isError = externalError !== undefined ? externalError : internalError;
  
  // Calculate total and trend
  const calculateTotal = () => {
    if (!displayData || displayData.length === 0) return 0;
    return displayData.reduce((sum, item) => sum + item.value, 0);
  };

  const calculateTrend = () => {
    if (!displayData || displayData.length < 2) return 0;
    const oldHalf = displayData.slice(0, Math.floor(displayData.length / 2));
    const newHalf = displayData.slice(Math.floor(displayData.length / 2));
    
    const oldAvg = oldHalf.reduce((sum, item) => sum + item.value, 0) / oldHalf.length;
    const newAvg = newHalf.reduce((sum, item) => sum + item.value, 0) / newHalf.length;
    
    if (oldAvg === 0) return newAvg > 0 ? 100 : 0;
    return Math.round(((newAvg - oldAvg) / oldAvg) * 100);
  };

  const total = calculateTotal();
  const trend = calculateTrend();
  
  // Calculate max value to normalize heights
  const maxValue = displayData && displayData.length > 0 
    ? Math.max(...displayData.map(d => d.value))
    : 0;
  
  // Format a date string
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateStr;
    }
  };
  
  if (isLoading) {
    return (
      <div className={`relative h-14 ${className}`}>
        <div className="w-full h-full bg-muted/30 animate-pulse rounded-md" />
      </div>
    );
  }
  
  // If no data or error, show empty state
  if (isError || !displayData || displayData.length === 0) {
    return (
      <div className={`relative h-14 ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground rounded-md border border-dashed">
          No activity data
        </div>
      </div>
    );
  }
  
  // Generate a color based on the trend
  const getTrendColor = () => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };
  
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 inline mr-0.5" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 inline mr-0.5" />;
    return <Minus className="h-3 w-3 inline mr-0.5" />;
  };
  
  // Get background colors
  const getBarBackground = (index: number) => {
    // Highlight effect for active bar
    if (activeBarIndex === index) {
      return isDark 
        ? 'bg-primary/50' 
        : 'bg-primary/50';
    }
    
    // Gradient from older to newer
    const intensity = Math.round((index / (displayData.length - 1)) * 100);
    
    return isDark
      ? `bg-gradient-to-t from-primary/10 to-primary/${20 + intensity}`
      : `bg-gradient-to-t from-primary/20 to-primary/${30 + intensity}`;
  };
  
  return (
    <div className={`relative h-14 ${className}`}>
      {/* Chart summary overlay */}
      <div className="absolute inset-0 flex items-center justify-between px-1 z-10 pointer-events-none">
        <div className="flex flex-col justify-center h-full text-xs">
          <div className="font-medium">{total.toLocaleString()}</div>
          <div className={cn("text-[10px] flex items-center gap-0.5", getTrendColor())}>
            {getTrendIcon()}
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        </div>
        
        {activeBarIndex !== null && displayData[activeBarIndex] && (
          <div className={cn(
            "bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-[10px]",
            "shadow-sm border border-border/40"
          )}>
            <div className="font-medium">{displayData[activeBarIndex].value.toLocaleString()}</div>
            <div className="opacity-75">{formatDate(displayData[activeBarIndex].date)}</div>
          </div>
        )}
      </div>
      
      {/* Chart bars */}
      <div className="absolute inset-0 flex items-end gap-[1px] z-0">
        {displayData.map((item, index) => {
          // Calculate normalized height (min 5% height for visual appeal)
          const height = maxValue === 0 ? 0 : Math.max(5, (item.value / maxValue) * 100);
          
          return (
            <div
              key={`${item.date}-${item.value}`}
              className={cn(
                "flex-1 rounded-sm transition-all duration-200",
                getBarBackground(index)
              )}
              style={{ 
                height: `${height}%`,
                transform: `scaleY(${activeBarIndex === index ? 1.05 : 1})`,
                zIndex: activeBarIndex === index ? 5 : 1
              }}
              onMouseEnter={() => setActiveBarIndex(index)}
              onMouseLeave={() => setActiveBarIndex(null)}
            />
          );
        })}
      </div>
    </div>
  );
} 