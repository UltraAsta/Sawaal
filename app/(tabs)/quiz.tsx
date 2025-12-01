"use client";

import BackButton from "@/components/back-button";
import { Question, QuizCategory, QuizDifficulty } from "@/models/quiz";
import { UserRole } from "@/models/user";
import { fetchCurrentUser } from "@/services/user";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../initSupabase";
import CategoryModal from "../modals/category-modal";

export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<QuizDifficulty>();
  const [isPublic, setIsPublic] = useState(true);
  // const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const insets = useSafeAreaInsets();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["quiz_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_categories").select("*");
      if (error) throw error;
      return data as QuizCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: difficulties = [] } = useQuery({
    queryKey: ["quiz_difficulty"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_difficulty").select("*");
      if (error) throw error;
      return data as QuizDifficulty[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const handleAddQuestion = () => {
    setEditingQuestion({
      id: `temp-${Date.now()}`, // Generate a temporary unique ID
      quiz_id: "", // Provide a default quiz ID
      question_text: "",
      options: [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ],
      correct_answer: "",
      order_index: questions.length, // Set order based on current length
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;

    if (!editingQuestion.question_text.trim()) {
      Alert.alert("Error", "Please enter a question");
      return;
    }

    if (editingQuestion.options!.some((opt) => !opt.text.trim())) {
      Alert.alert("Error", "Please fill in all answer options");
      return;
    }

    const existingIndex = questions.findIndex((q) => q.id === editingQuestion.id);
    if (existingIndex >= 0) {
      const updated = [...questions];
      updated[existingIndex] = editingQuestion;
      setQuestions(updated);
    } else {
      setQuestions([...questions, editingQuestion]);
    }

    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    Alert.alert("Delete Question", "Are you sure you want to delete this question?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setQuestions(questions.filter((q) => q.id !== id)),
      },
    ]);
  };

  const handleCreateQuiz = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a quiz title");
      return;
    }
    if (!category.trim()) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (questions.length === 0) {
      Alert.alert("Error", "Please add at least one question");
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "You must be logged in to create a quiz");
        setLoading(false);
        return;
      }

      // Insert quiz into database
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert([
          {
            creator_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            category_id: category,
            difficulty_id: difficultyLevel?.id,
            is_public: isPublic,
          },
        ])
        .select()
        .single();

      if (quizError) throw quizError;

      // Insert questions
      const questionsData = questions.map((q, index) => ({
        quiz_id: quizData.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        order_index: index,
      }));

      const { error: questionsError } = await supabase.from("questions").insert(questionsData);

      if (questionsError) throw questionsError;

      Alert.alert("Success", "Quiz created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error creating quiz:", error);
      Alert.alert("Error", "Failed to create quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#6366f1", "#7c3aed"]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <BackButton />
          <Text style={styles.headerTitle}>Create Quiz</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 85 }}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="rocket" size={32} color="#6366f1" />
          </View>
          <Text style={styles.heroTitle}>Build Your Quiz</Text>
          <Text style={styles.heroSubtitle}>
            Create engaging quizzes and share them with the world
          </Text>

          {user?.role === UserRole.Tutor ? (
            <TouchableOpacity
              style={styles.classroomButton}
              onPress={() => router.push("/classroom")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#6366f1", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.classroomButtonGradient}
              >
                <Ionicons name="school" size={20} color="#fff" />
                <Text style={styles.classroomButtonText}>My Classrooms</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : user?.role === UserRole.Student ? (
            <TouchableOpacity
              style={styles.classroomButton}
              onPress={() => router.push("/student/classrooms")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#6366f1", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.classroomButtonGradient}
              >
                <Ionicons name="book" size={20} color="#fff" />
                <Text style={styles.classroomButtonText}>My Classrooms</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
          {/* Classroom Button - Only for Tutors */}
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Quiz Title <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="create-outline" size={20} color="#6366f1" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g., World History Challenge"
                value={title}
                onChangeText={setTitle}
                maxLength={255}
                placeholderTextColor="#94a3b8"
              />
            </View>
            <Text style={styles.charCount}>{title.length}/255</Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <View style={[styles.inputWrapper, styles.textareaWrapper]}>
              <View style={[styles.inputIconContainer, styles.textareaIconContainer]}>
                <Ionicons name="document-text-outline" size={20} color="#6366f1" />
              </View>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Describe what your quiz is about..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.7}
            >
              {category ? (
                <>
                  <Text style={styles.categoryButtonText}>
                    {categories.find((c) => c.id === category)?.category_name || category}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#94a3b8"
                    style={styles.chevronIcon}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.categoryButtonPlaceholder}>Select a category</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#94a3b8"
                    style={styles.chevronIcon}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Difficulty Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Difficulty Level <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.difficultyGrid}>
              {difficulties.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.difficultyCard,
                    difficultyLevel?.difficulty_name === level.difficulty_name &&
                      styles.difficultyCardActive,
                  ]}
                  onPress={() => setDifficultyLevel(level)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.difficultyIconContainer,
                      difficultyLevel?.difficulty_name === level.difficulty_name &&
                        styles.difficultyIconContainerActive,
                    ]}
                  >
                    <Ionicons
                      name={
                        level.difficulty_name === "Easy"
                          ? "star-outline"
                          : level.difficulty_name === "Medium"
                          ? "star-half-outline"
                          : level.difficulty_name === "Hard"
                          ? "star"
                          : "sparkles"
                      }
                      size={18}
                      color={
                        difficultyLevel?.difficulty_name === level.difficulty_name
                          ? "#fff"
                          : "#6366f1"
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.difficultyText,
                      difficultyLevel?.difficulty_name === level.difficulty_name &&
                        styles.difficultyTextActive,
                    ]}
                  >
                    {level.difficulty_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Questions Section */}
          <View style={styles.questionsSection}>
            <View style={styles.questionsSectionHeader}>
              <Text style={styles.label}>
                Questions <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity style={styles.addQuestionButton} onPress={handleAddQuestion}>
                <Text style={styles.addQuestionText}>Add Question</Text>
              </TouchableOpacity>
            </View>

            {questions.length === 0 ? (
              <View style={styles.emptyQuestionsCard}>
                <Ionicons name="help-circle-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyQuestionsText}>No questions yet</Text>
                <Text style={styles.emptyQuestionsSubtext}>
                  Add multiple choice questions to your quiz
                </Text>
              </View>
            ) : (
              <View style={styles.questionsList}>
                {questions.map((q, index) => (
                  <View key={q.id} style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                      <View style={styles.questionNumberContainer}>
                        <Text style={styles.questionNumber}>Q{index + 1}</Text>
                      </View>
                      <View style={styles.questionActions}>
                        <TouchableOpacity
                          style={styles.questionActionButton}
                          onPress={() => handleEditQuestion(q)}
                        >
                          <Ionicons name="create-outline" size={18} color="#6366f1" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.questionActionButton}
                          onPress={() => q.id && handleDeleteQuestion(q.id)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.questionText} numberOfLines={2}>
                      {q.question_text}
                    </Text>
                    <View style={styles.questionOptionsPreview}>
                      {q.options!.map((opt, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.optionPreview,
                            opt.id === q.correct_answer && styles.optionPreviewCorrect,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionPreviewText,
                              opt.id === q.correct_answer && styles.optionPreviewTextCorrect,
                            ]}
                            numberOfLines={1}
                          >
                            {String.fromCharCode(65 + idx)}. {opt.text}
                          </Text>
                          {opt.id === q.correct_answer && (
                            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Quiz Settings</Text>

            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: "#ede9fe" }]}>
                  <Ionicons name="globe-outline" size={22} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Public Quiz</Text>
                  <Text style={styles.settingDescription}>Allow anyone to discover and play</Text>
                </View>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: "#e2e8f0", true: "#c7d2fe" }}
                thumbColor={isPublic ? "#6366f1" : "#fff"}
                ios_backgroundColor="#e2e8f0"
              />
            </View>

            {/* <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="sparkles-outline" size={22} color="#f59e0b" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>AI Generated</Text>
                  <Text style={styles.settingDescription}>Mark as created with AI assistance</Text>
                </View>
              </View>
              <Switch
                value={isAiGenerated}
                onValueChange={setIsAiGenerated}
                trackColor={{ false: "#e2e8f0", true: "#fed7aa" }}
                thumbColor={isAiGenerated ? "#f59e0b" : "#fff"}
                ios_backgroundColor="#e2e8f0"
              />
            </View> */}
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateQuiz}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ["#94a3b8", "#94a3b8"] : ["#6366f1", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.createButtonText}>Create Quiz</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <CategoryModal
        visible={showCategoryModal}
        categories={categories}
        selectedCategory={category}
        loading={categoriesLoading}
        onSelect={setCategory}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Question Modal */}
      <Modal
        visible={showQuestionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowQuestionModal(false);
          setEditingQuestion(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.questionModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingQuestion && questions.find((q) => q.id === editingQuestion.id)
                    ? "Edit Question"
                    : "Add Question"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.questionModalScroll}
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Question Input */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Question</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextarea]}
                    placeholder="Enter your question here..."
                    value={editingQuestion?.question_text || ""}
                    onChangeText={(text) =>
                      setEditingQuestion(
                        editingQuestion ? { ...editingQuestion, question_text: text } : null
                      )
                    }
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Options */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Answer Options</Text>
                  <View style={styles.optionInputContainer}>
                    {editingQuestion?.options?.map((option, idx) => (
                      <View key={idx} style={styles.optionInputWrapper}>
                        <View style={styles.optionLabel}>
                          <Text style={styles.optionLabelText}>
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        </View>
                        <TextInput
                          style={styles.optionInput}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          value={option.text}
                          onChangeText={(text) => {
                            if (editingQuestion) {
                              const newOptions = editingQuestion.options
                                ? [...editingQuestion.options]
                                : [];
                              newOptions[idx] = { ...option, text };
                              setEditingQuestion({ ...editingQuestion, options: newOptions });
                            }
                          }}
                          placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity
                          style={[
                            styles.correctAnswerButton,
                            editingQuestion?.correct_answer === option.id &&
                              styles.correctAnswerButtonActive,
                          ]}
                          onPress={() =>
                            setEditingQuestion(
                              editingQuestion
                                ? { ...editingQuestion, correct_answer: option.id }
                                : null
                            )
                          }
                        >
                          <Ionicons
                            name={
                              editingQuestion?.correct_answer === option.id
                                ? "checkmark-circle"
                                : "checkmark-circle-outline"
                            }
                            size={20}
                            color={
                              editingQuestion?.correct_answer === option.id ? "#ffffff" : "#cbd5e1"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.correctAnswerHint}>
                    Tap the checkmark to select the correct answer
                  </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveQuestion}>
                  <LinearGradient
                    colors={["#6366f1", "#7c3aed"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSaveButtonGradient}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.modalSaveButtonText}>Save Question</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf5ff",
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#c7d2fe",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 20,
  },
  classroomButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  classroomButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  classroomButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  formCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ede9fe",
    paddingRight: 16,
    minHeight: 56,
  },
  inputIconContainer: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  charCount: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "right",
    marginTop: 8,
    fontWeight: "600",
  },
  textareaWrapper: {
    alignItems: "flex-start",
    minHeight: 120,
  },
  textareaIconContainer: {
    alignSelf: "flex-start",
  },
  textarea: {
    minHeight: 104,
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: "top",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ede9fe",
    paddingHorizontal: 16,
    minHeight: 56,
  },
  categoryButtonText: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "600",
  },
  categoryButtonPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "500",
  },
  chevronIcon: {
    marginLeft: 8,
  },
  difficultyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  difficultyCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ede9fe",
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  difficultyCardActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  difficultyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  difficultyIconContainerActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: 0.2,
  },
  difficultyTextActive: {
    color: "#fff",
  },
  settingsSection: {
    marginTop: 30,
    marginBottom: 32,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#ede9fe",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  settingDescription: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 18,
  },
  createButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "80%",
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#faf5ff",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryList: {
    flex: 1,
  },
  categoryGrid: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47.5%",
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ede9fe",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    position: "relative",
  },
  categoryCardSelected: {
    backgroundColor: "#ede9fe",
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  categoryNameSelected: {
    color: "#0f172a",
    fontWeight: "700",
  },
  checkmarkContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  categoryLoadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  categoryLoadingText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  categoryEmptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  categoryEmptyText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  questionsSection: {
    marginTop: 24,
  },
  questionsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addQuestionButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addQuestionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyQuestionsCard: {
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ede9fe",
    padding: 32,
    alignItems: "center",
    borderStyle: "dashed",
  },
  emptyQuestionsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
  },
  emptyQuestionsSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  questionsList: {
    gap: 12,
  },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 16,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  questionNumberContainer: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366f1",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  questionActions: {
    flexDirection: "row",
    gap: 8,
  },
  questionActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 22,
    marginBottom: 12,
  },
  questionOptionsPreview: {
    gap: 8,
  },
  optionPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  optionPreviewCorrect: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  optionPreviewText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  optionPreviewTextCorrect: {
    color: "#0f172a",
    fontWeight: "700",
  },
  questionModalContent: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  questionModalScroll: {
    flex: 1,
  },
  modalInputGroup: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  modalTextarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  optionInputContainer: {
    gap: 12,
  },
  optionInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionLabel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366f1",
  },
  optionInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  correctAnswerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  correctAnswerButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  correctAnswerHint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 8,
    fontStyle: "italic",
  },
  modalSaveButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  modalSaveButtonGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  modalSaveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
