'use client';

import {
  Card,
  CardContent,
  CardDescription,
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

interface ChartProps {
  userRegistrationsOverTime: { date: string; value: number }[];
  websiteRegistrationsOverTime: { date: string; value: number }[];
  usersPerDay: { date: string; count: number }[];
  websitesPerDay: { date: string; count: number }[];
  eventsOverTime: { date: string; value: number }[];
  events24hOverTime: { hour: string; value: number }[];
  topWebsites: { website: string; value: number; name?: string | null; domain?: string | null; }[];
  topCountries: { country: string; visitors: number }[];
}

export function AnalyticsCharts({
  userRegistrationsOverTime,
  websiteRegistrationsOverTime,
  usersPerDay,
  websitesPerDay,
  eventsOverTime,
  events24hOverTime,
  topWebsites,
  topCountries,
}: ChartProps) {
  const topWebsitesFormatted = topWebsites.map((w) => ({
    ...w,
    label: w.name || w.domain || w.website,
  }));

  const userGrowthChartConfig = {
    value: {
      label: 'Users',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  const websiteGrowthChartConfig = {
    value: {
      label: 'Websites',
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  const usersPerDayChartConfig = {
    count: {
      label: 'Users',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  const websitesPerDayChartConfig = {
    count: {
      label: 'Websites',
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  const eventsOverTimeChartConfig = {
    value: {
      label: 'Events',
      color: 'var(--chart-3)',
    },
  } satisfies ChartConfig;

  const events24hOverTimeChartConfig = {
    value: {
      label: 'Events',
      color: 'var(--chart-4)',
    },
  } satisfies ChartConfig;

  const topWebsitesChartConfig = {
    value: {
      label: 'Events',
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  const topCountriesChartConfig = {
    visitors: {
      label: 'Visitors',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={userGrowthChartConfig} className="h-[300px] w-full">
            <AreaChart
              accessibilityLayer
              data={userRegistrationsOverTime}
              margin={{
                left: 12,
                right: 12,
                top: 10,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="value"
                type="natural"
                fill="url(#fillValue)"
                stroke="var(--color-value)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>Website Growth</CardTitle>
          <CardDescription>New website registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={websiteGrowthChartConfig}
            className="h-[300px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={websiteRegistrationsOverTime}
              margin={{
                left: 12,
                right: 12,
                top: 10,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="fillValue2" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="value"
                type="natural"
                fill="url(#fillValue2)"
                stroke="var(--color-value)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>New Users per Day</CardTitle>
          <CardDescription>Daily new user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={usersPerDayChartConfig}
            className="h-[300px] w-full"
          >
            <BarChart accessibilityLayer data={usersPerDay} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                fill="url(#fillCount)"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>New Websites per Day</CardTitle>
          <CardDescription>Daily new website registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={websitesPerDayChartConfig}
            className="h-[300px] w-full"
          >
            <BarChart accessibilityLayer data={websitesPerDay} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCount2" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                fill="url(#fillCount2)"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>Events Over Time (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={eventsOverTimeChartConfig}
            className="h-[300px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={eventsOverTime}
              margin={{
                left: 12,
                right: 12,
                top: 10,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="fillValue3" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="value"
                type="natural"
                fill="url(#fillValue3)"
                stroke="var(--color-value)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>Events in Last 24 Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={events24hOverTimeChartConfig}
            className="h-[300px] w-full"
          >
            <BarChart accessibilityLayer data={events24hOverTime} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillValue4" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => format(new Date(value), 'h a')}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="value"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                fill="url(#fillValue4)"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>Top Websites (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={topWebsitesChartConfig}
            className="h-[300px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={topWebsitesFormatted}
              layout="vertical"
              margin={{
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="fillValue5" x1="0" y1="0" x2="1" y2="0">
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={150}
              />
              <XAxis dataKey="value" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar
                dataKey="value"
                strokeWidth={2}
                radius={[0, 4, 4, 0]}
                fill="url(#fillValue5)"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-hover-effect">
        <CardHeader>
          <CardTitle>Top Countries (7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={topCountriesChartConfig}
            className="h-[300px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={topCountries}
              layout="vertical"
              margin={{
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="fillVisitors" x1="0" y1="0" x2="1" y2="0">
                  <stop
                    offset="5%"
                    stopColor="var(--color-visitors)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-visitors)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="country"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={150}
              />
              <XAxis dataKey="visitors" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar
                dataKey="visitors"
                strokeWidth={2}
                radius={[0, 4, 4, 0]}
                fill="url(#fillVisitors)"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
} 