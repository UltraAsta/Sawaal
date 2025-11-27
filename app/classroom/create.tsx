"use client";

import BackButton from "@/components/back-button";
import { UserRole } from "@/models/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreateClassroom() {
  const insets = useSafeAreaInsets();

  // TODO: Replace with actual user from context/query
  const userRole = UserRole.Tutor; // Mock - should come from auth context

  const [classroomName, setClassroomName] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("ABC123"); // Mock auto-generated code
  const [selectedQuizCount, setSelectedQuizCount] = useState(0);

  // Role-based access control - redirect if not tutor
  if (userRole !== UserRole.Tutor) {
    Alert.alert("Access Denied", "Only tutors can create classrooms");
    router.back();
    return null;
  }

  const generateJoinCode = () => {
    // Mock function - will implement random generation later
    const codes = ["XYZ789", "QWE456", "RTY123", "UIO987", "ASD654"];
    setJoinCode(codes[Math.floor(Math.random() * codes.length)]);
  };

  const handleSelectQuizzes = () => {
    // TODO: Open quiz selector modal
    Alert.alert("Coming Soon", "Quiz selection will be implemented");
  };

  const handleCreateClassroom = () => {
    // TODO: Implement classroom creation logic
    if (!classroomName.trim()) {
      Alert.alert("Error", "Please enter a classroom name");
      return;
    }
    Alert.alert("Success", "Classroom creation will be implemented");
  };

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
          <Text style={styles.headerTitle}>Create Classroom</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Icon */}
          <View style={styles.heroSection}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="school" size={48} color="#6366f1" />
            </View>
            <Text style={styles.heroTitle}>New Classroom</Text>
            <Text style={styles.heroSubtitle}>
              Create a classroom to organize quizzes for your students
            </Text>
          </View>

          {/* Classroom Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classroom Details</Text>

            {/* Classroom Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Classroom Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="bookmark"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Python Basics 2024"
                  placeholderTextColor="#94a3b8"
                  value={classroomName}
                  onChangeText={setClassroomName}
                  maxLength={50}
                />
              </View>
              <Text style={styles.hint}>{classroomName.length}/50 characters</Text>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe what students will learn in this classroom..."
                  placeholderTextColor="#94a3b8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.hint}>{description.length}/200 characters</Text>
            </View>
          </View>

          {/* Access Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Access Settings</Text>

            <View style={styles.joinCodeCard}>
              <View style={styles.joinCodeHeader}>
                <View style={styles.joinCodeIconContainer}>
                  <Ionicons name="key" size={24} color="#6366f1" />
                </View>
                <View style={styles.joinCodeInfo}>
                  <Text style={styles.joinCodeLabel}>Join Code</Text>
                  <Text style={styles.joinCodeSubtext}>
                    Students will use this code to join
                  </Text>
                </View>
              </View>

              <View style={styles.joinCodeDisplay}>
                <Text style={styles.joinCodeText}>{joinCode}</Text>
                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={generateJoinCode}
                >
                  <Ionicons name="refresh" size={18} color="#6366f1" />
                  <Text style={styles.regenerateText}>Regenerate</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.joinCodeTip}>
                <Ionicons name="information-circle" size={16} color="#94a3b8" />
                <Text style={styles.joinCodeTipText}>
                  Share this code with your students to let them join
                </Text>
              </View>
            </View>
          </View>

          {/* Quiz Assignment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz Assignment (Optional)</Text>

            <TouchableOpacity
              style={styles.selectQuizzesButton}
              onPress={handleSelectQuizzes}
              activeOpacity={0.7}
            >
              <View style={styles.selectQuizzesIcon}>
                <Ionicons name="add-circle" size={24} color="#6366f1" />
              </View>
              <View style={styles.selectQuizzesContent}>
                <Text style={styles.selectQuizzesTitle}>Add Quizzes</Text>
                <Text style={styles.selectQuizzesSubtext}>
                  Select quizzes to include in this classroom
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>

            {selectedQuizCount > 0 && (
              <View style={styles.selectedQuizzesBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.selectedQuizzesText}>
                  {selectedQuizCount} {selectedQuizCount === 1 ? "quiz" : "quizzes"}{" "}
                  selected
                </Text>
              </View>
            )}

            <View style={styles.infoCard}>
              <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
              <Text style={styles.infoText}>
                You can add quizzes now or add them later from the classroom page
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateClassroom}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#6366f1", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create Classroom</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#c7d2fe",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    marginTop: 6,
  },
  joinCodeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  joinCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  joinCodeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  joinCodeInfo: {
    flex: 1,
  },
  joinCodeLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  joinCodeSubtext: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  joinCodeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#faf5ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  joinCodeText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#6366f1",
    letterSpacing: 2,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#ede9fe",
  },
  regenerateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366f1",
  },
  joinCodeTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  joinCodeTipText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    flex: 1,
  },
  selectQuizzesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    gap: 12,
    marginBottom: 12,
  },
  selectQuizzesIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  selectQuizzesContent: {
    flex: 1,
  },
  selectQuizzesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  selectQuizzesSubtext: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  selectedQuizzesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#d1fae5",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  selectedQuizzesText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  infoText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "500",
    flex: 1,
    lineHeight: 16,
  },
  actionSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  createButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
});
