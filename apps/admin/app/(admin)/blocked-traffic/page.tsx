import { getBlockedTrafficTrends, getBlockedTrafficTopWebsites, getBlockedTrafficTopReasons, getBlockedTrafficTopCountries, getBlockedTrafficDetails } from './actions';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dayjs from 'dayjs';
import type { BlockedTraffic } from '@databuddy/db';
import type { ColumnDef } from '@tanstack/react-table';
import { BlockedTrafficCharts } from './charts';

export default async function BlockedTrafficPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
    // Extract query params
    const from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
    const to = typeof searchParams.to === 'string' ? searchParams.to : undefined;
    const client_id = typeof searchParams.client_id === 'string' ? searchParams.client_id : undefined;
    const block_reason = typeof searchParams.block_reason === 'string' ? searchParams.block_reason : undefined;
    const page = Number.parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1', 10) || 1;
    const limit = Number.parseInt(typeof searchParams.limit === 'string' ? searchParams.limit : '25', 10) || 25;
    const offset = (page - 1) * limit;

    // Fetch all data in parallel
    const [trends, topWebsites, topReasons, topCountries, details] = await Promise.all([
        getBlockedTrafficTrends({ from, to, client_id }),
        getBlockedTrafficTopWebsites({ from, to }),
        getBlockedTrafficTopReasons({ from, to, client_id }),
        getBlockedTrafficTopCountries({ from, to, client_id }),
        getBlockedTrafficDetails({ from, to, client_id, block_reason, limit, offset })
    ]);

    // Summary values
    const totalBlocked = trends.reduce((sum, t) => sum + (t.blocked_count || 0), 0);
    const topWebsite = topWebsites[0]?.website_id || '-';
    const topReason = topReasons[0]?.reason || '-';
    const topCountry = topCountries[0]?.country || '-';

    const columns: ColumnDef<BlockedTraffic & { domain?: string }>[] = [
        { accessorKey: 'timestamp', header: 'Time' },
        { accessorKey: 'client_id', header: 'Website ID' },
        { accessorKey: 'domain', header: 'Domain' },
        { accessorKey: 'origin', header: 'Origin' },
        { accessorKey: 'block_reason', header: 'Reason' },
        { accessorKey: 'block_category', header: 'Category' },
        { accessorKey: 'country', header: 'Country' },
        { accessorKey: 'ip', header: 'IP' },
        { accessorKey: 'path', header: 'Path' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-4">Blocked Traffic</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card><CardHeader><CardTitle>Total Blocked</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totalBlocked}</CardContent></Card>
                <Card><CardHeader><CardTitle>Top Website</CardTitle></CardHeader><CardContent>{topWebsite}</CardContent></Card>
                <Card><CardHeader><CardTitle>Top Reason</CardTitle></CardHeader><CardContent>{topReason}</CardContent></Card>
                <Card><CardHeader><CardTitle>Top Country</CardTitle></CardHeader><CardContent>{topCountry}</CardContent></Card>
            </div>
            <BlockedTrafficCharts
                trends={trends}
                topWebsites={topWebsites}
                topReasons={topReasons}
                topCountries={topCountries}
            />
            <div className="mb-4 font-semibold text-lg mt-8">Blocked Traffic Details</div>
            <div className="overflow-x-auto">
                <DataTable
                    columns={columns}
                    data={details}
                    pageSize={limit}
                />
            </div>
        </div>
    );
} 