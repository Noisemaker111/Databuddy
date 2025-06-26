"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBillingData, type Plan, type FeatureUsage } from "../data/billing-data";
import { useBilling } from "@/hooks/use-billing";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckIcon, ExternalLink } from "lucide-react";
import { NoPaymentMethodDialog } from "./no-payment-method-dialog";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";

function UsageMeter({ title, usage, limit, onUpgrade, nextReset, interval }: {
  title: string,
  usage: number,
  limit: number,
  onUpgrade: () => void,
  nextReset?: string | null,
  interval?: string | null
}) {
  const percentage = limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
  const isUnlimited = !isFinite(limit);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{title}</span>
        <span>{usage.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="flex justify-between items-center mt-1">
        {nextReset && interval && (
          <span className="text-xs text-muted-foreground">Resets {nextReset}</span>
        )}
        {!isUnlimited && percentage > 80 && (
          <div className="text-xs text-amber-600 flex items-center ml-auto">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Approaching limit</span>
            <Button variant="link" className="h-auto p-0 pl-1" onClick={onUpgrade}>Upgrade</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionStatus({ status, details }: { status: string, details?: string }) {
  let color = "bg-green-500";
  let label = "Active";

  if (status === "canceled" || status.includes("cancel")) {
    color = "bg-red-500";
    label = "Cancelled";
  } else if (status === "scheduled") {
    color = "bg-blue-500";
    label = "Scheduled";
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="font-medium">{label}</span>
      </div>
      {details && <p className="text-xs text-muted-foreground">{details}</p>}
    </div>
  );
}

export function OverviewTab() {
  const { subscriptionData, usage, customerData, isLoading, refetch } = useBillingData();
  const { onUpgrade, onCancel, onManageBilling, showNoPaymentDialog, setShowNoPaymentDialog, getSubscriptionStatusDetails } = useBilling(refetch);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const currentPlan = subscriptionData?.list?.find((p: Plan) => p.scenario === 'active');
  const usageStats = usage?.features || [];

  const nextPlan = subscriptionData?.list?.find((p: Plan) => p.scenario === 'upgrade');
  const nextPlanId = nextPlan?.id;

  // Get subscription details
  const statusDetails = currentPlan && customerData?.products?.find(p => p.id === currentPlan.id)
    ? getSubscriptionStatusDetails(customerData.products.find(p => p.id === currentPlan.id) as any)
    : '';

  return (
    <>
      <NoPaymentMethodDialog
        open={showNoPaymentDialog}
        onOpenChange={setShowNoPaymentDialog}
        onConfirm={onManageBilling}
      />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Your current usage for this billing period.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {usageStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No usage data available.</p>
              ) : (
                usageStats.map((feature: FeatureUsage) => (
                  <UsageMeter
                    key={feature.id}
                    title={feature.name}
                    usage={feature.used}
                    limit={feature.limit}
                    nextReset={feature.nextReset}
                    interval={feature.interval}
                    onUpgrade={() => nextPlanId && onUpgrade(nextPlanId)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold">{currentPlan?.name || 'Free'}</h3>
                {currentPlan && currentPlan.status && (
                  <SubscriptionStatus status={currentPlan.status} details={statusDetails} />
                )}
              </div>

              <div className="space-y-2 text-sm">
                {currentPlan?.items.map(item => (
                  <div key={item.feature_id} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500" />
                    <span>{item.primary_text}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                {currentPlan?.status === 'canceled' || currentPlan?.canceled_at ? (
                  <Button onClick={() => nextPlanId && onUpgrade(nextPlanId)} className="w-full">
                    Reactivate Subscription
                  </Button>
                ) : (
                  <>
                    {nextPlanId && (
                      <Button onClick={() => nextPlanId && onUpgrade(nextPlanId)} className="w-full" disabled={!nextPlanId}>
                        Upgrade
                      </Button>
                    )}
                    {currentPlan && currentPlan.id !== 'free-example' && (
                      <Button onClick={() => onCancel(currentPlan.id)} variant="outline" className="w-full">
                        Cancel Subscription
                      </Button>
                    )}
                  </>
                )}
                <Button onClick={onManageBilling} className="w-full" variant="outline">
                  Manage Billing <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 