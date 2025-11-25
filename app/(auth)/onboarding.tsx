/* eslint-disable react/no-unescaped-entities */
"use client";

import { supabase } from "@/initSupabase";
import type { Student, Tutor } from "@/models/user";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    username: string;
    description: string;
    role: Student | Tutor | "";
  }>({
    username: "",
    description: "",
    role: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roles: { id: Student | Tutor; label: string; icon: string }[] = [
    { id: 1 as Student, label: "Student", icon: "school" },
    { id: 2 as Tutor, label: "Tutor/Teacher", icon: "book" },
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.username && formData.description;
    if (step === 2) return formData.role;
    return false;
  };

  const completeOnboarding = async () => {
    if (!formData.role) {
      Alert.alert("Error", "Please select a role");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "User not found");
        setLoading(false);
        return;
      }

      // Check if username is already taken
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("username", formData.username)
        .single();

      if (existingUser) {
        Alert.alert("Error", "Username is already taken, please choose another one");
        setLoading(false);
        return;
      }

      // If there's an error other than "no rows found", it's a real error
      if (fetchError && fetchError.code !== "PGRST116") {
        Alert.alert("Error", fetchError.message);
        setLoading(false);
        return;
      }

      // Update user profile in the users table
      const { error: updateError } = await supabase
        .from("users")
        .update({
          username: formData.username.trim(),
          bio: formData.description.trim(),
          profile_photo_url: profileImage,
          role: formData.role,
        })
        .eq("id", user.id);

      if (updateError) {
        Alert.alert("Error", updateError.message);
        setLoading(false);
        return;
      }

      // Update auth metadata
      await supabase.auth.updateUser({
        data: {
          username: formData.username.trim(),
          role: formData.role,
          onboarding_completed: true,
        },
      });

      // Success - navigation will be handled by the auth context
    } catch (e: unknown) {
      console.log(e);
      Alert.alert("Error", "Something went wrong, please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#9333ea", "#a855f7", "#c026d3"]} style={styles.container}>
      <View style={styles.backgroundBlur1} />
      <View style={styles.backgroundBlur2} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          {[1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                i === step
                  ? styles.progressBarActive
                  : i < step
                  ? styles.progressBarCompleted
                  : styles.progressBarInactive,
              ]}
            />
          ))}
        </View>

        {/* Main card */}
        <View style={styles.card}>
          {/* Back button */}
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color="#7c3aed" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <View style={styles.header}>
                <LinearGradient colors={["#a855f7", "#c026d3"]} style={styles.iconContainer}>
                  <Ionicons name="sparkles" size={24} color="white" />
                </LinearGradient>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Let's get to know you better</Text>
              </View>

              {/* Profile picture upload */}
              <View style={styles.profileContainer}>
                <View style={styles.profileImageWrapper}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  ) : (
                    <LinearGradient
                      colors={["#f3e8ff", "#fae8ff"]}
                      style={styles.profilePlaceholder}
                    >
                      <Ionicons name="camera-outline" size={48} color="#d8b4fe" />
                    </LinearGradient>
                  )}
                </View>
                <TouchableOpacity onPress={pickImage} style={styles.cameraButton}>
                  <LinearGradient
                    colors={["#a855f7", "#c026d3"]}
                    style={styles.cameraButtonGradient}
                  >
                    <Ionicons name="camera" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    placeholder="JohnDoe"
                    value={formData.username}
                    onChangeText={(text) => setFormData({ ...formData, username: text })}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>About You</Text>
                  <TextInput
                    placeholder="Tell us a bit about yourself..."
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData({ ...formData, description: text.slice(0, 150) })
                    }
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea]}
                    placeholderTextColor="#9ca3af"
                    textAlignVertical="top"
                    maxLength={150}
                  />
                  <Text style={styles.characterCount}>{formData.description.length}/150</Text>
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Role Selection */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Choose Your Role</Text>
                <Text style={styles.subtitle}>What best describes you?</Text>
              </View>

              <View style={styles.rolesContainer}>
                {roles.map((role) => {
                  const isSelected = formData.role === role.id;
                  return (
                    <TouchableOpacity
                      key={role.id}
                      onPress={() => setFormData({ ...formData, role: role.id })}
                      style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                    >
                      <View style={styles.roleContent}>
                        <View
                          style={[
                            styles.roleIconContainer,
                            isSelected && styles.roleIconContainerSelected,
                          ]}
                        >
                          <LinearGradient
                            colors={isSelected ? ["#a855f7", "#c026d3"] : ["#f3f4f6", "#f3f4f6"]}
                            style={styles.roleIconGradient}
                          >
                            <Ionicons
                              name={role.icon as any}
                              size={28}
                              color={isSelected ? "white" : "#4b5563"}
                            />
                          </LinearGradient>
                        </View>
                        <Text style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}>
                          {role.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={() => (step < 2 ? setStep(step + 1) : completeOnboarding())}
            disabled={!canProceed() || loading}
            style={[styles.button, (!canProceed() || loading) && styles.buttonDisabled]}
            activeOpacity={0.8}
          >
            <LinearGradient colors={["#9333ea", "#c026d3"]} style={styles.buttonGradient}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>{step < 2 ? "Continue" : "Get Started"}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundBlur1: {
    position: "absolute",
    left: -80,
    top: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(192, 132, 252, 0.2)",
    opacity: 0.5,
  },
  backgroundBlur2: {
    position: "absolute",
    right: -80,
    bottom: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(232, 121, 249, 0.2)",
    opacity: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressBarActive: {
    width: 48,
    backgroundColor: "white",
  },
  progressBarCompleted: {
    width: 32,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  progressBarInactive: {
    width: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#faf5ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  backButtonText: {
    color: "#7c3aed",
    fontWeight: "600",
    fontSize: 14,
  },
  stepContent: {
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
  profileContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  profileImageWrapper: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "#f3e8ff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profilePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: width / 2 - 84,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cameraButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  characterCount: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 4,
  },
  rolesContainer: {
    flexDirection: "row",
    gap: 16,
  },
  roleCard: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 20,
    position: "relative",
  },
  roleCardSelected: {
    borderColor: "#a855f7",
    backgroundColor: "#faf5ff",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  roleContent: {
    alignItems: "center",
    gap: 12,
  },
  roleIconContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  roleIconContainerSelected: {
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  roleIconGradient: {
    padding: 12,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  roleLabelSelected: {
    color: "#7c3aed",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#a855f7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    marginTop: 32,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
