import { format } from "date-fns";
import { UserRound, Monitor, Smartphone, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ProfileData } from "@/hooks/use-analytics";
import ReferrerSourceCell from "../atomic/ReferrerSourceCell";

interface ProfileDetailsModalProps {
  profile: ProfileData;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDetailsModal({ profile, isOpen, onClose }: ProfileDetailsModalProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds}s`;
    
    return result.trim();
  };

  // Calculate average session duration from total duration and sessions
  const avgSessionDuration = profile.total_sessions > 0 
    ? Math.round(profile.total_duration / profile.total_sessions)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            Visitor Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto pr-2">
          {/* Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Sessions</p>
              <p className="text-lg font-semibold">{profile.total_sessions || 0}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Page Views</p>
              <p className="text-lg font-semibold">{profile.total_pageviews || 0}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Visitor Type</p>
              <Badge variant={profile.total_sessions > 1 ? "default" : "secondary"} className="mt-1">
                {profile.total_sessions > 1 ? 'Returning' : 'New'}
              </Badge>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Time</p>
              <p className="text-lg font-semibold">
                {profile.total_duration_formatted || formatDuration(profile.total_duration || 0)}
              </p>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <h4 className="font-medium">Profile Information</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">First Visit</p>
                <p className="font-medium">
                  {profile.first_visit ? format(new Date(profile.first_visit), 'PPp') : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Visit</p>
                <p className="font-medium">
                  {profile.last_visit ? format(new Date(profile.last_visit), 'PPp') : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  <p className="font-medium">
                    {profile.city && profile.city !== 'Unknown' ? `${profile.city}, ` : ''}
                    {profile.country || 'Unknown'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Average Session Duration</p>
                <p className="font-medium">
                  {formatDuration(avgSessionDuration)}
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
                <div className="flex items-center gap-1.5">
                  {profile.device === 'desktop' ? 
                    <Monitor className="h-3 w-3" /> : 
                    <Smartphone className="h-3 w-3" />}
                  <p className="font-medium capitalize">{profile.device.charAt(0).toUpperCase() + profile.device.slice(1) || 'Unknown'}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Browser</p>
                <p className="font-medium capitalize">{profile.browser.charAt(0).toUpperCase() + profile.browser.slice(1) || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Operating System</p>
                <p className="font-medium">{profile.os || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Sessions */}
          {profile.sessions && profile.sessions.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Recent Sessions ({profile.sessions.length})</h4>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium">Duration</th>
                        <th className="px-3 py-2 text-left text-xs font-medium">Pages</th>
                        <th className="px-3 py-2 text-left text-xs font-medium">Referrer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.sessions.slice(0, 10).map((session, index) => (
                        <tr key={session.session_id} className="border-b last:border-0">
                          <td className="px-3 py-2">
                            {session.first_visit ? format(new Date(session.first_visit), 'MMM d, HH:mm') : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {session.duration_formatted || `${Math.floor((session.duration || 0) / 60)}:${String((session.duration || 0) % 60).padStart(2, '0')}`}
                          </td>
                          <td className="px-3 py-2">{session.page_views || 0}</td>
                          <td className="px-3 py-2 truncate max-w-32" title={session.referrer}>
                            <ReferrerSourceCell referrer={session.referrer} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Identifiers */}
          <div className="space-y-4">
            <h4 className="font-medium">Identifiers</h4>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Visitor ID</p>
                <p className="font-mono text-xs bg-muted p-2 rounded break-all">{profile.visitor_id}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}