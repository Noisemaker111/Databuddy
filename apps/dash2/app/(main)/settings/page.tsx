"use client";

import { useState, Suspense } from "react";
import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ShieldOff,
  User,
  Shield,
  Bell,
  Settings,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

// Dynamic imports for settings form components
const EmailForm = dynamic(() => import("@/components/settings/email-form").then(mod => ({ default: mod.EmailForm })), {
  loading: () => <Skeleton className="h-32 w-full" />,
  ssr: false
});

const PasswordForm = dynamic(() => import("@/components/settings/password-form").then(mod => ({ default: mod.PasswordForm })), {
  loading: () => <Skeleton className="h-40 w-full" />,
  ssr: false
});

const TwoFactorForm = dynamic(() => import("@/components/settings/two-factor-form").then(mod => ({ default: mod.TwoFactorForm })), {
  loading: () => <Skeleton className="h-48 w-full" />,
  ssr: false
});

const SessionsForm = dynamic(() => import("@/components/settings/sessions-form").then(mod => ({ default: mod.SessionsForm })), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false
});

const AccountDeletion = dynamic(() => import("@/components/settings/account-deletion").then(mod => ({ default: mod.AccountDeletion })), {
  loading: () => <Skeleton className="h-24 w-full" />,
  ssr: false
});

const ProfileForm = dynamic(() => import("@/components/settings/profile-form").then(mod => ({ default: mod.ProfileForm })), {
  loading: () => <Skeleton className="h-56 w-full" />,
  ssr: false
});

const TimezonePreferences = dynamic(() => import("@/components/settings/timezone-preferences"), {
  loading: () => <Skeleton className="h-20 w-full" />,
  ssr: false
});

type SettingsTab = "profile" | "account" | "security" | "notifications";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useQueryState('tab', { defaultValue: 'profile' as SettingsTab });
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const tabs = [
    {
      id: "profile" as SettingsTab,
      label: "Profile",
      icon: User,
      description: "Manage your personal information and profile settings",
    },
    {
      id: "account" as SettingsTab,
      label: "Account",
      icon: Settings,
      description: "Manage your account settings and preferences",
    },
    {
      id: "security" as SettingsTab,
      label: "Security",
      icon: Shield,
      description: "Manage your security settings and authentication methods",
    },
    {
      id: "notifications" as SettingsTab,
      label: "Notifications",
      icon: Bell,
      description: "Configure your notification preferences",
      disabled: true,
    },
  ];

  return (
    <div className="container max-w-6xl py-3 space-y-8">
      <div className="flex items-center justify-between">
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden"
          >
            {isSidebarOpen ? "Hide Menu" : "Show Menu"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className={cn(
          "col-span-12 md:col-span-3 transition-all duration-300",
          isMobile && !isSidebarOpen && "hidden md:block"
        )}>
          <Card className="h-full">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-1 p-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2",
                          activeTab === tab.id && "bg-secondary"
                        )}
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (isMobile) setIsSidebarOpen(false);
                        }}
                        disabled={tab.disabled}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                        {tab.disabled && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            Soon
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className={cn(
          "col-span-12 md:col-span-9",
          isMobile && isSidebarOpen && "hidden md:block"
        )}>
          <Tabs value={activeTab} className="space-y-6">
            <TabsContent value="profile" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Profile Information</AlertTitle>
                <AlertDescription>
                  Your profile information is used to personalize your experience and how others see you on the platform.
                  This information is visible to other users.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Address</CardTitle>
                  <CardDescription>
                    Update your email address and manage email preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password and manage password security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timezone Preferences</CardTitle>
                  <CardDescription>
                    Update your timezone preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TimezonePreferences />
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldOff className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  </div>
                  <CardDescription className="text-destructive/80">
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AccountDeletion />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TwoFactorForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Manage and review your active sessions across devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SessionsForm />
                </CardContent>
                {/* <CardFooter className="flex justify-end border-t pt-4">
                  <Button variant="outline" onClick={() => router.push("/security-log")}>
                    View Security Log
                  </Button>
                </CardFooter> */}
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Configure how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground space-y-2">
                    <Bell className="h-8 w-8 text-muted-foreground/50" />
                    <p>Notification settings coming soon</p>
                    <p className="text-sm">We're working on this feature</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 