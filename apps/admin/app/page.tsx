import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, LayoutDashboard, BarChart3, Activity, Home } from 'lucide-react';
import { getAnalyticsOverviewData } from './(admin)/analytics/actions';

export default async function AdminHomePage() {
  let stats = { users: 0, websites: 0, events: 0 };
  try {
    const { data } = await getAnalyticsOverviewData();
    stats = {
      users: data?.totalUsers || 0,
      websites: data?.totalWebsites || 0,
      events: Array.isArray(data?.eventsOverTime) ? data.eventsOverTime.reduce((sum, d) => sum + (d.value || 0), 0) : 0,
    };
  } catch { }

  return (
    <div className="h-screen bg-background dark:bg-gradient-to-br dark:from-background dark:to-muted/60 flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header */}
        <Card className="bg-card dark:bg-card border-0 shadow-none">
          <CardHeader className="flex flex-col items-center gap-3 p-8 pb-4">
            <span className="rounded-full bg-primary/10 dark:bg-primary/20 p-4 mb-2"><Home className="h-10 w-10 text-primary" /></span>
            <CardTitle className="text-4xl font-bold text-center">Databuddy Admin</CardTitle>
            <CardDescription className="text-lg text-muted-foreground text-center max-w-xl">
              Welcome to your Databuddy&apos;s control center. Manage users, websites, domains, and view analytics in one place.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/users">
            <Card className="group transition-shadow hover:shadow-lg border-0 bg-card dark:bg-card hover:bg-muted/60 dark:hover:bg-muted/40 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 p-6">
                <span className="rounded-full bg-primary/10 dark:bg-primary/20 p-3"><Users className="h-7 w-7 text-primary" /></span>
                <div>
                  <CardTitle className="text-lg font-semibold">Users</CardTitle>
                  <CardDescription className="text-muted-foreground">Manage all platform users</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/websites">
            <Card className="group transition-shadow hover:shadow-lg border-0 bg-card dark:bg-card hover:bg-muted/60 dark:hover:bg-muted/40 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 p-6">
                <span className="rounded-full bg-blue-500/10 dark:bg-blue-400/20 p-3"><LayoutDashboard className="h-7 w-7 text-blue-600 dark:text-blue-400" /></span>
                <div>
                  <CardTitle className="text-lg font-semibold">Websites</CardTitle>
                  <CardDescription className="text-muted-foreground">View and manage websites</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/analytics">
            <Card className="group transition-shadow hover:shadow-lg border-0 bg-card dark:bg-card hover:bg-muted/60 dark:hover:bg-muted/40 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 p-6">
                <span className="rounded-full bg-orange-400/10 dark:bg-orange-400/20 p-3"><BarChart3 className="h-7 w-7 text-orange-600 dark:text-orange-400" /></span>
                <div>
                  <CardTitle className="text-lg font-semibold">Analytics</CardTitle>
                  <CardDescription className="text-muted-foreground">Platform stats & KPIs</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-2">
          <Card className="text-center bg-card/80 dark:bg-muted/80 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex flex-col items-center text-3xl font-bold"><Users className="h-7 w-7 mb-1 text-primary" />{stats.users}</CardTitle>
              <CardDescription className="text-muted-foreground">Users</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center bg-card/80 dark:bg-muted/80 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex flex-col items-center text-3xl font-bold"><LayoutDashboard className="h-7 w-7 mb-1 text-blue-600 dark:text-blue-400" />{stats.websites}</CardTitle>
              <CardDescription className="text-muted-foreground">Websites</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center bg-card/80 dark:bg-muted/80 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex flex-col items-center text-3xl font-bold"><Activity className="h-7 w-7 mb-1 text-orange-600 dark:text-orange-400" />{stats.events}</CardTitle>
              <CardDescription className="text-muted-foreground">Events (30d)</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
