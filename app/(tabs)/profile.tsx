"use client";

import { fetchUserQuizAttempts, fetchUserQuizzes } from "@/services/quiz";
import { assignRank, fetchCurrentUser } from "@/services/user";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EditProfileModal from "../modals/edit-profile-modal";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch current user
  const {
    data: user,
    isLoading: userLoading,
    isRefetching: userRefetching,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's created quizzes
  const { data: createdQuizzes = [] } = useQuery({
    queryKey: ["userQuizzes", user?.id],
    queryFn: () => fetchUserQuizzes(user!.id),
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });

  // Fetch user's quiz attempts
  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["userQuizAttempts", user?.id],
    queryFn: () => fetchUserQuizAttempts(user!.id),
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });

  // Calculate stats (excluding practice quizzes)
  const totalPoints = quizAttempts
    .filter((attempt) => !attempt.quiz?.is_practice)
    .reduce((sum, attempt) => sum + (attempt.points_earned || 0), 0);
  const userRank = assignRank(totalPoints);
  const quizzesCompleted = quizAttempts.filter((attempt) => !attempt.quiz?.is_practice).length;
  const quizzesCreated = createdQuizzes.length;

  const handleLogout = async () => {
    const { supabase } = await import("@/initSupabase");
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    refetchUser();
  };

  if (userLoading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 85 }}
      refreshControl={
        <RefreshControl
          refreshing={userRefetching}
          onRefresh={refetchUser}
          tintColor="#6366f1"
          colors={["#6366f1"]}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="person" size={20} color="#6366f1" />
            </View>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
          <TouchableOpacity onPress={handleEditProfile} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          {user?.profile_photo_url ? (
            <Image source={{ uri: user.profile_photo_url }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={["#6366f1", "#7c3aed"]} style={styles.avatar}>
              <Ionicons name="person" size={32} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.username}>@{user?.username || "User"}</Text>
            <View style={styles.rankBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.rankText}>{userRank}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="star" size={20} color="#6366f1" />
          </View>
          <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          </View>
          <Text style={styles.statValue}>{quizzesCompleted}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="add-circle" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>{quizzesCreated}</Text>
          <Text style={styles.statLabel}>Created</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/(tabs)/library")}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="create-outline" size={24} color="#6366f1" />
            </View>
            <Text style={styles.quickActionText}>My Quizzes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/(tabs)/leaderboard")}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="trophy-outline" size={24} color="#6366f1" />
            </View>
            <Text style={styles.quickActionText}>Leaderboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/(tabs)/library")}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="bookmark-outline" size={24} color="#6366f1" />
            </View>
            <Text style={styles.quickActionText}>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/(tabs)/library")}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="time-outline" size={24} color="#6366f1" />
            </View>
            <Text style={styles.quickActionText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={18} color="#6366f1" />
            </View>
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#6366f1" />
            </View>
            <Text style={styles.menuItemText}>Privacy & Security</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/settings/help-support")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="help-circle-outline" size={18} color="#6366f1" />
            </View>
            <Text style={styles.menuItemText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/settings/about")}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="information-circle-outline" size={18} color="#6366f1" />
            </View>
            <Text style={styles.menuItemText}>About Sawaal</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
        </Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        user={user || null}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />
    </ScrollView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "700",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingBottom: 24,
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
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f59e0b",
  },
  statsSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF5656",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fee2e2",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  footer: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: "#cbd5e1",
    fontWeight: "500",
  },
});
