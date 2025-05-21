"use client";

import { useMemo, useEffect } from "react";
import { FileText, Globe, BarChart, Link2, Users, Clock } from "lucide-react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { DataTable } from "@/components/analytics/data-table";
import { useWebsiteAnalytics } from "@/hooks/use-analytics";
import type { FullTabProps } from "../utils/types";
import { EmptyState } from "../utils/ui-components";
import { formatDomainLink } from "../utils/analytics-helpers";
import { PageLinkCell, type PageLinkCellData } from "@/components/atomic/PageLinkCell";
import { ReferrerSourceCell, type ReferrerSourceCellData } from "@/components/atomic/ReferrerSourceCell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TopPageEntry {
  path: string;
  pageviews: number;
  visitors?: number;
  avg_time_on_page?: number | null;
  avg_time_on_page_formatted?: string;
}

interface TopReferrerEntry {
  referrer: string;
  name?: string;
  domain?: string;
  visitors: number;
  pageviews: number;
  type?: string;
}

export function WebsiteContentTab({
  websiteId,
  dateRange,
  isRefreshing,
  setIsRefreshing,
  websiteData
}: FullTabProps) {
  const {
    analytics,
    loading,
    error,
    refetch
  } = useWebsiteAnalytics(websiteId, dateRange);

  useEffect(() => {
    let isMounted = true;
    
    if (isRefreshing) {
      const doRefresh = async () => {
        try {
          await refetch();
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

  const topPagesColumns = useMemo((): ColumnDef<TopPageEntry, any>[] => [
    {
      accessorKey: 'path',
      header: 'Page Path',
      cell: (info: CellContext<TopPageEntry, string>) => (
        <PageLinkCell 
          path={info.getValue()} 
          websiteDomain={websiteData?.domain} 
        />
      )
    },
    {
      accessorKey: 'pageviews',
      header: 'Views',
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: (info: CellContext<TopPageEntry, number | undefined>) => info.getValue() ?? 'N/A'
    },
    {
      accessorKey: 'avg_time_on_page_formatted',
      header: 'Avg. Time',
      cell: (info: CellContext<TopPageEntry, string | null | undefined>) => info.getValue() || 'N/A'
    },
    {
        accessorKey: 'percentage_of_total',
        header: '% Total Views',
        cell: (info: CellContext<TopPageEntry, number | undefined>) => {
          const value = info.getValue();
          return value ? `${value.toFixed(1)}%` : 'N/A';
        }
    }
  ], [websiteData?.domain]);

  const topPagesData = useMemo(() => {
    if (!analytics.top_pages?.length) return [];
    const totalSiteViews = analytics.summary?.pageviews || 1;
    return analytics.top_pages.map((page: TopPageEntry) => ({
      ...page,
      percentage_of_total: (page.pageviews / totalSiteViews) * 100
    })).slice(0, 10);
  }, [analytics.top_pages, analytics.summary?.pageviews]);

  const topReferrersColumns = useMemo((): ColumnDef<TopReferrerEntry, any>[] => [
    {
      accessorKey: 'name',
      header: 'Source',
      cell: (info: CellContext<TopReferrerEntry, string | undefined>) => {
        const cellData: ReferrerSourceCellData = info.row.original;
        return <ReferrerSourceCell {...cellData} />;
      }
    },
    {
        accessorKey: 'type',
        header: 'Type',
        meta: { className: 'text-left capitalize' },
        cell: (info: CellContext<TopReferrerEntry, string | undefined>) => {
          const value = info.getValue();
          return value ? value : 'Unknown';
        }
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'pageviews',
      header: 'Pageviews',
      meta: { className: 'text-right' },
    },
  ], []);

  const topReferrersData = useMemo(() => {
      return analytics.top_referrers?.slice(0, 10) || [];
  }, [analytics.top_referrers]);

  if (!isLoading && error?.summary) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Error Loading Content Data"
          description="There was an issue retrieving content analytics. Please try refreshing."
          action={null}
        />
      </div>
    );
  }

  if (!isLoading && !topPagesData.length && !topReferrersData.length) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No Content Data Available"
          description="Content and referrer data will appear here once your website receives more traffic."
          action={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-lg">Content Engagement</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-0.5">Key metrics for user interaction with your content</CardDescription>
            </div>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Avg. Session Duration</p>
                <p className="text-xl font-semibold">
                  {analytics.summary?.avg_session_duration_formatted || '0s'}
                </p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground self-end mt-1" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Bounce Rate</p>
                <p className="text-xl font-semibold">
                  {analytics.summary?.bounce_rate_pct || '0%'}
                </p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground self-end mt-1" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Pages per Session</p>
                <p className="text-xl font-semibold">
                  {analytics.summary?.sessions && analytics.summary.sessions > 0 ? 
                    ( (analytics.summary.pageviews || 0) / analytics.summary.sessions).toFixed(1) : 
                    '0.0'
                  }
                </p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground self-end mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {topPagesData.length > 0 && (
        <DataTable
            data={topPagesData}
            columns={topPagesColumns}
            title="Top Pages"
            description="Most viewed pages on your website."
            isLoading={isLoading}
          />
      )}

      {topReferrersData.length > 0 && (
        <DataTable
            data={topReferrersData}
            columns={topReferrersColumns}
            title="Top Referrers"
            description="Where your website traffic is coming from."
            isLoading={isLoading}
          />
      )}
    </div>
  );
} 