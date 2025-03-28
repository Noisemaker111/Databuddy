"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

// Default query client configuration
const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
};

// Create a shared query client for prefetching
export const queryClient = new QueryClient(defaultQueryClientOptions);

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create a client-specific query client to avoid shared state between users
  const [clientQueryClient] = useState(() => new QueryClient(defaultQueryClientOptions));

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={clientQueryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
