"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonChart } from "@/components/charts/skeleton-chart";
import { CurrencyDollarIcon, CreditCardIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

// Enhanced color palette with gradients
const REVENUE_COLORS = {
    revenue: {
        primary: "#10b981",
        secondary: "#059669",
        light: "#d1fae5",
        gradient: "from-emerald-500/20 to-emerald-600/5"
    },
    transactions: {
        primary: "#3b82f6",
        secondary: "#1d4ed8",
        light: "#dbeafe",
        gradient: "from-blue-500/20 to-blue-600/5"
    }
};

// Enhanced tooltip with glass morphism effect
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const getMetricIcon = (name: string) => {
        if (name.toLowerCase().includes('revenue')) return <CurrencyDollarIcon className="h-3 w-3" />;
        if (name.toLowerCase().includes('transaction')) return <CreditCardIcon className="h-3 w-3" />;
        return <CurrencyDollarIcon className="h-3 w-3" />;
    };

    return (
        <div className="bg-card backdrop-blur-md border border-border/50 rounded-xl shadow-2xl p-4 min-w-[200px]">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="font-semibold text-sm text-foreground">{label}</p>
            </div>
            <div className="space-y-2.5">
                {payload.map((entry: any, index: number) => {
                    let displayValue: string;
                    if (entry.name.toLowerCase().includes('revenue')) {
                        displayValue = formatCurrency(entry.value);
                    } else {
                        displayValue = entry.value.toLocaleString();
                    }

                    return (
                        <div key={`item-${entry.name}`} className="flex items-center justify-between gap-3 group">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-3 h-3 rounded-full shadow-sm ring-2 ring-background"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <div className="flex items-center gap-1.5">
                                    {getMetricIcon(entry.name)}
                                    <span className="text-muted-foreground text-xs font-medium">{entry.name}</span>
                                </div>
                            </div>
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                {displayValue}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface RevenueChartProps {
    data: Array<{
        date: string;
        revenue: number;
        transactions: number;
    }> | undefined;
    isLoading: boolean;
    height?: number;
    className?: string;
}

export function RevenueChart({
    data,
    isLoading,
    height = 400,
    className
}: RevenueChartProps) {
    const chartData = useMemo(() => data || [], [data]);
    const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

    const valueFormatter = (value: number): string => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
        return `$${value}`;
    };

    if (isLoading) {
        return <SkeletonChart height={height} className="w-full" />;
    }

    if (!chartData.length) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="relative">
                        <CurrencyDollarIcon className="mx-auto h-16 w-16 text-muted-foreground/20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-full blur-xl" />
                    </div>
                    <p className="mt-6 text-lg font-semibold text-foreground">No revenue data available</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                        Revenue data will appear here as transactions are processed
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("w-full", className)}>
            <div style={{ width: '100%', height: height + 20 }} className="relative">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/5 pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: chartData.length > 5 ? 60 : 20 }}
                    >
                        <defs>
                            {Object.entries(REVENUE_COLORS).map(([key, colors]) => (
                                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
                                    <stop offset="50%" stopColor={colors.primary} stopOpacity={0.1} />
                                    <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
                                </linearGradient>
                            ))}

                            {/* Glow effects */}
                            {Object.entries(REVENUE_COLORS).map(([key, colors]) => (
                                <filter key={`glow-${key}`} id={`glow-${key}`}>
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            ))}
                        </defs>

                        <CartesianGrid
                            strokeDasharray="2 4"
                            vertical={false}
                            stroke="var(--border)"
                            strokeOpacity={0.3}
                            className="animate-pulse"
                        />

                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--border)', strokeOpacity: 0.5 }}
                            dy={10}
                        />

                        <YAxis
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            width={60}
                            tickFormatter={valueFormatter}
                            yAxisId="left"
                        />

                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            width={45}
                            tickFormatter={(value) => value.toLocaleString()}
                        />

                        <Tooltip
                            content={<CustomTooltip />}
                            wrapperStyle={{ outline: 'none' }}
                            animationDuration={200}
                            cursor={{
                                stroke: 'var(--primary)',
                                strokeWidth: 1,
                                strokeOpacity: 0.5,
                                strokeDasharray: '4 4'
                            }}
                        />

                        <Legend
                            wrapperStyle={{
                                fontSize: '12px',
                                paddingTop: '20px',
                                bottom: chartData.length > 5 ? 35 : 5,
                                fontWeight: 500
                            }}
                            formatter={(value, entry: any) => (
                                <span
                                    className={cn(
                                        "text-xs font-medium transition-all duration-200 cursor-pointer",
                                        hoveredMetric === value ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onMouseEnter={() => setHoveredMetric(value)}
                                    onMouseLeave={() => setHoveredMetric(null)}
                                >
                                    {value.charAt(0).toUpperCase() + value.slice(1)}
                                </span>
                            )}
                            iconType="circle"
                            iconSize={10}
                        />

                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke={REVENUE_COLORS.revenue.primary}
                            fillOpacity={1}
                            fill="url(#gradient-revenue)"
                            strokeWidth={2.5}
                            activeDot={{
                                r: 6,
                                strokeWidth: 3,
                                stroke: REVENUE_COLORS.revenue.primary,
                                fill: 'var(--background)',
                                filter: 'url(#glow-revenue)'
                            }}
                            dot={{ r: 0 }}
                            name="Revenue"
                            yAxisId="left"
                            className="transition-all duration-300"
                        />

                        <Area
                            type="monotone"
                            dataKey="transactions"
                            stroke={REVENUE_COLORS.transactions.primary}
                            fillOpacity={1}
                            fill="url(#gradient-transactions)"
                            strokeWidth={2.5}
                            activeDot={{
                                r: 6,
                                strokeWidth: 3,
                                stroke: REVENUE_COLORS.transactions.primary,
                                fill: 'var(--background)',
                                filter: 'url(#glow-transactions)'
                            }}
                            dot={{ r: 0 }}
                            name="Transactions"
                            yAxisId="right"
                            className="transition-all duration-300"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
} 