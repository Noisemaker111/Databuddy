"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
    ArrowClockwiseIcon,
    PlusIcon,
    WarningCircleIcon,
    CurrencyDollarIcon,
    ArrowLeftIcon
} from "@phosphor-icons/react";

interface PageHeaderProps {
    websiteId: string;
    websiteName?: string;
    isRefreshing: boolean;
    onRefresh: () => void;
    hasError?: boolean;
    errorMessage?: string;
}

export function PageHeader({
    websiteId,
    websiteName,
    isRefreshing,
    onRefresh,
    hasError,
    errorMessage
}: PageHeaderProps) {
    return (
        <div className="space-y-6">
            {/* Header - matching funnels design */}
            <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" asChild className="mr-2">
                                <Link href={`/websites/${websiteId}`}>
                                    <ArrowLeftIcon size={16} />
                                    Back
                                </Link>
                            </Button>
                            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <CurrencyDollarIcon size={16} weight="duotone" className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Revenue Analytics</h1>
                                <p className="text-muted-foreground text-sm sm:text-base">
                                    Track revenue and transaction data for {websiteName || 'this website'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            variant="outline"
                            size="default"
                            className="gap-2 rounded-lg px-4 py-2 font-medium border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                        >
                            <ArrowClockwiseIcon size={16} weight="fill" className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh Data
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {hasError && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded-xl">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="p-3 rounded-full bg-destructive/10 border border-destructive/20">
                                <WarningCircleIcon size={16} weight="duotone" className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-destructive">Error loading revenue data</h4>
                                <p className="text-destructive/80 text-sm mt-1">
                                    {errorMessage || "There was an issue loading your revenue data. Please try refreshing the page."}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                className="gap-2 rounded-lg"
                            >
                                <ArrowClockwiseIcon size={16} weight="fill" className="h-4 w-4" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 