"use client";

import { useParams } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { 
  UserRound, 
  Globe,
  Clock,
  Smartphone,
  Monitor,
  ArrowUpRight,
  Filter,
  CircleUser
} from "lucide-react";

import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { cn } from "@/lib/utils";
import { useAnalyticsProfiles, useAnalyticsSessions } from "@/hooks/use-analytics";
import type { ProfileData, SessionData } from "@/hooks/use-analytics";
import { DataTable } from "@/components/analytics/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ProfilesPage() {
  const { id } = useParams<{ id: string }>();
  
  // Date range state (last 30 days by default)
  const [date, setDate] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  // Convert selected date range to string format for API
  const dateRange = useMemo(() => ({
    start_date: date.from ? format(date.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: date.to ? format(date.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  }), [date]);

  // Filter state
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Fetch profiles data
  const { data: profilesData, isLoading } = useAnalyticsProfiles(
    id, 
    dateRange
  );
  
  // Fetch sessions for all profiles
  const { data: allSessionsData, isLoading: isLoadingAllSessions } = useAnalyticsSessions(
    id, 
    dateRange,
    1000 // Fetch more sessions to ensure we have enough for profile filtering
  );

  // Profile filtering function
  const filteredProfiles = useMemo(() => {
    if (!profilesData?.profiles) return [];
    
    let results = [...profilesData.profiles];
    
    // Filter by device type if tab is not 'all'
    if (activeTab !== 'all') {
      results = results.filter(profile => {
        if (activeTab === 'desktop') return profile.device === 'desktop';
        if (activeTab === 'mobile') return profile.device === 'mobile' || profile.device === 'tablet';
        if (activeTab === 'returning') return profile.total_sessions > 1;
        return true;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(profile => 
        profile.visitor_id.toLowerCase().includes(query) ||
        (profile.country?.toLowerCase().includes(query) ?? false) ||
        (profile.city?.toLowerCase().includes(query) ?? false) ||
        (profile.browser?.toLowerCase().includes(query) ?? false)
      );
    }
    
    return results;
  }, [profilesData?.profiles, activeTab, searchQuery]);

  // Get sessions for selected profile
  const profileSessions = useMemo(() => {
    if (!selectedProfileId || !allSessionsData?.sessions) return [];
    return allSessionsData.sessions.filter(session => 
      session.visitor_id === selectedProfileId
    ).sort((a, b) => {
      const dateA = new Date(a.first_visit || '').getTime();
      const dateB = new Date(b.first_visit || '').getTime();
      return dateB - dateA;
    });
  }, [selectedProfileId, allSessionsData?.sessions]);

  // Stats calculations
  const totalVisitors = profilesData?.total_visitors || 0;
  const returningVisitors = profilesData?.returning_visitors || 0;
  const returningRate = totalVisitors > 0 ? Math.round((returningVisitors / totalVisitors) * 100) : 0;
  
  // Get the selected profile details
  const selectedProfile = useMemo(() => {
    if (!selectedProfileId || !profilesData?.profiles) return null;
    return profilesData.profiles.find(profile => profile.visitor_id === selectedProfileId);
  }, [selectedProfileId, profilesData?.profiles]);

  // Profile columns definition
  type ProfileColumn = {
    accessorKey: keyof ProfileData;
    header: string;
    cell: (value: any) => React.ReactNode;
    className?: string;
  };

  const profileColumns: ProfileColumn[] = [
    {
      accessorKey: 'visitor_id',
      header: 'Visitor ID',
      cell: (value: string) => (
        <span className="font-mono text-xs truncate block max-w-[150px]" title={value}>
          {value.substring(0, 8)}...
        </span>
      )
    },
    {
      accessorKey: 'last_visit',
      header: 'Last Seen',
      cell: (value: string) => {
        if (!value) return <span>-</span>;
        try {
          const date = new Date(value);
          return (
            <span className="whitespace-nowrap">
              {Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy')}
            </span>
          );
        } catch (error) {
          return <span>-</span>;
        }
      }
    },
    {
      accessorKey: 'total_sessions',
      header: 'Sessions',
      cell: (value: number) => (
        <span className="font-medium">{value || 0}</span>
      ),
      className: 'text-right',
    },
    {
      accessorKey: 'country',
      header: 'Country',
      cell: (value: string) => {
        if (!value || value === 'Unknown') return <span className="text-muted-foreground">Unknown</span>;
        return (
          <div className="flex items-center gap-1.5">
            {value && (
              <div className="w-4 h-3 relative overflow-hidden rounded-[1px]">
                <img 
                  src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${value.toUpperCase()}.svg`}
                  alt={value}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <span>{value}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'device',
      header: 'Device',
      cell: (value: string) => {
        const icon = value === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />;
        return (
          <div className="flex items-center gap-1.5">
            {icon}
            <span className="capitalize">{value || 'Unknown'}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'browser',
      header: 'Browser',
      cell: (value: string) => (
        <span className="capitalize">{value || 'Unknown'}</span>
      )
    },
  ];

  // Sessions columns for profile detail view
  type SessionColumn = {
    accessorKey: keyof SessionData;
    header: string;
    cell: (value: any) => React.ReactNode;
    className?: string;
  };

  const sessionColumns: SessionColumn[] = [
    {
      accessorKey: 'first_visit',
      header: 'Date',
      cell: (value: string) => {
        if (!value) return <span>-</span>;
        try {
          const date = new Date(value);
          return (
            <span className="whitespace-nowrap">
              {Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy HH:mm')}
            </span>
          );
        } catch (error) {
          return <span>-</span>;
        }
      }
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: (value: number) => {
        if (typeof value !== 'number') return <span>-</span>;
        return <span>{Math.floor(value / 60)}m {value % 60}s</span>;
      }
    },
    {
      accessorKey: 'page_views',
      header: 'Pages',
      cell: (value: number) => (
        <span className="font-medium">{value || 0}</span>
      ),
      className: 'text-right',
    },
    {
      accessorKey: 'referrer',
      header: 'Referrer',
      cell: (value: string) => {
        if (!value || value === 'direct') return <span className="text-muted-foreground">Direct</span>;
        return (
          <span className="truncate block max-w-[120px]" title={value}>
            {value}
          </span>
        );
      }
    },
  ];

  // Event handlers
  const handleProfileClick = useCallback((profile: any) => {
    setSelectedProfileId(profile.visitor_id);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setSelectedProfileId(null);
  }, []);
  
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDate(range);
    }
  }, []);

  // Add onKeyDown for accessibility to handle keyboard navigation
  const handleProfileRowKeyDown = useCallback((e: React.KeyboardEvent, profile: any) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleProfileClick(profile);
    }
  }, [handleProfileClick]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex flex-col p-6 pb-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Visitor Profiles</h1>
            <p className="text-muted-foreground text-sm">
              Analyze your website visitors and their behavior
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <CalendarDateRangePicker
              initialDateRange={date}
              onUpdate={handleDateRangeChange}
            />
          </div>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{totalVisitors.toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Returning Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-center gap-2">
                  <CircleUser className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{returningVisitors.toLocaleString()}</span>
                  <Badge variant="outline" className="ml-2 font-normal">
                    {returningRate}% return rate
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <Monitor className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">
                      {profilesData?.profiles?.filter(p => p.device === 'desktop').length || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">Desktop</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Smartphone className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">
                      {profilesData?.profiles?.filter(p => p.device === 'mobile' || p.device === 'tablet').length || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">Mobile</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start justify-between">
          <Tabs 
            defaultValue="all" 
            className="w-full max-w-[400px]"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="desktop">Desktop</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
              <TabsTrigger value="returning">Returning</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full sm:max-w-[250px]">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search profiles..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 pt-4 overflow-hidden">
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden h-full flex flex-col">
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filteredProfiles.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {profileColumns.map((column) => (
                      <th 
                        key={column.accessorKey} 
                        className={cn(
                          "px-4 py-3 text-xs font-medium text-left", 
                          column.className
                        )}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile, i) => (
                    <tr 
                      key={profile.visitor_id} 
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleProfileClick(profile)}
                      onKeyDown={(e) => handleProfileRowKeyDown(e, profile)}
                      tabIndex={0}
                      aria-label={`View details for visitor ${profile.visitor_id}`}
                    >
                      {profileColumns.map((column) => (
                        <td 
                          key={`${profile.visitor_id}-${column.accessorKey}`} 
                          className={cn("px-4 py-3 text-sm", column.className)}
                        >
                          {column.cell(profile[column.accessorKey])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <UserRound className="h-8 w-8 mb-2 opacity-20" />
                <p>No visitor profiles found</p>
                <p className="text-sm">Try changing your filters or date range</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-muted/20 text-sm text-muted-foreground">
            Showing {filteredProfiles.length} of {profilesData?.profiles?.length || 0} profiles
          </div>
        </div>
      </div>
      
      {/* Profile Detail Dialog */}
      <Dialog open={!!selectedProfileId} onOpenChange={(open) => !open && handleCloseProfile()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Visitor Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Visitor ID</p>
                  <p className="text-sm font-mono truncate" title={selectedProfile.visitor_id}>
                    {selectedProfile.visitor_id}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">First Seen</p>
                  <p className="text-sm">
                    {format(new Date(selectedProfile.first_visit), 'MMM d, yyyy')}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Seen</p>
                  <p className="text-sm">
                    {format(new Date(selectedProfile.last_visit), 'MMM d, yyyy')}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                  <p className="text-sm font-semibold">{selectedProfile.total_sessions}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Pageviews</p>
                  <p className="text-sm font-semibold">{selectedProfile.total_pageviews}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Time</p>
                  <p className="text-sm">{selectedProfile.total_duration_formatted}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Device</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    {selectedProfile.device === 'desktop' ? 
                      <Monitor className="h-3 w-3" /> : 
                      <Smartphone className="h-3 w-3" />}
                    <span className="capitalize">{selectedProfile.device}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Browser</p>
                  <p className="text-sm capitalize">{selectedProfile.browser}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">OS</p>
                  <p className="text-sm">{selectedProfile.os}</p>
                </div>
                
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Globe className="h-3 w-3" />
                    <span>
                      {selectedProfile.city && selectedProfile.city !== 'Unknown'
                        ? `${selectedProfile.city}, ${selectedProfile.country}`
                        : selectedProfile.country || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-3">Session History</h4>
                
                {isLoadingAllSessions ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : profileSessions.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          {sessionColumns.map((column) => (
                            <th 
                              key={column.accessorKey} 
                              className={cn(
                                "px-3 py-2 text-xs font-medium text-left", 
                                column.className
                              )}
                            >
                              {column.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {profileSessions.map((session, i) => (
                          <tr 
                            key={session.session_id} 
                            className="border-b last:border-0"
                          >
                            {sessionColumns.map((column) => (
                              <td 
                                key={`${session.session_id}-${column.accessorKey}`} 
                                className={cn("px-3 py-2 text-xs", column.className)}
                              >
                                {column.cell(session[column.accessorKey])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    No session data available
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
} 