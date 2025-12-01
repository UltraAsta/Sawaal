"use client";

import BackButton from "@/components/back-button";
import { Classroom } from "@/models/classroom";
import { UserRole } from "@/models/user";
import {
  countStudentsClassroom,
  fetchClassroomQuizzes,
  fetchUserClassrooms,
} from "@/services/classroom";
import { fetchCurrentUser } from "@/services/user";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Helper component to fetch and display student count for a classroom
function ClassroomStudentCount({ classroomId }: { classroomId: string }) {
  const { data: count = 0 } = useQuery({
    queryKey: ["studentCount", classroomId],
    queryFn: () => countStudentsClassroom(classroomId),
    staleTime: 2 * 60 * 1000,
  });

  return <Text style={styles.metaText}>{count} students</Text>;
}

// Helper component to fetch and display quiz count for a classroom
function ClassroomQuizCount({ classroomId }: { classroomId: string }) {
  const { data: quizzes = [] } = useQuery({
    queryKey: ["classroom_quizzes", classroomId],
    queryFn: () => fetchClassroomQuizzes(classroomId),
    staleTime: 2 * 60 * 1000,
  });

  return <Text style={styles.metaText}>{quizzes.length} quizzes</Text>;
}

export default function ClassroomList() {
  const insets = useSafeAreaInsets();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: classrooms = [],
    isLoading: loadingClassrooms,
    isRefetching: refreshingClassrooms,
    refetch: refetchClassrooms,
  } = useQuery({
    queryKey: ["my_classrooms", user?.id],
    queryFn: () => fetchUserClassrooms(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  if (loadingUser || !user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (user.role !== UserRole.Tutor) {
    Alert.alert("Access Denied", "Only tutors can view classrooms");
    router.back();
    return null;
  }

  const handleCreateClassroom = () => {
    router.push("/classroom/create");
  };

  const handleClassroomPress = (classroom: Classroom) => {
    router.push(`/classroom/${classroom.id}`);
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
          <Text style={styles.headerTitle}>My Classrooms</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshingClassrooms}
            onRefresh={refetchClassrooms}
            tintColor="#6366f1"
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="school" size={40} color="#6366f1" />
          </View>
          <Text style={styles.heroTitle}>Your Classrooms</Text>
          <Text style={styles.heroSubtitle}>Manage your classrooms and track student progress</Text>

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
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create New Classroom</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Classrooms List */}
        {loadingClassrooms ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading classrooms...</Text>
          </View>
        ) : classrooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Classrooms Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first classroom to start organizing quizzes for your students
            </Text>
          </View>
        ) : (
          <View style={styles.classroomsList}>
            {classrooms.map((classroom) => (
              <TouchableOpacity
                key={classroom.id}
                style={styles.classroomCard}
                onPress={() => handleClassroomPress(classroom)}
                activeOpacity={0.7}
              >
                <View style={styles.classroomHeader}>
                  <View style={styles.classroomIconContainer}>
                    <Ionicons name="school" size={24} color="#6366f1" />
                  </View>
                  <View style={styles.classroomInfo}>
                    <Text style={styles.classroomName} numberOfLines={1}>
                      {classroom.name}
                    </Text>
                    {classroom.description && (
                      <Text style={styles.classroomDescription} numberOfLines={2}>
                        {classroom.description}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.classroomFooter}>
                  <View style={styles.codeContainer}>
                    <Ionicons name="key" size={14} color="#6366f1" />
                    <Text style={styles.codeText}>{classroom.code}</Text>
                  </View>
                  <View style={styles.classroomMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="people" size={14} color="#64748b" />
                      <ClassroomStudentCount classroomId={classroom.id} />
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="document-text" size={14} color="#64748b" />
                      <ClassroomQuizCount classroomId={classroom.id} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
    width: 90,
    height: 90,
    borderRadius: 45,
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
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  classroomsList: {
    gap: 16,
    paddingVertical: 8,
  },
  classroomCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  classroomHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },
  classroomIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  classroomInfo: {
    flex: 1,
  },
  classroomName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  classroomDescription: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 18,
  },
  classroomFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ede9fe",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  codeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6366f1",
    letterSpacing: 1,
  },
  classroomMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
});
