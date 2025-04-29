"use client";

import { useCallback, useEffect, useRef } from 'react';
import { useWebsitesStore } from '@/stores/use-websites-store';
import { toast } from 'sonner';
import { 
  createWebsite as createWebsiteAction, 
  deleteWebsite as deleteWebsiteAction, 
  getUserWebsites,
  updateWebsite as updateWebsiteAction,
} from "@/app/actions/websites";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Website {
  id: string;
  name: string | null;
  // The domain can be either a string or an object depending on how it's returned from the API
  domain: string | { 
    id: string;
    name: string;
    verificationStatus: string;
    verificationToken: string | null;
    verifiedAt: string | null;
    userId: string | null;
    projectId: string | null;
    dnsRecords: any;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  userId?: string | null;
  projectId?: string | null;
  domainId?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  domainData?: {
    id: string;
    name: string;
    verificationStatus: string;
    verificationToken: string | null;
    verifiedAt: string | null;
    userId: string | null;
    projectId: string | null;
    dnsRecords: any;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  } | null;
}

interface CreateWebsiteData {
  name: string;
  domain: string;
  domainId?: string;
}

interface UpdateWebsiteData {
  name?: string;
  domain?: string;
  domainId?: string | null;
}

// Query keys
export const websiteKeys = {
  all: ['websites'] as const,
  lists: () => [...websiteKeys.all, 'list'] as const,
  list: (filters: string) => [...websiteKeys.lists(), { filters }] as const,
  details: () => [...websiteKeys.all, 'detail'] as const,
  detail: (id: string) => [...websiteKeys.details(), id] as const,
};

export function useWebsites() {
  const store = useWebsitesStore();
  const queryClient = useQueryClient();
  const previousDataRef = useRef<Website[] | null>(null);
  
  // Fetch websites with React Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: websiteKeys.lists(),
    queryFn: async () => {
      try {
        const result = await getUserWebsites();
        if (result.error) throw new Error(result.error);
        return result.data || [];
      } catch (error) {
        console.error('Error fetching websites:', error);
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
      store.setWebsites(data);
    }
  }, [data, store]);
  
  // Show toast on error, but don't update the store here to avoid loop
  useEffect(() => {
    if (isError) {
      toast.error('Failed to fetch websites');
    }
  }, [isError]);

  // Create website mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateWebsiteData) => {
      const result = await createWebsiteAction(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onMutate: () => {
      store.setIsCreating(true);
    },
    onSuccess: () => {
      toast.success("Website created successfully");
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create website');
    },
    onSettled: () => {
      store.setIsCreating(false);
    }
  });

  // Update website mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWebsiteData }) => {
      const result = await updateWebsiteAction(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onMutate: () => {
      store.setIsUpdating(true);
    },
    onSuccess: () => {
      toast.success("Website updated successfully");
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update website');
    },
    onSettled: () => {
      store.setIsUpdating(false);
    }
  });

  // Delete website mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteWebsiteAction(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onMutate: () => {
      store.setIsDeleting(true);
    },
    onSuccess: () => {
      toast.success("Website deleted successfully");
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete website');
    },
    onSettled: () => {
      store.setIsDeleting(false);
    }
  });

  return {
    // Data directly from React Query
    websites: data || [],
    selectedWebsite: store.selectedWebsite,
    
    // UI States
    isLoading,
    isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Actions
    setSelectedWebsite: store.setSelectedWebsite,
    createWebsite: createMutation.mutate,
    updateWebsite: updateMutation.mutate,
    deleteWebsite: deleteMutation.mutate,
    refetch,
  };
}

// Hook to get a single website by ID
export function useWebsite(id: string) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: websiteKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      
      // First check if we already have the website data in cache
      const websitesData = queryClient.getQueryData<Website[]>(websiteKeys.lists());
      const cachedWebsite = websitesData?.find(website => website.id === id);
      if (cachedWebsite) return cachedWebsite;
      
      // If not found in cache, could implement a getWebsiteById fetch here
      return null;
    },
    enabled: !!id,
  });
} 