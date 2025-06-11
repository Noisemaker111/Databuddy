'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Edit, Trash2, Database, Table as TableIcon, RefreshCw, Save, X, Download, BarChart2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableTabs } from '@/components/table-tabs'

interface ColumnInfo {
  name: string
  type: string
  default_type: string
  default_expression: string
  comment: string
  codec_expression: string
  ttl_expression: string
  is_in_partition_key: number
  is_in_sorting_key: number
  is_in_primary_key: number
  is_in_sampling_key: number
}

interface ColumnStats {
  unique_count?: number
  non_default_count?: number
  loading: boolean
  error?: string
}

interface TableInfo {
  database: string
  name: string
  engine: string
  create_table_query: string
  total_rows: string
  total_bytes: string
}

const CLICKHOUSE_TYPES = [
  'String', 'FixedString(N)', 'UUID',
  'Int8', 'Int16', 'Int32', 'Int64',
  'UInt8', 'UInt16', 'UInt32', 'UInt64',
  'Float32', 'Float64',
  'Decimal(P, S)', 'Decimal32(S)', 'Decimal64(S)', 'Decimal128(S)',
  'Bool',
  'Date', 'Date32', 'DateTime', 'DateTime64',
  'Enum8', 'Enum16',
  'Array(T)', 'Tuple(T1, T2, ...)', 'Map(K, V)',
  'Nullable(T)', 'LowCardinality(T)',
  'JSON', 'IPv4', 'IPv6'
]

const TRANSFORMATION_MAP: Record<string, { label: string, expression: (col: string) => string }> = {
  'toUnixTimestamp': {
    label: 'toUnixTimestamp(source)',
    expression: (col) => `toUnixTimestamp(${col})`
  },
  'toString': {
    label: 'toString(source)',
    expression: (col) => `toString(${col})`
  },
  'toUpperCase': {
    label: 'toUpperCase(source)',
    expression: (col) => `upper(${col})`
  },
  'toLowerCase': {
    label: 'toLowerCase(source)',
    expression: (col) => `lower(${col})`
  },
  'toDate': {
    label: 'toDate(source)',
    expression: (col) => `toDate(${col})`
  }
};

export default function TableSchemaPage({ 
  params 
}: { 
  params: { database: string; table: string } 
}) {
  const { database, table } = params
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingColumn, setEditingColumn] = useState<ColumnInfo | null>(null)
  const [columnStats, setColumnStats] = useState<Record<string, ColumnStats>>({})
  const [newColumn, setNewColumn] = useState({
    name: '',
    type: 'String',
    default_expression: '',
    comment: ''
  })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importedSchemaFile, setImportedSchemaFile] = useState<File | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [schemaDiff, setSchemaDiff] = useState<{
    added: any[],
    dropped: any[],
    modified: any[],
  } | null>(null)
  const [backfillSource, setBackfillSource] = useState<string | null>(null)
  const router = useRouter()

  const tableName = `${database}.${table}`

  useEffect(() => {
    loadTableSchema()
    loadTableInfo()
  }, [database, table])

  useEffect(() => {
    if (backfillSource) {
      const sourceColumn = columns.find(c => c.name === backfillSource);
      if (sourceColumn) {
        let expression = `${sourceColumn.name}`; // Default to direct copy
        // Suggest a transformation based on type
        if (sourceColumn.type.includes('DateTime')) {
          expression = `toUnixTimestamp(${sourceColumn.name})`;
        } else if (sourceColumn.type.includes('String')) {
          expression = `concat(${sourceColumn.name}, '_copy')`;
        }
        setNewColumn(prev => ({ ...prev, default_expression: expression }));
      }
    }
  }, [backfillSource, columns]);

  const loadTableSchema = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `DESCRIBE TABLE ${tableName}` 
        })
      })
      const result = await response.json()
      if (result.success) {
        setColumns(result.data.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table schema')
    } finally {
      setLoading(false)
    }
  }

  const loadTableInfo = async () => {
    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `
            SELECT 
              database,
              name,
              engine,
              create_table_query,
              total_rows,
              formatReadableSize(total_bytes) as total_bytes
            FROM system.tables 
            WHERE database = '${database}' 
              AND name = '${table}'
          `
        })
      })
      const result = await response.json()
      if (result.success && result.data.length > 0) {
        setTableInfo(result.data[0])
      }
    } catch (err) {
      console.error('Failed to load table info:', err)
    }
  }

  const addColumn = async () => {
    if (!newColumn.name || !newColumn.type) {
      setError('Column name and type are required')
      return
    }

    setLoading(true)
    try {
      let query = `ALTER TABLE ${tableName} ADD COLUMN ${newColumn.name} ${newColumn.type}`
      
      if (newColumn.default_expression) {
        query += ` DEFAULT ${newColumn.default_expression}`
      }
      
      if (newColumn.comment) {
        query += ` COMMENT '${newColumn.comment}'`
      }

      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const result = await response.json()
      if (result.success) {
        setShowAddDialog(false)
        setNewColumn({ name: '', type: 'String', default_expression: '', comment: '' })
        loadTableSchema()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add column')
    } finally {
      setLoading(false)
    }
  }

  const updateColumn = async (column: ColumnInfo) => {
    setLoading(true)
    try {
      // ClickHouse doesn't support direct column modification, so we need to be careful
      // For now, we'll only support comment updates
      const query = `ALTER TABLE ${tableName} COMMENT COLUMN ${column.name} '${column.comment}'`

      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const result = await response.json()
      if (result.success) {
        setEditingColumn(null)
        loadTableSchema()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update column')
    } finally {
      setLoading(false)
    }
  }

  const dropColumn = async (columnName: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `ALTER TABLE ${tableName} DROP COLUMN ${columnName}` 
        })
      })
      
      const result = await response.json()
      if (result.success) {
        loadTableSchema()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to drop column')
    } finally {
      setLoading(false)
    }
  }

  const loadColumnStats = async (column: ColumnInfo) => {
    setColumnStats(prev => ({ ...prev, [column.name]: { loading: true } }))

    try {
      // Query for unique count
      const uniqueQuery = `SELECT count(DISTINCT "${column.name}") as unique_count FROM ${tableName}`
      const uniqueResponse = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: uniqueQuery })
      })
      const uniqueResult = await uniqueResponse.json()
      if (!uniqueResult.success) throw new Error(uniqueResult.error)
      const unique_count = uniqueResult.data.data[0].unique_count

      let non_default_count: number | undefined = undefined
      if (column.default_expression) {
        const nonDefaultQuery = `SELECT count() as non_default_count FROM ${tableName} WHERE "${column.name}" != ${column.default_expression}`
        const nonDefaultResponse = await fetch('/api/database/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: nonDefaultQuery })
        })
        const nonDefaultResult = await nonDefaultResponse.json()
        if (!nonDefaultResult.success) throw new Error(nonDefaultResult.error)
        non_default_count = nonDefaultResult.data.data[0].non_default_count
      }

      setColumnStats(prev => ({
        ...prev,
        [column.name]: {
          loading: false,
          unique_count,
          non_default_count
        }
      }))

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stats'
      setColumnStats(prev => ({
        ...prev,
        [column.name]: {
          loading: false,
          error: errorMessage
        }
      }))
    }
  }

  const downloadColumn = async (columnName: string) => {
    try {
      const response = await fetch('/api/database/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableName,
          query: `SELECT "${columnName}" FROM ${tableName}`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName}_${columnName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to download column');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download column');
    }
  };

  const exportSchema = () => {
    try {
      const schemaToExport = {
        columns: columns.map(c => ({
          name: c.name,
          type: c.type,
          default_type: c.default_type,
          default_expression: c.default_expression,
          comment: c.comment,
        })),
      };
      const jsonString = JSON.stringify(schemaToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_schema.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export schema');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportedSchemaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content === 'string') {
            const importedSchema = JSON.parse(content);
            if (importedSchema.columns && Array.isArray(importedSchema.columns)) {
              calculateSchemaDiff(columns, importedSchema.columns);
            } else {
              setError("Invalid schema file format. Must contain a 'columns' array.");
              setSchemaDiff(null);
            }
          }
        } catch (err) {
          setError('Failed to parse schema file. Please ensure it is valid JSON.');
          setSchemaDiff(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const calculateSchemaDiff = (currentCols: ColumnInfo[], importedCols: any[]) => {
    const currentColsMap = new Map(currentCols.map(c => [c.name, c]));
    const importedColsMap = new Map(importedCols.map(c => [c.name, c]));

    const added = importedCols.filter(c => !currentColsMap.has(c.name));
    const dropped = currentCols.filter(c => !importedColsMap.has(c.name));
    
    const modified = importedCols
      .filter(ic => {
        const cc = currentColsMap.get(ic.name);
        return cc && (
          cc.type !== ic.type || 
          cc.default_expression !== ic.default_expression || 
          cc.comment !== ic.comment
        );
      })
      .map(ic => ({
        old: currentColsMap.get(ic.name),
        new: ic,
      }));

    setSchemaDiff({ added, dropped, modified });
  };

  const applySchemaChanges = async () => {
    if (!schemaDiff) return;
    setLoading(true);
    setError(null);
    try {
      const queries = [];
      
      for (const col of schemaDiff.dropped) {
        queries.push(`ALTER TABLE ${tableName} DROP COLUMN ${col.name}`);
      }
      
      for (const col of schemaDiff.added) {
        let q = `ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`;
        if (col.default_expression) {
            q += ` DEFAULT ${col.default_expression}`;
        }
        if (col.comment) {
            q += ` COMMENT '${col.comment}'`;
        }
        queries.push(q);
      }
      
      for (const mod of schemaDiff.modified) {
        if (mod.old.type !== mod.new.type) {
          queries.push(`ALTER TABLE ${tableName} MODIFY COLUMN ${mod.new.name} ${mod.new.type}`);
        }
        if (mod.old.comment !== mod.new.comment) {
          queries.push(`ALTER TABLE ${tableName} COMMENT COLUMN ${mod.new.name} '${mod.new.comment}'`);
        }
      }

      for (const query of queries) {
        const response = await fetch('/api/database/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(`Query failed: ${query}\nError: ${result.error}`);
        }
      }

      setShowImportDialog(false);
      setImportedSchemaFile(null);
      setSchemaDiff(null);
      loadTableSchema();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply schema changes');
    } finally {
      setLoading(false);
    }
  };

  const hasDestructiveChanges = schemaDiff && schemaDiff.dropped.length > 0
  const isConfirmRequired = hasDestructiveChanges && confirmText !== 'confirm'

  const getColumnBadges = (column: ColumnInfo) => {
    const badges = []
    if (column.is_in_primary_key) badges.push({ label: 'PK', variant: 'default' as const })
    if (column.is_in_partition_key) badges.push({ label: 'PART', variant: 'secondary' as const })
    if (column.is_in_sorting_key) badges.push({ label: 'SORT', variant: 'outline' as const })
    if (column.is_in_sampling_key) badges.push({ label: 'SAMPLE', variant: 'outline' as const })
    return badges
  }

  return (
    <div className="w-full h-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/table/${database}/${table}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Data
          </Button>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{database}</span>
            <span className="text-muted-foreground">/</span>
            <TableIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{table}</span>
            <Badge variant="outline">Schema</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTableSchema}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Column</DialogTitle>
                <DialogDescription>
                  Add a new column to the table. Make sure to choose the appropriate data type.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="column-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="column-name"
                    value={newColumn.name}
                    onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="column_name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="column-type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={newColumn.type}
                    onValueChange={(value) => setNewColumn(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLICKHOUSE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="column-default" className="text-right">
                    Default
                  </Label>
                  <Input
                    id="column-default"
                    value={newColumn.default_expression}
                    onChange={(e) => setNewColumn(prev => ({ ...prev, default_expression: e.target.value }))}
                    className="col-span-3"
                    placeholder="DEFAULT value or expression"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="column-comment" className="text-right">
                    Comment
                  </Label>
                  <Input
                    id="column-comment"
                    value={newColumn.comment}
                    onChange={(e) => setNewColumn(prev => ({ ...prev, comment: e.target.value }))}
                    className="col-span-3"
                    placeholder="Optional comment"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium">Backfill Helper</h4>
                <p className="text-sm text-muted-foreground">
                  Optionally, create this column's data from an existing column.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Source Column</Label>
                    <Select onValueChange={(value) => setBackfillSource(value)} value={backfillSource || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(c => (
                          <SelectItem key={c.name} value={c.name}>{c.name} ({c.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Transformation</Label>
                    <Select
                      onValueChange={(value) => {
                        if (backfillSource) {
                          const expression = TRANSFORMATION_MAP[value]?.expression(backfillSource);
                          if (expression) {
                            setNewColumn(prev => ({ ...prev, default_expression: expression }));
                          }
                        }
                      }}
                      disabled={!backfillSource}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a function" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRANSFORMATION_MAP).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-2">
                  <Label>Generated Expression (for DEFAULT clause)</Label>
                  <Input 
                    placeholder="e.g., toUnixTimestamp(source)"
                    value={newColumn.default_expression}
                    onChange={(e) => {
                      setBackfillSource(null) // Manual edit overrides helper
                      setNewColumn(prev => ({ ...prev, default_expression: e.target.value }))
                    }}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addColumn} disabled={loading}>
                  Add Column
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportSchema}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <TableTabs database={database} table={table} />

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex-shrink-0">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Table Info */}
        {tableInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Table Information</CardTitle>
              <CardDescription>Basic information about the table</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Engine</Label>
                  <p className="text-sm font-mono">{tableInfo.engine}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Rows</Label>
                  <p className="text-sm font-mono">{tableInfo.total_rows}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Size</Label>
                  <p className="text-sm font-mono">{tableInfo.total_bytes}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Columns</Label>
                  <p className="text-sm font-mono">{columns?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schema Table */}
        <Card>
          <CardHeader>
            <CardTitle>Table Schema</CardTitle>
            <CardDescription>
              Manage columns, data types, and constraints for {tableName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns && columns.length > 0 ? columns.map((column) => (
                  <TableRow key={column.name}>
                    <TableCell className="font-mono font-medium">
                      {column.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {column.type}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {column.default_expression || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {editingColumn?.name === column.name ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingColumn.comment}
                            onChange={(e) => setEditingColumn(prev => 
                              prev ? { ...prev, comment: e.target.value } : null
                            )}
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => updateColumn(editingColumn)}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingColumn(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        column.comment || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getColumnBadges(column).map((badge, index) => (
                          <Badge key={index} variant={badge.variant} className="text-xs">
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {columnStats[column.name] ? (
                        <div className="text-xs">
                          {columnStats[column.name].loading ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Loading...</span>
                            </div>
                          ) : columnStats[column.name].error ? (
                            <span className="text-destructive">{columnStats[column.name].error}</span>
                          ) : (
                            <>
                              <div><strong>Unique:</strong> {columnStats[column.name].unique_count}</div>
                              {columnStats[column.name].non_default_count !== undefined && (
                                <div><strong>Non-Default:</strong> {columnStats[column.name].non_default_count}</div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => loadColumnStats(column)}
                          title="Calculate stats"
                        >
                          <BarChart2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingColumn(column)}
                          title="Edit comment"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => downloadColumn(column.name)}
                          title="Download column data"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Drop column"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Drop Column</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to drop the column "{column.name}"? 
                                This action cannot be undone and will permanently delete all data in this column.
                                <br/><br/>
                                Please type <strong>{column.name}</strong> to confirm.
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
                                onClick={() => dropColumn(column.name)}
                                disabled={confirmText !== column.name}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Drop Column
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {loading ? 'Loading schema...' : 'No columns found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Table Query */}
        {tableInfo?.create_table_query && (
          <Card>
            <CardHeader>
              <CardTitle>CREATE TABLE Statement</CardTitle>
              <CardDescription>The SQL statement used to create this table</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={tableInfo.create_table_query}
                readOnly
                className="font-mono text-sm min-h-32 resize-none"
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showImportDialog} onOpenChange={(open) => {
        if (!open) {
          setShowImportDialog(false);
          setImportedSchemaFile(null);
          setSchemaDiff(null);
          setError(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Schema</DialogTitle>
            <DialogDescription>
              Upload a schema JSON file to compare and apply changes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="schema-file">Schema File (.json)</Label>
              <Input id="schema-file" type="file" accept=".json" onChange={handleFileImport} />
            </div>

            {schemaDiff && (
              <div className="max-h-96 overflow-y-auto">
                <h3 className="font-semibold mb-2">Schema Changes</h3>
                {schemaDiff.added.length > 0 && (
                  <div>
                    <h4 className="text-green-600 font-medium">Columns to Add</h4>
                    <pre className="bg-muted p-2 rounded text-xs">{JSON.stringify(schemaDiff.added, null, 2)}</pre>
                  </div>
                )}
                {schemaDiff.modified.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-yellow-600 font-medium">Columns to Modify</h4>
                    <pre className="bg-muted p-2 rounded text-xs">{JSON.stringify(schemaDiff.modified, null, 2)}</pre>
                  </div>
                )}
                {schemaDiff.dropped.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-red-600 font-medium">Columns to Drop</h4>
                    <pre className="bg-muted p-2 rounded text-xs">{JSON.stringify(schemaDiff.dropped, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
            {hasDestructiveChanges && (
              <div className="mt-4">
                <Label>
                  This action includes dropping columns, which is irreversible.
                  Please type <strong>confirm</strong> to proceed.
                </Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button onClick={applySchemaChanges} disabled={!schemaDiff || loading || isConfirmRequired}>
              {loading ? 'Applying...' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 