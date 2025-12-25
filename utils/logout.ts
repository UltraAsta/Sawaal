import { QueryClient } from "@tanstack/react-query";

/**
 * Global logout cleanup function
 * Clears all persistent data and caches when user logs out
 */
export const performLogoutCleanup = (queryClient: QueryClient) => {
  // Clear all React Query cache
  queryClient.clear();

  console.log("Logout cleanup completed");
};
