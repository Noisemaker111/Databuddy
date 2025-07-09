"use client"

import type { Icon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface NavItem {
    id: string
    label: string
    icon: Icon
    disabled?: boolean
}

interface SettingsSidebarProps {
    items: NavItem[]
    activeTab: string
    setActiveTab: (tab: string) => void
    className?: string
}

export function SettingsSidebar({
    items,
    activeTab,
    setActiveTab,
    className,
}: SettingsSidebarProps) {
    return (
        <nav className={cn("flex flex-col space-y-1", className)}>
            {items.map((item) => (
                <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(item.id)}
                    disabled={item.disabled}
                >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                </Button>
            ))}
        </nav>
    )
} 