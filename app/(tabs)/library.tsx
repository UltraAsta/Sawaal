"use client";

import { Quiz, QuizAttemptWithQuiz } from "@/models/quiz";
import { fetchSavedQuizzes, fetchUserQuizAttempts, fetchUserQuizzes } from "@/services/quiz";
import { fetchCurrentUser } from "@/services/user";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyQuizzes() {
  const [selectedTab, setSelectedTab] = useState<"created" | "attempted" | "saved">("created");
  const insets = useSafeAreaInsets();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch created quizzes
  const {
    data: createdQuizzes = [],
    isRefetching: createdRefetching,
    refetch: refetchCreated,
  } = useQuery({
    queryKey: ["userQuizzes", user?.id],
    queryFn: () => fetchUserQuizzes(user!.id),
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch saved quizzes
  const {
    data: savedQuizzes = [],
    isRefetching: savedRefetching,
    refetch: refetchSaved,
  } = useQuery({
    queryKey: ["savedQuizzes", user?.id],
    queryFn: () => fetchSavedQuizzes(user!.id),
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });

  // Fetch attempted quizzes
  const {
    data: attemptedQuizzes = [],
    isRefetching: attemptedRefetching,
    refetch: refetchAttempted,
  } = useQuery({
    queryKey: ["userQuizAttempts", user?.id],
    queryFn: () => fetchUserQuizAttempts(user!.id),
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });

  // Determine refreshing state based on selected tab
  const refreshing =
    selectedTab === "created"
      ? createdRefetching
      : selectedTab === "saved"
      ? savedRefetching
      : attemptedRefetching;

  // Handle pull-to-refresh
  const handleRefresh = () => {
    switch (selectedTab) {
      case "created":
        refetchCreated();
        break;
      case "saved":
        refetchSaved();
        break;
      case "attempted":
        refetchAttempted();
        break;
    }
  };

  function getDifficultyColor(difficulty: string) {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "#10b981";
      case "medium":
        return "#f59e0b";
      case "hard":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  }

  const renderCreatedQuiz = ({ item }: { item: Quiz }) => (
    <TouchableOpacity
      style={styles.quizCard}
      onPress={() => router.push(`/quiz/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.quizCardHeader}>
        <View style={styles.quizBadges}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty.difficulty_name) + "15" },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: getDifficultyColor(item.difficulty.difficulty_name) },
              ]}
            >
              {item.difficulty.difficulty_name}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.is_public ? "#10b98115" : "#94a3b815" },
            ]}
          >
            <Ionicons
              name={item.is_public ? "globe-outline" : "lock-closed-outline"}
              size={12}
              color={item.is_public ? "#10b981" : "#94a3b8"}
            />
            <Text style={[styles.statusText, { color: item.is_public ? "#10b981" : "#94a3b8" }]}>
              {item.is_public ? "Public" : "Private"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={(e) => {
            e.stopPropagation();
            // Add menu functionality later
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.quizContent}>
        <Text style={styles.quizTitle}>{item.title}</Text>
        <Text style={styles.quizDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.categoryTag}>
        <Ionicons name="pricetag" size={12} color="#6366f1" />
        <Text style={styles.categoryText}>{item.category.category_name}</Text>
      </View>

      <View style={styles.quizStats}>
        <View style={styles.statItem}>
          <Ionicons name="help-circle-outline" size={16} color="#64748b" />
          <Text style={styles.statText}>{item.questions.length} Questions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#64748b" />
          <Text style={styles.statText}>{item.total_attempts} Attempts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color="#6366f1" />
          <Text style={styles.statText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.quizActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            // Navigate to edit page
            Alert.alert("Edit", "Edit functionality coming soon!");
          }}
        >
          <Ionicons name="create-outline" size={18} color="#6366f1" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/quiz/${item.id}`);
          }}
        >
          <Ionicons name="eye-outline" size={18} color="#6366f1" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert("Share", "Share functionality coming soon!");
          }}
        >
          <Ionicons name="share-social-outline" size={18} color="#6366f1" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderAttemptedQuiz = ({ item }: { item: QuizAttemptWithQuiz }) => {
    const percentage = ((item.correct_answers / item.total_questions) * 100).toFixed(0);
    const difficultyColor = getDifficultyColor(item.quiz.difficulty.difficulty_name);

    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() => router.push(`/quiz/review/${item.quiz_id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.quizCardHeader}>
          <View style={styles.quizBadges}>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + "15" }]}>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                {item.quiz.difficulty.difficulty_name}
              </Text>
            </View>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{percentage}%</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.quizContent}>
          <Text style={styles.quizTitle}>{item.quiz.title}</Text>
          <Text style={styles.quizDescription} numberOfLines={2}>
            {item.quiz.description}
          </Text>
          <View style={styles.creatorInfo}>
            <Ionicons name="person-outline" size={14} color="#94a3b8" />
            <Text style={styles.creatorText}>by {item.quiz.creator.username}</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={["#6366f1", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${percentage}%` as any }]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.correct_answers}/{item.total_questions} Correct
          </Text>
        </View>

        <View style={styles.quizFooter}>
          <Text style={styles.dateText}>
            <Ionicons name="time-outline" size={14} color="#94a3b8" />{" "}
            {new Date(item.completed_at).toLocaleDateString()}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/quiz/solve/${item.quiz_id}`);
            }}
          >
            <LinearGradient
              colors={["#6366f1", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.retryText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSavedQuiz = ({ item }: { item: Quiz }) => (
    <TouchableOpacity
      style={styles.quizCard}
      onPress={() => router.push(`/quiz/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.quizCardHeader}>
        <View style={styles.quizBadges}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty.difficulty_name) + "15" },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: getDifficultyColor(item.difficulty.difficulty_name) },
              ]}
            >
              {item.difficulty.difficulty_name}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={(e) => {
            e.stopPropagation();
            // Bookmark is already active - could add remove functionality here
            Alert.alert("Saved", "This quiz is in your saved list!");
          }}
        >
          <Ionicons name="bookmark" size={20} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      <View style={styles.quizContent}>
        <Text style={styles.quizTitle}>{item.title}</Text>
        <Text style={styles.quizDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.creatorInfo}>
          <Ionicons name="person-outline" size={14} color="#94a3b8" />
          <Text style={styles.creatorText}>by {item.creator.username}</Text>
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
        <TouchableOpacity
          style={styles.startButton}
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/quiz/${item.id}`);
          }}
        >
          <LinearGradient
            colors={["#6366f1", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startText}>Start Quiz</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    const emptyStates = {
      created: {
        icon: "create-outline" as const,
        title: "No Quizzes Created Yet",
        subtitle: "Start creating your first quiz!",
        buttonText: "Create Quiz",
        buttonIcon: "add" as const,
      },
      attempted: {
        icon: "document-text-outline" as const,
        title: "No Quiz Attempts",
        subtitle: "Start attempting quizzes to track your progress",
        buttonText: "Browse Quizzes",
        buttonIcon: "search" as const,
      },
      saved: {
        icon: "bookmark-outline" as const,
        title: "No Saved Quizzes",
        subtitle: "Save quizzes you want to attempt later",
        buttonText: "Discover Quizzes",
        buttonIcon: "compass" as const,
      },
    };

    const state = emptyStates[selectedTab];

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name={state.icon} size={64} color="#6366f1" />
        </View>
        <Text style={styles.emptyTitle}>{state.title}</Text>
        <Text style={styles.emptySubtitle}>{state.subtitle}</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => {
            if (selectedTab === "created") {
              router.push("/(tabs)/quiz");
            } else {
              router.push("/(tabs)");
            }
          }}
        >
          <LinearGradient
            colors={["#6366f1", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name={state.buttonIcon} size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>{state.buttonText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const getData = () => {
    switch (selectedTab) {
      case "created":
        return createdQuizzes;
      case "attempted":
        return attemptedQuizzes;
      case "saved":
        return savedQuizzes;
      default:
        return [];
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    switch (selectedTab) {
      case "created":
        return renderCreatedQuiz({ item });
      case "attempted":
        return renderAttemptedQuiz({ item });
      case "saved":
        return renderSavedQuiz({ item });
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="folder-open" size={20} color="#6366f1" />
            </View>
            <Text style={styles.headerTitle}>My Quizzes</Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push("/search-modal")}
          >
            <Ionicons name="search" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "created" && styles.tabActive]}
            onPress={() => setSelectedTab("created")}
          >
            <Ionicons
              name="create"
              size={18}
              color={selectedTab === "created" ? "#6366f1" : "#94a3b8"}
            />
            <Text style={[styles.tabText, selectedTab === "created" && styles.tabTextActive]}>
              Created
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "attempted" && styles.tabActive]}
            onPress={() => setSelectedTab("attempted")}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={selectedTab === "attempted" ? "#6366f1" : "#94a3b8"}
            />
            <Text style={[styles.tabText, selectedTab === "attempted" && styles.tabTextActive]}>
              Attempted
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "saved" && styles.tabActive]}
            onPress={() => setSelectedTab("saved")}
          >
            <Ionicons
              name="bookmark"
              size={18}
              color={selectedTab === "saved" ? "#6366f1" : "#94a3b8"}
            />
            <Text style={[styles.tabText, selectedTab === "saved" && styles.tabTextActive]}>
              Saved
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quiz List */}
      <FlatList
        data={getData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
          getData().length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
            colors={["#6366f1"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
  },
  tabTextActive: {
    color: "#6366f1",
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  quizCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
  quizBadges: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fffbeb",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#6366f1",
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
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
  quizStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#e2e8f0",
  },
  statText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  quizActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  actionText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "700",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  quizFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  retryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  retryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },
  startButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  startText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: "#c7d2fe",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "800",
  },
});
