"use client";

import { Badge } from "@/components/ui/badge";
import {
    TargetIcon,
    CaretDownIcon,
    TrendDownIcon
} from "@phosphor-icons/react";

interface FunnelStep {
    step_number: number;
    step_name: string;
    users: number;
    conversion_rate?: number;
    dropoff_rate?: number;
    avg_time_to_complete?: number;
    dropoffs?: number;
}

interface FunnelFlowProps {
    steps: FunnelStep[];
    totalUsers: number;
    formatCompletionTime: (seconds: number) => string;
}

export function FunnelFlow({ steps, totalUsers, formatCompletionTime }: FunnelFlowProps) {
    const maxUsers = Math.max(...steps.map(s => s.users));

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <TargetIcon size={16} weight="duotone" className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Funnel Steps</h3>
            </div>

            <div className="space-y-4">
                {steps.map((step, index) => {
                    const isFirstStep = index === 0;
                    const conversionRate = isFirstStep ? 100 : ((step.users / totalUsers) * 100);
                    const barWidth = Math.max((step.users / maxUsers) * 100, 5);
                    const previousStep = index > 0 ? steps[index - 1] : null;
                    const droppedUsers = previousStep ? previousStep.users - step.users : 0;
                    const stepConversionRate = previousStep ? ((step.users / previousStep.users) * 100) : 100;

                    return (
                        <div key={step.step_number} className="space-y-2">
                            {/* Step header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                        {index + 1}
                                    </div>
                                    <div className="font-medium text-foreground">
                                        {step.step_name}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-foreground">
                                        {conversionRate.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        of total
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="relative h-8 bg-muted rounded overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                                    style={{ width: `${barWidth}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-between px-3">
                                    <span className="text-sm font-medium text-white">
                                        {step.users.toLocaleString()} users
                                    </span>
                                    {!isFirstStep && (
                                        <span className="text-sm text-muted-foreground">
                                            {stepConversionRate.toFixed(1)}% from previous
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Drop-off info */}
                            {!isFirstStep && droppedUsers > 0 && (
                                <div className="flex items-center justify-between text-sm text-muted-foreground pl-9">
                                    <span className="text-destructive">
                                        -{droppedUsers.toLocaleString()} users dropped off
                                    </span>
                                </div>
                            )}

                            {/* Connector */}
                            {index < steps.length - 1 && (
                                <div className="flex justify-center py-1">
                                    <CaretDownIcon size={16} weight="fill" className="text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-muted/30 rounded border">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium text-foreground">Overall Conversion</div>
                        <div className="text-sm text-muted-foreground">
                            {steps[steps.length - 1]?.users.toLocaleString() || 0} of {totalUsers.toLocaleString()} users completed the funnel
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                        {((steps[steps.length - 1]?.users || 0) / totalUsers * 100).toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    );
} 