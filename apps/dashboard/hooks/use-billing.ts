import { useState } from 'react';
import { useAutumn } from 'autumn-js/react';
import { toast } from 'sonner';
import dayjs from 'dayjs';

// Define types for customer data
export interface CustomerProduct {
    id: string;
    name: string;
    group: string | null;
    status: 'active' | 'canceled' | 'scheduled';
    canceled_at: number | null;
    started_at: number;
    is_default: boolean;
    is_add_on: boolean;
    current_period_start?: number;
    current_period_end?: number;
}

export interface CustomerFeature {
    id: string;
    name: string;
    type: string;
    unlimited?: boolean;
    balance: number | null;
    usage: number;
    included_usage: number;
    next_reset_at: number | null;
    interval?: string;
}

export interface Customer {
    id: string;
    created_at: number;
    name: string;
    email: string;
    fingerprint: string | null;
    stripe_id: string;
    env: string;
    products: CustomerProduct[];
    features: Record<string, CustomerFeature>;
    metadata: Record<string, any>;
}

export function useBilling(refetch?: () => void) {
    const { attach, cancel, check, track, openBillingPortal } = useAutumn();
    const [isLoading, setIsLoading] = useState(false);
    const [showNoPaymentDialog, setShowNoPaymentDialog] = useState(false);

    const handleUpgrade = async (planId: string) => {
        setIsLoading(true);
        try {
            const result = await attach({ productId: planId });
            if (result.error) {
                if (result.error.message?.includes('no payment method')) {
                    setShowNoPaymentDialog(true);
                } else {
                    toast.error(result.error.message || 'Failed to upgrade.');
                }
            } else {
                toast.success('Successfully upgraded!');
                // Refetch customer data to update UI
                if (refetch) {
                    setTimeout(() => refetch(), 500); // Small delay to ensure backend is updated
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async (planId: string) => {
        setIsLoading(true);
        try {
            await cancel({ productId: planId });
            toast.success('Subscription cancelled.');
            // Refetch customer data to update UI
            if (refetch) {
                setTimeout(() => refetch(), 500); // Small delay to ensure backend is updated
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel subscription.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManageBilling = async () => {
        await openBillingPortal({
            returnUrl: `${window.location.origin}/billing`,
        });
    };

    // Helper functions to extract subscription information
    const getSubscriptionStatus = (product: CustomerProduct) => {
        if (product.status === 'canceled') return 'Cancelled';
        if (product.status === 'scheduled') return 'Scheduled';
        if (product.canceled_at) return 'Cancelling';
        return 'Active';
    };

    const getSubscriptionStatusDetails = (product: CustomerProduct) => {
        if (product.canceled_at && product.current_period_end) {
            return `Access until ${dayjs(product.current_period_end).format('MMM D, YYYY')}`;
        }
        if (product.status === 'scheduled') {
            return `Starts on ${dayjs(product.started_at).format('MMM D, YYYY')}`;
        }
        if (product.current_period_end) {
            return `Renews on ${dayjs(product.current_period_end).format('MMM D, YYYY')}`;
        }
        return '';
    };

    const getFeatureUsage = (featureId: string, customer?: Customer) => {
        if (!customer || !customer.features) return null;

        const feature = customer.features[featureId];
        if (!feature) return null;

        return {
            id: feature.id,
            name: feature.name,
            used: feature.usage,
            limit: feature.unlimited ? Infinity : feature.included_usage,
            unlimited: feature.unlimited || false,
            nextReset: feature.next_reset_at ? dayjs(feature.next_reset_at).format('MMM D, YYYY') : null,
            interval: feature.interval || null
        };
    };

    return {
        isLoading,
        onUpgrade: handleUpgrade,
        onCancel: handleCancel,
        onManageBilling: handleManageBilling,
        check,
        track,
        showNoPaymentDialog,
        setShowNoPaymentDialog,
        getSubscriptionStatus,
        getSubscriptionStatusDetails,
        getFeatureUsage
    };
} 