"use client";

import BackButton from "@/components/back-button";
import { Classroom } from "@/models/classroom";
import { Quiz } from "@/models/quiz";
import { UserRole } from "@/models/user";
import {
  addQuizzesToClassroom,
  deleteClassroom,
  fetchClassroomById,
  fetchClassroomQuizzes,
  removeQuizFromClassroom,
  updateClassroom,
} from "@/services/classroom";
import { fetchCurrentUser } from "@/services/user";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QuizSelectorModal from "../modals/quiz-selector-modal";

export default function ClassroomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [showQuizSelector, setShowQuizSelector] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: classroom,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["classroom", id],
    queryFn: () => fetchClassroomById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: classroomQuizzes = [], refetch: refetchQuizzes } = useQuery({
    queryKey: ["classroom_quizzes", id],
    queryFn: () => fetchClassroomQuizzes(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const handleEdit = () => {
    setEditedName(classroom?.name || "");
    setEditedDescription(classroom?.description || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName("");
    setEditedDescription("");
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      Alert.alert("Error", "Classroom name is required");
      return;
    }

    try {
      await updateClassroom(id!, {
        name: editedName.trim(),
        description: editedDescription.trim(),
      });

      Alert.alert("Success", "Classroom updated successfully");
      setIsEditing(false);
      refetch();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to update classroom");
    }
  };

  const handleAddQuizzes = () => {
    setShowQuizSelector(true);
  };

  const handleQuizSelection = async (quizzes: Quiz[]) => {
    try {
      const existingQuizIds = classroomQuizzes.map((q) => q.id);
      const newQuizzes = quizzes.filter((q) => !existingQuizIds.includes(q.id));

      if (newQuizzes.length === 0) {
        Alert.alert("Info", "All selected quizzes are already in this classroom");
        return;
      }

      const newQuizIds = newQuizzes.map((quiz) => quiz.id);
      await addQuizzesToClassroom(id!, newQuizIds);

      Alert.alert("Success", `Added ${newQuizzes.length} quiz(zes) to classroom`);
      refetchQuizzes();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to add quizzes to classroom");
    }
  };

  const handleRemoveQuiz = async (quizId: string) => {
    Alert.alert("Remove Quiz", "Are you sure you want to remove this quiz from the classroom?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeQuizFromClassroom(id!, quizId);

            Alert.alert("Success", "Quiz removed from classroom");
            refetchQuizzes();
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to remove quiz");
          }
        },
      },
    ]);
  };

  const handleDeleteClassroom = () => {
    Alert.alert(
      "Delete Classroom",
      "Are you sure you want to delete this classroom? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClassroom(id!);

              Alert.alert("Success", "Classroom deleted successfully", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Failed to delete classroom");
            }
          },
        },
      ]
    );
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

  const isOwner = user?.id === classroom.creator.id;

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
          <BackButton color="#fff" />
          <Text style={styles.headerTitle}>Classroom</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Classroom Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="school" size={32} color="#6366f1" />
            </View>
            {isOwner && !isEditing && (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Ionicons name="pencil" size={18} color="#6366f1" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Classroom Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter classroom name"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  placeholder="Enter description"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.classroomName}>{classroom.name}</Text>
              {classroom.description && (
                <Text style={styles.classroomDescription}>{classroom.description}</Text>
              )}

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="key" size={16} color="#64748b" />
                  <Text style={styles.metaText}>Code: {classroom.code}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar" size={16} color="#64748b" />
                  <Text style={styles.metaText}>
                    {new Date(classroom.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Quizzes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quizzes ({classroomQuizzes.length})</Text>
            {isOwner && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddQuizzes}>
                <Ionicons name="add-circle" size={20} color="#6366f1" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {classroomQuizzes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No quizzes yet</Text>
              <Text style={styles.emptySubtext}>
                {isOwner
                  ? "Add quizzes to this classroom to get started"
                  : "The tutor hasn't added any quizzes yet"}
              </Text>
            </View>
          ) : (
            <View style={styles.quizzesList}>
              {classroomQuizzes.map((quiz) => (
                <View key={quiz.id} style={styles.quizCard}>
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
                  {isOwner && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveQuiz(quiz.id)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Danger Zone */}
        {isOwner && (
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClassroom}>
              <Ionicons name="trash" size={20} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete Classroom</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Quiz Selector Modal */}
      <QuizSelectorModal
        visible={showQuizSelector}
        onClose={() => setShowQuizSelector(false)}
        onSelect={handleQuizSelection}
        creatorId={user?.id || ""}
        selectedQuizIds={classroomQuizzes.map((q) => q.id)}
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
  placeholder: {
    width: 40,
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
    marginBottom: 24,
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#ede9fe",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366f1",
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748b",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  section: {
    marginBottom: 24,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#ede9fe",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366f1",
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
    alignItems: "flex-start",
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
  removeButton: {
    padding: 4,
  },
  dangerZone: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#fee2e2",
    marginTop: 12,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ef4444",
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 2,
    borderColor: "#fee2e2",
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
  },
});
