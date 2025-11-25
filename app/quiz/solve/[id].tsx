"use client";

import type { Quiz } from "@/models/quiz";
import { fetchQuizById } from "@/models/quiz";
import type { User } from "@/models/user";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../initSupabase";

const { width, height } = Dimensions.get("window");

export default function QuizTakingScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (!isQuizCompleted && quiz) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isQuizCompleted, quiz, startTime]);

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      setUser(data);
    }
  };

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const data = await fetchQuizById(id as string);

      if (!data) {
        throw new Error("Quiz not found");
      }

      setQuiz(data);
      setSelectedAnswers(new Array(data.questions.length).fill(null));
    } catch (error) {
      console.error("Error fetching quiz:", error);
      Alert.alert("Error", "Failed to load quiz. Please try again.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quiz) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleSelectOption = (optionId: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionId;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleBack = () => {
    Alert.alert("Exit Quiz", "Are you sure you want to exit? Your progress will be lost.", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: () => router.back() },
    ]);
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to submit a quiz");
      return;
    }

    // Check if all questions are answered
    const unansweredCount = selectedAnswers.filter((answer) => answer === null).length;
    if (unansweredCount > 0) {
      Alert.alert(
        "Incomplete Quiz",
        `You have ${unansweredCount} unanswered question${
          unansweredCount > 1 ? "s" : ""
        }. Are you sure you want to submit?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Submit Anyway", onPress: () => submitQuiz() },
        ]
      );
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    try {
      setSubmitting(true);

      const correct = calculateCorrectAnswers();
      setCorrectAnswers(correct);
      const pointsEarned = calculateScore();
      const timeTaken = elapsedTime;

      // Save quiz attempt to database
      const { error: attemptError } = await supabase.from("quiz_attempts").upsert(
        {
          user_id: user!.id,
          quiz_id: quiz.id,
          score: pointsEarned,
          total_questions: quiz.questions.length,
          correct_answers: correct,
          points_earned: pointsEarned,
          time_taken: timeTaken,
          answers: selectedAnswers,
        },
        { onConflict: "user_id,quiz_id" }
      );

      if (attemptError) throw attemptError;

      // Update quiz total_attempts count
      const { error: updateError } = await supabase
        .from("quizzes")
        .update({ total_attempts: quiz.total_attempts + 1 })
        .eq("id", quiz.id);

      if (updateError) throw updateError;

      setIsQuizCompleted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      Alert.alert("Error", "Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateCorrectAnswers = () => {
    let correct = 0;
    selectedAnswers.forEach((answer, index) => {
      const question = quiz.questions[index];
      if (answer === question.correct_answer) {
        correct++;
      }
    });
    return correct;
  };

  const calculateScore = () => {
    const correct = calculateCorrectAnswers();

    let score = correct;
    if (correct === quiz.questions.length) {
      // completion bonus
      score += 10;
    }

    // multiplier based on difficulty of the quiz
    switch (quiz.difficulty.difficulty_name.toLowerCase()) {
      case "medium":
        score *= 1.5;
        break;
      case "hard":
        score *= 2.0;
        break;
      case "expert":
        score *= 2.2;
        break;
    }
    return Math.round(score);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    setIsQuizCompleted(false);
    setStartTime(new Date());
    setElapsedTime(0);
  };

  const handleReviewAnswers = () => {
    router.push(`/quiz/review/${id}`);
  };

  if (isQuizCompleted) {
    const percentage = ((correctAnswers / quiz.questions.length) * 100).toFixed(0);

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#7C3AED", "#9333EA", "#A855F7"]} style={styles.gradient}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Quiz Completed!</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Results Card */}
            <BlurView intensity={20} tint="light" style={styles.resultsCard}>
              <LinearGradient
                colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.9)"]}
                style={styles.resultsCardGradient}
              >
                <View style={styles.scoreCircle}>
                  <LinearGradient
                    colors={["#7C3AED", "#A855F7"]}
                    style={styles.scoreCircleGradient}
                  >
                    <Text style={styles.scorePercentage}>{percentage}%</Text>
                    <Text style={styles.scoreLabel}>Score</Text>
                  </LinearGradient>
                </View>

                <Text style={styles.resultsTitle}>
                  {Number(percentage) >= 80
                    ? "Excellent Work!"
                    : Number(percentage) >= 60
                    ? "Good Job!"
                    : "Keep Practicing!"}
                </Text>
                <Text style={styles.resultsSubtitle}>
                  You got {correctAnswers} out of {quiz.questions.length} questions correct
                </Text>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                    <Text style={styles.statValue}>{correctAnswers}</Text>
                    <Text style={styles.statLabel}>Correct</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="close-circle" size={32} color="#EF4444" />
                    <Text style={styles.statValue}>{quiz.questions.length - correctAnswers}</Text>
                    <Text style={styles.statLabel}>Wrong</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="time" size={32} color="#F59E0B" />
                    <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                    <Text style={styles.statLabel}>Time</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity style={styles.reviewButton} onPress={handleReviewAnswers}>
                  <LinearGradient
                    colors={["#7C3AED", "#9333EA"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.reviewButtonText}>Review Answers</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                  <Text style={styles.retakeButtonText}>Retake Quiz</Text>
                </TouchableOpacity>
              </LinearGradient>
            </BlurView>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#7C3AED", "#9333EA", "#A855F7"]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{quiz.title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </Text>
              <Text style={styles.progressPercentage}>{progress.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Question Card */}
          <BlurView intensity={20} tint="light" style={styles.questionCard}>
            <LinearGradient
              colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.9)"]}
              style={styles.questionCardGradient}
            >
              <View style={styles.questionHeader}>
                <View style={styles.questionBadge}>
                  <LinearGradient
                    colors={["#7C3AED", "#A855F7"]}
                    style={styles.questionBadgeGradient}
                  >
                    <Ionicons name="help-circle" size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
              </View>

              <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {currentQuestion.options?.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === option.id;
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                      onPress={() => handleSelectOption(option.id)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={["#7C3AED", "#9333EA"]}
                          style={styles.optionGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <View style={styles.optionContent}>
                            <View style={styles.optionLabelContainer}>
                              <Text style={styles.optionLabelSelected}>{optionLabel}</Text>
                            </View>
                            <Text style={styles.optionTextSelected}>{option.text}</Text>
                            <View style={styles.checkIconContainer}>
                              <Ionicons name="checkmark-circle" size={24} color="#fff" />
                            </View>
                          </View>
                        </LinearGradient>
                      ) : (
                        <View style={styles.optionContent}>
                          <View style={styles.optionLabelContainer}>
                            <Text style={styles.optionLabel}>{optionLabel}</Text>
                          </View>
                          <Text style={styles.optionText}>{option.text}</Text>
                          <View style={styles.checkIconContainer}>
                            <View style={styles.uncheckedCircle} />
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </LinearGradient>
          </BlurView>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={currentQuestionIndex === 0 ? "#999" : "#7C3AED"}
              />
              <Text
                style={[
                  styles.navButtonText,
                  currentQuestionIndex === 0 && styles.navButtonTextDisabled,
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <LinearGradient
                  colors={submitting ? ["#D1D5DB", "#9CA3AF"] : ["#10B981", "#059669"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Submit Quiz</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                disabled={selectedAnswers[currentQuestionIndex] === null}
              >
                <LinearGradient
                  colors={
                    selectedAnswers[currentQuestionIndex] === null
                      ? ["#D1D5DB", "#9CA3AF"]
                      : ["#7C3AED", "#9333EA"]
                  }
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextButtonText}>Next Question</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Question Dots Indicator */}
          <View style={styles.dotsContainer}>
            {quiz.questions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentQuestionIndex && styles.dotActive,
                  selectedAnswers[index] !== null && styles.dotAnswered,
                ]}
              />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#7C3AED",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7C3AED",
  },
  loadingText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
    marginTop: 16,
    letterSpacing: 0.3,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.3,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  questionCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  questionCardGradient: {
    padding: 24,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  questionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  questionBadgeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7C3AED",
    letterSpacing: 0.3,
  },
  questionText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    lineHeight: 32,
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonSelected: {
    borderColor: "transparent",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  optionGradient: {
    padding: 16,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  optionLabelContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  optionLabelSelected: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7C3AED",
    backgroundColor: "#fff",
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: "center",
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    letterSpacing: 0.2,
  },
  optionTextSelected: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  checkIconContainer: {
    marginLeft: 8,
  },
  uncheckedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonDisabled: {
    backgroundColor: "#F3F4F6",
    shadowOpacity: 0,
    elevation: 0,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7C3AED",
    letterSpacing: 0.3,
  },
  navButtonTextDisabled: {
    color: "#999",
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 24,
  },
  dotAnswered: {
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  resultsCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  resultsCardGradient: {
    padding: 32,
    alignItems: "center",
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: "hidden",
    marginBottom: 32,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  scoreCircleGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scorePercentage: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  resultsSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 32,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    letterSpacing: 0.2,
  },
  reviewButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  retakeButton: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7C3AED",
    letterSpacing: 0.3,
  },
});
