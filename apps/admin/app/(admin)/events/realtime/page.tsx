import { Suspense } from "react";
import { Activity, Clock, TrendingUp, Users, AlertTriangle, Zap, AlertCircle, FileText } from "lucide-react";
import { fetchRealTimeStats } from "../actions";
import { RealTimeEventsWidget } from "./realtime-widget";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

async function RealTimeStats() {
    const stats = await fetchRealTimeStats();
    const now = new Date();
    return (
        <div className="grid gap-3 md:grid-cols-4">
            <Card className="border-l-4 border-l-primary py-2">
                <CardHeader className="pb-1 px-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium">Live Events</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                    <div className="text-lg font-bold text-primary">{stats.events_last_minute}</div>
                    <p className="text-xs text-muted-foreground">Last minute</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-primary py-2">
                <CardHeader className="pb-1 px-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium">Hourly Rate</CardTitle>
                        <Clock className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                    <div className="text-lg font-bold text-primary">{stats.events_last_hour}</div>
                    <p className="text-xs text-muted-foreground">Last hour</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-primary py-2">
                <CardHeader className="pb-1 px-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                    <div className="text-lg font-bold text-primary">{stats.active_sessions}</div>
                    <p className="text-xs text-muted-foreground">Last 5 min</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-destructive py-2">
                <CardHeader className="pb-1 px-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium">Errors</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                    <div className="text-lg font-bold text-destructive">{stats.recent_errors.length}</div>
                    <p className="text-xs text-muted-foreground">Last hour</p>
                </CardContent>
            </Card>
        </div>
    );
}

function RealTimeStatsSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index.toString()} className="py-2">
                    <CardHeader className="pb-1 px-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-3">
                        <Skeleton className="h-6 w-10 mb-1" />
                        <Skeleton className="h-3 w-16" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function RealTimeEventsPage() {
    const now = new Date();
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold">Real-Time Events</h1>
                        <p className="text-sm text-muted-foreground">Live monitoring</p>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground ml-1 sm:ml-4">Last updated: {now.toLocaleTimeString()}</div>
            </div>

            <Suspense fallback={<RealTimeStatsSkeleton />}>
                <RealTimeStats />
            </Suspense>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4" />
                            Events Per Second
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RealTimeEventsWidget />
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-4 w-4" />
                                Top Pages (5 min)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>}>
                                <TopPagesNow />
                            </Suspense>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                Recent Errors (1 hour)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>}>
                                <RecentErrorsNow />
                            </Suspense>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

async function TopPagesNow() {
    const stats = await fetchRealTimeStats();

    if (stats.top_pages_now.length === 0) {
        return (
            <div className="text-center py-8">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No page activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {stats.top_pages_now.map((page, index) => (
                <div key={`${page.path}-${page.count}`} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{page.path}</p>
                    </div>
                    <div className="text-sm font-bold text-primary">{page.count}</div>
                </div>
            ))}
        </div>
    );
}

async function RecentErrorsNow() {
    const stats = await fetchRealTimeStats();
    if (!stats.recent_errors.length) {
        return <div className="text-center py-8 text-xs text-muted-foreground">No errors in the last hour.</div>;
    }
    return (
        <div className="space-y-2">
            {stats.recent_errors.map((err) => (
                <div key={err.time + err.path + (err.error_message || '')} className="flex flex-col gap-0.5 p-2 rounded hover:bg-muted/50 transition-colors">
                    <span className="text-destructive font-medium truncate">{err.error_message || err.event_name}</span>
                    <span className="text-muted-foreground truncate text-xs">{err.path} • {new Date(err.time).toLocaleTimeString()}</span>
                </div>
            ))}
        </div>
    );
} 