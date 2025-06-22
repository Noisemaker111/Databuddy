"use client";

import { StatCard } from "@/components/analytics/stat-card";
import {
    CurrencyDollarIcon,
    CreditCardIcon,
    TrendUpIcon,
    ArrowClockwiseIcon
} from "@phosphor-icons/react";
import { formatCurrency, formatNumber } from "@/lib/formatters";

interface RevenueMetricsProps {
    summary: {
        total_revenue: number;
        total_transactions: number;
        avg_order_value: number;
        total_refunds: number;
    };
    refundRate: number;
    isLoading: boolean;
}

export function RevenueMetrics({ summary, refundRate, isLoading }: RevenueMetricsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
                title="TOTAL REVENUE"
                value={formatCurrency(summary.total_revenue)}
                icon={CurrencyDollarIcon}
                isLoading={isLoading}
                variant="success"
                className="h-full"
                id="revenue-card"
            />
            <StatCard
                title="TRANSACTIONS"
                value={formatNumber(summary.total_transactions)}
                icon={CreditCardIcon}
                isLoading={isLoading}
                variant="info"
                className="h-full"
                id="transactions-card"
            />
            <StatCard
                title="AVERAGE ORDER VALUE"
                value={formatCurrency(summary.avg_order_value)}
                icon={TrendUpIcon}
                isLoading={isLoading}
                variant="default"
                className="h-full"
                id="aov-card"
            />
            <StatCard
                title="REFUND RATE"
                value={`${refundRate}%`}
                icon={ArrowClockwiseIcon}
                isLoading={isLoading}
                variant="warning"
                invertTrend={true}
                className="h-full"
                id="refund-rate-card"
            />
        </div>
    );
} 