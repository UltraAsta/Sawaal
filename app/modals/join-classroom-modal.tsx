import { joinClassroomByCode } from "@/services/classroom";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface JoinClassroomModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export default function JoinClassroomModal({ visible, onClose, userId }: JoinClassroomModalProps) {
  const [code, setCode] = useState("");
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: (classroomCode: string) => joinClassroomByCode(userId, classroomCode),
    onSuccess: (classroom) => {
      Alert.alert("Success", `You have joined ${classroom.name}!`, [
        {
          text: "OK",
          onPress: () => {
            setCode("");
            onClose();
            queryClient.invalidateQueries({ queryKey: ["student_classrooms", userId] });
          },
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to join classroom");
    },
  });

  const handleJoin = () => {
    if (!code.trim()) {
      Alert.alert("Error", "Please enter a classroom code");
      return;
    }

    Keyboard.dismiss();
    joinMutation.mutate(code.trim().toUpperCase());
  };

  const handleClose = () => {
    setCode("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="enter" size={24} color="#6366f1" />
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Join Classroom</Text>
          <Text style={styles.subtitle}>Enter the classroom code provided by your tutor</Text>

          {/* Code Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="key" size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Enter code (e.g., ABC123)"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              editable={!joinMutation.isPending}
            />
          </View>

          {/* Join Button */}
          <TouchableOpacity
            style={[styles.joinButton, joinMutation.isPending && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={joinMutation.isPending}
            activeOpacity={0.8}
          >
            {joinMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.joinButtonText}>Join Classroom</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: 2,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
});
