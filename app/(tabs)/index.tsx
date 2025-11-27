"use client";

import { Quiz } from "@/models/quiz";
import { User } from "@/models/user";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBookmarks } from "../../contexts/BookmarkContext";
import { useSearch } from "../../contexts/SearchContext";
import { supabase } from "../../initSupabase";

export default function Home() {
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const { bookmarkedQuizIds, toggleBookmark, refreshBookmarks } = useBookmarks();
  const { filters, hasActiveFilters, clearFilters } = useSearch();
  const insets = useSafeAreaInsets();

  // Fetch current user
  const {
    data: user,
    isLoading: userLoading,
    isRefetching: userRefetching,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
        return data as User;
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch quizzes with filters
  const {
    data: quizzes = [],
    isLoading: loading,
    isRefetching: refreshing,
    refetch: refetchQuizzes,
  } = useQuery({
    queryKey: ["quizzes", filters],
    queryFn: async () => {
      try {
        // Build the query
        let query = supabase
          .from("quizzes")
          .select(
            `
            *,
            creator:creator_id(id, username, profile_photo_url),
            category:category_id(id, category_name),
            difficulty:difficulty_id(id, difficulty_name),
            questions(id, question_text, options)
            `
          )
          .eq("is_public", true);

        // Apply search query filter
        if (filters.query) {
          query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
        }

        const { data, error } = await query.order("created_at", { ascending: false }).limit(100);

        if (error) {
          console.error("Error fetching quizzes:", error);
          return [];
        }

        // Apply client-side filtering for category and difficulty
        let filteredData = data || [];

        if (filters.category && filters.category !== "all") {
          filteredData = filteredData.filter(
            (quiz) => quiz.category?.category_name?.toLowerCase() === filters.category.toLowerCase()
          );
        }

        if (filters.difficulty && filters.difficulty !== "all") {
          filteredData = filteredData.filter(
            (quiz) =>
              quiz.difficulty.difficulty_name?.toLowerCase() === filters.difficulty.toLowerCase()
          );
        }

        return filteredData.slice(0, 20) as Quiz[];
      } catch (error) {
        console.error("Error:", error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  async function handleBookmark(item: Quiz) {
    if (user) {
      await toggleBookmark(item.id, user.id);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "#10b981"; // Green
      case "medium":
        return "#f59e0b"; // Amber
      case "hard":
        return "#ef4444"; // Red
      case "expert":
        return "#8b5cf6"; // Purple
      default:
        return "#94a3b8";
    }
  };

  const renderQuiz = ({ item }: { item: Quiz }) => {
    const isBookmarked = bookmarkedQuizIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() => router.push(`/quiz/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.quizCardHeader}>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor: getDifficultyColor(item.difficulty.difficulty_name) + "15",
              },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: getDifficultyColor(item.difficulty.difficulty_name) },
              ]}
            >
              {item.difficulty.difficulty_name.charAt(0).toUpperCase() +
                item.difficulty.difficulty_name.slice(1)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleBookmark(item);
            }}
            style={isBookmarked ? styles.selectedBookmarkButton : styles.unSelectedBookmarkButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isBookmarked ? "#f59e0b" : "#94a3b8"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.quizContent}>
          <Text style={styles.quizTitle}>{item.title}</Text>
          <Text style={styles.quizDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.creatorInfo}>
            <Ionicons name="person-outline" size={14} color="#94a3b8" />
            <Text style={styles.creatorText}>by {item.creator?.username || "Unknown"}</Text>
          </View>
        </View>

        <View style={styles.categoryTag}>
          <Ionicons name="pricetag" size={12} color="#6366f1" />
          <Text style={styles.categoryText}>{item.category.category_name}</Text>
        </View>

        <View style={styles.quizFooter}>
          <View style={styles.statItem}>
            <Ionicons name="help-circle-outline" size={16} color="#64748b" />
            <Text style={styles.statText}>{item.questions.length} Questions</Text>
          </View>
          <View style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="arrow-forward" size={16} color="#6366f1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={[styles.topSection, { paddingTop: insets.top + 20 }]}>
          <View style={styles.topBar}>
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Ionicons name="flash" size={20} color="#6366f1" />
              </View>
              <Text style={styles.appName}>Sawaal</Text>
            </View>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.profileButton}>
              {user?.profile_photo_url ? (
                <Image source={{ uri: user.profile_photo_url }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons name="person" size={24} color="#6366f1" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.searchContainer}
            activeOpacity={0.7}
            onPress={() => router.push("/modals/search-modal")}
          >
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search quizzes...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {hasActiveFilters() ? "Search Results" : "Popular Quizzes"}
          </Text>
          {hasActiveFilters() ? (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFilterText}>Clear Filters</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>
        {hasActiveFilters() && (
          <View style={styles.activeFiltersContainer}>
            {filters.query && (
              <View style={styles.filterChip}>
                <Ionicons name="search" size={12} color="#6366f1" />
                <Text style={styles.filterChipText}>{filters.query}</Text>
              </View>
            )}
            {filters.category !== "all" && (
              <View style={styles.filterChip}>
                <Ionicons name="pricetag" size={12} color="#6366f1" />
                <Text style={styles.filterChipText}>{filters.category}</Text>
              </View>
            )}
            {filters.difficulty !== "all" && (
              <View style={styles.filterChip}>
                <Ionicons name="speedometer" size={12} color="#6366f1" />
                <Text style={styles.filterChipText}>{filters.difficulty}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="document-text-outline" size={72} color="#6366f1" />
      </View>
      <Text style={styles.emptyTitle}>No quizzes available yet</Text>
      <Text style={styles.emptySubtitle}>Be the first to create a quiz!</Text>
      <TouchableOpacity style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>Create Quiz</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading quizzes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quizzes}
        renderItem={renderQuiz}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetchQuizzes}
            tintColor="#6366f1"
            colors={["#6366f1"]}
          />
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.profileMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push(`/profile/${user?.id}`);
              }}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="person-outline" size={20} color="#6366f1" />
              </View>
              <Text style={styles.menuText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
              }}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="create-outline" size={20} color="#6366f1" />
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={[styles.menuIconContainer, { backgroundColor: "#fee2e2" }]}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.menuText, { color: "#ef4444" }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf5ff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#faf5ff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  listContent: {
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 28,
  },
  topSection: {
    backgroundColor: "#ffffff",
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  appName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#faf5ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ede9fe",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#ede9fe",
  },
  profilePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#c7d2fe",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf5ff",
    borderRadius: 28,
    paddingHorizontal: 18,
    height: 56,
    borderWidth: 2,
    borderColor: "#ede9fe",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 0.3,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6366f1",
    letterSpacing: 0.2,
  },
  clearFilterText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
    letterSpacing: 0.2,
  },
  activeFiltersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: -12,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#ede9fe",
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366f1",
    textTransform: "capitalize",
  },
  quizCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 20,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quizCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  unSelectedBookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fffbeb",
    justifyContent: "center",
    alignItems: "center",
  },
  quizContent: {
    marginBottom: 12,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
    lineHeight: 24,
  },
  quizDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    fontWeight: "500",
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  creatorText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ede9fe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  quizFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ede9fe",
    borderRadius: 16,
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 3,
    borderColor: "#c7d2fe",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "500",
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 110,
    paddingRight: 20,
  },
  profileMenu: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    minWidth: 200,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderRadius: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "600",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 4,
  },
});
