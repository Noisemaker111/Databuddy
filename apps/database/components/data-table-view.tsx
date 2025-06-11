'use client'

import * as React from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SortAsc, SortDesc, ArrowUpDown, MoreHorizontal, Hash, Calendar, Type, Binary, Edit, Trash2, Eye, EyeOff, Columns } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface TableColumn {
  name: string
  type: string
}

interface DataTableViewProps {
  data: Record<string, any>[]
  columns: TableColumn[]
  loading: boolean
  onDeleteRow?: (row: Record<string, any>) => void
  onEditRow?: (originalRow: Record<string, any>, updatedRow: Record<string, any>) => void
  onHideRow?: (row: Record<string, any>) => void
}

const selectColumn: ColumnDef<any> = {
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && 'indeterminate')
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
      className="mx-1"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
      className="mx-1"
    />
  ),
  enableSorting: false,
  enableHiding: false,
  enableResizing: false,
  size: 40,
  minSize: 40,
  maxSize: 40,
}

const FieldIcon = ({
  label,
  children,
}: { label: string | null; children: React.ReactNode }) => {
  if (children === null) return null
  return (
    <TooltipProvider delayDuration={20}>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center justify-center w-4 h-4 hover:bg-sidebar-accent rounded-sm">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-card text-card-foreground border border-border"
        >
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const ValueCell = ({ value, type, columnName }: { value: any; type: string; columnName: string }) => {
  const formatValue = (val: any, dataType: string, colName: string) => {
    if (val === null || val === undefined) {
      return <span className="text-muted-foreground italic text-xs">null</span>
    }
    
    const stringValue = String(val)
    
    // Special handling for ID columns - make them very compact
    if (colName.toLowerCase().includes('id') || colName.toLowerCase() === 'uuid') {
      if (stringValue.length > 8) {
        return (
          <span title={stringValue} className="cursor-help font-mono text-xs text-blue-600 block truncate">
            {stringValue.substring(0, 8)}...
          </span>
        )
      }
      return <span className="font-mono text-xs text-blue-600">{stringValue}</span>
    }
    
    // Format different data types
    if (dataType.includes('DateTime')) {
      const truncated = stringValue.length > 16 ? stringValue.substring(0, 16) + '...' : stringValue
      return <span title={stringValue} className="font-mono text-xs text-blue-600 cursor-help">{truncated}</span>
    }
    if (dataType.includes('Int') || dataType.includes('Float')) {
      return <span className="font-mono text-xs text-green-600 text-right">{stringValue}</span>
    }
    if (stringValue.length > 30) {
      return (
        <span title={stringValue} className="cursor-help font-mono text-xs block truncate">
          {stringValue.substring(0, 30)}...
        </span>
      )
    }
    
    return <span className="font-mono text-xs">{stringValue}</span>
  }

  return formatValue(value, type, columnName)
}

const getTypeIcon = (type: string) => {
  if (type.includes('DateTime')) return <Calendar className="size-3 text-blue-500" />
  if (type.includes('Int') || type.includes('Float')) return <Hash className="size-3 text-green-500" />
  if (type.includes('String')) return <Type className="size-3 text-purple-500" />
  return <Binary className="size-3 text-gray-500" />
}

export function DataTableView({
  data,
  columns,
  loading,
  onDeleteRow,
  onEditRow,
  onHideRow
}: DataTableViewProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [colSizing, setColSizing] = React.useState<ColumnSizingState>({})
  const [hiddenRows, setHiddenRows] = React.useState<Set<string>>(new Set())
  const [editingRow, setEditingRow] = React.useState<Record<string, any> | null>(null)
  const [editFormData, setEditFormData] = React.useState<Record<string, any>>({})
  const [confirmText, setConfirmText] = React.useState('')

  // Helper functions
  const handleEditRow = (row: Record<string, any>) => {
    setEditingRow(row)
    setEditFormData({ ...row })
  }

  const handleSaveEdit = () => {
    if (editingRow && onEditRow) {
      onEditRow(editingRow, editFormData)
      setEditingRow(null)
      setEditFormData({})
    }
  }

  const handleHideRow = (row: Record<string, any>) => {
    const rowId = JSON.stringify(row)
    setHiddenRows(prev => new Set([...prev, rowId]))
    if (onHideRow) {
      onHideRow(row)
    }
  }

  const handleDeleteSelected = () => {
    const selectedRows = table.getSelectedRowModel().rows
    selectedRows.forEach(row => {
      if (onDeleteRow) {
        onDeleteRow(row.original)
      }
    })
    setRowSelection({})
  }

  const EditDialog = () => (
    <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Row</DialogTitle>
          <DialogDescription>
            Make changes to the row data. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {columns.map((col) => (
            <div key={col.name} className="grid grid-cols-4 items-center gap-4">
              <label htmlFor={col.name} className="text-right text-sm font-medium">
                {col.name}
              </label>
              <div className="col-span-3">
                <Input
                  id={col.name}
                  value={editFormData[col.name] || ''}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    [col.name]: e.target.value
                  }))}
                  placeholder={`Enter ${col.name}`}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Type: {col.type}</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingRow(null)}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const tableColumns: ColumnDef<any>[] = React.useMemo(() => {
    const fields: ColumnDef<any>[] = columns.map((col) => {
      
      return {
        accessorKey: col.name,
        header: ({ column }) => (
          <div className="flex items-center gap-3 text-foreground min-w-0 pr-6 w-full">
            <FieldIcon label={`Type: ${col.type}`}>
              {getTypeIcon(col.type)}
            </FieldIcon>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 font-semibold hover:bg-transparent flex items-center gap-2 text-xs justify-start min-w-0"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              >
                <span className="truncate text-left font-medium">{col.name}</span>
                {column.getIsSorted() === 'asc' ? (
                  <SortAsc className="h-3 w-3 flex-shrink-0" />
                ) : column.getIsSorted() === 'desc' ? (
                  <SortDesc className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <ArrowUpDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                )}
              </Button>
            </div>
            <Badge variant="outline" className="text-xs flex-shrink-0 px-2 py-1">
              {col.type.length > 6 ? col.type.substring(0, 6) + '...' : col.type}
            </Badge>
          </div>
        ),
        cell: ({ row }) => {
          const value = row.getValue(col.name) as any
          return <ValueCell value={value} type={col.type} columnName={col.name} />
        },
        enableResizing: true,
        size: 250,
        minSize: 80,
        maxSize: 450,
        filterFn: 'includesString',
      }
    })

    const actionColumn: ColumnDef<any> = {
      id: 'actions',
      enableHiding: false,
      enableResizing: false,
      size: 60,
      minSize: 60,
      maxSize: 60,
      cell: ({ row }) => {
        const rowData = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-6 w-6 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onEditRow && (
                <DropdownMenuItem
                  onClick={() => handleEditRow(rowData)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Edit row
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleHideRow(rowData)}
                className="flex items-center gap-2"
              >
                <EyeOff className="h-3 w-3" />
                Hide row
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const text = Object.entries(rowData)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')
                  navigator.clipboard.writeText(text)
                }}
              >
                Copy row data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onDeleteRow && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete row
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Row</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this row? This action cannot be undone.
                        <br/><br/>
                        Please type <strong>DELETE</strong> to confirm.
                      </AlertDialogDescription>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="mt-2"
                      />
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (onDeleteRow) onDeleteRow(rowData)
                          setConfirmText('')
                        }}
                        disabled={confirmText !== 'DELETE'}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Row
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }

    return [selectColumn, ...fields, actionColumn]
  }, [columns, onDeleteRow, onEditRow, handleEditRow, handleHideRow])

  // Filter out hidden rows
  const filteredData = React.useMemo(() => {
    if (!data) return []
    return data.filter(row => {
      const rowId = JSON.stringify(row)
      return !hiddenRows.has(rowId)
    })
  }, [data, hiddenRows])

  const table = useReactTable({
    data: filteredData,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColSizing,
    enableColumnResizing: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing: colSizing,
    },
    defaultColumn: {
      size: 150,
      minSize: 80,
      maxSize: 300,
    },
    columnResizeMode: 'onChange',
  })

  const rows = React.useMemo(() => table.getRowModel().rows, [table, data])
  const selectedRowsCount = table.getSelectedRowModel().rows.length

  // Table controls component
  const TableControls = () => (
    <div className="flex items-center justify-between p-4 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Columns className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Show hidden rows count */}
        {hiddenRows.size > 0 && (
          <Badge variant="secondary" className="h-8">
            {hiddenRows.size} hidden
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-2"
              onClick={() => setHiddenRows(new Set())}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Bulk actions for selected rows */}
        {selectedRowsCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-8">
              {selectedRowsCount} selected
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-8">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Rows</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedRowsCount} selected rows? 
                    This action cannot be undone.
                    <br/><br/>
                    Please type <strong>DELETE</strong> to confirm.
                  </AlertDialogDescription>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="mt-2"
                  />
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      handleDeleteSelected()
                      setConfirmText('')
                    }}
                    disabled={confirmText !== 'DELETE'}
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
    </div>
  )

  // Add column filters below headers
  const renderColumnFilters = () => (
    <TableRow className="hover:bg-transparent border-b">
      {table.getHeaderGroups()[0]?.headers.map((header) => (
        <TableHead key={`filter-${header.id}`} style={{ width: header.getSize() }} className="p-1">
          {header.column.getCanFilter() && header.id !== 'select' && header.id !== 'actions' ? (
            <Input
              placeholder={`Filter...`}
              value={(header.column.getFilterValue() as string) ?? ''}
              onChange={(e) => header.column.setFilterValue(e.target.value)}
              className="h-6 text-xs px-2"
            />
          ) : null}
        </TableHead>
      ))}
    </TableRow>
  )

  return (
      <Table style={{ width: table.getTotalSize() }} className="table-fixed">
        <TableHeader className="sticky top-0 bg-background border-b z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className="hover:[&>*]:border-border h-10"
          >
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className="border border-transparent relative hover:[&>.resizer]:bg-border p-2 text-xs"
                style={{ width: header.getSize() }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                <div
                  onMouseDown={header.getResizeHandler()}
                  onTouchStart={header.getResizeHandler()}
                  className={cn(
                    'resizer absolute right-0 top-0 h-full w-1 z-10 select-none touch-none transition-colors duration-150 ease-in-out',
                    header.column.getIsResizing()
                      ? 'bg-primary/50'
                      : header.column.getCanResize()
                        ? 'hover:bg-border cursor-col-resize'
                        : 'hidden',
                  )}
                />
              </TableHead>
            ))}
          </TableRow>
        ))}
        {renderColumnFilters()}
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              className="hover:[&>*]:border-border h-8"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="border border-transparent overflow-hidden p-2 text-xs"
                  style={{
                    width: cell.column.getSize(),
                  }}
                >
                  <div className="truncate">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={tableColumns.length}
              className="h-24 text-center"
              style={{ width: `${table.getTotalSize()}px` }}
            >
              {loading
                ? 'Loading...'
                : 'No results.'}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
} 