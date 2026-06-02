"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { ToastProvider } from "@/features/auth/context/toast-context";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { WorkspaceProvider } from "@/features/workspace/context/workspace-context";
import { ChunkReloadGuard } from "./chunk-reload-guard";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ChunkReloadGuard />
      <ToastProvider>
        <AuthProvider>
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
