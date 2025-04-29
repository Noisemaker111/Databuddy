"use client";

import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WebsiteDialog } from "@/components/website-dialog";
import type { Website } from "@/hooks/use-websites";
import { useWebsitesStore } from "@/stores/use-websites-store";

interface WebsiteCardProps {
  website: Website;
  onUpdate: (id: string, data: { domain?: string }) => void;
  isUpdating: boolean;
}

export function WebsiteCard({
  website,
  onUpdate,
  isUpdating,
}: WebsiteCardProps) {
  const setSelectedWebsite = useWebsitesStore(state => state.setSelectedWebsite);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Enhanced domain value extraction logic
  let domainValue = '';
  if (typeof website.domain === 'string') {
    domainValue = website.domain;
  } else if (website.domain && typeof website.domain === 'object') {
    // If domain is an object, try to get its name property if it exists
    const domainObj = website.domain as any;
    domainValue = domainObj.name || JSON.stringify(website.domain);
  } else if (website.domainData?.name) {
    // Fallback to domainData if available
    domainValue = website.domainData.name;
  }
  
  const isLocalhost = domainValue.includes('localhost') || domainValue.includes('127.0.0.1');

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedWebsite(website);
    setDialogOpen(true);
  };

  return (
    <Card className="relative overflow-hidden border-border/60 shadow-sm card-hover-effect">
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base truncate">
              {website.name || 'Unnamed Website'}
            </CardTitle>
            <CardDescription className="truncate">
              {domainValue}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0"
            type="button"
            onClick={handleOpenDialog}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <Badge variant="outline" className="bg-background">
            {isLocalhost ? "Local Development" : "Website"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button asChild variant="default" className="w-full">
          <Link href={`/websites/${website.id}`}>
            View Analytics
          </Link>
        </Button>
      </CardFooter>
      
      <WebsiteDialog
        website={website}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(data) => onUpdate(website.id, data)}
        isLoading={isUpdating}
      />
    </Card>
  );
} 