'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Eye, Trash2, Download, BarChart3, Settings } from 'lucide-react'

interface TableInfo {
  name: string
  database: string
  engine: string
  total_rows: number
  total_bytes: number
}

interface TableCardProps {
  table: TableInfo
  onViewData: (tableName: string) => void
  onDropTable: (tableName: string) => void
  onExportData?: (tableName: string) => void
  onAnalyze?: (tableName: string) => void
  loading?: boolean
}

export function TableCard({ 
  table, 
  onViewData, 
  onDropTable, 
  onExportData, 
  onAnalyze,
  loading = false 
}: TableCardProps) {
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

  const fullTableName = `${table.database}.${table.name}`

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{table.name}</h3>
              <Badge variant="secondary">{table.engine}</Badge>
              <Badge variant="outline">{table.database}</Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="font-medium">{formatNumber(table.total_rows)}</span>
                <span>rows</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{formatBytes(table.total_bytes)}</span>
              </div>
            </div>
            
            {/* Health indicator */}
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${table.total_rows > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-muted-foreground">
                {table.total_rows > 0 ? 'Active' : 'Empty'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewData(fullTableName)}
              disabled={loading}
              title="View table data"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {onAnalyze && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAnalyze(fullTableName)}
                disabled={loading}
                title="Analyze table"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            )}
            
            {onExportData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExportData(fullTableName)}
                disabled={loading}
                title="Export data"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={loading}
                  title="Drop table"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Drop Table</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to drop table <strong>{fullTableName}</strong>? 
                    This will permanently delete all {formatNumber(table.total_rows)} rows 
                    and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDropTable(fullTableName)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Drop Table
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 