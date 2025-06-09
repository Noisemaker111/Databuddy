"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Globe,
  Users,
  MousePointer,
  AlertTriangle,
  BarChart,
  Timer,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";

import { StatCard } from "@/components/analytics/stat-card";
import { MetricsChart } from "@/components/charts/metrics-chart";
import { DataTable } from "@/components/analytics/data-table";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import { useDynamicQuery } from "@/hooks/use-dynamic-query";
import {
  formatDateByGranularity,
  getColorVariant,
  calculatePercentChange,
} from "../utils/analytics-helpers";
import { MetricToggles } from "../utils/ui-components";
import type { FullTabProps, MetricPoint } from "../utils/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ReferrerSourceCell, type ReferrerSourceCellData } from "@/components/atomic/ReferrerSourceCell";
import {
  processDeviceData,
  processBrowserData,
  inferOperatingSystems,
  TechnologyIcon,
  PercentageBadge,
} from "../utils/technology-helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Types
interface TrendCalculation {
  visitors?: number;
  sessions?: number;
  pageviews?: number;
  bounce_rate?: number;
  session_duration?: number;
  pages_per_session?: number;
}

import { useTableTabs } from "@/lib/table-tabs";

interface ChartDataPoint {
  date: string;
  pageviews?: number;
  visitors?: number;
  sessions?: number;
  [key: string]: unknown;
}

const MIN_PREVIOUS_SESSIONS_FOR_TREND = 5;
const MIN_PREVIOUS_VISITORS_FOR_TREND = 5;
const MIN_PREVIOUS_PAGEVIEWS_FOR_TREND = 10;

function PropertyBreakdown({ websiteId, dateRange, eventName, propertyKey }: {
  websiteId: string;
  dateRange: { start_date: string, end_date: string };
  eventName: string;
  propertyKey: string;
}) {
  const { data, isLoading, error } = useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: `prop-breakdown-${eventName}-${propertyKey}`,
      parameters: ['custom_events'],
      filters: [
        { field: 'event_name', operator: 'eq', value: eventName },
        { field: 'property_key', operator: 'eq', value: propertyKey }
      ]
    }
  );

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-center text-muted-foreground">
        Loading breakdown...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-center text-red-500">
        Error loading data.
      </div>
    );
  }

  const breakdownData = data?.['custom_event_properties'] as { name: string; total_events: number }[] | undefined;

  if (!breakdownData || breakdownData.length === 0) {
    return (
      <div className="p-4 text-sm text-center text-muted-foreground">
        No breakdown available for this property.
      </div>
    );
  }

  const totalEvents = breakdownData.reduce((sum: number, item: { total_events: number }) => sum + item.total_events, 0);

  return (
    <div className="space-y-1">
      {breakdownData.map((item: any) => (
        <div key={item.name} className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground truncate" title={item.name}>{item.name}</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.total_events.toLocaleString()}</span>
            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${(item.total_events / totalEvents) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UnauthorizedAccessError() {
  const router = useRouter();

  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/50 w-full max-w-lg mx-auto my-8">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Access Denied</CardTitle>
            <CardDescription className="mt-1">
              You don't have permission to view this website's analytics.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-5">
          Contact the website owner if you think this is an error.
        </p>
        <Button
          onClick={() => router.push("/websites")}
          className="w-full sm:w-auto"
          variant="destructive"
        >
          Back to Websites
        </Button>
      </CardContent>
    </Card>
  );
}

export function WebsiteOverviewTab({
  websiteId,
  dateRange,
  websiteData,
  isRefreshing,
  setIsRefreshing,
}: FullTabProps) {

  const { analytics, loading, error, refetch } = useWebsiteAnalytics(websiteId, dateRange);

  const [breakdownState, setBreakdownState] = useState<{
    open: boolean;
    eventName?: string;
    propertyKey?: string;
  }>({ open: false });

  // Fetch custom events data
  const {
    data: customEventsData,
    isLoading: customEventsLoading,
    error: customEventsError,
    refetch: refetchCustomEvents
  } = useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: 'overview-custom-events',
      parameters: ['custom_events'],
      limit: 10
    }
  );

  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    pageviews: true,
    visitors: true,
    sessions: false,
  });

  const toggleMetric = useCallback((metric: string) => {
    setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isRefreshing) {
      const doRefresh = async () => {
        try {
          await Promise.all([
            refetch(),
            refetchCustomEvents()
          ]);
        } catch (error) {
          console.error("Failed to refresh data:", error);
        } finally {
          if (isMounted) {
            setIsRefreshing(false);
          }
        }
      };

      doRefresh();
    }

    return () => {
      isMounted = false;
    };
  }, [isRefreshing, refetch, setIsRefreshing]);

  const isLoading = loading.summary || isRefreshing;

  if (error instanceof Error && error.message === 'UNAUTHORIZED_ACCESS') {
    return <UnauthorizedAccessError />;
  }

  const referrerCustomCell = useCallback((info: any) => {
    const cellData: ReferrerSourceCellData = info.row.original;
    return <ReferrerSourceCell {...cellData} />;
  }, []);

  const chartData = useMemo(() => {
    if (!analytics.events_by_date?.length) return [];

    return analytics.events_by_date.map((event: MetricPoint): ChartDataPoint => {
      const filtered: ChartDataPoint = {
        date: formatDateByGranularity(event.date, dateRange.granularity)
      };

      if (visibleMetrics.pageviews) {
        filtered.pageviews = event.pageviews;
      }

      if (visibleMetrics.visitors) {
        filtered.visitors = event.visitors || event.unique_visitors || 0;
      }

      if (visibleMetrics.sessions) {
        filtered.sessions = event.sessions;
      }

      return filtered;
    });
  }, [analytics.events_by_date, visibleMetrics, dateRange.granularity]);

  const processedTopPages = useMemo(() => {
    if (!analytics.top_pages?.length) return [];

    const totalPageviews = analytics.top_pages.reduce((sum: number, page: any) => sum + (page.pageviews || 0), 0);

    return analytics.top_pages.map(page => ({
      ...page,
      percentage: totalPageviews > 0 ? Math.round((page.pageviews / totalPageviews) * 100) : 0
    }));
  }, [analytics.top_pages]);

  const processedEntryPages = useMemo(() => {
    if (!analytics.entry_pages?.length) return [];

    return analytics.entry_pages.map(page => ({
      ...page,
      pageviews: page.entries,
      visitors: page.visitors
    }));
  }, [analytics.entry_pages]);

  const processedExitPages = useMemo(() => {
    if (!analytics.exit_pages?.length) return [];

    return analytics.exit_pages.map(page => ({
      ...page,
      pageviews: page.exits,
      visitors: page.visitors
    }));
  }, [analytics.exit_pages]);

  const referrerTabs = useTableTabs({
    referrers: {
      data: analytics.top_referrers || [],
      label: 'Referrers',
      primaryField: 'name',
      primaryHeader: 'Source',
      customCell: referrerCustomCell
    },
    utm_sources: {
      data: analytics.utm_sources || [],
      label: 'UTM Sources',
      primaryField: 'utm_source',
      primaryHeader: 'Source'
    },
    utm_mediums: {
      data: analytics.utm_mediums || [],
      label: 'UTM Mediums',
      primaryField: 'utm_medium',
      primaryHeader: 'Medium'
    },
    utm_campaigns: {
      data: analytics.utm_campaigns || [],
      label: 'UTM Campaigns',
      primaryField: 'utm_campaign',
      primaryHeader: 'Campaign'
    }
  });

  const pagesTabs = useTableTabs({
    top_pages: {
      data: processedTopPages,
      label: 'Top Pages',
      primaryField: 'path',
      primaryHeader: 'Page'
    },
    entry_pages: {
      data: processedEntryPages,
      label: 'Entry Pages',
      primaryField: 'path',
      primaryHeader: 'Page'
    },
    exit_pages: {
      data: processedExitPages,
      label: 'Exit Pages',
      primaryField: 'path',
      primaryHeader: 'Page'
    }
  });

  const dateFrom = useMemo(() => new Date(dateRange.start_date), [dateRange.start_date]);
  const dateTo = useMemo(() => new Date(dateRange.end_date), [dateRange.end_date]);
  const dateDiff = useMemo(() => differenceInDays(dateTo, dateFrom), [dateTo, dateFrom]);

  const metricColors = {
    pageviews: 'blue-500',
    visitors: 'green-500',
    sessions: 'purple-500'
  };

  const calculateTrends = useMemo<TrendCalculation>(() => {
    if (!analytics.events_by_date?.length || analytics.events_by_date.length < 2) {
      return {};
    }

    const events = [...analytics.events_by_date].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const midpoint = Math.floor(events.length / 2);
    const previousPeriodData = events.slice(0, midpoint);
    const currentPeriodData = events.slice(midpoint);

    if (previousPeriodData.length === 0 || currentPeriodData.length === 0) {
      return {};
    }

    const sumCountMetric = (period: MetricPoint[], field: keyof Pick<MetricPoint, 'pageviews' | 'visitors' | 'sessions'>) =>
      period.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);

    const currentSumVisitors = sumCountMetric(currentPeriodData, 'visitors');
    const currentSumSessions = sumCountMetric(currentPeriodData, 'sessions');
    const currentSumPageviews = sumCountMetric(currentPeriodData, 'pageviews');
    const currentPagesPerSession = currentSumSessions > 0 ? currentSumPageviews / currentSumSessions : 0;

    const previousSumVisitors = sumCountMetric(previousPeriodData, 'visitors');
    const previousSumSessions = sumCountMetric(previousPeriodData, 'sessions');
    const previousSumPageviews = sumCountMetric(previousPeriodData, 'pageviews');
    const previousPagesPerSession = previousSumSessions > 0 ? previousSumPageviews / previousSumSessions : 0;

    const averageRateMetric = (period: MetricPoint[], field: keyof Pick<MetricPoint, 'bounce_rate' | 'avg_session_duration'>) => {
      const validEntries = period.map(item => Number(item[field])).filter(value => !Number.isNaN(value) && value > 0);
      if (validEntries.length === 0) return 0;
      return validEntries.reduce((acc, value) => acc + value, 0) / validEntries.length;
    };

    const currentBounceRateAvg = averageRateMetric(currentPeriodData, 'bounce_rate');
    const previousBounceRateAvg = averageRateMetric(previousPeriodData, 'bounce_rate');
    const currentSessionDurationAvg = averageRateMetric(currentPeriodData, 'avg_session_duration');
    const previousSessionDurationAvg = averageRateMetric(previousPeriodData, 'avg_session_duration');

    const calculateTrendPercentage = (current: number, previous: number, minimumBase = 0) => {
      if (previous < minimumBase && !(previous === 0 && current === 0)) {
        return undefined;
      }
      if (previous === 0) {
        return current === 0 ? 0 : undefined;
      }
      const change = calculatePercentChange(current, previous);
      return Math.max(-100, Math.min(1000, Math.round(change)));
    };

    const canShowSessionBasedTrend = previousSumSessions >= MIN_PREVIOUS_SESSIONS_FOR_TREND;

    return {
      visitors: calculateTrendPercentage(currentSumVisitors, previousSumVisitors, MIN_PREVIOUS_VISITORS_FOR_TREND),
      sessions: calculateTrendPercentage(currentSumSessions, previousSumSessions, MIN_PREVIOUS_SESSIONS_FOR_TREND),
      pageviews: calculateTrendPercentage(currentSumPageviews, previousSumPageviews, MIN_PREVIOUS_PAGEVIEWS_FOR_TREND),
      pages_per_session: canShowSessionBasedTrend
        ? calculateTrendPercentage(currentPagesPerSession, previousPagesPerSession)
        : undefined,
      bounce_rate: canShowSessionBasedTrend
        ? calculateTrendPercentage(currentBounceRateAvg, previousBounceRateAvg)
        : undefined,
      session_duration: canShowSessionBasedTrend
        ? calculateTrendPercentage(currentSessionDurationAvg, previousSessionDurationAvg)
        : undefined,
    };
  }, [analytics.events_by_date]);

  const processedDeviceData = useMemo(() =>
    processDeviceData(analytics.device_types || []),
    [analytics.device_types]
  );

  const processedBrowserData = useMemo(() =>
    processBrowserData(analytics.browser_versions || []),
    [analytics.browser_versions]
  );

  const processedOSData = useMemo(() =>
    inferOperatingSystems(analytics.device_types || [], analytics.browser_versions || []),
    [analytics.device_types, analytics.browser_versions]
  );

  const processedCustomEventsData = useMemo(() => {
    console.log("Raw custom events data:", customEventsData);
    // useDynamicQuery returns data in the format: {custom_events: [...]}
    if (!customEventsData?.custom_events?.length) {
      return [];
    }

    const customEvents = customEventsData.custom_events;
    console.log("Processing custom events:", customEvents);
    const totalEvents = customEvents.reduce((sum: number, event: any) => sum + (event.total_events || 0), 0);

    return customEvents.map((event: any) => ({
      ...event,
      percentage: totalEvents > 0 ? Math.round((event.total_events / totalEvents) * 100) : 0,
      last_occurrence_formatted: event.last_occurrence ?
        new Date(event.last_occurrence).toLocaleDateString() : 'N/A',
      first_occurrence_formatted: event.first_occurrence ?
        new Date(event.first_occurrence).toLocaleDateString() : 'N/A'
    }));
  }, [customEventsData]);

  const deviceColumns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Device Type',
      cell: (info: any) => {
        const entry = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <TechnologyIcon entry={entry} size="md" />
            <span className="font-medium">{entry.name}</span>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
  ], []);

  const browserColumns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Browser',
      cell: (info: any) => {
        const entry = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <TechnologyIcon entry={entry} size="md" />
            <span className="font-medium">{entry.name}</span>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
  ], []);

  const osColumns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Operating System',
      cell: (info: any) => {
        const entry = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <TechnologyIcon entry={entry} size="md" />
            <span className="font-medium">{entry.name}</span>
          </div>
        );
      }
    },
    {
      id: 'visitors',
      accessorKey: 'visitors',
      header: 'Visitors',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
  ], []);

  const customEventsColumns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Event Name',
      cell: (info: any) => {
        const eventName = info.getValue() as string;
        return (
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span className="font-medium truncate">{eventName}</span>
          </div>
        );
      }
    },
    {
      id: 'total_events',
      accessorKey: 'total_events',
      header: 'Events',
      cell: (info: any) => {
        const count = info.getValue() as number;
        return <span className="font-medium">{count.toLocaleString()}</span>;
      }
    },
    {
      id: 'unique_users',
      accessorKey: 'unique_users',
      header: 'Users',
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      header: 'Share',
      cell: (info: any) => {
        const percentage = info.getValue() as number;
        return <PercentageBadge percentage={percentage} />;
      },
    },
    {
      id: 'properties',
      header: 'Properties',
      cell: (info: any) => {
        const keys = info.row.original.property_keys as string[];
        if (!keys || keys.length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-wrap items-center gap-1">
            {keys.slice(0, 3).map(key => (
              <span key={key} className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full truncate" title={key}>{key}</span>
            ))}
            {keys.length > 3 && (
              <span className="text-xs bg-gray-300 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">+{keys.length - 3} more</span>
            )}
          </div>
        );
      }
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="UNIQUE VISITORS"
          value={analytics.summary?.unique_visitors || 0}
          icon={Users}
          description={`${analytics.today?.visitors || 0} today`}
          isLoading={isLoading}
          variant="default"
          trend={calculateTrends.visitors}
          trendLabel={calculateTrends.visitors !== undefined ? "vs previous period" : undefined}
          className="h-full"
        />
        <StatCard
          title="SESSIONS"
          value={analytics.summary?.sessions || 0}
          icon={BarChart}
          description={`${analytics.today?.sessions || 0} today`}
          isLoading={isLoading}
          variant="default"
          trend={calculateTrends.sessions}
          trendLabel={calculateTrends.sessions !== undefined ? "vs previous period" : undefined}
          className="h-full"
        />
        <StatCard
          title="PAGEVIEWS"
          value={analytics.summary?.pageviews || 0}
          icon={Globe}
          description={`${analytics.today?.pageviews || 0} today`}
          isLoading={isLoading}
          variant="default"
          trend={calculateTrends.pageviews}
          trendLabel={calculateTrends.pageviews !== undefined ? "vs previous period" : undefined}
          className="h-full"
        />
        <StatCard
          title="PAGES/SESSION"
          value={analytics.summary ?
            (analytics.summary.sessions > 0 ?
              (analytics.summary.pageviews / analytics.summary.sessions).toFixed(1) :
              '0'
            ) : '0'
          }
          icon={LayoutDashboard}
          isLoading={isLoading}
          variant="default"
          trend={calculateTrends.pages_per_session}
          trendLabel={calculateTrends.pages_per_session !== undefined ? "vs previous period" : undefined}
          className="h-full"
        />
        <StatCard
          title="BOUNCE RATE"
          value={analytics.summary?.bounce_rate_pct || '0%'}
          icon={MousePointer}
          isLoading={isLoading}
          trend={calculateTrends.bounce_rate}
          trendLabel={calculateTrends.bounce_rate !== undefined ? "vs previous period" : undefined}
          variant={getColorVariant(analytics.summary?.bounce_rate || 0, 70, 50)}
          invertTrend={true}
          className="h-full"
        />
        <StatCard
          title="SESSION DURATION"
          value={analytics.summary?.avg_session_duration_formatted || '0s'}
          icon={Timer}
          isLoading={isLoading}
          variant="default"
          trend={calculateTrends.session_duration}
          trendLabel={calculateTrends.session_duration !== undefined ? "vs previous period" : undefined}
          className="h-full"
        />
      </div>

      {/* Chart */}
      <div className="rounded-xl border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Traffic Trends</h2>
            <p className="text-sm text-muted-foreground">
              {dateRange.granularity === 'hourly' ? 'Hourly' : 'Daily'} traffic data
            </p>
            {dateRange.granularity === 'hourly' && dateDiff > 7 && (
              <div className="mt-1 flex items-center text-amber-600 gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>Large date ranges may affect performance</span>
              </div>
            )}
          </div>

          <MetricToggles
            metrics={visibleMetrics}
            onToggle={toggleMetric}
            colors={metricColors}
          />
        </div>
        <div>
          <MetricsChart
            data={chartData}
            isLoading={isLoading}
            height={350}
          />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          tabs={referrerTabs}
          title="Traffic Sources"
          description="Referrers and campaign data"
          isLoading={isLoading}
          initialPageSize={7}
          minHeight={230}
        />

        <DataTable
          tabs={pagesTabs}
          title="Pages"
          description="Top pages and entry/exit points"
          isLoading={isLoading}
          initialPageSize={7}
          minHeight={230}
        />
      </div>

      {/* Custom Events Table */}
      <DataTable
        data={processedCustomEventsData}
        columns={customEventsColumns}
        title="Custom Events"
        description="User-defined events and interactions"
        isLoading={customEventsLoading}
        initialPageSize={8}
        minHeight={200}
        emptyMessage="No custom events tracked yet"
      />

      {/* Technology */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DataTable
          data={processedDeviceData}
          columns={deviceColumns}
          title="Devices"
          description="Device breakdown"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
        />

        <DataTable
          data={processedBrowserData}
          columns={browserColumns}
          title="Browsers"
          description="Browser breakdown"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
        />

        <DataTable
          data={processedOSData}
          columns={osColumns}
          title="Operating Systems"
          description="OS breakdown"
          isLoading={isLoading}
          initialPageSize={8}
          minHeight={200}
          showSearch={false}
        />
      </div>
    </div>
  );
} 