'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { format } from 'date-fns';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar,
} from 'recharts';

interface BlockedTrafficChartsProps {
    trends: { date: string; blocked_count: number }[];
    topWebsites: { website_id: string; blocked_count: number }[];
    topReasons: { reason: string; blocked_count: number }[];
    topCountries: { country: string; blocked_count: number }[];
}

export function BlockedTrafficCharts({ trends, topWebsites, topReasons, topCountries }: BlockedTrafficChartsProps) {
    const trendsChartConfig = {
        blocked_count: {
            label: 'Blocked',
            color: 'var(--chart-1)',
        },
    } satisfies ChartConfig;

    const topWebsitesChartConfig = {
        blocked_count: {
            label: 'Blocked',
            color: 'var(--chart-2)',
        },
    } satisfies ChartConfig;

    const topReasonsChartConfig = {
        blocked_count: {
            label: 'Blocked',
            color: 'var(--chart-3)',
        },
    } satisfies ChartConfig;

    const topCountriesChartConfig = {
        blocked_count: {
            label: 'Blocked',
            color: 'var(--chart-4)',
        },
    } satisfies ChartConfig;

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-hover-effect">
                <CardHeader>
                    <CardTitle>Blocked Traffic Trends</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={trendsChartConfig} className="h-[300px] w-full">
                        <AreaChart data={trends} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id="fillBlocked" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => format(new Date(value), 'MMM d')} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Area dataKey="blocked_count" type="natural" fill="url(#fillBlocked)" stroke="var(--chart-1)" stackId="a" />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="card-hover-effect">
                <CardHeader>
                    <CardTitle>Top Blocked Websites</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={topWebsitesChartConfig} className="h-[300px] w-full">
                        <BarChart data={topWebsites} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id="fillWebsites" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="website_id" type="category" tickLine={false} tickMargin={10} axisLine={false} width={150} />
                            <XAxis dataKey="blocked_count" type="number" hide />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="blocked_count" strokeWidth={2} radius={[0, 4, 4, 0]} fill="url(#fillWebsites)" />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="card-hover-effect">
                <CardHeader>
                    <CardTitle>Top Block Reasons</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={topReasonsChartConfig} className="h-[300px] w-full">
                        <BarChart data={topReasons} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id="fillReasons" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="reason" type="category" tickLine={false} tickMargin={10} axisLine={false} width={150} />
                            <XAxis dataKey="blocked_count" type="number" hide />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="blocked_count" strokeWidth={2} radius={[0, 4, 4, 0]} fill="url(#fillReasons)" />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="card-hover-effect">
                <CardHeader>
                    <CardTitle>Top Countries</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={topCountriesChartConfig} className="h-[300px] w-full">
                        <BarChart data={topCountries} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id="fillCountries" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="country" type="category" tickLine={false} tickMargin={10} axisLine={false} width={150} />
                            <XAxis dataKey="blocked_count" type="number" hide />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="blocked_count" strokeWidth={2} radius={[0, 4, 4, 0]} fill="url(#fillCountries)" />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
} 