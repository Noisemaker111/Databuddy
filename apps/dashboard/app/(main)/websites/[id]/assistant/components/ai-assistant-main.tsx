"use client";

import { Suspense, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAtom } from 'jotai';
import {
  modelAtom,
  websiteIdAtom,
  websiteDataAtom,
  dateRangeAtom,
  messagesAtom,
  isLoadingAtom,
  isInitializedAtom,
} from '@/stores/jotai/assistantAtoms';
import ChatSection, { ChatSkeleton } from "./chat-section";
import VisualizationSection, { VisualizationSkeleton } from "./visualization-section";
import type { Message } from "../types/message";

export default function AIAssistantMain() {
  const [websiteId, setWebsiteId] = useAtom(websiteIdAtom);
  const [websiteData, setWebsiteData] = useAtom(websiteDataAtom);
  const [dateRange, setDateRange] = useAtom(dateRangeAtom);
  const [messages] = useAtom(messagesAtom);
  const [isLoading] = useAtom(isLoadingAtom);
  const [isInitialized] = useAtom(isInitializedAtom);

  // Find latest visualization message and query message
  const latestVisualizationMessage = messages
    .slice()
    .reverse()
    .find(
      (m: Message) => m.data && m.chartType && m.type === "assistant" && m.responseType === "chart"
    );

  let currentQueryMessage: Message | undefined;
  if (latestVisualizationMessage) {
    const vizMessageIndex = messages.findIndex((m) => m.id === latestVisualizationMessage.id);
    if (vizMessageIndex > -1) {
      for (let i = vizMessageIndex - 1; i >= 0; i--) {
        if (messages[i].type === "user") {
          currentQueryMessage = messages[i];
          break;
        }
      }
    }
  }

  const shouldShowVisualization = !!(
    latestVisualizationMessage?.data &&
    latestVisualizationMessage?.chartType &&
    latestVisualizationMessage?.responseType === "chart"
  );

  // Only local: handle switching chats
  const handleSelectChat = useCallback((id: string, name?: string) => {
    setWebsiteId(id);
    setWebsiteData((prev) => prev ? { ...prev, name } : prev);
  }, [setWebsiteId, setWebsiteData]);

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-background to-muted/20 pt-16 md:pl-72">
      <div className="flex flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
        <div className="flex flex-1 flex-col gap-3 overflow-hidden lg:flex-row">
          <div
            className={cn(
              "flex flex-col overflow-hidden",
              shouldShowVisualization ? "lg:flex-[0.6]" : "flex-1"
            )}
          >
            {!websiteData ? (
              <ChatSkeleton />
            ) : (
              <Suspense fallback={<ChatSkeleton />}>
                <ChatSection onSelectChat={handleSelectChat} />
              </Suspense>
            )}
          </div>
          {shouldShowVisualization && (
            <div className="flex flex-[0.4] flex-col overflow-hidden">
              <Suspense fallback={<VisualizationSkeleton />}>
                <VisualizationSection
                  currentMessage={currentQueryMessage}
                  hasVisualization={shouldShowVisualization}
                  latestVisualization={latestVisualizationMessage}
                  websiteData={websiteData}
                  websiteId={websiteId}
                  dateRange={dateRange}
                // onQuickInsight={...} // If needed, can use atom for this too
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
