"use client";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearch } from "../contexts/SearchContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CATEGORIES = [
  { id: "all", name: "All", icon: "apps" as const },
  { id: "science", name: "Science", icon: "flask" as const },
  { id: "history", name: "History", icon: "time" as const },
  { id: "geography", name: "Geography", icon: "earth" as const },
  { id: "math", name: "Math", icon: "calculator" as const },
  { id: "tech", name: "Tech", icon: "laptop" as const },
  { id: "sports", name: "Sports", icon: "football" as const },
];

const DIFFICULTY_FILTERS = [
  { id: "all", name: "All Levels", color: "#94a3b8" },
  { id: "easy", name: "Easy", color: "#10b981" },
  { id: "medium", name: "Medium", color: "#f59e0b" },
  { id: "hard", name: "Hard", color: "#ef4444" },
];

const TRENDING_SEARCHES = ["JavaScript Basics", "World History", "Science Facts", "Math Puzzles"];

const RECENT_SEARCHES = ["React Native", "Geography Quiz", "Space Science"];

export default function SearchModal() {
  const { setSearchQuery, setCategory, setDifficulty } = useSearch();
  const [localQuery, setLocalQuery] = useState("");
  const [localCategory, setLocalCategory] = useState("all");
  const [localDifficulty, setLocalDifficulty] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const insets = useSafeAreaInsets();

  // Animation values
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [backdropAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 9,
      }),
    ]).start();

    // Auto-focus the search input after animation
    const timer = setTimeout(() => {
      // Keyboard will show automatically due to autoFocus on TextInput
    }, 400);

    return () => clearTimeout(timer);
  }, [backdropAnim, scaleAnim, slideAnim]);

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 65,
        friction: 9,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const applyFilters = () => {
    // Apply all filters to context
    setSearchQuery(localQuery);
    setCategory(localCategory);
    setDifficulty(localDifficulty);
    // Close modal and navigate back to home
    handleClose();
  };

  const handleTrendingSearch = (query: string) => {
    setLocalQuery(query);
    // Don't apply immediately, just update local state
  };

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContent,
          {
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.modalInner}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Search Quizzes</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for quizzes, topics, or creators..."
                  placeholderTextColor="#94a3b8"
                  value={localQuery}
                  onChangeText={setLocalQuery}
                  returnKeyType="search"
                  onSubmitEditing={applyFilters}
                  autoFocus={true}
                />
                {localQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setLocalQuery("")} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Ionicons name="options" size={20} color="#6366f1" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      localCategory === category.id && styles.categoryCardActive,
                    ]}
                    onPress={() => setLocalCategory(category.id)}
                  >
                    <View
                      style={[
                        styles.categoryIconContainer,
                        localCategory === category.id && styles.categoryIconActive,
                      ]}
                    >
                      <Ionicons
                        name={category.icon}
                        size={20}
                        color={localCategory === category.id ? "#fff" : "#6366f1"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        localCategory === category.id && styles.categoryNameActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Difficulty Filter */}
            {showFilters && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Difficulty</Text>
                <View style={styles.difficultyContainer}>
                  {DIFFICULTY_FILTERS.map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty.id}
                      style={[
                        styles.difficultyChip,
                        localDifficulty === difficulty.id && {
                          backgroundColor: difficulty.color + "15",
                          borderColor: difficulty.color,
                        },
                      ]}
                      onPress={() => setLocalDifficulty(difficulty.id)}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          localDifficulty === difficulty.id && { color: difficulty.color },
                        ]}
                      >
                        {difficulty.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Trending Searches */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trending Searches</Text>
                <Ionicons name="trending-up" size={18} color="#6366f1" />
              </View>
              <View style={styles.tagsContainer}>
                {TRENDING_SEARCHES.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.trendingTag}
                    onPress={() => handleTrendingSearch(search)}
                  >
                    <Ionicons name="flame" size={14} color="#f59e0b" />
                    <Text style={styles.trendingText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Searches */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentContainer}>
                {RECENT_SEARCHES.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentItem}
                    onPress={() => handleTrendingSearch(search)}
                  >
                    <View style={styles.recentLeft}>
                      <Ionicons name="time-outline" size={18} color="#64748b" />
                      <Text style={styles.recentText}>{search}</Text>
                    </View>
                    <Ionicons name="arrow-up-outline" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Popular Creators */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Creators</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.creatorsContainer}>
                {[1, 2, 3].map((creator) => (
                  <View key={creator} style={styles.creatorCard}>
                    <View style={styles.creatorInfo}>
                      <View style={styles.creatorAvatar}>
                        <Ionicons name="person" size={24} color="#6366f1" />
                      </View>
                      <View style={styles.creatorDetails}>
                        <Text style={styles.creatorName}>Creator {creator}</Text>
                        <Text style={styles.creatorStats}>
                          <Ionicons name="document-text" size={12} color="#94a3b8" /> 24 Quizzes
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.followButton}>
                      <LinearGradient
                        colors={["#6366f1", "#7c3aed"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.followButtonGradient}
                      >
                        <Text style={styles.followButtonText}>Follow</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Search Tips */}
            <View style={[styles.section, styles.tipsSection]}>
              <View style={styles.tipCard}>
                <View style={styles.tipIcon}>
                  <Ionicons name="bulb" size={24} color="#f59e0b" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Search Tips</Text>
                  <Text style={styles.tipText}>
                    Try searching by topic, difficulty level, or creator name to find the perfect
                    quiz for you!
                  </Text>
                </View>
              </View>
            </View>

            {/* Search Button */}
            <View style={[styles.section, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity style={styles.searchButton} onPress={applyFilters}>
                <LinearGradient
                  colors={["#6366f1", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.searchButtonGradient}
                >
                  <Ionicons name="search" size={20} color="#fff" />
                  <Text style={styles.searchButtonText}>Apply Filters & Search</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "transparent",
  },
  modalInner: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
  categoriesContainer: {
    gap: 12,
    paddingRight: 20,
  },
  categoryCard: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#f1f5f9",
    minWidth: 90,
  },
  categoryCardActive: {
    backgroundColor: "#ede9fe",
    borderColor: "#6366f1",
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIconActive: {
    backgroundColor: "#6366f1",
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  categoryNameActive: {
    color: "#6366f1",
  },
  difficultyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  difficultyChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  trendingTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  trendingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  recentContainer: {
    gap: 8,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  recentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  recentText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  creatorsContainer: {
    gap: 12,
  },
  creatorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  creatorStats: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  followButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  followButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
    gap: 16,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    fontWeight: "500",
  },
  searchButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  searchButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
