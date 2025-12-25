import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContexts";
import { BookmarkProvider } from "../contexts/BookmarkContext";
import { SearchProvider } from "../contexts/SearchContext";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    },
  },
});

function RootLayoutNav() {
  const { user, loading, registerCleanupCallback, unregisterCleanupCallback } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Register cleanup callbacks
  useEffect(() => {
    const cleanup = () => {
      // Clear React Query cache
      queryClient.clear();
      console.log("React Query cache cleared on logout");
    };

    registerCleanupCallback(cleanup);
    return () => unregisterCleanupCallback(cleanup);
  }, [registerCleanupCallback, unregisterCleanupCallback, queryClient]);

  useEffect(() => {
    // Don't do anything while loading
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const onboardingCompleted = user?.user_metadata?.onboarding_completed;

    // Use setTimeout to ensure navigation happens after mount
    setTimeout(() => {
      if (!user && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace("/(auth)/login");
      } else if (user && onboardingCompleted === false && segments[1] !== "onboarding") {
        // Redirect to onboarding if authenticated but onboarding not completed
        router.replace("/(auth)/onboarding");
      } else if (user && onboardingCompleted === true && inAuthGroup) {
        // Redirect to tabs if authenticated and onboarding completed
        router.replace("/(tabs)");
      }
    }, 0);
  }, [user, loading, segments, router]);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/register" />
      <Stack.Screen name="(auth)/onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="quiz/[id]" />
      <Stack.Screen name="settings/help-support" />
      <Stack.Screen name="settings/about" />
      <Stack.Screen name="classroom/index" />
      <Stack.Screen name="classroom/create" />
      <Stack.Screen name="classroom/[id]" />
      <Stack.Screen name="student/classrooms" />
      <Stack.Screen name="student/classroom/[id]" />
      <Stack.Screen
        name="modals/search-modal"
        options={{
          presentation: "transparentModal",
          animation: "fade",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookmarkProvider>
          <SearchProvider>
            <RootLayoutNav />
          </SearchProvider>
        </BookmarkProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
