'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Search, 
  Eye, 
  EyeOff, 
  Trash2,
  Filter,
  ArrowUpDown,
  Columns,
  RefreshCcw
} from 'lucide-react'

interface TableColumn {
  name: string
  type: string
}

interface TableControlsProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  selectedRowsCount: number
  onDeleteSelected: () => void
  columns: TableColumn[]
  hiddenColumns: Set<string>
  onToggleColumn: (column: string) => void
  onRefresh: () => void
  loading: boolean
}

export function TableControls({
  searchTerm,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  selectedRowsCount,
  onDeleteSelected,
  columns,
  hiddenColumns,
  onToggleColumn,
  onRefresh,
  loading
}: TableControlsProps) {
  return (
    <div className="w-full h-[60px] bg-sidebar border-b border-border flex items-center px-2 gap-2 relative">
      {/* Left side controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 cursor-pointer bg-accent/50"
        >
          <Filter className="size-3 opacity-80" />
          Filter
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 cursor-pointer bg-accent/50"
        >
          <ArrowUpDown className="size-3 opacity-80" />
          Sort
        </Button>
        
        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer bg-accent/50"
            >
              <Columns className="size-3 opacity-80" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {columns.map((col) => (
              <DropdownMenuItem
                key={col.name}
                onClick={() => onToggleColumn(col.name)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{col.name}</span>
                {hiddenColumns.has(col.name) ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-7 w-48 bg-accent/50"
          />
        </div>

        {/* Page Size */}
        <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="w-24 h-7 bg-accent/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
            <SelectItem value="500">500</SelectItem>
          </SelectContent>
        </Select>

        {/* Selected rows actions */}
        {selectedRowsCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-7">
              {selectedRowsCount} selected
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-7">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Rows</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedRowsCount} selected rows? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDeleteSelected}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Rows
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="absolute right-0 left-0 h-full flex items-center justify-end gap-2 mr-2 pointer-events-none">
        <Button
          variant="outline"
          size="sm"
          className="h-7 pointer-events-auto cursor-pointer bg-accent/50"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCcw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  )
} 