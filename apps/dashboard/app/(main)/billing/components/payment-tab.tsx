"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useBilling } from "@/hooks/use-billing"
import { useBillingData } from "../data/billing-data"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CircleOff, ExternalLink } from "lucide-react"

export function PaymentTab() {
  const { onManageBilling } = useBilling()
  const { subscriptionData, isLoading } = useBillingData()

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  const paymentMethods: any[] = (subscriptionData as any)?.paymentMethods || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>
          Manage your payment methods and billing information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method: any) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <span className="font-semibold">{method.brand} **** {method.last4}</span>
                  <span className="text-sm text-muted-foreground ml-2">Expires {method.exp_month}/{method.exp_year}</span>
                </div>
                {method.isDefault && <Badge>Default</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 border-dashed border-2 rounded-lg">
            <CircleOff className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Payment Methods</h3>
            <p className="text-muted-foreground text-sm mt-1">Add a payment method to get started.</p>
          </div>
        )}
        <Button onClick={onManageBilling} className="mt-6 w-full">
          Manage Payment Methods <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
} 