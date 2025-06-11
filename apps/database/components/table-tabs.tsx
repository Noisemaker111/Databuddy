'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Table, Settings } from 'lucide-react'

interface TableTabsProps {
  database: string
  table: string
}

export function TableTabs({ database, table }: TableTabsProps) {
  const pathname = usePathname()
  
  const tabs = [
    {
      name: 'Data',
      href: `/table/${database}/${table}`,
      icon: Table,
      current: pathname === `/table/${database}/${table}`
    },
    {
      name: 'Schema',
      href: `/table/${database}/${table}/schema`,
      icon: Settings,
      current: pathname === `/table/${database}/${table}/schema`
    }
  ]

  return (
    <div className="border-b border-border bg-muted/30">
      <nav className="flex space-x-8 px-4" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                tab.current
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 