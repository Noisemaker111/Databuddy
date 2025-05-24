"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAnalyticsSessions } from "@/hooks/use-analytics";
import { SessionStats } from "@/components/sessions/session-stats";
import { SessionsTable } from "@/components/sessions/sessions-table";
import { SessionDetailsModal } from "@/components/sessions/session-details-modal";
import type { SessionData } from "@/hooks/use-analytics";

export default function SessionsPage() {
  const params = useParams();
  const websiteId = params.id as string;
  
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  
  const { data, isLoading } = useAnalyticsSessions(websiteId, undefined, 1000, 1);

  const sessions = data?.sessions || [];
  
  // Calculate stats from all sessions
  const totalSessions = sessions.length;
  const avgDuration = sessions.length > 0 
    ? sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / sessions.length 
    : 0;
  const bounceRate = sessions.length > 0 
    ? (sessions.filter(session => (session.page_views || 0) <= 1).length / sessions.length) * 100 
    : 0;
  const totalPageViews = sessions.reduce((sum, session) => sum + (session.page_views || 0), 0);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex-shrink-0 p-4 sm:p-6">
        <SessionStats
          totalSessions={totalSessions}
          avgDuration={Math.round(avgDuration)}
          bounceRate={bounceRate}
          totalPageViews={totalPageViews}
        />
      </div>
      
      {/* Table Section - Flexible height with scroll */}
      <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 min-h-0">
        <SessionsTable
          sessions={sessions}
          isLoading={isLoading}
          onSessionClick={setSelectedSession}
        />
      </div>

      {/* Modal */}
      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
} 