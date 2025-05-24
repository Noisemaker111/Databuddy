"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAnalyticsProfiles } from "@/hooks/use-analytics";
import { ProfileStats } from "@/components/profiles/profile-stats";
import { ProfilesTable } from "@/components/profiles/profiles-table";
import { ProfileDetailsModal } from "@/components/profiles/profile-details-modal";
import type { ProfileData } from "@/hooks/use-analytics";

export default function ProfilesPage() {
  const params = useParams();
  const websiteId = params.id as string;
  
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  
  const { data, isLoading } = useAnalyticsProfiles(websiteId);

  const profiles = data?.profiles || [];
  
  // Calculate stats from all profiles
  const totalVisitors = profiles.length;
  const returningVisitors = profiles.filter(profile => profile.total_sessions > 1).length;
  const returningRate = totalVisitors > 0 ? (returningVisitors / totalVisitors) * 100 : 0;
  const totalPageViews = profiles.reduce((sum, profile) => sum + (profile.total_pageviews || 0), 0);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex-shrink-0 p-4 sm:p-6">
        <ProfileStats
          totalVisitors={totalVisitors}
          returningVisitors={returningVisitors}
          returningRate={returningRate}
          totalPageViews={totalPageViews}
        />
      </div>
      
      {/* Table Section - Flexible height with scroll */}
      <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 min-h-0">
        <ProfilesTable
          profiles={profiles}
          isLoading={isLoading}
          onProfileClick={setSelectedProfile}
        />
      </div>

      {/* Modal */}
      {selectedProfile && (
        <ProfileDetailsModal
          profile={selectedProfile}
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
} 