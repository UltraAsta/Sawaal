"use client";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LeaderboardUser {
  id: string;
  username: string;
  total_points: number;
  rank: string;
  profile_photo_url?: string;
  position: number;
}

// Mock data for leaderboard
const DUMMY_LEADERBOARD: LeaderboardUser[] = [
  {
    id: "1",
    username: "QuizMaster2024",
    total_points: 15420,
    rank: "Legend",
    position: 1,
  },
  {
    id: "2",
    username: "BrainiacKing",
    total_points: 14850,
    rank: "Master",
    position: 2,
  },
  {
    id: "3",
    username: "TriviaNinja",
    total_points: 13990,
    rank: "Master",
    position: 3,
  },
  {
    id: "4",
    username: "SmartCookie",
    total_points: 12300,
    rank: "Expert",
    position: 4,
  },
  {
    id: "5",
    username: "GeekGenius",
    total_points: 11750,
    rank: "Expert",
    position: 5,
  },
  {
    id: "6",
    username: "PuzzleWhiz",
    total_points: 10500,
    rank: "Expert",
    position: 6,
  },
  {
    id: "7",
    username: "ThinkTank",
    total_points: 9800,
    rank: "Advanced",
    position: 7,
  },
  {
    id: "8",
    username: "QuizWizard",
    total_points: 9200,
    rank: "Advanced",
    position: 8,
  },
  {
    id: "9",
    username: "MindBender",
    total_points: 8750,
    rank: "Advanced",
    position: 9,
  },
  {
    id: "10",
    username: "KnowledgeSeeker",
    total_points: 8100,
    rank: "Intermediate",
    position: 10,
  },
  {
    id: "11",
    username: "You",
    total_points: 7500,
    rank: "Intermediate",
    position: 11,
  },
  {
    id: "12",
    username: "TriviaFan",
    total_points: 6900,
    rank: "Intermediate",
    position: 12,
  },
  {
    id: "13",
    username: "QuizEnthusiast",
    total_points: 6200,
    rank: "Beginner",
    position: 13,
  },
  {
    id: "14",
    username: "CuriousMind",
    total_points: 5500,
    rank: "Beginner",
    position: 14,
  },
  {
    id: "15",
    username: "Learner2024",
    total_points: 4800,
    rank: "Beginner",
    position: 15,
  },
];

const CURRENT_USER_ID = "11"; // The user's position in the leaderboard

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month">("all");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLeaderboard(DUMMY_LEADERBOARD);
      setLoading(false);
    }, 500);
  }, [timeFilter]);

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
      case "Legend":
        return "#f59e0b";
      case "Master":
        return "#8b5cf6";
      case "Expert":
        return "#3b82f6";
      case "Advanced":
        return "#10b981";
      case "Intermediate":
        return "#6366f1";
      default:
        return "#94a3b8";
    }
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardUser }) => {
    const isCurrentUser = item.id === CURRENT_USER_ID;
    const medal = getMedalEmoji(item.position);
    const rankColor = getRankColor(item.rank);

    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.positionContainer}>
          {medal ? (
            <Text style={styles.medalText}>{medal}</Text>
          ) : (
            <Text style={styles.positionText}>#{item.position}</Text>
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
              <Text style={[styles.rankText, { color: rankColor }]}>{item.rank}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{item.total_points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
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

        {/* Time Filter */}
        {/* <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeFilter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setTimeFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === "all" && styles.filterTextActive,
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeFilter === "month" && styles.filterButtonActive,
            ]}
            onPress={() => setTimeFilter("month")}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === "month" && styles.filterTextActive,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeFilter === "week" && styles.filterButtonActive,
            ]}
            onPress={() => setTimeFilter("week")}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === "week" && styles.filterTextActive,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
        </View> */}
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
            {leaderboard[1]?.username}
          </Text>
          <Text style={styles.podiumPoints}>{leaderboard[1]?.total_points.toLocaleString()}</Text>
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
            {leaderboard[0]?.username}
          </Text>
          <Text style={styles.podiumPoints}>{leaderboard[0]?.total_points.toLocaleString()}</Text>
          <View style={[styles.podiumBar, styles.firstPlaceBar]} />
        </View>

        {/* 3rd Place */}
        <View style={styles.podiumPlace}>
          <View style={[styles.podiumAvatar, styles.thirdPlace]}>
            <Ionicons name="person" size={24} color="#6366f1" />
          </View>
          <Text style={styles.podiumMedal}>🥉</Text>
          <Text style={styles.podiumUsername} numberOfLines={1}>
            {leaderboard[2]?.username}
          </Text>
          <Text style={styles.podiumPoints}>{leaderboard[2]?.total_points.toLocaleString()}</Text>
          <View style={[styles.podiumBar, styles.thirdPlaceBar]} />
        </View>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}
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
