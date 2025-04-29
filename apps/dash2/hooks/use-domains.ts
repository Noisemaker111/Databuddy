"use client";

import { useEffect, useRef } from 'react';
import { useDomainsStore } from '@/stores/use-domains-store';
import { toast } from 'sonner';
import { 
  getUserDomains,
  createDomain as createDomainAction,
  deleteDomain as deleteDomainAction,
  updateDomain as updateDomainAction,
  checkDomainVerification as checkDomainVerificationAction,
  regenerateVerificationToken as regenerateVerificationTokenAction
} from '@/app/actions/domains';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Use the Domain type from the store
import type { domains } from '@databuddy/db';

type Domain = typeof domains.$inferSelect;
// Query keys
export const domainKeys = {
  all: ['domains'] as const,
  lists: () => [...domainKeys.all, 'list'] as const,
  list: (filters: string) => [...domainKeys.lists(), { filters }] as const,
  details: () => [...domainKeys.all, 'detail'] as const,
  detail: (id: string) => [...domainKeys.details(), id] as const,
};

interface CreateDomainData {
  name: string;
}

interface UpdateDomainData {
  name?: string;
}

interface VerificationResult {
  verified: boolean;
  message: string;
}

export function useDomains() {
  const store = useDomainsStore();
  const queryClient = useQueryClient();
  const previousDataRef = useRef<Domain[] | null>(null);
  
  // Fetch domains with React Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: domainKeys.lists(),
    queryFn: async () => {
      try {
        const result = await getUserDomains();
        if (result.error) throw new Error(result.error);
        return result.data || [];
      } catch (error) {
        console.error('Error fetching domains:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
  
  // Update store when data changes, but only if data has actually changed
  useEffect(() => {
    if (data && JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      previousDataRef.current = data;
      store.setDomains(data);
    }
  }, [data, store]);

  // Show toast on error
  useEffect(() => {
    if (isError) {
      toast.error('Failed to fetch domains');
    }
  }, [isError]);

  // Create domain mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateDomainData) => {
      const result = await createDomainAction(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onMutate: () => {
      store.setIsCreating(true);
    },
    onSuccess: () => {
      toast.success("Domain created successfully");
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create domain');
    },
    onSettled: () => {
      store.setIsCreating(false);
    }
  });

  // Update domain mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDomainData }) => {
      const result = await updateDomainAction(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onMutate: () => {
      store.setIsUpdating(true);
    },
    onSuccess: () => {
      toast.success("Domain updated successfully");
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update domain');
    },
    onSettled: () => {
      store.setIsUpdating(false);
    }
  });

  // Delete domain mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteDomainAction(id);
      if (result.error) throw new Error(result.error);
      // Return success flag if available, otherwise just return an empty object
      return result.success !== undefined ? { success: result.success } : {};
    },
    onMutate: () => {
      store.setIsDeleting(true);
    },
    onSuccess: () => {
      toast.success("Domain deleted successfully");
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete domain');
    },
    onSettled: () => {
      store.setIsDeleting(false);
    }
  });

  // Verify domain mutation
  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await checkDomainVerificationAction(id);
      if (result.error) throw new Error(result.error);
      return result.data as VerificationResult;
    },
    onMutate: () => {
      store.setIsVerifying(true);
    },
    onSuccess: (data: VerificationResult) => {
      if (data?.verified) {
        toast.success(data.message || "Domain verified successfully");
      } else if (data) {
        toast.error(data.message || "Domain verification failed");
      }
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify domain');
    },
    onSettled: () => {
      store.setIsVerifying(false);
    }
  });

  // Regenerate token mutation
  const regenerateMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await regenerateVerificationTokenAction(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onMutate: () => {
      store.setIsRegenerating(true);
    },
    onSuccess: () => {
      toast.success("Verification token regenerated successfully");
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to regenerate verification token');
    },
    onSettled: () => {
      store.setIsRegenerating(false);
    }
  });

  // Extract verified domains
  const verifiedDomains = (data || []).filter(
    domain => domain.verificationStatus === "VERIFIED"
  );

  return {
    // Data
    domains: data || [],
    verifiedDomains,
    selectedDomain: store.selectedDomain,
    
    // UI States
    isLoading,
    isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
    
    // Dialogs
    showVerificationDialog: store.showVerificationDialog,
    setShowVerificationDialog: store.setShowVerificationDialog,
    
    // Actions
    setSelectedDomain: store.setSelectedDomain,
    createDomain: createMutation.mutate,
    updateDomain: updateMutation.mutate,
    deleteDomain: deleteMutation.mutate,
    verifyDomain: verifyMutation.mutate,
    regenerateToken: regenerateMutation.mutate,
    refetch
  };
}

// Hook to get a single domain by ID
export function useDomain(id: string) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: domainKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      
      // First check if we already have the domain data in cache
      const domainsData = queryClient.getQueryData<Domain[]>(domainKeys.lists());
      const cachedDomain = domainsData?.find(domain => domain.id === id);
      if (cachedDomain) return cachedDomain;
      
      // If not found in cache, could implement a getDomainById fetch here
      return null;
    },
    enabled: !!id,
  });
} 