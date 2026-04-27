"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Singleton pattern to persist QueryClient across route navigation
let browserQueryClient = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return new QueryClient();
  } else {
    // Browser: create once and reuse
    if (!browserQueryClient) {
      browserQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 15, // 15 minutes default
            gcTime: 1000 * 60 * 30, // 30 minutes default
            refetchOnWindowFocus: false,
          },
        },
      });
    }
    return browserQueryClient;
  }
}

export default function TanStackQueryProvider({ children }) {
  // Note: useState is not needed here since we use a singleton pattern
  // but we keep it to trigger re-render if needed in the future
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
