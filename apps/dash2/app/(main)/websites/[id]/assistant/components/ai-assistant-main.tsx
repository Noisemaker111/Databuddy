"use client";

import React, { Suspense, useMemo } from "react";
import type { WebsiteDataTabProps } from "../../_components/utils/types";
import { useChat } from "../hooks/use-chat";
import type { Message } from "../types/message";
import ChatSection, { ChatSkeleton } from "./chat-section";
import VisualizationSection, { VisualizationSkeleton } from "./visualization-section";
import { cn } from "@/lib/utils";

export default function AIAssistantMain(props: WebsiteDataTabProps) {
  const chat = useChat(props.websiteId, props.websiteData);
  
  const latestVisualizationMessage = chat.messages
    .slice()
    .reverse()
    .find((m: Message) => m.data && m.chartType && m.type === 'assistant' && m.responseType === 'chart');

  let currentQueryMessage: Message | undefined = undefined;
  if (latestVisualizationMessage) {
    const vizMessageIndex = chat.messages.findIndex(m => m.id === latestVisualizationMessage.id);
    if (vizMessageIndex > -1) {
      for (let i = vizMessageIndex - 1; i >= 0; i--) {
        if (chat.messages[i].type === 'user') {
          currentQueryMessage = chat.messages[i];
          break;
        }
      }
    }
  }

  // Determine if we should show the visualization panel
  const shouldShowVisualization = useMemo(() => {
    return latestVisualizationMessage && 
           latestVisualizationMessage.data && 
           latestVisualizationMessage.chartType && 
           latestVisualizationMessage.responseType === 'chart';
  }, [latestVisualizationMessage]);

  // Check if we have any recent activity that might benefit from showing the panel
  const hasRecentActivity = useMemo(() => {
    return chat.messages.length > 1; // More than just the welcome message
  }, [chat.messages.length]);

  return (
    // Use flex row for layout, allowing children to take available space
    <div className="flex flex-1 lg:flex-row flex-col gap-3 overflow-hidden">
      {/* Chat Section - expands to take more space when visualization is hidden */}
      <div 
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-500 ease-in-out",
          shouldShowVisualization 
            ? "flex-[2_2_0%]" 
            : "flex-[1_1_0%] lg:flex-[3_3_0%]"
        )}
      >
        <Suspense fallback={<ChatSkeleton />}>
          <ChatSection 
            {...props} 
            messages={chat.messages}
            inputValue={chat.inputValue}
            setInputValue={chat.setInputValue}
            isLoading={chat.isLoading}
            isRateLimited={chat.isRateLimited}
            scrollAreaRef={chat.scrollAreaRef}
            sendMessage={chat.sendMessage}
            handleKeyPress={chat.handleKeyPress}
            onResetChat={chat.resetChat}
          />
        </Suspense>
      </div>
      
      {/* Visualization Section - smoothly slides in/out based on need */}
      <div 
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-500 ease-in-out transform",
          shouldShowVisualization 
            ? "flex-[3_3_0%] translate-x-0 opacity-100" 
            : hasRecentActivity 
              ? "flex-[2_2_0%] lg:flex-[1_1_0%] translate-x-0 opacity-60"
              : "flex-[2_2_0%] lg:flex-[1_1_0%] translate-x-0 opacity-40"
        )}
      >
        <Suspense fallback={<VisualizationSkeleton />}>
          <VisualizationSection 
            {...props} 
            latestVisualization={latestVisualizationMessage}
            currentMessage={currentQueryMessage}
            onQuickInsight={chat.sendMessage}
            hasVisualization={shouldShowVisualization}
          />
        </Suspense>
      </div>
    </div>
  );
} 