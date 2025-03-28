"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ExternalLink, 
  Pencil, 
  Globe, 
  Users, 
  BarChart2, 
  Calendar, 
  Clock, 
  MousePointer, 
  Monitor, 
  Smartphone, 
  Zap,
  ChevronDown,
  LayoutDashboard,
  ArrowRight,
  AlertTriangle,
  Star,
  Loader2,
  Info,
  CalendarIcon,
  BarChart3Icon,
  RefreshCw
} from "lucide-react";
import { DateRange as DayPickerRange } from "react-day-picker";
import { format, subDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebsiteDialog } from "@/components/website-dialog";
import { getWebsiteById, updateWebsite } from "@/app/actions/websites";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/app/providers";
import { useWebsiteAnalytics, useAnalyticsSessions, useAnalyticsSessionDetails, useAnalyticsProfiles, SessionData, ProfileData } from "@/hooks/use-analytics";
import { PageData, ReferrerData, DateRange } from "@/hooks/use-analytics";

import { MetricsChart } from "@/components/charts/metrics-chart";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { StatCard } from "@/components/analytics/stat-card";
import { DataTable } from "@/components/analytics/data-table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function WebsiteDetailsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const { id } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Date range state for analytics with default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange>({
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });
  
  // Initialize date picker state with the same values
  const [date, setDate] = useState<DayPickerRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Memoize date range to prevent unnecessary re-renders
  const memoizedDateRange = useMemo(() => dateRange, [dateRange.start_date, dateRange.end_date]);

  // Callback for date range updates
  const handleDateRangeChange = useCallback((range: DayPickerRange | undefined) => {
    if (range?.from && range?.to) {
      setDate(range);
      setDateRange({
        start_date: format(range.from, 'yyyy-MM-dd'),
        end_date: format(range.to, 'yyyy-MM-dd')
      });
    }
  }, []);

  // Fetch website details with optimized settings
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["website", id],
    queryFn: async () => {
      const result = await getWebsiteById(id as string);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000, // 10 min
  });

  // Fetch all analytics data with a single hook
  const {
    analytics,
    loading,
    error: analyticsError,
    refetch
  } = useWebsiteAnalytics(id as string, memoizedDateRange);

  // Handler for manual data refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    
    // Also refresh sessions and profiles data if visible
    if (activeTab === "sessions" && sessionsRefetch) {
      await sessionsRefetch();
    }
    
    if (activeTab === "profiles" && profilesRefetch) {
      await profilesRefetch();
    }
    
    setIsRefreshing(false);
    toast.success("Data refreshed successfully");
  }, [refetch, activeTab]);

  // Handle website update
  const updateWebsiteMutation = useMutation({
    mutationFn: async (data: { name?: string; domain?: string }) => {
      return updateWebsite(id as string, data);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Website updated successfully");
      queryClient.invalidateQueries({ queryKey: ["website", id] });
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
    onError: (error) => {
      toast.error("Failed to update website");
      console.error(error);
    },
  });

  // Prepare data for charts and tables
  const deviceData = useMemo(() => {
    if (!analytics.device_types?.length) return [];
    return analytics.device_types.map((item) => ({
      name: item.device_type.charAt(0).toUpperCase() + item.device_type.slice(1),
      value: item.visitors
    }));
  }, [analytics.device_types]);

  const browserData = useMemo(() => {
    if (!analytics.browser_versions?.length) return [];
    
    // Group by browser name only
    const browserCounts = analytics.browser_versions.reduce((acc, item) => {
      const browserName = item.browser;
      if (!acc[browserName]) {
        acc[browserName] = { visitors: 0 };
      }
      acc[browserName].visitors += item.visitors;
      return acc;
    }, {} as Record<string, { visitors: number }>);
    
    return Object.entries(browserCounts).map(([browser, data]) => ({
      name: browser,
      value: data.visitors
    }));
  }, [analytics.browser_versions]);

  const topPagesColumns = useMemo(() => [
    {
      accessorKey: 'path',
      header: 'Page',
      cell: (value: string) => {
        const displayPath = value.length > 30 ? value.slice(0, 27) + '...' : value;
        
        return (
          <div className="flex items-center">
            <a 
              href={data?.domain ? `${data.domain}${value}` : `#${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-primary hover:underline truncate max-w-[250px] flex items-center gap-1"
              title={data?.domain ? `${data.domain}${value}` : value}
            >
              {displayPath}
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        );
      }
    },
    {
      accessorKey: 'pageviews',
      header: 'Views',
      className: 'text-right',
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      className: 'text-right',
    },
    // {
    //   accessorKey: 'avg_time_on_page_formatted',
    //   header: 'Avg. Time',
    //   className: 'text-right',
    // },
  ], [data?.domain]);

  const referrerColumns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Source',
      cell: (value: string, row: any) => (
        <span className="font-medium">
          {value || row.referrer || 'Direct'}
        </span>
      )
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      className: 'text-right',
    },
    {
      accessorKey: 'pageviews',
      header: 'Views',
      className: 'text-right',
    },
  ], []);

  // Add these new useMemo for the connection types, languages, and timezones data
  const connectionData = useMemo(() => {
    if (!analytics.connection_types?.length) return [];
    return analytics.connection_types.map(item => ({
      name: item.connection_type,
      value: item.visitors
    }));
  }, [analytics.connection_types]);

  const languageData = useMemo(() => {
    if (!analytics.languages?.length) return [];
    return analytics.languages.map(item => ({
      name: item.language,
      value: item.visitors
    }));
  }, [analytics.languages]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast.error("Failed to load website details");
      console.error(error);
    }
  }, [isError, error]);

  // Add this for session details dialog
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Fetch sessions data
  const { 
    data: sessionsData, 
    isLoading: isLoadingSessions,
    refetch: sessionsRefetch 
  } = useAnalyticsSessions(
    id as string, 
    { start_date: dateRange.start_date, end_date: dateRange.end_date },
    50
  );
  
  // Fetch session details when a session is selected
  const { data: sessionDetails, isLoading: isLoadingSessionDetails } = useAnalyticsSessionDetails(
    id as string,
    selectedSessionId || '',
    !!selectedSessionId
  );
  
  
  // Format session events for display
  const formattedEvents = useMemo(() => {
    if (!sessionDetails?.session?.events) return [];
    
    return sessionDetails.session.events.map(event => ({
      id: event.event_id,
      time: format(new Date(event.time), 'HH:mm:ss'),
      event: event.event_name,
      path: event.path,
      title: event.title || '-',
      time_on_page: event.time_on_page ? `${Math.round(event.time_on_page)}s` : '-',
      device_info: [event.browser, event.os, event.device_type]
        .filter(Boolean)
        .join(' / ') || 'Unknown'
    }));
  }, [sessionDetails]);

  // Add this for profiles tab
  const { 
    data: profilesData, 
    isLoading: isLoadingProfiles,
    refetch: profilesRefetch
  } = useAnalyticsProfiles(
    id as string, 
    { start_date: dateRange.start_date, end_date: dateRange.end_date },
    50
  );
  
  // Add this for profile details dialog
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Format the selected profile
  const selectedProfile = useMemo(() => {
    if (!selectedProfileId || !profilesData?.profiles) return null;
    return profilesData.profiles.find(profile => profile.visitor_id === selectedProfileId) || null;
  }, [selectedProfileId, profilesData]);
  
  // Format profile sessions for display
  const formattedProfileSessions = useMemo(() => {
    if (!selectedProfile?.sessions) return [];
    
    return selectedProfile.sessions.map(session => ({
      id: session.session_id,
      name: session.session_name,
      time: format(new Date(session.first_visit), 'MMM d, yyyy HH:mm:ss'),
      duration: session.duration_formatted,
      pages: session.page_views
    }));
  }, [selectedProfile]);

  if (isLoading) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" disabled className="h-8 w-8">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Skeleton className="h-7 w-48 mb-1" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-9 w-full max-w-xs mb-4" />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-8">
          <h1 className="text-xl font-bold mb-2">Website Not Found</h1>
          <p className="text-muted-foreground text-sm mb-4">
            The website you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button asChild size="sm">
            <Link href="/websites">Back to Websites</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Add this before the return statement
  const handleSessionRowClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };
  
  const handleCloseSessionDialog = () => {
    setSelectedSessionId(null);
  };

  // Add these before the return statement
  const handleProfileRowClick = (profileId: string) => {
    setSelectedProfileId(profileId);
  };
  
  const handleCloseProfileDialog = () => {
    setSelectedProfileId(null);
  };

  return (
    <div className="p-3 max-w-[1600px] mx-auto">
      {/* Compact header with breadcrumb and actions */}
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/websites")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Back to websites
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight">{data.name || "Unnamed Website"}</h1>
          <a
            href={data.domain}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {data.domain}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Calendar className="h-3 w-3" />
                {date?.from ? format(date.from, 'MMM d, yyyy') : ''} - {date?.to ? format(date.to, 'MMM d, yyyy') : ''}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                disabled={(date) => date > new Date() || date < new Date(2020, 0, 1)}
              />
            </PopoverContent>
          </Popover>
          
          <WebsiteDialog
            website={{
              id: data.id,
              name: data.name,
              domain: data.domain,
            }}
            onSubmit={(formData) => updateWebsiteMutation.mutate(formData)}
            isSubmitting={updateWebsiteMutation.isPending}
          >
            <Button variant="outline" size="sm" className="h-7 text-xs px-2">
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </WebsiteDialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-3">
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-xs h-7">Overview</TabsTrigger>
          <TabsTrigger value="audience" className="text-xs h-7">Audience</TabsTrigger>
          <TabsTrigger value="content" className="text-xs h-7">Content</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs h-7">Performance</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs h-7">Settings</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs h-7">Sessions</TabsTrigger>
          <TabsTrigger value="profiles" className="text-xs h-7">Profiles</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="pt-2 space-y-2">
          {/* Key metrics */}
          <div className="grid grid-cols-4 gap-1.5">
            <StatCard 
              title="Unique Visitors"
              value={analytics.summary?.unique_visitors || 0}
              icon={Users}
              description={`${analytics.today?.visitors || 0} today`}
              isLoading={loading.summary}
              variant="info"
              className="shadow-sm"
            />
            <StatCard 
              title="Page Views"
              value={analytics.summary?.pageviews || 0}
              icon={Globe}
              description={`${analytics.today?.pageviews || 0} today`}
              isLoading={loading.summary}
              className="shadow-sm"
            />
            <StatCard 
              title="Bounce Rate"
              value={analytics.summary?.bounce_rate_pct || '0%'}
              icon={MousePointer}
              isLoading={loading.summary}
              variant={
                (analytics.summary?.bounce_rate || 0) > 70 ? "danger" : 
                (analytics.summary?.bounce_rate || 0) > 50 ? "warning" : "success"
              }
              className="shadow-sm"
            />
            <StatCard 
              title="Avg. Session"
              value={analytics.summary?.avg_session_duration_formatted || '0s'}
              icon={Clock}
              isLoading={loading.summary}
              className="shadow-sm"
            />
          </div>

          {/* Visitor Trends */}
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <MetricsChart 
              data={analytics.events_by_date} 
              isLoading={loading.summary}
            />
          </div>

          {/* Two column layout for smaller charts and tables */}
          <div className="grid gap-2 grid-cols-2">
            {/* Left column */}
            <div className="space-y-2">
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DistributionChart 
                  data={deviceData} 
                  isLoading={loading.summary}
                  title="Device Types"
                  description="Visitors by device type"
                  height={190}
                />
              </div>
              
              <div className="rounded-lg border shadow-sm overflow-hidden">  
                <DataTable 
                  data={analytics.top_referrers}
                  columns={referrerColumns}
                  title="Top Referrers"
                  description="Sources of your traffic"
                  isLoading={loading.summary}
                  limit={5}
                />
              </div>
            </div>
            
            {/* Right column */}
            <div className="space-y-2">
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DistributionChart 
                  data={browserData} 
                  isLoading={loading.summary}
                  title="Browsers"
                  description="Visitors by browser"
                  height={190}
                />
              </div>
              
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DataTable 
                  data={analytics.top_pages}
                  columns={topPagesColumns}
                  title="Top Pages"
                  description="Most viewed content"
                  isLoading={loading.summary}
                  limit={5}
                />
              </div>
            </div>
          </div>

          {/* Performance Snapshot */}
          <div className="grid grid-cols-4 gap-1.5">
            <StatCard 
              title="Page Load Time"
              value={analytics.performance?.avg_load_time_formatted || '0 ms'}
              icon={Zap}
              isLoading={loading.summary}
              variant={
                (analytics.performance?.avg_load_time || 0) > 3000 ? "danger" : 
                (analytics.performance?.avg_load_time || 0) > 1500 ? "warning" : "success"
              }
              className="shadow-sm"
            />
            <StatCard 
              title="Time to First Byte"
              value={analytics.performance?.avg_ttfb_formatted || '0 ms'}
              icon={Zap}
              isLoading={loading.summary}
              className="shadow-sm"
            />
            <StatCard 
              title="DOM Ready"
              value={analytics.performance?.avg_dom_ready_time_formatted || '0 ms'}
              icon={Zap}
              isLoading={loading.summary}
              className="shadow-sm"
            />
            <StatCard 
              title="Render Time"
              value={analytics.performance?.avg_render_time_formatted || '0 ms'}
              icon={Zap}
              isLoading={loading.summary}
              className="shadow-sm"
            />
          </div>
        </TabsContent>
        
        {/* Other tabs would be detailed here... */}
        <TabsContent value="audience">
          <div className="pt-2 space-y-3">
            <h2 className="text-lg font-semibold mb-2">Audience Insights</h2>
            
            {/* First row - Device and browser info */}
            <div className="grid gap-2 grid-cols-2">
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DistributionChart 
                  data={deviceData} 
                  isLoading={loading.summary}
                  title="Device Types"
                  description="Visitors by device type"
                  height={280}
                />
              </div>
              
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DistributionChart 
                  data={browserData} 
                  isLoading={loading.summary}
                  title="Browsers"
                  description="Visitors by browser"
                  height={280}
                />
              </div>
            </div>
            
            {/* Second row - Connection type and language data */}
            <div className="grid gap-2 grid-cols-2">
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DistributionChart 
                  data={connectionData} 
                  isLoading={loading.summary}
                  title="Connection Types"
                  description="Visitors by network connection"
                  height={250}
                />
              </div>
              
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DistributionChart 
                  data={languageData} 
                  isLoading={loading.summary}
                  title="Languages"
                  description="Visitors by preferred language"
                  height={250}
                />
              </div>
            </div>
            
            {/* Timezones */}
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <DataTable 
                data={analytics.timezones?.map(item => ({
                  timezone: item.timezone, 
                  visitors: item.visitors, 
                  pageviews: item.pageviews
                })) || []}
                columns={[
                  {
                    accessorKey: 'timezone',
                    header: 'Timezone',
                    cell: (value: string) => (
                      <span className="font-medium">
                        {value || 'Unknown'}
                      </span>
                    )
                  },
                  {
                    accessorKey: 'visitors',
                    header: 'Visitors',
                    className: 'text-right'
                  },
                  {
                    accessorKey: 'pageviews',
                    header: 'Pageviews',
                    className: 'text-right'
                  }
                ]}
                title="Timezones"
                description="Visitors by timezone"
                isLoading={loading.summary}
                limit={10}
              />
            </div>
            
            {/* Countries */}
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <DataTable 
                data={analytics.countries}
                columns={[
                  {
                    accessorKey: 'country',
                    header: 'Country',
                    cell: (value: string) => (
                      <span className="font-medium">
                        {value || 'Unknown'}
                      </span>
                    )
                  },
                  {
                    accessorKey: 'visitors',
                    header: 'Visitors',
                    className: 'text-right'
                  },
                  {
                    accessorKey: 'pageviews',
                    header: 'Pageviews',
                    className: 'text-right'
                  }
                ]}
                title="Geographic Distribution"
                description="Visitors by location"
                isLoading={loading.summary}
              />
            </div>
            
            {/* Screen resolutions */}
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <DataTable 
                data={analytics.screen_resolutions}
                columns={[
                  {
                    accessorKey: 'screen_resolution',
                    header: 'Resolution',
                    cell: (value: string) => (
                      <span className="font-medium">
                        {value || 'Unknown'}
                      </span>
                    )
                  },
                  {
                    accessorKey: 'visitors',
                    header: 'Visitors',
                    className: 'text-right'
                  },
                  {
                    accessorKey: 'count',
                    header: 'Count',
                    className: 'text-right'
                  }
                ]}
                title="Screen Resolutions"
                description="Visitors by screen size"
                isLoading={loading.summary}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="content">
          <div className="pt-2 space-y-3">
            <h2 className="text-lg font-semibold mb-2">Content Performance</h2>
            
            {/* Top pages full table */}
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <DataTable 
                data={analytics.top_pages}
                columns={topPagesColumns}
                title="Top Pages"
                description="Most viewed content"
                isLoading={loading.summary}
                limit={10}
              />
            </div>
            
            {/* Top referrers full table */}
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <DataTable 
                data={analytics.top_referrers}
                columns={referrerColumns}
                title="Traffic Sources"
                description="Where your visitors come from"
                isLoading={loading.summary}
                limit={10}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="performance">
          <div className="pt-2 space-y-3">
            <h2 className="text-lg font-semibold mb-2">Performance Metrics</h2>
            
            {/* Performance metrics */}
            <div className="grid gap-1.5 grid-cols-4">
              <StatCard 
                title="Page Load Time"
                value={analytics.performance?.avg_load_time_formatted || '0 ms'}
                icon={Zap}
                isLoading={loading.summary}
                variant={
                  (analytics.performance?.avg_load_time || 0) > 3000 ? "danger" : 
                  (analytics.performance?.avg_load_time || 0) > 1500 ? "warning" : "success"
                }
                className="shadow-sm"
              />
              <StatCard 
                title="Time to First Byte"
                value={analytics.performance?.avg_ttfb_formatted || '0 ms'}
                icon={Zap}
                isLoading={loading.summary}
                variant={
                  (analytics.performance?.avg_ttfb || 0) > 1000 ? "danger" : 
                  (analytics.performance?.avg_ttfb || 0) > 500 ? "warning" : "success"
                }
                className="shadow-sm"
              />
              <StatCard 
                title="DOM Ready"
                value={analytics.performance?.avg_dom_ready_time_formatted || '0 ms'}
                icon={Zap}
                isLoading={loading.summary}
                variant={
                  (analytics.performance?.avg_dom_ready_time || 0) > 2000 ? "danger" : 
                  (analytics.performance?.avg_dom_ready_time || 0) > 1000 ? "warning" : "success"
                }
                className="shadow-sm"
              />
              <StatCard 
                title="Render Time"
                value={analytics.performance?.avg_render_time_formatted || '0 ms'}
                icon={Zap}
                isLoading={loading.summary}
                variant={
                  (analytics.performance?.avg_render_time || 0) > 2000 ? "danger" : 
                  (analytics.performance?.avg_render_time || 0) > 1000 ? "warning" : "success"
                }
                className="shadow-sm"
              />
            </div>
            
            {/* More detailed metrics */}
            <div className="grid gap-1.5 grid-cols-3">
              <StatCard 
                title="First Contentful Paint"
                value={analytics.performance?.avg_fcp_formatted || '0 ms'}
                icon={Monitor}
                isLoading={loading.summary}
                className="shadow-sm"
              />
              <StatCard 
                title="Largest Contentful Paint"
                value={analytics.performance?.avg_lcp_formatted || '0 ms'}
                icon={Monitor}
                isLoading={loading.summary}
                className="shadow-sm"
              />
              <StatCard 
                title="Cumulative Layout Shift"
                value={analytics.performance?.avg_cls_formatted || '0'}
                icon={Monitor}
                isLoading={loading.summary}
                className="shadow-sm"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="max-w-2xl pt-3">
            <h2 className="text-lg font-semibold mb-3">Website Settings</h2>
            
            <div className="rounded-lg border shadow-sm overflow-hidden mb-4">
              <div className="p-4">
                <h3 className="text-sm font-medium mb-2">Tracking Code</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Add this code to your website to start tracking visitors and analytics.
                </p>
                <div className="bg-secondary p-3 rounded-md mb-3 overflow-x-auto">
                  <pre className="text-xs">
                    <code>{`<script src="https://cdn.databuddy.com/tracker.js" data-website-id="${data.id}"></script>`}</code>
                  </pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `<script src="https://cdn.databuddy.com/tracker.js" data-website-id="${data.id}"></script>`
                    );
                    toast.success("Tracking code copied to clipboard");
                  }}
                >
                  Copy Code
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4">
                <h3 className="text-sm font-medium mb-2">Website Information</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="font-medium">ID:</div>
                  <div className="text-muted-foreground">{data.id}</div>
                  <div className="font-medium">Created:</div>
                  <div className="text-muted-foreground">{new Date(data.createdAt).toLocaleDateString()}</div>
                  <div className="font-medium">Last Updated:</div>
                  <div className="text-muted-foreground">{new Date(data.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Add the new Sessions tab content */}
        <TabsContent value="sessions">
          <div className="pt-2 space-y-3">
            <h2 className="text-lg font-semibold mb-2">Visitor Sessions</h2>
            
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <DataTable
                data={sessionsData?.sessions || []}
                columns={[
                  {
                    accessorKey: 'session_name',
                    header: 'Session',
                    cell: (value: string, row: any) => (
                      <div className="font-medium flex items-center">
                        {value}
                        {row.is_returning_visitor && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                            Returning
                          </span>
                        )}
                      </div>
                    )
                  },
                  {
                    accessorKey: 'first_visit',
                    header: 'Time',
                    cell: (value: string) => (
                      <div>
                        {value ? format(new Date(value), 'MMM d, yyyy HH:mm:ss') : '-'}
                      </div>
                    )
                  },
                  {
                    accessorKey: 'country',
                    header: 'Location',
                    cell: (value: string) => (
                      <div className="whitespace-nowrap">
                        {value || 'Unknown'}
                      </div>
                    )
                  },
                  {
                    accessorKey: 'device',
                    header: 'Device',
                    cell: (value: string) => value || 'Unknown'
                  },
                  {
                    accessorKey: 'page_views',
                    header: 'Pages',
                    className: 'text-right',
                    cell: (value: number) => value || 0
                  },
                  {
                    accessorKey: 'duration_formatted',
                    header: 'Duration',
                    className: 'text-right',
                    cell: (value: string) => value || '0s'
                  },
                  {
                    accessorKey: 'referrer_parsed',
                    header: 'Source',
                    cell: (value: { type: string; name: string; domain: string } | undefined) => (
                      <div className="max-w-[200px] truncate">
                        {value?.name || 'Direct'}
                      </div>
                    )
                  }
                ]}
                title="Recent Sessions"
                description="List of visitor sessions on your website"
                isLoading={isLoadingSessions}
                emptyMessage="No session data available for the selected period"
                onRowClick={(row: { session_id: string }) => handleSessionRowClick(row.session_id)}
              />
            </div>
            
            {sessionsData && (
              <div className="text-sm text-muted-foreground mt-2">
                Showing {sessionsData.sessions.length} sessions from {sessionsData.unique_visitors} unique visitors in the selected period.
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Add the Profiles tab content */}
        <TabsContent value="profiles">
          <div className="pt-2 space-y-3">
            <h2 className="text-lg font-semibold mb-2">Visitor Profiles</h2>
            
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <DataTable
                data={profilesData?.profiles || []}
                columns={[
                  {
                    accessorKey: 'visitor_id',
                    header: 'Visitor ID',
                    cell: (value: string) => (
                      <div className="font-medium">
                        {value.substring(0, 12)}...
                        {value && value.split('_').length > 1 && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                            {value.split('_')[0]}
                          </span>
                        )}
                      </div>
                    )
                  },
                  {
                    accessorKey: 'first_visit',
                    header: 'First Visit',
                    cell: (value: string) => (
                      <div>
                        {value ? format(new Date(value), 'MMM d, yyyy HH:mm') : '-'}
                      </div>
                    )
                  },
                  {
                    accessorKey: 'total_sessions',
                    header: 'Sessions',
                    className: 'text-right',
                    cell: (value: number) => value || 0
                  },
                  {
                    accessorKey: 'total_pageviews',
                    header: 'Pageviews',
                    className: 'text-right',
                    cell: (value: number) => value || 0
                  },
                  {
                    accessorKey: 'device',
                    header: 'Device',
                    cell: (value: string) => value || 'Unknown'
                  },
                  {
                    accessorKey: 'browser',
                    header: 'Browser',
                    cell: (value: string) => value || 'Unknown'
                  },
                  {
                    accessorKey: 'total_duration_formatted',
                    header: 'Total Time',
                    className: 'text-right',
                    cell: (value: string) => value || '0s'
                  }
                ]}
                title="Visitor Profiles"
                description="Detailed visitor information grouped by unique ID"
                isLoading={isLoadingProfiles}
                emptyMessage="No visitor data available for the selected period"
                onRowClick={(row: { visitor_id: string }) => handleProfileRowClick(row.visitor_id)}
              />
            </div>
            
            {profilesData && (
              <div className="text-sm text-muted-foreground mt-2">
                Showing {profilesData.profiles.length} of {profilesData.total_visitors} visitors ({profilesData.returning_visitors} returning) in the selected period.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Session Details Dialog */}
      <Dialog open={!!selectedSessionId} onOpenChange={(open) => {
        if (!open) handleCloseSessionDialog();
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {sessionDetails?.session?.session_name || 'Session Details'}
              {sessionDetails?.session?.is_returning_visitor && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                  Returning Visitor
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {sessionDetails?.session ? (
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Started:</span> {format(new Date(sessionDetails.session.first_visit), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {sessionDetails.session.duration_formatted}
                  </div>
                  <div>
                    <span className="font-medium">Device:</span> {sessionDetails.session.device || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Browser:</span> {sessionDetails.session.browser || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Country:</span> {sessionDetails.session.country || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Pages viewed:</span> {sessionDetails.session.page_views}
                  </div>
                  <div>
                    <span className="font-medium">Visitor ID:</span> {sessionDetails.session.visitor_id?.substring(0, 8) || 'Unknown'}
                    {sessionDetails.session.is_returning_visitor && (
                      <span className="ml-2 text-xs">
                        (Session {sessionDetails.session.visitor_session_count} of this visitor)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Referrer:</span> {sessionDetails.session.referrer_parsed?.name || 'Direct'}
                    {sessionDetails.session.referrer && (
                      <span className="text-xs ml-2 opacity-70">({sessionDetails.session.referrer})</span>
                    )}
                  </div>
                </div>
              ) : (
                <p>Loading session information...</p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Session Events</h3>
            {isLoadingSessionDetails ? (
              <div className="text-center py-8">Loading session events...</div>
            ) : (
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DataTable
                  data={formattedEvents}
                  columns={[
                    {
                      accessorKey: 'time',
                      header: 'Time',
                      cell: (value: string) => <div className="font-medium">{value}</div>
                    },
                    {
                      accessorKey: 'event',
                      header: 'Event'
                    },
                    {
                      accessorKey: 'path',
                      header: 'Path',
                      cell: (value: string) => (
                        <div className="max-w-[250px] truncate">
                          {value}
                        </div>
                      )
                    },
                    {
                      accessorKey: 'device_info',
                      header: 'Device Info',
                      cell: (value: string) => (
                        <div className="max-w-[200px] truncate">
                          {value}
                        </div>
                      )
                    },
                    {
                      accessorKey: 'time_on_page',
                      header: 'Time on Page',
                      className: 'text-right'
                    }
                  ]}
                  title="Session Timeline"
                  description="Chronological list of events during this session"
                  isLoading={isLoadingSessionDetails}
                  emptyMessage="No events recorded for this session"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Profile Details Dialog */}
      <Dialog open={!!selectedProfileId} onOpenChange={(open) => {
        if (!open) handleCloseProfileDialog();
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Visitor Profile {selectedProfile?.visitor_id.substring(0, 12)}...
              {selectedProfile && selectedProfile.total_sessions > 1 && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                  Returning Visitor
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedProfile ? (
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">First visit:</span> {format(new Date(selectedProfile.first_visit), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                  <div>
                    <span className="font-medium">Last visit:</span> {format(new Date(selectedProfile.last_visit), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                  <div>
                    <span className="font-medium">Total sessions:</span> {selectedProfile.total_sessions}
                  </div>
                  <div>
                    <span className="font-medium">Total pages viewed:</span> {selectedProfile.total_pageviews}
                  </div>
                  <div>
                    <span className="font-medium">Device:</span> {selectedProfile.device || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Browser:</span> {selectedProfile.browser || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Country:</span> {selectedProfile.country || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Total time spent:</span> {selectedProfile.total_duration_formatted}
                  </div>
                </div>
              ) : (
                <p>Loading profile information...</p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Sessions</h3>
            {isLoadingProfiles ? (
              <div className="text-center py-8">Loading sessions...</div>
            ) : (
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <DataTable
                  data={formattedProfileSessions}
                  columns={[
                    {
                      accessorKey: 'name',
                      header: 'Session',
                      cell: (value: string) => <div className="font-medium">{value}</div>
                    },
                    {
                      accessorKey: 'time',
                      header: 'Time'
                    },
                    {
                      accessorKey: 'pages',
                      header: 'Pages',
                      className: 'text-right'
                    },
                    {
                      accessorKey: 'duration',
                      header: 'Duration',
                      className: 'text-right'
                    }
                  ]}
                  title="Session History"
                  description="This visitor's sessions in chronological order"
                  isLoading={isLoadingProfiles}
                  emptyMessage="No sessions recorded for this visitor"
                  onRowClick={(row: { id: string }) => handleSessionRowClick(row.id)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 

export default function Page() {
    return (
        <Suspense fallback={
          <div className="p-3 flex items-center justify-center h-screen">
            <div className="space-y-3 w-full max-w-md">
              <Skeleton className="h-7 w-2/3 mx-auto" />
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        }>
            <WebsiteDetailsPage />
        </Suspense>
    )
}