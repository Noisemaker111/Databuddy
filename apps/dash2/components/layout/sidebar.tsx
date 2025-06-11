"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, X, ChevronLeft } from "lucide-react";
import { TopHeader } from "./top-header";
import { useWebsites } from "@/hooks/use-websites";
import { WebsiteHeader } from "./navigation/website-header";
import { mainNavigation, websiteNavigation } from "./navigation/navigation-config";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const WebsiteList = dynamic(() => import("./navigation/website-list").then(mod => mod.WebsiteList), {
  ssr: false,
  loading: () => null
});

const NavigationSection = dynamic(() => import("./navigation/navigation-section").then(mod => mod.NavigationSection), {
  ssr: false,
  loading: () => null
});

interface SwipeGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children: React.ReactNode;
  className?: string;
}

function SwipeGesture({ onSwipeLeft, onSwipeRight, children, className }: SwipeGestureProps) {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startX || !isDragging) return;
    setCurrentX(e.touches[0].clientX);
  }, [startX, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!startX || !currentX || !isDragging) {
      setIsDragging(false);
      setStartX(null);
      setCurrentX(null);
      return;
    }

    const deltaX = currentX - startX;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setIsDragging(false);
    setStartX(null);
    setCurrentX(null);
  }, [startX, currentX, isDragging, onSwipeLeft, onSwipeRight]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { websites, isLoading } = useWebsites();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if we're on a specific website page
  const websitePathMatch = pathname.match(/^\/websites\/([^\/]+)(?:\/(.*))?$/);
  const currentWebsiteId = websitePathMatch ? websitePathMatch[1] : null;
  const isInWebsiteContext = !!currentWebsiteId;

  // Find current website details
  const currentWebsite = isInWebsiteContext 
    ? websites?.find((site: any) => site.id === currentWebsiteId) 
    : null;

  // Close sidebar when route changes on mobile
  useEffect(() => {
    pathname
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileOpen]);

  // Handle swipe to close sidebar
  const handleSwipeLeft = useCallback(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [isMobileOpen]);

  // Handle swipe to open sidebar (from edge of screen)
  const handleSwipeRight = useCallback(() => {
    if (!isMobileOpen) {
      setIsMobileOpen(true);
    }
  }, [isMobileOpen]);

  // Smooth open/close with animation states
  const openSidebar = useCallback(() => {
    setIsAnimating(true);
    setIsMobileOpen(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsAnimating(true);
    setIsMobileOpen(false);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, closeSidebar]);

  // Add edge swipe detection for opening sidebar
  useEffect(() => {
    let startX: number | null = null;
    let isEdgeSwipe = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isEdgeSwipe = startX < 20; // Edge swipe area (20px from left edge)
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !isEdgeSwipe || isMobileOpen) return;
      
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;
      
      // Only trigger if swiping right from the edge
      if (deltaX > 50) {
        setIsMobileOpen(true);
        isEdgeSwipe = false;
      }
    };

    const handleTouchEnd = () => {
      startX = null;
      isEdgeSwipe = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Top Navigation Bar */}
      <TopHeader setMobileOpen={openSidebar} />

      {/* Enhanced mobile backdrop */}
      {isMobileOpen && (
        <SwipeGesture
          onSwipeLeft={handleSwipeLeft}
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-30 md:hidden animate-in fade-in duration-300"
        >
          <div 
            className="w-full h-full"
            onClick={closeSidebar}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                closeSidebar();
              }
            }}
          />
        </SwipeGesture>
      )}

      {/* Enhanced sidebar */}
      <SwipeGesture onSwipeLeft={handleSwipeLeft}>
        <div
          ref={sidebarRef}
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-background via-background to-muted/20",
            "border-r border-border/60 transition-all duration-300 ease-out md:translate-x-0 pt-16",
            "shadow-2xl md:shadow-lg backdrop-blur-sm",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
            isAnimating && "transition-transform"
          )}
        >
          {/* Enhanced mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-4 right-4 z-50 md:hidden h-9 w-9",
              "bg-background/90 backdrop-blur-sm border border-border/60 rounded-lg",
              "hover:bg-muted/80 transition-all duration-200 group"
            )}
            onClick={closeSidebar}
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
            <span className="sr-only">Close sidebar</span>
          </Button>

          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-4 space-y-6 pb-8 animate-in fade-in slide-in-from-left-2 duration-300">
              {isInWebsiteContext ? (
                // Website-specific navigation
                <div className="space-y-6">
                  <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <WebsiteHeader website={currentWebsite} />
                  </div>
                  
                  {/* Website navigation sections */}
                  {websiteNavigation.map((section, index) => (
                    <div
                      key={section.title}
                      className="animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${(index + 1) * 100}ms` }}
                    >
                      <NavigationSection
                        title={section.title}
                        items={section.items}
                        pathname={pathname}
                        currentWebsiteId={currentWebsiteId}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                // Main navigation
                <div className="space-y-6">
                  {/* Main navigation sections */}
                  {mainNavigation.map((section, index) => (
                    <div
                      key={section.title}
                      className="animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <NavigationSection
                        title={section.title}
                        items={section.items}
                        pathname={pathname}
                      />
                    </div>
                  ))}

                  {/* Enhanced websites section */}
                  <div 
                    className="animate-in fade-in slide-in-from-left-4"
                    style={{ animationDelay: `${mainNavigation.length * 100}ms` }}
                  >
                    <div className="bg-muted/30 rounded-lg p-3 border border-muted">
                      <h3 className="px-2 mb-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center">
                        <div className="p-1 rounded bg-primary/10 mr-2">
                          <Globe className="h-3 w-3 text-primary" />
                        </div>
                        Websites
                      </h3>
                      <div className="space-y-1 ml-1">
                        <WebsiteList
                          websites={websites}
                          isLoading={isLoading}
                          pathname={pathname}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile-only bottom padding for safe area */}
              <div className="h-8 md:hidden" />
            </div>
          </ScrollArea>

          {/* Enhanced mobile visual indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:hidden">
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground/60 bg-background/80 backdrop-blur-sm rounded-full px-3 py-2 border border-border/40">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="font-medium">Swipe to close</span>
            </div>
          </div>
        </div>
      </SwipeGesture>
    </>
  );
}   
