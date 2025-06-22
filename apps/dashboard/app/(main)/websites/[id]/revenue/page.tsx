"use client";

import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useParams } from "next/navigation";
// Card components removed - using direct div styling for consistency with overview tab
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TrendUpIcon,
    CreditCardIcon,
    ChartLineIcon,
    ReceiptIcon
} from "@phosphor-icons/react";
import { useWebsite } from "@/hooks/use-websites";
import { useRevenueConfig } from "@/app/(main)/revenue/hooks/use-revenue-config";
import { useWebsiteRevenue } from "./hooks/use-website-revenue";
import { useAtom } from "jotai";
import { formattedDateRangeAtom, timeGranularityAtom } from "@/stores/jotai/filterAtoms";

// Lazy load components
const PageHeader = lazy(() => import("./_components/page-header").then(m => ({ default: m.PageHeader })));
const RevenueMetrics = lazy(() => import("./_components/revenue-metrics").then(m => ({ default: m.RevenueMetrics })));
const RevenueChart = lazy(() => import("./_components/revenue-chart").then(m => ({ default: m.RevenueChart })));
const RecentTransactions = lazy(() => import("./_components/recent-transactions").then(m => ({ default: m.RecentTransactions })));
const RevenueNotSetup = lazy(() => import("./_components/empty-states").then(m => ({ default: m.RevenueNotSetup })));
const NoRevenueData = lazy(() => import("./_components/empty-states").then(m => ({ default: m.NoRevenueData })));

const PageHeaderSkeleton = () => (
    <div className="space-y-4">
        <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted animate-pulse rounded-xl"></div>
                        <div>
                            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
                            <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
                </div>
            </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="overflow-hidden border bg-card rounded-lg">
                    <div className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded" />
                            <div className="p-1 rounded-md bg-muted/20">
                                <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 rounded" />
                            </div>
                        </div>
                        <Skeleton className="h-5 sm:h-6 md:h-8 w-20 sm:w-24 mb-1.5 sm:mb-2 rounded" />
                        <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 rounded" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const RevenueMetricsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="overflow-hidden border bg-card rounded-lg">
                <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded" />
                        <div className="p-1 rounded-md bg-muted/20">
                            <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 rounded" />
                        </div>
                    </div>
                    <Skeleton className="h-5 sm:h-6 md:h-8 w-20 sm:w-24 mb-1.5 sm:mb-2 rounded" />
                    <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 rounded" />
                </div>
            </div>
        ))}
    </div>
);

export default function WebsiteRevenuePage() {
    const { id } = useParams();
    const websiteId = id as string;
    const [activeTab, setActiveTab] = useState('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Date range state
    const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);
    const [currentGranularity] = useAtom(timeGranularityAtom);

    const dateRange = useMemo(() => ({
        start_date: formattedDateRangeState.startDate,
        end_date: formattedDateRangeState.endDate,
        granularity: currentGranularity,
    }), [formattedDateRangeState, currentGranularity]);

    // Fetch data
    const { data: websiteData } = useWebsite(websiteId);
    const revenueConfig = useRevenueConfig();
    const {
        data: revenueData,
        summaryStats,
        isLoading: revenueLoading,
        error: revenueError,
        refetch
    } = useWebsiteRevenue(websiteId, dateRange);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                refetch(),
                revenueConfig.refetch?.()
            ]);
        } catch (error) {
            console.error("Failed to refresh revenue data:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetch, revenueConfig.refetch]);

    // Loading state
    if (revenueConfig.isLoading) {
        return (
            <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
                <PageHeaderSkeleton />
            </div>
        );
    }

    // Revenue not set up
    if (!revenueConfig.isSetupComplete) {
        return (
            <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
                <Suspense fallback={<PageHeaderSkeleton />}>
                    <PageHeader
                        websiteId={websiteId}
                        websiteName={websiteData?.name || undefined}
                        isRefreshing={isRefreshing}
                        onRefresh={handleRefresh}
                    />
                </Suspense>

                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <RevenueNotSetup websiteName={websiteData?.name || undefined} />
                </Suspense>
            </div>
        );
    }

    // No data state
    if (!summaryStats.hasData && !revenueLoading) {
        return (
            <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
                <Suspense fallback={<PageHeaderSkeleton />}>
                    <PageHeader
                        websiteId={websiteId}
                        websiteName={websiteData?.name || undefined}
                        isRefreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        hasError={!!revenueError}
                        errorMessage={revenueError?.message}
                    />
                </Suspense>



                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <NoRevenueData websiteName={websiteData?.name || undefined} />
                </Suspense>
            </div>
        );
    }

    // Main revenue page
    return (
        <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
            <Suspense fallback={<PageHeaderSkeleton />}>
                <PageHeader
                    websiteId={websiteId}
                    websiteName={websiteData?.name || undefined}
                    isRefreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    hasError={!!revenueError}
                    errorMessage={revenueError?.message}
                />
            </Suspense>



            {/* Revenue Metrics */}
            <Suspense fallback={<RevenueMetricsSkeleton />}>
                <RevenueMetrics
                    summary={revenueData.summary}
                    refundRate={summaryStats.refundRate}
                    isLoading={revenueLoading}
                />
            </Suspense>

            {/* Revenue Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="border-b relative">
                    <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
                        <TabsTrigger
                            value="overview"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2"
                        >
                            <ChartLineIcon size={16} />
                            Overview
                            {activeTab === "overview" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="transactions"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2"
                        >
                            <ReceiptIcon size={16} />
                            Transactions
                            {activeTab === "transactions" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-6 transition-all duration-200 animate-fadeIn">
                    <div className="rounded border shadow-sm bg-card">
                        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start gap-3">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                                    <TrendUpIcon size={20} weight="duotone" />
                                    Revenue Trends
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {dateRange.granularity === 'hourly' ? 'Hourly' : 'Daily'} revenue data
                                </p>
                            </div>
                        </div>
                        <div>
                            <Suspense fallback={
                                <div className="flex items-center justify-center py-8">
                                    <div className="relative">
                                        <div className="w-6 h-6 rounded-full border-2 border-muted"></div>
                                        <div className="absolute top-0 left-0 w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                    </div>
                                    <div className="ml-3 text-sm text-muted-foreground">
                                        Loading chart...
                                    </div>
                                </div>
                            }>
                                <RevenueChart data={revenueData.trends} isLoading={revenueLoading} />
                            </Suspense>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-6 transition-all duration-200 animate-fadeIn">
                    <div className="rounded border shadow-sm bg-card">
                        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start gap-3">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                                    <CreditCardIcon size={20} weight="duotone" />
                                    Recent Transactions
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Latest payment transactions for this website
                                </p>
                            </div>
                        </div>
                        <div className="p-4">
                            <Suspense fallback={
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                            <Skeleton className="h-6 w-16" />
                                        </div>
                                    ))}
                                </div>
                            }>
                                <RecentTransactions
                                    data={revenueData.recent_transactions}
                                    isLoading={revenueLoading}
                                />
                            </Suspense>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 