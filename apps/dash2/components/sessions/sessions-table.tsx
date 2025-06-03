import { useMemo, useState } from "react";
import Image from "next/image";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Monitor, Smartphone, Globe, ArrowUpDown, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionData } from "@/hooks/use-analytics";

interface SessionsTableProps {
  sessions: SessionData[];
  isLoading: boolean;
  onSessionClick: (session: SessionData) => void;
}

const getBrowserIcon = (browser: string) => {
  const browserMap: Record<string, string> = {
    'chrome': '/browsers/Chrome.svg',
    'firefox': '/browsers/Firefox.svg',
    'safari': '/browsers/Safari.svg',
    'edge': '/browsers/Edge.svg',
    'opera': '/browsers/Opera.svg',
    'ie': '/browsers/IE.svg',
    'samsung': '/browsers/SamsungInternet.svg',
  };
  return browserMap[browser?.toLowerCase() || ''] || '/browsers/Chrome.svg';
};

const getOSIcon = (os: string) => {
  const osMap: Record<string, string> = {
    'windows': '/operating-systems/Windows.svg',
    'macos': '/operating-systems/macOS.svg',
    'ios': '/operating-systems/Apple.svg',
    'android': '/operating-systems/Android.svg',
    'linux': '/operating-systems/Ubuntu.svg',
    'ubuntu': '/operating-systems/Ubuntu.svg',
  };
  return osMap[os?.toLowerCase() || ''] || '/operating-systems/Windows.svg';
};

export function SessionsTable({ sessions, isLoading, onSessionClick }: SessionsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<SessionData>[]>(() => [
    {
      accessorKey: 'country',
      header: 'Location',
      cell: ({ row }) => {
        const session = row.original;
        const hasValidCountry = session.country && session.country !== 'Unknown';
        
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              {hasValidCountry ? (
                <Image 
                  src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${session.country.toUpperCase()}.svg`}
                  alt={session.country}
                  width={20}
                  height={20}
                  className="object-cover rounded-full"
                  onError={() => {}}
                />
              ) : (
                <Globe className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {session.country || 'Unknown'}
                </span>
                <Badge variant={session.is_returning_visitor ? "default" : "secondary"} className="text-xs flex-shrink-0">
                  {session.is_returning_visitor ? 'Return' : 'New'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {session.region && session.region !== 'Unknown' ? session.region : 'Unknown Region'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'first_visit',
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Date
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ getValue }) => {
        const date = getValue() as string;
        return date ? (
          <div className="text-center">
            <p className="text-xs font-medium">{format(new Date(date), 'MMM d')}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(date), 'HH:mm')}</p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-xs text-muted-foreground">-</span>
          </div>
        );
      },
      sortingFn: 'datetime',
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Duration
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ getValue }) => {
        const duration = getValue() as number || 0;
        // Format as Xh Ym Zs
        const formatDuration = (seconds: number) => {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const remainingSeconds = seconds % 60;
          let result = '';
          if (hours > 0) result += `${hours}h `;
          if (minutes > 0 || hours > 0) result += `${minutes}m `;
          if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds}s`;
          return result.trim();
        };
        return (
          <div className="text-center">
            <span className="text-xs font-medium">
              {formatDuration(duration)}
            </span>
          </div>
        );
      },
      sortingFn: 'basic',
    },
    {
      accessorKey: 'page_views',
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Pages
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ getValue }) => (
        <div className="text-center">
          <span className="text-xs font-medium">{(getValue() as number) || 0}</span>
        </div>
      ),
      sortingFn: 'basic',
    },
    {
      accessorKey: 'device',
      header: () => <div className="text-center">Device</div>,
      cell: ({ getValue }) => {
        const device = getValue() as string;
        return (
          <div className="flex items-center justify-center gap-1">
            {device === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
            <span className="text-xs hidden sm:inline">{device.charAt(0).toUpperCase() + device.slice(1) || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'browser',
      header: () => <div className="text-center hidden md:block">Browser</div>,
      cell: ({ getValue }) => {
        const browser = getValue() as string;
        return (
          <div className="hidden md:flex items-center justify-center gap-1">
            <Image 
              src={getBrowserIcon(browser)} 
              alt={browser || 'Unknown'}
              width={12}
              height={12}
              className="flex-shrink-0"
            />
            <span className="text-xs truncate">{browser || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'os',
      header: () => <div className="text-center hidden md:block">OS</div>,
      cell: ({ getValue }) => {
        const os = getValue() as string;
        return (
          <div className="hidden md:flex items-center justify-center gap-1">
            <Image 
              src={getOSIcon(os)} 
              alt={os || 'Unknown'}
              width={12}
              height={12}
              className="flex-shrink-0"
            />
            <span className="text-xs truncate">{os || 'Unknown'}</span>
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: sessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 50,
      },
      sorting: [
        {
          id: 'first_visit',
          desc: true,
        },
      ],
    },
  });

  if (isLoading) {
    return (
      <div className="bg-background border border-border rounded-lg overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="h-9 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={`skeleton-${i + 1}`} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-background border border-border rounded-lg overflow-hidden h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <UserRound className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">No sessions found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sessions will appear here as visitors interact with your website.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden h-full flex flex-col">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-2 sm:px-4 py-3 text-left text-xs font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSessionClick(row.original)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSessionClick(row.original);
                  }
                }}
                tabIndex={0}
                aria-label={`View details for session from ${row.original.country || 'Unknown'}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 sm:px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {sessions.length} sessions
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </Button>
          <span className="text-sm px-2">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 