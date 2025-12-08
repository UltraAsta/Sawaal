"use client";

import BackButton from "@/components/back-button";
import type { Comment, Quiz, Vote } from "@/models/quiz";
import type { User } from "@/models/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../initSupabase";

export default function QuizDetailsPage() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [voteCounts, setVoteCounts] = useState({ upvotes: 0, downvotes: 0 });
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchQuizDetails();
    fetchComments();
    fetchVotes();
    checkUserAttempt();
  }, [id]);

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      setUser(data);
    }
  };

  const fetchQuizDetails = async () => {
    try {
      const { data, error } = await supabase
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
        .eq("id", id)
        .single();

      if (error) throw error;
      setQuiz(data);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      Alert.alert("Error", "Failed to load quiz details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          quiz_id,
          user_id,
          comment_text,
          created_at,
          user:user_id(id, username, profile_photo_url)
        `
        )
        .eq("quiz_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from("votes")
        .select("id, quiz_id, user_id, vote_type, created_at")
        .eq("quiz_id", id);

      if (error) throw error;

      setVotes(data || []);

      const upvotes = data?.filter((v) => v.vote_type === "upvote").length || 0;
      const downvotes = data?.filter((v) => v.vote_type === "downvote").length || 0;
      setVoteCounts({ upvotes, downvotes });

      if (user) {
        const userVoteData = data?.find((v) => v.user_id === user.id);
        setUserVote(userVoteData?.vote_type || null);
      }
    } catch (error) {
      console.error("Error fetching votes:", error);
    }
  };

  const checkUserAttempt = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setHasAttempted(false);
        return;
      }

      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("quiz_id", id)
        .eq("user_id", authUser.id)
        .limit(1);

      if (error) {
        console.error("Error checking user attempt:", error);
        setHasAttempted(false);
        return;
      }

      const attempted = data && data.length > 0;
      console.log("Has attempted quiz:", attempted, "User ID:", authUser.id, "Quiz ID:", id);
      setHasAttempted(attempted);
    } catch (error) {
      console.error("Error checking user attempt:", error);
      setHasAttempted(false);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to vote");
      return;
    }

    if (!hasAttempted) {
      Alert.alert("Can't Vote Yet", "You need to attempt this quiz before you can vote on it");
      return;
    }

    try {
      const existingVote = votes.find((v) => v.user_id === user.id);

      // Optimistically update UI immediately
      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Removing vote
          setUserVote(null);
          setVoteCounts((prev) => ({
            ...prev,
            [voteType === "upvote" ? "upvotes" : "downvotes"]:
              prev[voteType === "upvote" ? "upvotes" : "downvotes"] - 1,
          }));
        } else {
          // Switching vote type
          setUserVote(voteType);
          setVoteCounts((prev) => ({
            upvotes: voteType === "upvote" ? prev.upvotes + 1 : prev.upvotes - 1,
            downvotes: voteType === "downvote" ? prev.downvotes + 1 : prev.downvotes - 1,
          }));
        }
      } else {
        // Adding new vote
        setUserVote(voteType);
        setVoteCounts((prev) => ({
          ...prev,
          [voteType === "upvote" ? "upvotes" : "downvotes"]:
            prev[voteType === "upvote" ? "upvotes" : "downvotes"] + 1,
        }));
      }

      // Perform database operation in background
      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          const { error } = await supabase.from("votes").delete().eq("id", existingVote.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("votes")
            .update({ vote_type: voteType })
            .eq("id", existingVote.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("votes")
          .insert({ quiz_id: id, user_id: user.id, vote_type: voteType });
        if (error) throw error;
      }

      // Refresh votes to sync with server
      fetchVotes();
    } catch (error) {
      console.error("Error voting:", error);
      Alert.alert("Error", "Failed to submit vote");
      // Refresh to get correct state from server
      fetchVotes();
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to comment");
      return;
    }

    if (!commentText.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      setSubmittingComment(true);
      const { error } = await supabase.from("comments").insert({
        quiz_id: id,
        user_id: user.id,
        comment_text: commentText.trim(),
      });

      if (error) throw error;

      setCommentText("");
      fetchComments();
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", "Failed to submit comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuizDetails();
    fetchComments();
    fetchVotes();
    checkUserAttempt();
  };

  const getDifficultyColor = (difficulty: string) => {
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
  };

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";

    return Math.floor(seconds) + "s ago";
  };

  if (loading) {
    return (
      <LinearGradient colors={["#faf5ff", "#f3e8ff"]} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading quiz details...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Quiz not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Gradient Header Background */}
      <LinearGradient
        colors={["#7c3aed", "#6366f1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <BackButton />
          <Text style={styles.headerTitle}>Quiz Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(quiz.difficulty.difficulty_name) },
              ]}
            >
              <Text style={styles.difficultyText}>{quiz.difficulty.difficulty_name}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag" size={14} color="#fff" />
              <Text style={styles.categoryText}>{quiz.category.category_name}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{quiz.title}</Text>
          <Text style={styles.heroDescription}>{quiz.description}</Text>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Ionicons name="help-circle-outline" size={20} color="#fff" />
              <Text style={styles.quickStatText}>{quiz.questions.length} Questions</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Ionicons name="people-outline" size={20} color="#fff" />
              <Text style={styles.quickStatText}>{} Attempts</Text>
            </View>
          </View>

          {/* Creation Date */}
          <View style={styles.creationDateBadge}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.creationDateText}>
              Created {new Date(quiz.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
        }
      >
        {/* Creator Card */}
        <View style={styles.creatorSection}>
          <View style={styles.creatorCard}>
            {quiz.creator.profile_photo_url ? (
              <Image
                source={{ uri: quiz.creator.profile_photo_url }}
                style={styles.creatorAvatar}
              />
            ) : (
              <LinearGradient colors={["#7c3aed", "#6366f1"]} style={styles.creatorAvatarGradient}>
                <Ionicons name="person" size={28} color="#fff" />
              </LinearGradient>
            )}
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorLabel}>Created by</Text>
              <Text style={styles.creatorName}>{quiz.creator.username}</Text>
            </View>
            <View style={styles.creatorBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          </View>
        </View>

        {/* Voting Section */}
        <View style={styles.votingSection}>
          <Text style={styles.sectionTitle}>How was this quiz?</Text>
          {!hasAttempted && (
            <Text style={styles.votingHint}>
              Complete this quiz to vote and share your feedback
            </Text>
          )}
          <View style={styles.votingContainer}>
            <TouchableOpacity
              style={[
                styles.voteCard,
                userVote === "upvote" && styles.voteCardActiveUp,
                !hasAttempted && styles.voteCardDisabled,
              ]}
              onPress={() => handleVote("upvote")}
              activeOpacity={0.7}
              disabled={!hasAttempted}
            >
              <View
                style={[styles.voteIconContainer, userVote === "upvote" && styles.voteIconActiveUp]}
              >
                <Ionicons
                  name={userVote === "upvote" ? "thumbs-up" : "thumbs-up-outline"}
                  size={28}
                  color={userVote === "upvote" ? "#fff" : "#10b981"}
                />
              </View>
              <Text style={[styles.voteLabel, userVote === "upvote" && styles.voteLabelActive]}>
                Helpful
              </Text>
              <View
                style={[
                  styles.voteCountBadge,
                  userVote === "upvote" && styles.voteCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.voteCountNumber,
                    userVote === "upvote" && styles.voteCountNumberActive,
                  ]}
                >
                  {voteCounts.upvotes}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.voteCard,
                userVote === "downvote" && styles.voteCardActiveDown,
                !hasAttempted && styles.voteCardDisabled,
              ]}
              onPress={() => handleVote("downvote")}
              activeOpacity={0.7}
              disabled={!hasAttempted}
            >
              <View
                style={[
                  styles.voteIconContainer,
                  userVote === "downvote" && styles.voteIconActiveDown,
                ]}
              >
                <Ionicons
                  name={userVote === "downvote" ? "thumbs-down" : "thumbs-down-outline"}
                  size={28}
                  color={userVote === "downvote" ? "#fff" : "#ef4444"}
                />
              </View>
              <Text style={[styles.voteLabel, userVote === "downvote" && styles.voteLabelActive]}>
                Needs Work
              </Text>
              <View
                style={[
                  styles.voteCountBadge,
                  userVote === "downvote" && styles.voteCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.voteCountNumber,
                    userVote === "downvote" && styles.voteCountNumberActive,
                  ]}
                >
                  {voteCounts.downvotes}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsSectionHeader}>
            <Text style={styles.sectionTitle}>Discussion</Text>
            <View style={styles.commentsCountBadge}>
              <Text style={styles.commentsCountText}>{comments.length}</Text>
            </View>
          </View>

          {comments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color="#c7d2fe" />
              </View>
              <Text style={styles.emptyStateTitle}>No comments yet</Text>
              <Text style={styles.emptyStateText}>Start the conversation!</Text>
            </View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    {comment.user.profile_photo_url ? (
                      <Image
                        source={{ uri: comment.user.profile_photo_url }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <LinearGradient
                        colors={["#7c3aed", "#6366f1"]}
                        style={styles.commentAvatarGradient}
                      >
                        <Ionicons name="person" size={16} color="#fff" />
                      </LinearGradient>
                    )}
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentUsername}>{comment.user.username}</Text>
                      <Text style={styles.commentTime}>{getTimeSince(comment.created_at)}</Text>
                    </View>
                  </View>
                  <Text style={styles.commentText}>{comment.comment_text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Comment Input */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.commentInputRow}>
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your thoughts..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || submittingComment) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submittingComment}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={commentText.trim() ? ["#7c3aed", "#6366f1"] : ["#e2e8f0", "#cbd5e1"]}
              style={styles.sendButtonGradient}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Start Quiz Button */}
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={() => router.push(`/quiz/solve/${id}`)}
        >
          <LinearGradient
            colors={["#7c3aed", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <View style={styles.startButtonContent}>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Start Quiz Now</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#7c3aed",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    fontWeight: "700",
    marginTop: 16,
  },
  headerGradient: {
    paddingBottom: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerPlaceholder: {
    width: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 12,
    lineHeight: 36,
    letterSpacing: 0.3,
  },
  heroDescription: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: "500",
  },
  quickStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  quickStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  quickStatText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  creationDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    alignSelf: "center",
  },
  creationDateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  creatorSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  creatorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    gap: 14,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3e8ff",
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#ede9fe",
  },
  creatorAvatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ede9fe",
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  creatorName: {
    fontSize: 17,
    color: "#0f172a",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  creatorBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  votingSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  votingHint: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  votingContainer: {
    flexDirection: "row",
    gap: 14,
  },
  voteCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  voteCardActiveUp: {
    backgroundColor: "#f0fdf4",
    borderColor: "#10b981",
  },
  voteCardActiveDown: {
    backgroundColor: "#fef2f2",
    borderColor: "#ef4444",
  },
  voteCardDisabled: {
    opacity: 0.5,
    backgroundColor: "#f8fafc",
  },
  voteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  voteIconActiveUp: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  voteIconActiveDown: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  voteLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.3,
  },
  voteLabelActive: {
    color: "#0f172a",
  },
  voteCountBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 48,
    alignItems: "center",
  },
  voteCountBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  voteCountNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  voteCountNumberActive: {
    color: "#0f172a",
  },
  commentsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  commentsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  commentsCountBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  commentsCountText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7c3aed",
  },
  commentsList: {
    gap: 12,
  },
  commentCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#ede9fe",
  },
  commentAvatarGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ede9fe",
  },
  commentMeta: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  commentTime: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  commentText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    fontWeight: "500",
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 48,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f1f5f9",
    borderStyle: "dashed",
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#faf5ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  bottomContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 12,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  commentInputWrapper: {
    flex: 1,
  },
  commentInput: {
    backgroundColor: "#faf5ff",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0f172a",
    borderWidth: 2,
    borderColor: "#ede9fe",
    maxHeight: 100,
    fontWeight: "500",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  startButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonGradient: {
    paddingVertical: 20,
  },
  startButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  startButtonText: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
