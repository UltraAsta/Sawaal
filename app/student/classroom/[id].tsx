/* eslint-disable react/no-unescaped-entities */
"use client";

import BackButton from "@/components/back-button";
import { Quiz } from "@/models/quiz";
import {
  fetchClassroomById,
  fetchClassroomLeaderboard,
  fetchClassroomQuizzes,
  leaveClassroom,
} from "@/services/classroom";
import { fetchCurrentUser } from "@/services/user";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StudentClassroomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: classroom,
    isLoading,
    isRefetching: refreshingClassroom,
    refetch: refetchClassroom,
  } = useQuery({
    queryKey: ["classroom", id],
    queryFn: () => fetchClassroomById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: classroomQuizzes = [],
    refetch: refetchQuizzes,
  } = useQuery({
    queryKey: ["classroom_quizzes", id],
    queryFn: () => fetchClassroomQuizzes(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: leaderboard = [],
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ["classroom_leaderboard", id],
    queryFn: () => fetchClassroomLeaderboard(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });

  const handleRefresh = async () => {
    await Promise.all([
      refetchClassroom(),
      refetchQuizzes(),
      refetchLeaderboard(),
    ]);
  };

  const handleLeaveClassroom = () => {
    Alert.alert(
      "Leave Classroom",
      "Are you sure you want to leave this classroom? You can rejoin later with the code.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveClassroom(id!, user!.id);
              Alert.alert("Success", "You have left the classroom", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Failed to leave classroom");
            }
          },
        },
      ]
    );
  };

  const handleQuizPress = (quiz: Quiz) => {
    router.push(`/quiz/${quiz.id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!classroom) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Classroom not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#6366f1", "#7c3aed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <BackButton />
          <Text style={styles.headerTitle}>Classroom</Text>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveClassroom}>
            <Ionicons name="exit-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshingClassroom}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Classroom Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="school" size={32} color="#6366f1" />
            </View>
          </View>

          <Text style={styles.classroomName}>{classroom.name}</Text>
          {classroom.description && (
            <Text style={styles.classroomDescription}>{classroom.description}</Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={16} color="#64748b" />
              <Text style={styles.metaText}>Tutor: {classroom.creator.username}</Text>
            </View>
          </View>
        </View>

        {/* Quizzes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quizzes ({classroomQuizzes.length})</Text>
          </View>

          {classroomQuizzes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No quizzes yet</Text>
              <Text style={styles.emptySubtext}>
                Your tutor hasn't added any quizzes to this classroom
              </Text>
            </View>
          ) : (
            <View style={styles.quizzesList}>
              {classroomQuizzes.map((quiz) => (
                <TouchableOpacity
                  key={quiz.id}
                  style={styles.quizCard}
                  onPress={() => handleQuizPress(quiz)}
                  activeOpacity={0.7}
                >
                  <View style={styles.quizCardContent}>
                    <Text style={styles.quizTitle}>{quiz.title}</Text>
                    <Text style={styles.quizDescription} numberOfLines={2}>
                      {quiz.description}
                    </Text>
                    <View style={styles.quizMeta}>
                      {quiz.category && (
                        <View style={styles.badge}>
                          <Ionicons name="folder-outline" size={12} color="#64748b" />
                          <Text style={styles.badgeText}>{quiz.category.category_name}</Text>
                        </View>
                      )}
                      {quiz.difficulty && (
                        <View style={styles.badge}>
                          <Ionicons name="speedometer-outline" size={12} color="#64748b" />
                          <Text style={styles.badgeText}>{quiz.difficulty.difficulty_name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Leaderboard Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
          </View>

          {leaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No data yet</Text>
              <Text style={styles.emptySubtext}>
                Complete quizzes to appear on the leaderboard
              </Text>
            </View>
          ) : (
            <View style={styles.leaderboardList}>
              {leaderboard.map((entry, index) => (
                <View
                  key={entry.student_id}
                  style={[
                    styles.leaderboardItem,
                    entry.student_id === user?.id && styles.leaderboardItemHighlight,
                  ]}
                >
                  <View style={styles.rankContainer}>
                    {index < 3 ? (
                      <Ionicons
                        name="trophy"
                        size={24}
                        color={index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : "#d97706"}
                      />
                    ) : (
                      <Text style={styles.rankText}>#{entry.rank}</Text>
                    )}
                  </View>
                  <Image
                    source={{
                      uri:
                        entry.profile_photo_url ||
                        "https://ui-avatars.com/api/?name=" + entry.username,
                    }}
                    style={styles.leaderboardAvatar}
                  />
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>{entry.username}</Text>
                    <Text style={styles.leaderboardStats}>
                      {entry.quizzes_completed} quiz{entry.quizzes_completed !== 1 ? "zes" : ""}
                    </Text>
                  </View>
                  <View style={styles.pointsContainer}>
                    <Text style={styles.pointsText}>{entry.total_points}</Text>
                    <Text style={styles.pointsLabel}>pts</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  leaveButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  classroomName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  classroomDescription: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#ede9fe",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
  },
  tabTextActive: {
    color: "#6366f1",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },
  quizzesList: {
    gap: 12,
  },
  quizCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quizCardContent: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  quizDescription: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 8,
    lineHeight: 18,
  },
  quizMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  badgeText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  leaderboardList: {
    gap: 12,
  },
  leaderboardItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  leaderboardItemHighlight: {
    borderColor: "#6366f1",
    backgroundColor: "#f5f3ff",
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
  },
  rankText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#64748b",
  },
  leaderboardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e2e8f0",
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  leaderboardStats: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#6366f1",
  },
  pointsLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
});
