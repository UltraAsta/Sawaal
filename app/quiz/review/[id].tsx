"use client";

import type { Quiz, QuizAttempt } from "@/models/quiz";
import { fetchQuizAttemptByUserAndQuiz, fetchQuizById } from "@/services/quiz";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../initSupabase";

export default function QuizReviewScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    fetchQuizAndAttempt();
  }, [id]);

  const fetchQuizAndAttempt = async () => {
    try {
      setLoading(true);

      // Fetch quiz details
      const quizData = await fetchQuizById(id as string);
      setQuiz(quizData);

      // Fetch the latest attempt for this quiz
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const attemptData = await fetchQuizAttemptByUserAndQuiz(user.id, id as string);
        setAttempt(attemptData);
      }
    } catch (error) {
      console.error("Error fetching quiz and attempt:", error);
      Alert.alert("Error", "Failed to load quiz review. Please try again.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quiz) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading review...</Text>
      </View>
    );
  }

  if (!attempt) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>No attempt found for this quiz</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const userAnswer = attempt.answers[currentQuestionIndex];
  const correctAnswer = currentQuestion.correct_answer;
  const isCorrect = userAnswer === correctAnswer;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnswerStatus = (optionId: string) => {
    if (optionId === correctAnswer && optionId === userAnswer) {
      return "correct-selected"; // User selected correct answer
    }
    if (optionId === correctAnswer) {
      return "correct"; // Correct answer but not selected
    }
    if (optionId === userAnswer) {
      return "wrong-selected"; // User selected wrong answer
    }
    return "default";
  };

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
            <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Review Answers</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.statText}>
                {attempt.correct_answers}/{attempt.total_questions}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="#F59E0B" />
              <Text style={styles.statText}>{formatTime(attempt.time_taken)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={20} color="#FBBF24" />
              <Text style={styles.statText}>{attempt.points_earned} pts</Text>
            </View>
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
              <LinearGradient
                colors={["#fff", "#f3f4f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progress}%` }]}
              />
            </View>
          </View>

          {/* Question Card */}
          <BlurView intensity={20} tint="light" style={styles.questionCard}>
            <LinearGradient colors={["#FFFFFF", "#F9FAFB"]} style={styles.questionCardGradient}>
              {/* Result Badge */}
              <View style={styles.resultBadgeContainer}>
                {isCorrect ? (
                  <View style={[styles.resultBadge, styles.correctBadge]}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={[styles.resultBadgeText, styles.correctBadgeText]}>
                      Correct Answer
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.resultBadge, styles.wrongBadge]}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={[styles.resultBadgeText, styles.wrongBadgeText]}>
                      Wrong Answer
                    </Text>
                  </View>
                )}
              </View>

              {/* Question Header */}
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
                  const status = getAnswerStatus(option.id);
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D

                  return (
                    <View
                      key={option.id}
                      style={[
                        styles.optionButton,
                        status === "correct-selected" && styles.optionButtonCorrect,
                        status === "correct" && styles.optionButtonCorrectNotSelected,
                        status === "wrong-selected" && styles.optionButtonWrong,
                      ]}
                    >
                      {status === "correct-selected" || status === "correct" ? (
                        <LinearGradient
                          colors={["#10B981", "#059669"]}
                          style={styles.optionGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <View style={styles.optionLabelContainerSelected}>
                            <Text style={styles.optionLabelSelected}>{optionLabel}</Text>
                          </View>
                          <Text style={styles.optionTextSelected}>{option.text}</Text>
                          <View style={styles.checkIconContainer}>
                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                          </View>
                        </LinearGradient>
                      ) : status === "wrong-selected" ? (
                        <LinearGradient
                          colors={["#EF4444", "#DC2626"]}
                          style={styles.optionGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <View style={styles.optionLabelContainerSelected}>
                            <Text style={styles.optionLabelSelected}>{optionLabel}</Text>
                          </View>
                          <Text style={styles.optionTextSelected}>{option.text}</Text>
                          <View style={styles.checkIconContainer}>
                            <Ionicons name="close-circle" size={24} color="#fff" />
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
                    </View>
                  );
                })}
              </View>

              {/* Explanation Section */}
              {!isCorrect && userAnswer === null && (
                <View style={styles.explanationCard}>
                  <View style={styles.explanationHeader}>
                    <Ionicons name="information-circle" size={20} color="#F59E0B" />
                    <Text style={styles.explanationTitle}>Not Answered</Text>
                  </View>
                  <Text style={styles.explanationText}>
                    You didn't answer this question. The correct answer is highlighted above.
                  </Text>
                </View>
              )}
            </LinearGradient>
          </BlurView>

          {/* Navigation */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentQuestionIndex === 0 ? "#9CA3AF" : "#fff"}
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
              <TouchableOpacity style={styles.finishButton} onPress={() => router.back()}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.finishButtonText}>Finish Review</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <LinearGradient
                  colors={["#7C3AED", "#9333EA"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Question Dots Indicator */}
          <View style={styles.dotsContainer}>
            {quiz.questions.map((_, index) => {
              const questionAnswer = attempt.answers[index];
              const questionCorrect = questionAnswer === quiz.questions[index].correct_answer;

              return (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentQuestionIndex && styles.dotActive,
                    questionCorrect ? styles.dotCorrect : styles.dotWrong,
                  ]}
                />
              );
            })}
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
  errorText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#7C3AED",
    fontWeight: "700",
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
    marginBottom: 20,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  statText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
  },
  questionCardGradient: {
    padding: 24,
  },
  resultBadgeContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
  },
  correctBadge: {
    backgroundColor: "#D1FAE5",
  },
  wrongBadge: {
    backgroundColor: "#FEE2E2",
  },
  resultBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  correctBadgeText: {
    color: "#10B981",
  },
  wrongBadgeText: {
    color: "#EF4444",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  questionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  questionBadgeGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.3,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 28,
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  optionsContainer: {
    gap: 14,
  },
  optionButton: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  optionButtonCorrect: {
    borderColor: "#10B981",
  },
  optionButtonCorrectNotSelected: {
    borderColor: "#10B981",
    borderWidth: 3,
  },
  optionButtonWrong: {
    borderColor: "#EF4444",
  },
  optionGradient: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
  },
  optionLabelContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabelContainerSelected: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#475569",
    letterSpacing: 0.3,
  },
  optionLabelSelected: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  optionTextSelected: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  checkIconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uncheckedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  explanationCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400E",
    letterSpacing: 0.3,
  },
  explanationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#78350F",
    lineHeight: 20,
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
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  navButtonDisabled: {
    backgroundColor: "rgba(156, 163, 175, 0.2)",
    borderColor: "rgba(156, 163, 175, 0.3)",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  navButtonTextDisabled: {
    color: "#D1D5DB",
  },
  nextButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  finishButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
    paddingHorizontal: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#fff",
  },
  dotCorrect: {
    backgroundColor: "#10B981",
  },
  dotWrong: {
    backgroundColor: "#EF4444",
  },
});
