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
import { Monitor, Smartphone, Globe, ArrowUpDown, ChevronLeft, ChevronRight, UserRound, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProfileData } from "@/hooks/use-analytics";

interface ProfilesTableProps {
  profiles: ProfileData[];
  isLoading: boolean;
  onProfileClick: (profile: ProfileData) => void;
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

export function ProfilesTable({ profiles, isLoading, onProfileClick }: ProfilesTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<ProfileData>[]>(() => [
    {
      accessorKey: 'visitor_id',
      header: 'Visitor ID',
      cell: ({ getValue }) => {
        const id = getValue() as string;
        return (
          <div className="font-mono text-xs">
            {id.substring(0, 8)}...
          </div>
        );
      },
    },
    {
      accessorKey: 'country',
      header: 'Location',
      cell: ({ row }) => {
        const profile = row.original;
        const hasValidCountry = profile.country && profile.country !== 'Unknown';
        
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              {hasValidCountry ? (
                <Image 
                  src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${profile.country.toUpperCase()}.svg`}
                  alt={profile.country}
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
                  {profile.country || 'Unknown'}
                </span>
                <Badge variant={profile.total_sessions > 1 ? "default" : "secondary"} className="text-xs flex-shrink-0">
                  {profile.total_sessions > 1 ? 'Return' : 'New'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {profile.region && profile.region !== 'Unknown' ? profile.region : 'Unknown Region'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'last_visit',
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Last Seen
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ getValue }) => {
        const date = getValue() as string;
        return date ? (
          <div className="text-center">
            <p className="text-xs font-medium">{format(new Date(date), 'MMM d')}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(date), 'yyyy')}</p>
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
      accessorKey: 'total_sessions',
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Sessions
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
      accessorKey: 'total_pageviews',
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Page Views
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
  ], []);

  const table = useReactTable({
    data: profiles,
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
          id: 'last_visit',
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

  if (profiles.length === 0) {
    return (
      <div className="bg-background border border-border rounded-lg overflow-hidden h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <UserRound className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">No profiles found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Visitor profiles will appear here as they visit your website.
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
                onClick={() => onProfileClick(row.original)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onProfileClick(row.original);
                  }
                }}
                tabIndex={0}
                aria-label={`View profile for visitor ${row.original.visitor_id.substring(0, 8)}`}
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
          Showing {table.getRowModel().rows.length} of {profiles.length} profiles
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