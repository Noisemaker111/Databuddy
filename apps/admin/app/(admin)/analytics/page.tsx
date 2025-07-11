import { getAnalyticsOverviewData } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Users2,
  Globe2,
  BarChart3,
  UserPlus,
  Zap,
  Clock,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BotRequestsWidget from '@/components/BotRequestsWidget';
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { AnalyticsCharts } from "./charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatNumber(val: number | null | undefined) {
  if (typeof val !== 'number' || Number.isNaN(val)) return '0';

  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(1)}K`;
  }
  return val.toLocaleString();
}

function getTrendIcon(trend: 'up' | 'down' | 'neutral') {
  switch (trend) {
    case 'up':
      return <ArrowUpRight className="h-3 w-3 text-green-500" />;
    case 'down':
      return <ArrowDownRight className="h-3 w-3 text-red-500" />;
    default:
      return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend = 'neutral',
  tooltip
}: {
  icon: any;
  title: string;
  value: number;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-help">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{formatNumber(value)}</p>
                    {getTrendIcon(trend)}
                  </div>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export default async function AdminAnalyticsOverviewPage() {
  const { data, error } = await getAnalyticsOverviewData();

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-4 max-w-7xl mx-auto p-4 sm:p-6">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold">Analytics Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Platform metrics and insights</p>
          </div>
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-destructive text-base">
                <BarChart3 className="h-5 w-5" />
                Analytics Unavailable
              </CardTitle>
              <CardDescription>Could not load analytics data. Please try again later.</CardDescription>
            </CardHeader>
            {error && (
              <CardContent className="pt-0">
                <div className="bg-destructive/10 p-4 rounded-lg">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Real-time platform insights and performance metrics.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <main className="grid-cols-1 space-y-8 lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              <MetricCard
                icon={Users2}
                title="Total Users"
                value={data.totalUsers}
                subtitle="All-time registered users"
                tooltip="Total number of registered users on the platform"
              />
              <MetricCard
                icon={Globe2}
                title="Websites"
                value={data.totalWebsites}
                subtitle="All-time connected websites"
                tooltip="Total number of websites connected to the platform"
              />
              <MetricCard
                icon={UserPlus}
                title="New Users (24h)"
                value={data.usersToday}
                subtitle="Registrations in last 24h"
                tooltip="New user registrations in the last 24 hours"
              />
              <MetricCard
                icon={Globe2}
                title="New Sites (24h)"
                value={data.websitesToday}
                subtitle="New sites in last 24h"
                tooltip="New websites added in the last 24 hours"
              />
              <MetricCard
                icon={Zap}
                title="Events (24h)"
                value={data.events24h}
                subtitle="Events in last 24h"
                tooltip="Total analytics events captured in the last 24 hours"
              />
              <MetricCard
                icon={Clock}
                title="Events (30d)"
                value={data.eventsMonthly}
                subtitle="Events in last 30d"
                tooltip="Total analytics events captured in the last 30 days"
              />
            </div>

            <AnalyticsCharts
              userRegistrationsOverTime={data.usersCumulative}
              websiteRegistrationsOverTime={data.websitesCumulative}
              usersPerDay={data.usersPerDay}
              websitesPerDay={data.websitesPerDay}
              eventsOverTime={data.eventsOverTime}
              events24hOverTime={data.events24hOverTime}
              topWebsites={data.topWebsites}
              topCountries={data.topCountries}
            />
          </main>

          <aside className="space-y-8">
            <BotRequestsWidget />

            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">Recent Users</TabsTrigger>
                <TabsTrigger value="websites">Recent Websites</TabsTrigger>
              </TabsList>
              <TabsContent value="users">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Users</CardTitle>
                      <Link href="/users">
                        <Button variant="outline" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.image ?? undefined} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium truncate">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{new Date(user.createdAt).toLocaleString()}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="websites">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Websites</CardTitle>
                      <Link href="/websites">
                        <Button variant="outline" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.recentWebsitesWithUsers.map((website: any) => (
                        <div key={website.id} className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={website.user?.image ?? undefined} />
                            <AvatarFallback>{getInitials(website.name || website.domain)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium truncate">{website.name || website.domain}</p>
                            <p className="text-sm text-muted-foreground truncate">{website.domain}</p>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(website.createdAt), { addSuffix: true })}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{new Date(website.createdAt).toLocaleString()}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      </div>
    </div>
  );
}