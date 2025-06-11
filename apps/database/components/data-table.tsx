'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Download, Edit, Trash2, Filter, SortAsc, SortDesc, RefreshCw } from 'lucide-react'

interface QueryResult {
  data: Record<string, any>[]
  meta: Array<{ name: string; type: string }>
  rows: number
  statistics?: {
    elapsed: number
    rows_read: number
    bytes_read: number
  }
}

interface DataTableProps {
  result: QueryResult
  tableName?: string
  onDeleteRow?: (rowData: Record<string, any>) => void
  onEditRow?: (rowData: Record<string, any>) => void
  onRefresh?: () => void
  loading?: boolean
}

export function DataTable({ 
  result, 
  tableName, 
  onDeleteRow, 
  onEditRow, 
  onRefresh,
  loading = false 
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = result.data

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filter]) => {
      if (filter) {
        filtered = filtered.filter(row =>
          String(row[column]).toLowerCase().includes(filter.toLowerCase())
        )
      }
    })

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        
        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sortDirection === 'asc' ? -1 : 1
        if (bVal == null) return sortDirection === 'asc' ? 1 : -1
        
        // Handle numbers
        const aNum = Number(aVal)
        const bNum = Number(bVal)
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
        }
        
        // Handle strings
        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
        }
      })
    }

    return filtered
  }, [result.data, searchTerm, sortColumn, sortDirection, columnFilters])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex)

  // Reset pagination when filters change
  useState(() => {
    setCurrentPage(1)
  }, [searchTerm, columnFilters, sortColumn, sortDirection])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }))
  }

  const exportToCSV = () => {
    const headers = result.meta?.map(col => col.name).join(',') || ''
    const rows = filteredAndSortedData.map(row =>
      result.meta?.map(col => {
        const value = row[col.name]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    ).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tableName || 'query-result'}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {tableName ? `Table Data: ${tableName}` : 'Query Results'}
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              {formatNumber(filteredAndSortedData.length)} of {formatNumber(result.rows)} rows
              {result.statistics && (
                <span className="ml-2">
                  • {result.statistics.elapsed.toFixed(2)}ms
                  • {formatNumber(result.statistics.rows_read)} rows read
                  • {formatBytes(result.statistics.bytes_read)} processed
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
              <SelectItem value="200">200 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <div className="rounded border">
          <ScrollArea className="h-96 w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  {result.meta?.map((col) => (
                    <TableHead key={col.name} className="min-w-32">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                            onClick={() => handleSort(col.name)}
                          >
                            {col.name}
                            {sortColumn === col.name && (
                              sortDirection === 'asc' ? 
                                <SortAsc className="ml-1 h-3 w-3" /> : 
                                <SortDesc className="ml-1 h-3 w-3" />
                            )}
                          </Button>
                          <Badge variant="outline" className="text-xs">
                            {col.type}
                          </Badge>
                        </div>
                        <Input
                          placeholder={`Filter ${col.name}...`}
                          value={columnFilters[col.name] || ''}
                          onChange={(e) => handleColumnFilter(col.name, e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </TableHead>
                  ))}
                  {(onEditRow || onDeleteRow) && (
                    <TableHead className="w-24">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={(result.meta?.length || 0) + ((onEditRow || onDeleteRow) ? 1 : 0)}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, index) => (
                    <TableRow key={startIndex + index}>
                      {result.meta?.map((col) => (
                        <TableCell key={col.name} className="max-w-xs">
                          <div className="truncate" title={String(row[col.name] ?? '')}>
                            {row[col.name] === null || row[col.name] === undefined ? (
                              <span className="text-muted-foreground italic">null</span>
                            ) : (
                              String(row[col.name])
                            )}
                          </div>
                        </TableCell>
                      ))}
                      {(onEditRow || onDeleteRow) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {onEditRow && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditRow(row)}
                                title="Edit row"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {onDeleteRow && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Delete row">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Row</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this row? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDeleteRow(row)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete Row
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedData.length)} of {formatNumber(filteredAndSortedData.length)} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 