import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Category {
  id: string;
  category_name: string;
}

interface CategoryModalProps {
  visible: boolean;
  categories: Category[];
  selectedCategory: string;
  loading: boolean;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}

export default function CategoryModal({
  visible,
  categories,
  selectedCategory,
  loading,
  onSelect,
  onClose,
}: CategoryModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.categoryLoadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.categoryLoadingText}>Loading categories...</Text>
              </View>
            ) : categories.length === 0 ? (
              <View style={styles.categoryEmptyContainer}>
                <Ionicons name="file-tray-outline" size={48} color="#cbd5e1" />
                <Text style={styles.categoryEmptyText}>No categories available</Text>
              </View>
            ) : (
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      selectedCategory === cat.id && styles.categoryCardSelected,
                    ]}
                    onPress={() => {
                      onSelect(cat.id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryName,
                        selectedCategory === cat.id && styles.categoryNameSelected,
                      ]}
                    >
                      {cat.category_name}
                    </Text>
                    {selectedCategory === cat.id && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
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
    height: "80%",
    paddingTop: 24,
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
    paddingBottom: 40,
  },
  categoryGrid: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryCard: {
    width: "47%",
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ede9fe",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    position: "relative",
    marginRight: "3%",
    marginBottom: 12,
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
  },
  categoryLoadingText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 16,
  },
  categoryEmptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryEmptyText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 12,
  },
});
