"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
    WarningCircleIcon,
    CurrencyDollarIcon,
    PlusIcon
} from "@phosphor-icons/react";

interface RevenueNotSetupProps {
    websiteName?: string;
}

export function RevenueNotSetup({ websiteName }: RevenueNotSetupProps) {
    return (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 rounded-xl">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                        <WarningCircleIcon size={32} weight="duotone" className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">Revenue Tracking Not Set Up</h3>
                        <p className="text-orange-700 dark:text-orange-300 text-sm mt-2 max-w-md">
                            Configure your Stripe webhook integration to start tracking revenue for {websiteName || 'this website'}.
                        </p>
                    </div>
                    <Button asChild className="gap-2">
                        <Link href="/revenue">
                            <PlusIcon size={16} />
                            Configure Revenue Tracking
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

interface NoRevenueDataProps {
    websiteName?: string;
}

export function NoRevenueData({ websiteName }: NoRevenueDataProps) {
    return (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 rounded-xl">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <CurrencyDollarIcon size={32} weight="duotone" className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">No Revenue Data</h3>
                        <p className="text-blue-700 dark:text-blue-300 text-sm mt-2 max-w-md">
                            No revenue has been recorded for {websiteName || 'this website'} in the selected time period.
                            Make sure your Stripe checkout includes the correct client_id and session_id.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <a href="https://docs.databuddy.cc/integrations/stripe" target="_blank" rel="noopener noreferrer">
                            View Integration Guide
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
} 