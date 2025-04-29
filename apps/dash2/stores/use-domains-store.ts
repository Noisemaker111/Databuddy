import { create } from 'zustand';
import type { domains } from '@databuddy/db';

type Domain = typeof domains.$inferSelect;

interface DomainsState {
  // Data
  domains: Domain[];
  selectedDomain: Domain | null;
  
  // UI States
  isLoading: boolean;
  isError: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isVerifying: boolean;
  isRegenerating: boolean;
  showVerificationDialog: boolean;
  
  // Actions
  setDomains: (domains: Domain[]) => void;
  setSelectedDomain: (domain: Domain | null) => void;
  setShowVerificationDialog: (show: boolean) => void;
  
  // Loading States
  setIsLoading: (loading: boolean) => void;
  setIsError: (error: boolean) => void;
  setIsCreating: (creating: boolean) => void;
  setIsUpdating: (updating: boolean) => void;
  setIsDeleting: (deleting: boolean) => void;
  setIsVerifying: (verifying: boolean) => void;
  setIsRegenerating: (regenerating: boolean) => void;
}

// Use standard Zustand create with better performance
export const useDomainsStore = create<DomainsState>((set) => ({
  // Initial Data
  domains: [],
  selectedDomain: null,
  
  // Initial UI States
  isLoading: true,
  isError: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isVerifying: false,
  isRegenerating: false,
  showVerificationDialog: false,
  
  // Actions
  setDomains: (domains) => set({ domains }),
  setSelectedDomain: (domain) => set({ selectedDomain: domain }),
  setShowVerificationDialog: (show) => set({ showVerificationDialog: show }),
  
  // Loading States
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsError: (error) => set({ isError: error }),
  setIsCreating: (creating) => set({ isCreating: creating }),
  setIsUpdating: (updating) => set({ isUpdating: updating }),
  setIsDeleting: (deleting) => set({ isDeleting: deleting }),
  setIsVerifying: (verifying) => set({ isVerifying: verifying }),
  setIsRegenerating: (regenerating) => set({ isRegenerating: regenerating }),
}));

// Helper selectors for more efficient component subscriptions
export const useSelectedDomain = () => useDomainsStore(state => state.selectedDomain);
export const useVerificationDialogState = () => {
  const { showVerificationDialog, setShowVerificationDialog } = useDomainsStore(
    state => ({
      showVerificationDialog: state.showVerificationDialog,
      setShowVerificationDialog: state.setShowVerificationDialog
    })
  );
  
  return {
    show: showVerificationDialog,
    setShow: setShowVerificationDialog
  };
}; 