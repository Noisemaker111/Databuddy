'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  ChevronDown,
  Database,
  TableIcon,
  MoreHorizontal,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

interface TableStats {
  total_rows: number
  total_bytes: number
  compressed_size: string
  uncompressed_size: string
}

interface TableTopbarProps {
  database: string
  table: string
  stats: TableStats | null
  columnsCount: number
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onDropTable: () => void
}

export function TableTopbar({
  database,
  table,
  stats,
  columnsCount,
  loading,
  onRefresh,
  onExport,
  onDropTable
}: TableTopbarProps) {
  const [confirmText, setConfirmText] = React.useState('')
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <div className="w-full h-16 bg-sidebar border-b border-border flex items-center px-4">
      <div className="flex items-center gap-4 flex-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-all duration-150 outline-none cursor-pointer select-none">
                  {database}
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/">Browse all databases</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                {table}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Stats in header */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        {stats && (
          <>
            <div className="flex items-center gap-2">
              <span>{formatNumber(stats.total_rows)} rows</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{stats.compressed_size}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{columnsCount} columns</span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <Link href={`/table/${database}/${table}/schema`}>
            <Settings className="h-4 w-4 mr-2" />
            Schema
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExport} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Drop Table
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Drop Table</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to drop table <strong>{database}.{table}</strong>? 
                    This action cannot be undone and will permanently delete all data.
                    <br/><br/>
                    Please type <strong>{database}.{table}</strong> to confirm.
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
                    onClick={onDropTable}
                    disabled={confirmText !== `${database}.${table}`}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Drop Table
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 