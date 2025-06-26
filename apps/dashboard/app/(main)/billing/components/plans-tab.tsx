"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon, Star } from "lucide-react";
import { useBillingData, type Plan } from "../data/billing-data";
import { useBilling } from "@/hooks/use-billing";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NoPaymentMethodDialog } from "./no-payment-method-dialog";

function PlanCard({ plan, onUpgrade, isLoading }: { plan: Plan, onUpgrade: (id: string) => void, isLoading: boolean }) {
  const isCurrent = plan.scenario === 'active';
  const isCanceled = plan.scenario === 'canceled';
  const isScheduled = plan.scenario === 'scheduled';
  const isPopular = plan.name === "Pro Plan";

  // Determine button text based on plan status
  let buttonText = plan.button_text;
  let buttonVariant: 'default' | 'outline' | 'secondary' = isPopular ? 'default' : 'outline';

  if (isCurrent) {
    buttonText = "Current Plan";
    buttonVariant = 'outline';
  } else if (isCanceled) {
    buttonText = "Reactivate";
  } else if (isScheduled) {
    buttonText = "Scheduled";
    buttonVariant = 'secondary';
  }

  return (
    <Card className={cn(
      "flex flex-col border",
      (isCurrent || isCanceled) ? "ring-2 ring-primary" : "hover:shadow-lg",
      isPopular && !isCurrent ? "border-purple-500" : "border-border"
    )}>
      {isPopular && (
        <Badge className="w-fit self-center -mt-3 bg-purple-500 text-white hover:bg-purple-600">
          <Star className="h-3 w-3 mr-1" />
          Most Popular
        </Badge>
      )}
      {isCanceled && (
        <Badge className="w-fit self-center -mt-3 bg-amber-500 text-white">
          Cancelled
        </Badge>
      )}
      {isScheduled && (
        <Badge className="w-fit self-center -mt-3 bg-blue-500 text-white">
          Starts Soon
        </Badge>
      )}
      <CardHeader className={cn("text-center", !(isPopular || isCanceled || isScheduled) && "pt-6")}>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">{plan.price.primary_text}</span>
          <span className="text-muted-foreground">{plan.price.secondary_text}</span>
        </CardDescription>
        {plan.status && (plan.current_period_end || plan.canceled_at) && (
          <div className="text-xs text-muted-foreground mt-1">
            {plan.canceled_at ? (
              <span>Access until {new Date(plan.current_period_end || 0).toLocaleDateString()}</span>
            ) : plan.status === 'scheduled' ? (
              <span>Starts on {new Date(plan.current_period_end || 0).toLocaleDateString()}</span>
            ) : (
              <span>Renews on {new Date(plan.current_period_end || 0).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col flex-grow p-6">
        <div className="flex-grow space-y-3">
          {plan.items.map(item => (
            <li key={item.feature_id} className="flex items-start gap-3 list-none">
              <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <span>{item.primary_text}</span>
                {item.secondary_text && <p className="text-muted-foreground text-xs">{item.secondary_text}</p>}
              </div>
            </li>
          ))}
        </div>
        <Button
          onClick={() => onUpgrade(plan.id)}
          disabled={(isScheduled || (isCurrent && !isCanceled)) || isLoading}
          variant={buttonVariant}
          className="w-full mt-6"
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  )
}

export function PlansTab() {
  const { subscriptionData, isLoading: isDataLoading, refetch } = useBillingData()
  const { onUpgrade, onManageBilling, isLoading: isActionLoading, showNoPaymentDialog, setShowNoPaymentDialog } = useBilling(refetch)

  if (isDataLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[28rem] w-full" />
        <Skeleton className="h-[28rem] w-full" />
        <Skeleton className="h-[28rem] w-full" />
      </div>
    )
  }

  const plans = subscriptionData?.list || []

  return (
    <>
      <NoPaymentMethodDialog
        open={showNoPaymentDialog}
        onOpenChange={setShowNoPaymentDialog}
        onConfirm={onManageBilling}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan: Plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onUpgrade={onUpgrade}
            isLoading={isActionLoading}
          />
        ))}
      </div>
    </>
  )
} 