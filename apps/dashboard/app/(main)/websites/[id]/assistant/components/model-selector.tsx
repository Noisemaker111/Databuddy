"use client";

import type React from "react";
import { ChevronDown, FlaskConical, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AssistantModel } from "../types/model";
import { MODEL_CONFIGS } from "../types/model";

const modelIcons: Record<string, React.ReactNode> = {
    chat: <Star className="h-4 w-4 text-yellow-400" />, // Use Star for default
    agent: <FlaskConical className="h-4 w-4 text-blue-400" />, // Flask for experimental/agent
    "agent-max": <FlaskConical className="h-4 w-4 text-purple-400" />, // Flask for max
};

interface ModelSelectorProps {
    selectedModel: AssistantModel;
    onModelChange: (model: AssistantModel) => void;
    disabled?: boolean;
    className?: string;
}

export function ModelSelector({
    selectedModel,
    onModelChange,
    disabled = false,
    className,
}: ModelSelectorProps) {
    const currentConfig = MODEL_CONFIGS[selectedModel];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className={cn(
                        "h-8 px-3 text-xs font-semibold border border-border/50 bg-background/70",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors duration-200",
                        className
                    )}
                >
                    {modelIcons[selectedModel]}
                    <span className="ml-2 mr-1">{currentConfig.name}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background/95 border border-border/60 shadow-xl p-1">
                {Object.values(MODEL_CONFIGS).map((config) => (
                    <DropdownMenuItem
                        key={config.id}
                        onClick={() => onModelChange(config.id)}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer group transition-colors",
                            selectedModel === config.id
                                ? "bg-accent/80 text-accent-foreground border border-primary"
                                : "hover:bg-muted/60 hover:text-foreground"
                        )}
                    >
                        <div className="flex items-center gap-2 min-w-[28px]">
                            {modelIcons[config.id]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{config.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                                {config.description}
                            </div>
                        </div>
                        {selectedModel === config.id && (
                            <Check className="h-4 w-4 text-primary ml-2" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 