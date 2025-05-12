"use client";

import { useParams } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { 
  Clock, 
  Globe, 
  Smartphone, 
  Monitor,
  MousePointerClick,
  Filter,
  ExternalLink,
  Laptop
} from "lucide-react";

import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { cn } from "@/lib/utils";
import { useAnalyticsSessions, useAnalyticsSessionDetails } from "@/hooks/use-analytics";
import type { SessionData, SessionEventData, SessionWithEvents } from "@/hooks/use-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SessionsPage() {
  const { id } = useParams<{ id: string }>();
  
  // Date range state (last 7 days by default)
  const [date, setDate] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  
  // Convert selected date range to string format for API
  const dateRange = useMemo(() => ({
    start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  }), [date]);

  // Filter state
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Fetch sessions data
  const { data: sessionsData, isLoading } = useAnalyticsSessions(
    id, 
    dateRange,
    500 // Fetch more sessions for better filtering
  );
  
  // Fetch session details when a session is selected
  const { data: sessionDetails, isLoading: isLoadingSessionDetails } = useAnalyticsSessionDetails(
    id,
    selectedSessionId || '',
    !!selectedSessionId
  );

  // Sessions filtering function  
  const filteredSessions = useMemo(() => {
    if (!sessionsData?.sessions) return [];
    
    let results = [...sessionsData.sessions];
    
    // Filter by device type if tab is not 'all'
    if (activeTab !== 'all') {
      results = results.filter(session => {
        if (activeTab === 'desktop') return session.device === 'desktop';
        if (activeTab === 'mobile') return session.device === 'mobile' || session.device === 'tablet';
        if (activeTab === 'long') return (session.duration || 0) > 300; // 5+ minutes
        if (activeTab === 'bounce') return (session.page_views || 0) === 1; // Single page view
        return true;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(session => 
        session.visitor_id.toLowerCase().includes(query) ||
        session.session_id.toLowerCase().includes(query) ||
        (session.country?.toLowerCase().includes(query)) ||
        (session.browser?.toLowerCase().includes(query))
      );
    }
    
    return results;
  }, [sessionsData?.sessions, activeTab, searchQuery]);

  // Stats calculations
  const totalSessions = sessionsData?.sessions?.length || 0;
  const avgDuration = useMemo(() => {
    if (!sessionsData?.sessions?.length) return 0;
    const totalDuration = sessionsData.sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    return Math.round(totalDuration / sessionsData.sessions.length);
  }, [sessionsData?.sessions]);
  
  const bounceRate = useMemo(() => {
    if (!sessionsData?.sessions?.length) return 0;
    const singlePageSessions = sessionsData.sessions.filter(session => (session.page_views || 0) === 1).length;
    return Math.round((singlePageSessions / sessionsData.sessions.length) * 100);
  }, [sessionsData?.sessions]);

  // Add type definition for column cell accessors
  type ColumnAccessKeys = keyof SessionData;

  // Session columns definition
  type SessionColumn = {
    accessorKey: string;
    header: string;
    cell: (value: any) => React.ReactNode;
    className?: string;
  };

  const sessionColumns: SessionColumn[] = [
    {
      accessorKey: 'first_visit',
      header: 'Date & Time',
      cell: (value: string) => {
        if (!value) return <span>-</span>;
        try {
          const date = new Date(value);
          return (
            <span className="whitespace-nowrap">
              {Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, HH:mm')}
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
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return <span>{minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}</span>;
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

  // Session event columns for session detail view
  type EventColumn = {
    accessorKey: keyof SessionEventData;
    header: string;
    cell: (value: any, row?: any) => React.ReactNode;
  };

  const eventColumns: EventColumn[] = [
    {
      accessorKey: 'time',
      header: 'Time',
      cell: (value: string) => {
        if (!value) return <span>-</span>;
        try {
          return <span className="font-mono text-xs">{value.split(' ')[1]}</span>;
        } catch (error) {
          return <span>-</span>;
        }
      }
    },
    {
      accessorKey: 'event_name',
      header: 'Event',
      cell: (value: string, row?: any) => {
        let icon: React.ReactNode;
        let variant: "default" | "secondary" | "destructive" | "outline" | undefined = "default";
        
        if (value === 'pageview') {
          icon = <ExternalLink className="h-3 w-3" />;
          variant = "outline";
        } else if (value === 'click') {
          icon = <MousePointerClick className="h-3 w-3" />;
          variant = "secondary";
        }
        
        return (
          <Badge variant={variant} className="capitalize font-normal">
            <span className="flex items-center gap-1">
              {icon}
              <span>{value}</span>
            </span>
          </Badge>
        );
      }
    },
    {
      accessorKey: 'path',
      header: 'Path',
      cell: (value: string) => (
        <span className="truncate block max-w-[120px]" title={value}>
          {value || '/'}
        </span>
      )
    },
    {
      accessorKey: 'title',
      header: 'Page Title',
      cell: (value: string) => (
        <span className="truncate block max-w-[150px]" title={value}>
          {value || '-'}
        </span>
      )
    }
  ];

  // Format session events for display
  const formattedEvents = useMemo(() => {
    if (!sessionDetails?.session?.events) return [];
    
    return sessionDetails.session.events.map(event => ({
      ...event,
      time: event.time ? format(new Date(event.time), 'yyyy-MM-dd HH:mm:ss') : '',
    }));
  }, [sessionDetails?.session?.events]);

  // Event handlers
  const handleSessionClick = useCallback((session: any) => {
    setSelectedSessionId(session.session_id);
  }, []);

  const handleCloseSession = useCallback(() => {
    setSelectedSessionId(null);
  }, []);
  
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDate(range);
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex flex-col p-6 pb-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Session Analysis</h1>
            <p className="text-muted-foreground text-sm">
              View and analyze your visitors' browsing sessions 
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
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{totalSessions.toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {Math.floor(avgDuration / 60)}m {avgDuration % 60}s
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{bounceRate}%</span>
                  <Badge variant="outline" className="ml-2 font-normal">
                    Single page visits
                  </Badge>
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
              <TabsTrigger value="long">Long</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full sm:max-w-[250px]">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
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
            ) : filteredSessions.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {sessionColumns.map((column) => (
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
                  {filteredSessions.map((session) => (
                    <tr 
                      key={session.session_id} 
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleSessionClick(session)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSessionClick(session);
                      }}
                      tabIndex={0}
                    >
                      {sessionColumns.map((column) => (
                        <td 
                          key={`${session.session_id}-${column.accessorKey}`} 
                          className={cn("px-4 py-3 text-sm", column.className)}
                        >
                          {column.cell((session as any)[column.accessorKey])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-20" />
                <p>No sessions found</p>
                <p className="text-sm">Try changing your filters or date range</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-muted/20 text-sm text-muted-foreground">
            Showing {filteredSessions.length} of {sessionsData?.sessions?.length || 0} sessions
          </div>
        </div>
      </div>
      
      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSessionId} onOpenChange={(open) => !open && handleCloseSession()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Session Details
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingSessionDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : sessionDetails?.session ? (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Session ID</p>
                  <p className="text-sm font-mono truncate" title={sessionDetails.session.session_id}>
                    {sessionDetails.session.session_id?.substring(0, 8)}...
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Visitor ID</p>
                  <p className="text-sm font-mono truncate" title={sessionDetails.session.visitor_id}>
                    {sessionDetails.session.visitor_id?.substring(0, 8)}...
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm">
                    {sessionDetails.session.first_visit ? 
                      format(new Date(sessionDetails.session.first_visit), 'MMM d, yyyy') : '-'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm">
                    {sessionDetails.session.first_visit ? 
                      format(new Date(sessionDetails.session.first_visit), 'HH:mm:ss') : '-'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-semibold">
                    {sessionDetails.session.duration ? 
                      `${Math.floor(sessionDetails.session.duration / 60)}m ${sessionDetails.session.duration % 60}s` : '-'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Pages Viewed</p>
                  <p className="text-sm font-semibold">{sessionDetails.session.page_views || 0}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Device</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    {sessionDetails.session.device === 'desktop' ? 
                      <Monitor className="h-3 w-3" /> : 
                      <Smartphone className="h-3 w-3" />}
                    <span className="capitalize">{sessionDetails.session.device}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Browser</p>
                  <p className="text-sm capitalize">{sessionDetails.session.browser}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">OS</p>
                  <p className="text-sm">{sessionDetails.session.os}</p>
                </div>
                
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Globe className="h-3 w-3" />
                    <span>
                      {sessionDetails.session.city && sessionDetails.session.city !== 'Unknown'
                        ? `${sessionDetails.session.city}, ${sessionDetails.session.country}`
                        : sessionDetails.session.country || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Referrer</p>
                  <p className="text-sm truncate" title={sessionDetails.session.referrer}>
                    {sessionDetails.session.referrer || 'Direct'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">User Type</p>
                  <p className="text-sm">
                    {sessionDetails.session.is_returning_visitor ? 'Returning' : 'New'} visitor
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Session Timeline</h4>
                
                {formattedEvents.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          {eventColumns.map((column) => (
                            <th 
                              key={column.accessorKey} 
                              className={cn(
                                "px-3 py-2 text-xs font-medium text-left"
                              )}
                            >
                              {column.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {formattedEvents.map((event, i) => (
                          <tr 
                            key={event.event_id || i} 
                            className="border-b last:border-0"
                          >
                            {eventColumns.map((column) => (
                              <td 
                                key={`${event.event_id || i}-${column.accessorKey}`} 
                                className={cn("px-3 py-2 text-xs")}
                              >
                                {column.cell((event as any)[column.accessorKey], event)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    No event data available for this session
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Session details not found
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