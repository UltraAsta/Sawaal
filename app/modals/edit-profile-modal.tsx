"use client";

import { User } from "@/models/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../initSupabase";

interface EditProfileModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProfileModal({
  visible,
  user,
  onClose,
  onSuccess,
}: EditProfileModalProps) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(
    user?.profile_photo_url || null
  );
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePickImage = async () => {
    try {
      // Check current permissions
      const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== "granted") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable photo library access in your device settings to change your profile photo.",
          [{ text: "OK" }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image: " + (error.message || "Unknown error"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    if (!user) return;

    try {
      // Create file name
      const fileExt = uri.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update user profile with new photo URL
      const { error: updateError } = await supabase
        .from("users")
        .update({
          profile_photo_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfilePhotoUri(urlData.publicUrl);
      Alert.alert("Success", "Profile photo updated successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      Alert.alert("Error", error.message || "Failed to upload photo");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate username
    if (!username.trim()) {
      Alert.alert("Error", "Username is required");
      return;
    }

    if (username.length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters long");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert("Error", "Username can only contain letters, numbers, and underscores");
      return;
    }

    setLoading(true);

    try {
      // Update user profile
      const { error } = await supabase
        .from("users")
        .update({
          username: username.trim(),
          bio: bio.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          Alert.alert("Error", "This username is already taken");
        } else {
          Alert.alert("Error", error.message);
        }
        return;
      }

      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => {
            onSuccess();
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 20 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Profile Picture Section */}
              <View style={styles.section}>
                <View style={styles.avatarSection}>
                  {profilePhotoUri ? (
                    <Image source={{ uri: profilePhotoUri }} style={styles.avatar} />
                  ) : (
                    <LinearGradient colors={["#6366f1", "#7c3aed"]} style={styles.avatar}>
                      <Ionicons name="person" size={48} color="#fff" />
                    </LinearGradient>
                  )}
                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={handlePickImage}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <ActivityIndicator size="small" color="#6366f1" />
                    ) : (
                      <>
                        <Ionicons name="camera" size={16} color="#6366f1" />
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Username */}
              <View style={styles.section}>
                <Text style={styles.label}>
                  Username <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="at"
                    size={20}
                    color="#94a3b8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter username"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    maxLength={30}
                  />
                </View>
                <Text style={styles.hint}>
                  {username.length}/30 characters
                </Text>
              </View>

              {/* Email (Read-only) */}
              <View style={styles.section}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputContainer, styles.disabledInput]}>
                  <Ionicons
                    name="mail"
                    size={20}
                    color="#94a3b8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.disabledText]}
                    value={user?.email}
                    editable={false}
                  />
                  <Ionicons name="lock-closed" size={16} color="#94a3b8" />
                </View>
                <Text style={styles.hint}>Email cannot be changed</Text>
              </View>

              {/* Bio */}
              <View style={styles.section}>
                <Text style={styles.label}>Bio</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor="#94a3b8"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>
                <Text style={styles.hint}>{bio.length}/200 characters</Text>
              </View>

              {/* Save Button */}
              <View style={styles.buttonSection}>
                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ["#94a3b8", "#64748b"] : ["#6366f1", "#7c3aed"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    flex: 1,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#ede9fe",
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
  label: {
    fontSize: 15,
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
  disabledInput: {
    backgroundColor: "#f8fafc",
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
  disabledText: {
    color: "#94a3b8",
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
  buttonSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    shadowOpacity: 0.1,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
});
