import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type RowData,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  DatabaseIcon,
  ListFilterIcon,
  Search,
  X,
} from "lucide-react";
import React, { Fragment, useCallback, useMemo, useRef, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TabConfig<TData> {
  id: string;
  label: string;
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
}

interface DataTableProps<TData extends { name: string | number }, TValue> {
  data?: TData[] | undefined;
  columns?: ColumnDef<TData, TValue>[];
  tabs?: TabConfig<TData>[];
  title: string;
  description?: string;
  isLoading?: boolean;
  initialPageSize?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (field: string, value: string | number) => void;
  minHeight?: string | number;
  showSearch?: boolean;
  getSubRows?: (row: TData) => TData[] | undefined;
  renderSubRow?: (subRow: TData, parentRow: TData, index: number) => React.ReactNode;
  expandable?: boolean;
  renderTooltipContent?: (row: TData) => React.ReactNode;
}

function getRowPercentage(row: any): number {
  if (row.marketShare !== undefined) return Number.parseFloat(row.marketShare) || 0;
  if (row.percentage !== undefined) return Number.parseFloat(row.percentage) || 0;
  if (row.percent !== undefined) return Number.parseFloat(row.percent) || 0;
  if (row.share !== undefined) return Number.parseFloat(row.share) || 0;
  return 0;
}

// Pre-computed CSS classes for different percentage ranges to avoid inline styles
const PERCENTAGE_CLASSES = {
  high: "bg-gradient-to-r from-green-500/8 via-green-500/15 to-transparent border-l-4 border-l-green-500/80",
  medium: "bg-gradient-to-r from-blue-500/8 via-blue-500/15 to-transparent border-l-4 border-l-blue-500/80",
  low: "bg-gradient-to-r from-amber-500/8 via-amber-500/15 to-transparent border-l-4 border-l-amber-500/80",
  minimal: "bg-gradient-to-r from-gray-500/6 via-gray-500/12 to-transparent border-l-4 border-l-gray-500/70",
} as const;

// Memoized function to get CSS class instead of inline styles
const getPercentageClass = (percentage: number): string => {
  if (percentage >= 50) return PERCENTAGE_CLASSES.high;
  if (percentage >= 25) return PERCENTAGE_CLASSES.medium;
  if (percentage >= 10) return PERCENTAGE_CLASSES.low;
  if (percentage > 0) return PERCENTAGE_CLASSES.minimal;
  return "";
};

// Pre-computed column width classes to avoid inline styles
const COLUMN_WIDTH_CLASSES = {
  xs: "w-20 min-w-20 max-w-20",
  sm: "w-24 min-w-24 max-w-24",
  md: "w-32 min-w-32 max-w-32",
  lg: "w-40 min-w-40 max-w-40",
  xl: "w-48 min-w-48 max-w-48",
  auto: "w-auto min-w-20 max-w-80",
} as const;

const getColumnWidthClass = (size: number): string => {
  if (size <= 80) return COLUMN_WIDTH_CLASSES.xs;
  if (size <= 100) return COLUMN_WIDTH_CLASSES.sm;
  if (size <= 150) return COLUMN_WIDTH_CLASSES.md;
  if (size <= 200) return COLUMN_WIDTH_CLASSES.lg;
  if (size <= 250) return COLUMN_WIDTH_CLASSES.xl;
  return COLUMN_WIDTH_CLASSES.auto;
};

const EnhancedSkeleton = memo(({ minHeight }: { minHeight: string | number }) => (
  <div className="animate-pulse space-y-3" style={{ minHeight }}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24 rounded-md" />
      <Skeleton className="h-8 w-32 rounded-lg" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, index) => index).map((itemIndex) => (
        <div
          className="flex animate-pulse items-center space-x-4 rounded-lg bg-muted/20 p-3"
          key={`skeleton-${itemIndex}`}
        >
          <Skeleton className="h-6 w-6 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-16 rounded-sm" />
              <Skeleton className="h-3 w-12 rounded-sm" />
              <Skeleton className="h-3 w-8 rounded-sm" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-3 w-8 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  </div>
));

EnhancedSkeleton.displayName = 'EnhancedSkeleton';

export function DataTable<TData extends { name: string | number }, TValue>({
  data,
  columns,
  tabs,
  title,
  description,
  isLoading = false,
  initialPageSize,
  emptyMessage = "No data available",
  className,
  onRowClick,
  minHeight = 200,
  showSearch = true,
  getSubRows,
  renderSubRow,
  expandable = false,
  renderTooltipContent,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [activeTab, setActiveTab] = React.useState(tabs?.[0]?.id || "");
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    content: React.ReactNode;
    x: number;
    y: number;
  }>({ visible: false, content: null, x: 0, y: 0 });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const currentTabData = tabs?.find((tab) => tab.id === activeTab);
  const tableData = React.useMemo(
    () => currentTabData?.data || data || [],
    [currentTabData?.data, data]
  );
  const tableColumns = React.useMemo(
    () => currentTabData?.columns || columns || [],
    [currentTabData?.columns, columns]
  );

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getRowId: (row, index) => {
      if ((row as any)._uniqueKey) {
        return (row as any)._uniqueKey;
      }
      return activeTab ? `${activeTab}-${index}` : `row-${index}`;
    },
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  // Memoize pagination calculations
  const filteredRows = table.getFilteredRowModel().rows;
  const paginationInfo = useMemo(() => {
    const pageSize = initialPageSize || 25;
    const totalRows = filteredRows.length;
    const totalPages = Math.ceil(totalRows / pageSize);
    return { pageSize, totalRows, totalPages };
  }, [filteredRows.length, initialPageSize]);

  const [currentPage, setCurrentPage] = useState(1);

  const displayData = useMemo(() => {
    const startIndex = (currentPage - 1) * paginationInfo.pageSize;
    const endIndex = startIndex + paginationInfo.pageSize;
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, currentPage, paginationInfo.pageSize]);

  const getFieldFromTabId = (tabId: string): string => {
    const fieldMapping: Record<string, string> = {
      referrers: "referrer",
      utm_sources: "utm_source",
      utm_mediums: "utm_medium",
      utm_campaigns: "utm_campaign",
      top_pages: "page",
      entry_pages: "page",
      exit_pages: "page",
    };
    return fieldMapping[tabId] || "name";
  };

  const handleTabChange = useCallback(async (tabId: string) => {
    if (tabId === activeTab) return;

    setIsTransitioning(true);
    setCurrentPage(1);
    setGlobalFilter("");
    setSorting([]);
    setExpandedRows(new Set());

    await new Promise((resolve) => setTimeout(resolve, 150));
    setActiveTab(tabId);
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsTransitioning(false);
  }, [activeTab]);

  const toggleRowExpansion = useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);

  const handleRowMouseEnter = useCallback((rowData: TData, rowId: string) => {
    setHoveredRow(rowId);
    if (renderTooltipContent && tableContainerRef.current) {
      const rect = tableContainerRef.current.getBoundingClientRect();
      setTooltipState({
        visible: true,
        content: renderTooltipContent(rowData),
        x: rect.right + 10,
        y: rect.top + 20,
      });
    }
  }, [renderTooltipContent]);

  const handleMouseLeave = useCallback(() => {
    setHoveredRow(null);
    setTooltipState((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (renderTooltipContent && tooltipState.visible && tableContainerRef.current) {
      const rect = tableContainerRef.current.getBoundingClientRect();
      setTooltipState((prev) => ({
        ...prev,
        x: rect.right + 10,
        y: e.clientY - rect.top + rect.top,
      }));
    }
  }, [renderTooltipContent, tooltipState.visible]);

  const shouldShowPagination = paginationInfo.totalPages > 1;

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
              {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <EnhancedSkeleton minHeight={minHeight} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-full pl-8 sm:w-64"
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search..."
                  value={globalFilter}
                />
                {globalFilter && (
                  <Button
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-sm p-0 hover:bg-muted"
                    onClick={() => setGlobalFilter("")}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            {tabs && tabs.length > 1 && (
              <div className="flex rounded-lg border border-border/50 bg-muted/20 p-1">
                {tabs.map((tab) => (
                  <button
                    className={cn(
                      "relative rounded-md px-3 py-1.5 font-medium text-sm transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          className={cn(
            "relative transition-all duration-300 ease-in-out",
            isTransitioning && "scale-[0.98] opacity-40"
          )}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          ref={tableContainerRef}
        >
          <AnimatePresence>
            {renderTooltipContent && tooltipState.visible && (
              <motion.div
                animate={{ opacity: 1, scale: 1, y: "-50%" }}
                className="pointer-events-none absolute z-30 translate-x-4"
                exit={{ opacity: 0, scale: 0.9, y: "-50%" }}
                initial={{ opacity: 0, scale: 0.9, y: "-50%" }}
                style={{
                  top: tooltipState.y,
                  left: tooltipState.x,
                }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {tooltipState.content}
              </motion.div>
            )}
          </AnimatePresence>
          {isTransitioning && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2 shadow-sm">
                <div className="h-3 w-3 animate-pulse rounded-full bg-primary/60" />
                <span className="font-medium text-muted-foreground text-xs">Loading...</span>
              </div>
            </div>
          )}

          {table.getRowModel().rows.length ? (
            <div
              aria-labelledby={`tab-${activeTab}`}
              className="relative overflow-auto rounded-md border border-border/50 bg-background/50 sm:rounded-lg"
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              style={{ height: minHeight }}
            >
              <Table className="w-full table-fixed">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      className="sticky top-0 z-10 border-border/30 bg-muted/20"
                      key={headerGroup.id}
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          aria-sort={
                            header.column.getIsSorted() === "asc"
                              ? "ascending"
                              : header.column.getIsSorted() === "desc"
                                ? "descending"
                                : header.column.getCanSort()
                                  ? "none"
                                  : undefined
                          }
                          className={cn(
                            "h-11 bg-muted/20 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide backdrop-blur-sm sm:px-4",
                            (header.column.columnDef.meta as any)?.className,
                            header.column.getCanSort()
                              ? "group cursor-pointer select-none transition-all duration-200 hover:bg-muted/30 hover:text-foreground"
                              : "select-none",
                            getColumnWidthClass(header.getSize())
                          )}
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          role={header.column.getCanSort() ? "button" : undefined}
                          tabIndex={header.column.getCanSort() ? 0 : -1}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {header.column.getCanSort() && (
                              <div className="flex h-3 w-3 flex-col items-center justify-center">
                                {!header.column.getIsSorted() && (
                                  <ArrowUpDown className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/70" />
                                )}
                                {header.column.getIsSorted() === "asc" && (
                                  <ArrowUp className="h-3 w-3 text-primary" />
                                )}
                                {header.column.getIsSorted() === "desc" && (
                                  <ArrowDown className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="overflow-hidden">
                  {displayData.map((row, rowIndex) => {
                    const subRows = expandable && getSubRows ? getSubRows(row.original) : undefined;
                    const hasSubRows = subRows && subRows.length > 0;
                    const isExpanded = expandedRows.has(row.id);
                    const percentage = getRowPercentage(row.original);
                    const percentageClass = getPercentageClass(percentage);

                    return (
                      <Fragment key={row.id}>
                        <TableRow
                          className={cn(
                            "relative h-12 border-border/20 transition-all duration-300 ease-in-out",
                            (onRowClick && !hasSubRows) || hasSubRows ? "cursor-pointer" : "",
                            hoveredRow && hoveredRow !== row.id
                              ? "opacity-40 grayscale-[80%]"
                              : "opacity-100",
                            !hoveredRow && (rowIndex % 2 === 0 ? "bg-background/50" : "bg-muted/10"),
                            !hoveredRow && percentage > 0 && percentageClass
                          )}
                          onClick={() => {
                            if (hasSubRows) {
                              toggleRowExpansion(row.id);
                            } else if (onRowClick && row.original.name) {
                              const field = getFieldFromTabId(activeTab);
                              onRowClick(field, row.original.name);
                            }
                          }}
                          onMouseEnter={() => handleRowMouseEnter(row.original, row.id)}
                        >
                          {row.getVisibleCells().map((cell, cellIndex) => (
                            <TableCell
                              className={cn(
                                "px-2 py-3 font-medium text-sm transition-colors duration-150 sm:px-4",
                                cellIndex === 0 && "font-semibold text-foreground",
                                (cell.column.columnDef.meta as any)?.className,
                                getColumnWidthClass(cell.column.getSize())
                              )}
                              key={cell.id}
                            >
                              <div className="flex items-center gap-2">
                                {cellIndex === 0 && hasSubRows && (
                                  <button
                                    aria-label={isExpanded ? "Collapse row" : "Expand row"}
                                    className="flex-shrink-0 rounded p-0.5 transition-colors hover:bg-muted"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpansion(row.id);
                                    }}
                                    type="button"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </button>
                                )}
                                <div className="flex-1 overflow-hidden truncate">
                                  <div className="truncate">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>

                        {hasSubRows &&
                          isExpanded &&
                          subRows.map((subRow, subIndex) => (
                            <TableRow
                              className="border-border/10 bg-muted/5 transition-colors hover:bg-muted/10"
                              key={`${row.id}-sub-${subIndex}`}
                            >
                              {renderSubRow ? (
                                <TableCell className="p-0" colSpan={row.getVisibleCells().length}>
                                  {renderSubRow(subRow, row.original, subIndex)}
                                </TableCell>
                              ) : (
                                row.getVisibleCells().map((cell, cellIndex) => (
                                  <TableCell
                                    className={cn(
                                      "py-2 text-muted-foreground text-sm",
                                      getColumnWidthClass(cell.column.getSize())
                                    )}
                                    key={`${cell.id}-sub`}
                                  >
                                    <div className="pl-6 truncate">
                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </div>
                                  </TableCell>
                                ))
                              )}
                            </TableRow>
                          ))}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                <DatabaseIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="mb-2 font-semibold text-lg">{emptyMessage}</h4>
              <p className="max-w-sm text-muted-foreground text-sm">
                {globalFilter
                  ? "Try adjusting your search terms or filters."
                  : "Data will appear here once available."}
              </p>
              {globalFilter && (
                <Button
                  className="mt-4"
                  onClick={() => setGlobalFilter("")}
                  size="sm"
                  variant="outline"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Search
                </Button>
              )}
            </div>
          )}

          {shouldShowPagination && (
            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
              <div className="text-muted-foreground text-sm">
                Showing {Math.min((currentPage - 1) * paginationInfo.pageSize + 1, paginationInfo.totalRows)} to{" "}
                {Math.min(currentPage * paginationInfo.pageSize, paginationInfo.totalRows)} of{" "}
                {paginationInfo.totalRows} entries
              </div>

              <div className="flex items-center gap-2">
                <Button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <Button
                        className={cn(
                          "h-8 w-8",
                          currentPage === pageNumber
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        size="sm"
                        variant="outline"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  {paginationInfo.totalPages > 5 && (
                    <>
                      <span className="px-2 text-muted-foreground">...</span>
                      <Button
                        className={cn(
                          "h-8 w-8",
                          currentPage === paginationInfo.totalPages
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                        onClick={() => setCurrentPage(paginationInfo.totalPages)}
                        size="sm"
                        variant="outline"
                      >
                        {paginationInfo.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  disabled={currentPage >= paginationInfo.totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(paginationInfo.totalPages, prev + 1))}
                  size="sm"
                  variant="outline"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
