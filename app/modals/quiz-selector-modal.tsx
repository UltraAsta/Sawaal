import { Quiz } from "@/models/quiz";
import { fetchCreatorQuizzes } from "@/services/quiz";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface QuizSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (quizzes: Quiz[]) => void;
  creatorId: string;
  selectedQuizIds?: string[];
}

export default function QuizSelectorModal({
  visible,
  onClose,
  onSelect,
  creatorId,
  selectedQuizIds = [],
}: QuizSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedQuizIds);

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["creator_quizzes", creatorId],
    queryFn: () => fetchCreatorQuizzes(creatorId),
    enabled: visible && !!creatorId,
    staleTime: 2 * 60 * 1000,
  });

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleQuizSelection = (quizId: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(quizId) ? prev.filter((id) => id !== quizId) : [...prev, quizId]
    );
  };

  const handleConfirm = () => {
    const selected = quizzes.filter((quiz) => localSelectedIds.includes(quiz.id));
    onSelect(selected);
    onClose();
  };

  const handleClose = () => {
    setLocalSelectedIds(selectedQuizIds);
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Quizzes</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your quizzes..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Selected Count */}
          {localSelectedIds.length > 0 && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#6366f1" />
              <Text style={styles.selectedText}>
                {localSelectedIds.length} {localSelectedIds.length === 1 ? "quiz" : "quizzes"}{" "}
                selected
              </Text>
            </View>
          )}

          {/* Quiz List */}
          <ScrollView style={styles.quizList} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading your quizzes...</Text>
              </View>
            ) : filteredQuizzes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>
                  {searchQuery ? "No quizzes found" : "No quizzes created yet"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery
                    ? "Try a different search term"
                    : "Create a quiz first to add it to your classroom"}
                </Text>
              </View>
            ) : (
              filteredQuizzes.map((quiz) => {
                const isSelected = localSelectedIds.includes(quiz.id);
                return (
                  <TouchableOpacity
                    key={quiz.id}
                    style={[styles.quizCard, isSelected && styles.quizCardSelected]}
                    onPress={() => toggleQuizSelection(quiz.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quizCardLeft}>
                      <View
                        style={[styles.quizCheckbox, isSelected && styles.quizCheckboxSelected]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </View>
                      <View style={styles.quizInfo}>
                        <Text style={styles.quizTitle} numberOfLines={2}>
                          {quiz.title}
                        </Text>
                        <View style={styles.quizMeta}>
                          {quiz.category && (
                            <View style={styles.metaItem}>
                              <Ionicons name="folder-outline" size={12} color="#64748b" />
                              <Text style={styles.metaText}>{quiz.category.category_name}</Text>
                            </View>
                          )}
                          {quiz.difficulty && (
                            <View style={styles.metaItem}>
                              <Ionicons name="speedometer-outline" size={12} color="#64748b" />
                              <Text style={styles.metaText}>{quiz.difficulty.difficulty_name}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                localSelectedIds.length === 0 && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={localSelectedIds.length === 0}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>
                Confirm Selection ({localSelectedIds.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    paddingTop: 24,
    paddingBottom: 20,
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#faf5ff",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 20,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    paddingVertical: 12,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#ede9fe",
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366f1",
  },
  quizList: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  quizCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    padding: 16,
    marginBottom: 12,
  },
  quizCardSelected: {
    backgroundColor: "#ede9fe",
    borderColor: "#6366f1",
  },
  quizCardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  quizCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  quizCheckboxSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    lineHeight: 20,
  },
  quizMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  actionButtons: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366f1",
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
});
