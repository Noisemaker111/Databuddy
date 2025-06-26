import { useCustomer } from 'autumn-js/react';
import { useQuery } from '@tanstack/react-query';
import { Customer, CustomerProduct, CustomerFeature } from '@/hooks/use-billing';

export interface Price {
  primary_text: string;
  secondary_text: string;
  primaryText?: string;
  secondaryText?: string;
  type?: string;
  feature_id?: string | null;
  interval?: string;
  price?: number;
}

export interface PlanItem {
  type: 'feature' | 'priced_feature';
  feature_id: string;
  primary_text: string;
  secondary_text?: string;
  included_usage: number | 'inf' | string;
  feature_type?: string;
  interval?: string;
  reset_usage_when_enabled?: boolean;
  primaryText?: string;
  secondaryText?: string;
  price?: number | null;
  tiers?: any[];
  usage_model?: string;
  billing_units?: number;
}

export interface Plan {
  id: string;
  name: string;
  is_add_on: boolean;
  price: Price;
  items: PlanItem[];
  scenario: 'active' | 'upgrade' | 'downgrade' | 'canceled' | 'scheduled';
  button_text: string;
  free_trial?: any | null;
  interval_group?: any | null;
  buttonText?: string;
  status?: string;
  statusDetails?: string;
  current_period_end?: number;
  canceled_at?: number | null;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  isDefault: boolean;
}

export interface SubscriptionResponse {
  list: Plan[];
  paymentMethods?: PaymentMethod[];
}

const PLANS_DATA: SubscriptionResponse = {
  "list": [
    {
      "id": "free-example",
      "name": "Free (Example)",
      "is_add_on": false,
      "price": {
        "primary_text": "Free",
        "secondary_text": " ",
        "primaryText": "Free",
        "secondaryText": " "
      },
      "items": [
        {
          "type": "feature",
          "feature_id": "chat-messages",
          "feature_type": "single_use",
          "included_usage": 10,
          "interval": "month",
          "reset_usage_when_enabled": true,
          "primary_text": "10 chat messages",
          "primaryText": "10 chat messages"
        },
        {
          "type": "feature",
          "feature_id": "events",
          "feature_type": "single_use",
          "included_usage": 10,
          "interval": "month",
          "reset_usage_when_enabled": true,
          "primary_text": "10 events",
          "primaryText": "10 events"
        }
      ],
      "scenario": "downgrade",
      "button_text": "Get Started",
      "free_trial": null,
      "interval_group": null,
      "buttonText": "Get Started"
    },
    {
      "id": "pro-example",
      "name": "Pro (Example)",
      "is_add_on": false,
      "price": {
        "primary_text": "$20.5",
        "secondary_text": "per month",
        "type": "price",
        "feature_id": null,
        "interval": "month",
        "price": 20.5,
        "primaryText": "$20.5",
        "secondaryText": "per month"
      },
      "items": [
        {
          "type": "priced_feature",
          "feature_id": "events",
          "feature_type": "single_use",
          "included_usage": 50,
          "interval": "month",
          "price": null,
          "tiers": [
            {
              "to": "inf",
              "amount": 1
            }
          ],
          "usage_model": "pay_per_use",
          "billing_units": 1,
          "reset_usage_when_enabled": true,
          "primary_text": "50 included",
          "secondary_text": "then $1 per event",
          "primaryText": "50 included",
          "secondaryText": "then $1 per event"
        },
        {
          "type": "feature",
          "feature_id": "chat-messages",
          "feature_type": "single_use",
          "included_usage": "inf",
          "interval": undefined,
          "reset_usage_when_enabled": true,
          "primary_text": "Unlimited chat message",
          "primaryText": "Unlimited chat message"
        },
        {
          "type": "feature",
          "feature_id": "pro-analytics",
          "feature_type": "static",
          "included_usage": "inf",
          "interval": undefined,
          "reset_usage_when_enabled": true,
          "primary_text": "Pro Analytics",
          "primaryText": "Pro Analytics"
        }
      ],
      "scenario": "active",
      "button_text": "Current Plan",
      "free_trial": null,
      "interval_group": null,
      "buttonText": "Current Plan"
    }
  ],
  "paymentMethods": []
}

export type FeatureUsage = {
  id: string;
  name: string;
  used: number;
  limit: number;
  unlimited?: boolean;
  nextReset?: string | null;
  interval?: string | null;
};

export type Usage = {
  features: FeatureUsage[];
}

export const useBillingData = () => {
  // Use the useCustomer hook instead of check
  const { customer, isLoading: isCustomerLoading, refetch } = useCustomer();

  // Transform customer data to match the expected format
  const subscriptionData: SubscriptionResponse = {
    list: PLANS_DATA.list.map(plan => {
      const customerProduct = customer?.products?.find(p => p.id === plan.id);

      if (customerProduct) {
        // Update plan status based on customer data
        let scenario: Plan['scenario'] = 'upgrade';

        if (customerProduct.status === 'active') {
          scenario = customerProduct.canceled_at ? 'canceled' : 'active';
        } else if (customerProduct.status === 'scheduled') {
          scenario = 'scheduled';
        } else {
          // Handle any other status as downgrade
          scenario = 'downgrade';
        }

        const updatedPlan: Plan = {
          ...plan,
          scenario,
          status: customerProduct.status,
          statusDetails: customerProduct.status,
          current_period_end: customerProduct.current_period_end || undefined,
          canceled_at: customerProduct.canceled_at,
        };

        return updatedPlan;
      }

      return plan;
    }),
    paymentMethods: PLANS_DATA.paymentMethods,
  };

  // Transform feature usage data
  const usage: Usage = {
    features: !customer ? [] : Object.values(customer.features).map(feature => ({
      id: feature.id,
      name: feature.name,
      used: feature.usage || 0,
      limit: feature.unlimited ? Infinity : (feature.included_usage || 0),
      unlimited: feature.unlimited || false,
      nextReset: feature.next_reset_at ? new Date(feature.next_reset_at).toLocaleDateString() : null,
      interval: feature.interval || null
    })),
  };

  return {
    subscriptionData,
    usage,
    customerData: customer,
    isLoading: isCustomerLoading,
    refetch,
  };
};