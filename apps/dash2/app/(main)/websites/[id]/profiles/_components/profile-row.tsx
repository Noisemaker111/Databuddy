"use client";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronRightIcon, ClockIcon, EyeIcon, UserRound, Users } from "lucide-react";
import { format } from "date-fns";
import { getCountryFlag, getDeviceIcon, getBrowserIconComponent, getOSIconComponent, formatDuration } from "./profile-utils";
import type { ProfileData } from "@/hooks/use-analytics";

interface ProfileRowProps {
    profile: ProfileData;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}

export function ProfileRow({ profile, index, isExpanded, onToggle }: ProfileRowProps) {
    const avgSessionDuration = profile.total_sessions > 0
        ? (profile.total_duration || 0) / profile.total_sessions
        : 0;

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-5 hover:bg-muted/30 cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:border-primary/20">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Expand/Collapse and Profile Number */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 text-muted-foreground transition-transform" />
                            ) : (
                                <ChevronRightIcon className="w-4 h-4 text-muted-foreground transition-transform" />
                            )}
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                                {index + 1}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {getCountryFlag(profile.country)}
                            {getDeviceIcon(profile.device)}
                            {getBrowserIconComponent(profile.browser)}
                            {getOSIconComponent(profile.os)}
                        </div>

                        {/* Profile Info */}
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground truncate text-base">
                                Visitor {profile.visitor_id.substring(0, 8)}...
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{profile.browser}</span>
                                <span className="text-muted-foreground/60">•</span>
                                <span>{profile.country || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics - More Prominent */}
                    <div className="flex items-center gap-4 text-sm flex-shrink-0 ml-4">
                        {/* Sessions Count */}
                        <div className="hidden sm:flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <Users className="w-3 h-3" />
                                <span>Sessions</span>
                            </div>
                            <span className="font-semibold text-foreground text-sm">{profile.total_sessions}</span>
                        </div>

                        {/* Page Views */}
                        <div className="hidden sm:flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <EyeIcon className="w-3 h-3" />
                                <span>Pages</span>
                            </div>
                            <span className="font-semibold text-foreground text-sm">{profile.total_pageviews}</span>
                        </div>

                        {/* Avg Duration */}
                        <div className="hidden lg:flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <ClockIcon className="w-3 h-3" />
                                <span>Avg Time</span>
                            </div>
                            <span className="font-semibold text-foreground text-sm">{formatDuration(avgSessionDuration)}</span>
                        </div>

                        {/* Visitor Type Badge */}
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                            <div className="text-muted-foreground text-xs">Type</div>
                            <Badge variant={profile.total_sessions > 1 ? "default" : "secondary"} className="text-xs font-semibold px-2 py-1">
                                {profile.total_sessions > 1 ? 'Return' : 'New'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="px-4 pb-4 bg-muted/20 border-t border-border">
                    {/* Profile Info Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 text-sm border-b border-border/50">
                        <div className="text-center">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Total Sessions</span>
                            <div className="font-bold text-foreground text-lg">{profile.total_sessions}</div>
                        </div>
                        <div className="text-center">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Page Views</span>
                            <div className="font-bold text-foreground text-lg">{profile.total_pageviews}</div>
                        </div>
                        <div className="text-center">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Visitor Type</span>
                            <div className="font-medium text-foreground">
                                {profile.total_sessions > 1 ? (
                                    <span className="text-blue-600 font-semibold">Returning</span>
                                ) : (
                                    <span className="text-green-600 font-semibold">New</span>
                                )}
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Avg Session</span>
                            <div className="font-bold text-foreground text-lg">
                                {formatDuration(avgSessionDuration)}
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="pt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-semibold text-lg text-foreground">Profile Details</h4>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                                    <span className="text-sm font-bold text-slate-800">{profile.total_sessions}</span>
                                    <span className="text-xs text-slate-600">sessions</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                                    <span className="text-sm font-bold text-slate-800">{profile.total_pageviews}</span>
                                    <span className="text-xs text-slate-600">page views</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                                    <span className="text-sm font-bold text-slate-800">{profile.total_duration_formatted || formatDuration(profile.total_duration || 0)}</span>
                                    <span className="text-xs text-slate-600">total time</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Visit Information */}
                            <div className="space-y-3">
                                <h5 className="font-medium text-foreground">Visit Information</h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">First Visit:</span>
                                        <span className="font-medium">
                                            {profile.first_visit ? format(new Date(profile.first_visit), 'MMM d, yyyy HH:mm') : 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last Visit:</span>
                                        <span className="font-medium">
                                            {profile.last_visit ? format(new Date(profile.last_visit), 'MMM d, yyyy HH:mm') : 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Duration:</span>
                                        <span className="font-medium">
                                            {profile.total_duration_formatted || formatDuration(profile.total_duration || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Information */}
                            <div className="space-y-3">
                                <h5 className="font-medium text-foreground">Technical Information</h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Location:</span>
                                        <span className="font-medium">
                                            {profile.region && profile.region !== 'Unknown' ? `${profile.region}, ` : ''}
                                            {profile.country || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Device:</span>
                                        <span className="font-medium capitalize">
                                            {profile.device || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Browser:</span>
                                        <span className="font-medium">
                                            {profile.browser || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Operating System:</span>
                                        <span className="font-medium">
                                            {profile.os || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
} 