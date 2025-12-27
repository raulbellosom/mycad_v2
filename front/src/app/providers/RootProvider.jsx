import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../../features/auth/context/AuthProvider";
import { ActiveGroupProvider } from "../../features/groups/context/ActiveGroupProvider";
import { ThemeProvider } from "../../shared/theme/ThemeProvider";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function RootProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <ActiveGroupProvider>
            {children}
            <Toaster position="top-center" reverseOrder={false} />
            <ReactQueryDevtools initialIsOpen={false} />
          </ActiveGroupProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
