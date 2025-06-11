'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Copy, Download, Clock } from 'lucide-react'
import Link from 'next/link'
import { DataTable } from '@/components/data-table'

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

export default function SqlConsole() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)

  const executeQuery = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await response.json()
      const duration = Date.now() - startTime
      setExecutionTime(duration)
      
      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute query')
    } finally {
      setLoading(false)
    }
  }

  const copyQuery = async () => {
    try {
      await navigator.clipboard.writeText(query)
    } catch (error) {
      console.error('Failed to copy query:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      executeQuery()
    }
  }

  const commonQueries = [
    {
      name: 'Show Databases',
      query: 'SHOW DATABASES'
    },
    {
      name: 'Show Tables',
      query: 'SHOW TABLES FROM analytics'
    },
    {
      name: 'Recent Events',
      query: `SELECT * FROM analytics.events 
WHERE time >= now() - INTERVAL 1 HOUR 
ORDER BY time DESC 
LIMIT 100`
    },
    {
      name: 'Event Count by Hour',
      query: `SELECT 
  toStartOfHour(time) as hour,
  count() as events
FROM analytics.events 
WHERE time >= now() - INTERVAL 24 HOUR
GROUP BY hour 
ORDER BY hour DESC`
    }
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">SQL Console</h1>
              <p className="text-muted-foreground">Execute ClickHouse queries</p>
            </div>
          </div>
        </div>

        {/* Query Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Query Editor</CardTitle>
                <CardDescription>Press Ctrl+Enter to execute</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyQuery}
                  disabled={!query.trim()}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="SELECT * FROM analytics.events LIMIT 10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-32 font-mono text-sm"
              rows={8}
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {query.trim().length} characters
                {executionTime && (
                  <span className="ml-4 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {executionTime}ms
                  </span>
                )}
              </div>
              <Button 
                onClick={executeQuery} 
                disabled={loading || !query.trim()}
                className="min-w-24"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Common Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Common Queries</CardTitle>
            <CardDescription>Click to load a pre-built query</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {commonQueries.map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-3 text-left justify-start"
                  onClick={() => setQuery(item.query)}
                >
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {item.query.split('\n')[0]}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive font-mono text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <DataTable
            result={result}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
} 