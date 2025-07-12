"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

export function WebsiteIdCopy({ id }: { id: string }) {
    return (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground select-all">
            <span className="truncate font-mono">{id}</span>
            <button
                type="button"
                className="ml-1 p-1 rounded hover:bg-accent focus:outline-none"
                title="Copy Website ID"
                onClick={async (e) => {
                    e.preventDefault();
                    await navigator.clipboard.writeText(id);
                    toast.success("Website ID copied!");
                }}
            >
                <Copy className="h-3 w-3" />
            </button>
        </div>
    );
} 