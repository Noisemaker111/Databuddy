import { format } from "date-fns";
import { Activity, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SessionData } from "@/hooks/use-analytics";

interface SessionDetailsModalProps {
  session: SessionData;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionDetailsModal({ session, isOpen, onClose }: SessionDetailsModalProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Session Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{formatDuration(session.duration || 0)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Page Views</p>
              <p className="text-lg font-semibold">{session.page_views || 0}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Visitor Type</p>
              <Badge variant={session.is_returning_visitor ? "default" : "secondary"} className="mt-1">
                {session.is_returning_visitor ? 'Returning' : 'New'}
              </Badge>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Session Count</p>
              <p className="text-lg font-semibold">{session.visitor_session_count || 1}</p>
            </div>
          </div>

          {/* Session Info */}
          <div className="space-y-4">
            <h4 className="font-medium">Session Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">First Visit</p>
                <p className="font-medium">
                  {session.first_visit ? format(new Date(session.first_visit), 'PPp') : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Visit</p>
                <p className="font-medium">
                  {session.last_visit ? format(new Date(session.last_visit), 'PPp') : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">
                                      {session.region && session.region !== 'Unknown' ? `${session.region}, ` : ''}
                  {session.country || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Referrer</p>
                <p className="font-medium truncate" title={session.referrer}>
                  {session.referrer || 'Direct'}
                </p>
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="space-y-4">
            <h4 className="font-medium">Device Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Device</p>
                <p className="font-medium">{session.device || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Browser</p>
                <p className="font-medium">{session.browser || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Operating System</p>
                <p className="font-medium">{session.os || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* IDs */}
          <div className="space-y-4">
            <h4 className="font-medium">Identifiers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Session ID</p>
                <p className="font-mono text-xs bg-muted p-2 rounded">{session.session_id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Visitor ID</p>
                <p className="font-mono text-xs bg-muted p-2 rounded">{session.visitor_id}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 