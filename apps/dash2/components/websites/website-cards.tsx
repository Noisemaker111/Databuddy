"use client";

import { useBatchedMiniCharts } from "@/hooks/use-analytics";
import { WebsiteCard } from "./website-card";
import type { Website } from "@/hooks/use-websites";

interface WebsiteCardsProps {
  websites: Website[];
  onUpdate: (id: string, name: string) => void;
  isUpdating: boolean;
  verifiedDomains: Array<{
    id: string;
    name: string;
    verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
  }>;
}

export function WebsiteCards({ 
  websites, 
  onUpdate, 
  isUpdating, 
  verifiedDomains 
}: WebsiteCardsProps) {
  // Extract website IDs for batched fetching
  const websiteIds = websites.map(website => website.id);
  
  // Fetch all mini charts in a single API request
  const { 
    chartsData, 
    isLoading: chartsLoading,
    isError: chartsError 
  } = useBatchedMiniCharts(websiteIds);

  if (!websites.length) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No websites found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {websites.map((website) => (
        <WebsiteCard
          key={website.id}
          website={website}
          onUpdate={onUpdate}
          isUpdating={isUpdating}
          verifiedDomains={verifiedDomains}
          data={chartsData[website.id]}
          isLoading={chartsLoading}
          isError={chartsError}
        />
      ))}
    </div>
  );
} 