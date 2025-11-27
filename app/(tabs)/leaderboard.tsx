"use client";

import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LeaderboardUser, UserRank } from "@/models/user";
import { assignRank, fetchCurrentUser, fetchTopLeaderboard } from "@/services/user";

// Mock function to fetch leaderboard data

export default function Leaderboard() {
  const insets = useSafeAreaInsets();

  const {
    data: currentUser,
    isLoading: currentUserLoading,
    isRefetching: isRefetchingCurrentUser,
    refetch: refetchCurrentUser,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch leaderboard data
  const {
    data: leaderboard = [],
    isLoading: loading,
    isRefetching: isRefetchingLeaderboard,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchTopLeaderboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case UserRank.QuizOverlord:
        return "#f59e0b";
      case UserRank.BrainBlaster:
        return "#8b5cf6";
      case UserRank.KnowledgeNinja:
        return "#3b82f6";
      case UserRank.TriviaTitan:
        return "#10b981";
      case UserRank.SmartCookie:
        return "#6366f1";
      default:
        return "#94a3b8";
    }
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardUser; index: number }) => {
    const isCurrentUser = item.user_id === currentUser?.id;
    const position = index + 1;
    const medal = getMedalEmoji(position);
    const rank = assignRank(item.total_points);
    const rankColor = getRankColor(rank);

    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.positionContainer}>
          {medal ? (
            <Text style={styles.medalText}>{medal}</Text>
          ) : (
            <Text style={styles.positionText}>#{position}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons
              name={isCurrentUser ? "person" : "person-outline"}
              size={24}
              color="#6366f1"
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.username, isCurrentUser && styles.currentUsername]}>
              {item.username}
              {isCurrentUser && " (You)"}
            </Text>
            <View style={styles.rankBadge}>
              <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
              <Text style={[styles.rankText, { color: rankColor }]}>{rank}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{item?.total_points?.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  if (loading && !leaderboard!.length) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#6366f1", "#7c3aed"]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Ionicons name="trophy" size={24} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Leaderboard</Text>
          </View>
          <Text style={styles.headerSubtitle}>Compete with the best quiz takers!</Text>
        </View>
      </LinearGradient>

      {/* Top 3 Podium */}
      <View style={styles.podiumContainer}>
        {/* 2nd Place */}
        <View style={styles.podiumPlace}>
          <View style={[styles.podiumAvatar, styles.secondPlace]}>
            <Ionicons name="person" size={28} color="#6366f1" />
          </View>
          <Text style={styles.podiumMedal}>🥈</Text>
          <Text style={styles.podiumUsername} numberOfLines={1}>
            {leaderboard?.[1]?.username}
          </Text>
          <Text style={styles.podiumPoints}>
            {leaderboard?.[1]?.total_points?.toLocaleString()}
          </Text>
          <View style={[styles.podiumBar, styles.secondPlaceBar]} />
        </View>

        {/* 1st Place */}
        <View style={styles.podiumPlace}>
          <View style={[styles.podiumAvatar, styles.firstPlace]}>
            <Ionicons name="person" size={32} color="#f59e0b" />
          </View>
          <View style={styles.crownContainer}>
            <Ionicons name="star" size={16} color="#f59e0b" />
          </View>
          <Text style={styles.podiumMedal}>🥇</Text>
          <Text style={styles.podiumUsername} numberOfLines={1}>
            {leaderboard?.[0]?.username}
          </Text>
          <Text style={styles.podiumPoints}>
            {leaderboard?.[0]?.total_points?.toLocaleString()}
          </Text>
          <View style={[styles.podiumBar, styles.firstPlaceBar]} />
        </View>

        {/* 3rd Place */}
        <View style={styles.podiumPlace}>
          <View style={[styles.podiumAvatar, styles.thirdPlace]}>
            <Ionicons name="person" size={24} color="#6366f1" />
          </View>
          <Text style={styles.podiumMedal}>🥉</Text>
          <Text style={styles.podiumUsername} numberOfLines={1}>
            {leaderboard?.[2]?.username}
          </Text>
          <Text style={styles.podiumPoints}>
            {leaderboard?.[2]?.total_points?.toLocaleString() || "N/A"}
          </Text>
          <View style={[styles.podiumBar, styles.thirdPlaceBar]} />
        </View>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingLeaderboard}
            onRefresh={refetchLeaderboard}
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    // marginBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginLeft: 60,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#fff",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
  filterTextActive: {
    color: "#6366f1",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  podiumPlace: {
    flex: 1,
    alignItems: "center",
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  firstPlace: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  secondPlace: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f1f5f9",
    borderColor: "#94a3b8",
  },
  thirdPlace: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff7ed",
    borderColor: "#fb923c",
  },
  crownContainer: {
    position: "absolute",
    top: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
  },
  podiumMedal: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumUsername: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
    textAlign: "center",
  },
  podiumPoints: {
    fontSize: 16,
    fontWeight: "900",
    color: "#6366f1",
    marginBottom: 8,
  },
  podiumBar: {
    width: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  firstPlaceBar: {
    height: 80,
    backgroundColor: "#fef3c7",
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  secondPlaceBar: {
    height: 60,
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#94a3b8",
  },
  thirdPlaceBar: {
    height: 40,
    backgroundColor: "#fff7ed",
    borderWidth: 2,
    borderColor: "#fb923c",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  currentUserItem: {
    backgroundColor: "#ede9fe",
    borderColor: "#6366f1",
    borderWidth: 2,
    shadowColor: "#6366f1",
    shadowOpacity: 0.15,
  },
  positionContainer: {
    width: 48,
    alignItems: "center",
  },
  positionText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#64748b",
  },
  medalText: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#c7d2fe",
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  currentUsername: {
    color: "#6366f1",
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rankDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
});
