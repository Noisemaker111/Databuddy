"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, Settings, AlertCircle, TrendingUp, DollarSign, PieChart, Zap } from "lucide-react";
import { RevenueSummaryCards } from "../revenue-summary-cards";
import { useRevenueAnalytics } from "../../hooks/use-revenue-analytics";
import { useAtom } from 'jotai';
import { dateRangeAtom } from '@/stores/jotai/filterAtoms';
import { DistributionChart } from "@/components/charts/distribution-chart";
import { VersatileAIChart } from "@/components/charts/versatile-ai-chart";
import { useMemo } from "react";
import type { DateRange } from "@/hooks/use-analytics";

interface OverviewTabProps {
    onSetupClick: () => void;
    isSetupComplete: boolean;
    setupProgress: number;
    isLiveMode: boolean;
}

export function RevenueOverviewTab({
    onSetupClick,
    isSetupComplete,
}: OverviewTabProps) {
    const [dateRangeState] = useAtom(dateRangeAtom);

    const dateRange: DateRange = useMemo(() => ({
        start_date: dateRangeState.startDate.toISOString().slice(0, 10),
        end_date: dateRangeState.endDate.toISOString().slice(0, 10),
        granularity: 'daily',
    }), [dateRangeState]);

    const analytics = useRevenueAnalytics(dateRange);

    if (!isSetupComplete) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <div className="inline-block p-3 bg-orange-100 rounded-full dark:bg-orange-900/20">
                    <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Stripe Integration Not Configured</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    You need to configure your Stripe webhook to start tracking revenue.
                </p>
                <div className="mt-6">
                    <Button onClick={onSetupClick}>
                        <Zap className="h-4 w-4 mr-2" />
                        Go to Setup
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <RevenueSummaryCards analytics={analytics} />

            {/* Main chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Revenue Trends
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <VersatileAIChart
                        data={analytics.formattedData?.trends ?? []}
                        isLoading={analytics.isLoading}
                        chartType="bar"
                    />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue by Country */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Revenue by Country
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DistributionChart
                            title="Revenue by Country"
                            data={analytics.formattedData?.byCountry?.map(d => ({ name: d.name, value: d.total_revenue })) ?? []}
                            isLoading={analytics.isLoading}
                        />
                    </CardContent>
                </Card>

                {/* Revenue by Card Brand */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Revenue by Card Brand
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DistributionChart
                            title="Revenue by Card Brand"
                            data={analytics.formattedData?.byCardBrand?.map(d => ({ name: d.name, value: d.total_revenue })) ?? []}
                            isLoading={analytics.isLoading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 