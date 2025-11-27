"use client";

import BackButton from "@/components/back-button";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEAM_MEMBERS = [
  {
    role: "Founder & Lead Developer",
    name: "Sawaal Team",
    icon: "person" as const,
  },
];

const FEATURES = [
  {
    icon: "create" as const,
    title: "Create Quizzes",
    description: "Design engaging quizzes with multiple choice questions",
  },
  {
    icon: "trophy" as const,
    title: "Earn Ranks",
    description: "Progress through ranks as you complete more quizzes",
  },
  {
    icon: "people" as const,
    title: "Compete",
    description: "Challenge friends and climb the leaderboard",
  },
  {
    icon: "library" as const,
    title: "Explore",
    description: "Discover thousands of quizzes on various topics",
  },
];

const SOCIAL_LINKS = [
  {
    icon: "logo-github" as const,
    label: "GitHub",
    url: "https://github.com/sawaal",
    color: "#0f172a",
  },
  {
    icon: "logo-twitter" as const,
    label: "Twitter",
    url: "https://twitter.com/sawaal",
    color: "#1da1f2",
  },
  {
    icon: "logo-instagram" as const,
    label: "Instagram",
    url: "https://instagram.com/sawaal",
    color: "#e4405f",
  },
  {
    icon: "mail" as const,
    label: "Email",
    url: "mailto:hello@sawaal.app",
    color: "#6366f1",
  },
];

export default function About() {
  const insets = useSafeAreaInsets();

  const openURL = (url: string) => {
    Linking.openURL(url);
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
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info */}
        <View style={styles.appInfoSection}>
          <LinearGradient
            colors={["#6366f1", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.appIcon}
          >
            <Ionicons name="flash" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>Sawaal</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>
            The ultimate quiz platform for learners and creators
          </Text>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.missionCard}>
            <View style={styles.missionIconContainer}>
              <Ionicons name="bulb" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.missionText}>
              Sawaal is dedicated to making learning fun and accessible for everyone. We believe
              that knowledge should be engaging, interactive, and available to all. Our platform
              empowers educators and learners to create, share, and participate in meaningful
              quizzes that inspire curiosity and growth.
            </Text>
          </View>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={24} color="#6366f1" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          {TEAM_MEMBERS.map((member, index) => (
            <View key={index} style={styles.teamCard}>
              <View style={styles.teamAvatar}>
                <Ionicons name={member.icon} size={32} color="#6366f1" />
              </View>
              <View style={styles.teamInfo}>
                <Text style={styles.teamRole}>{member.role}</Text>
                <Text style={styles.teamName}>{member.name}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Connect With Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialContainer}>
            {SOCIAL_LINKS.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.socialButton, { backgroundColor: link.color + "15" }]}
                onPress={() => openURL(link.url)}
                activeOpacity={0.7}
              >
                <Ionicons name={link.icon} size={24} color={link.color} />
                <Text style={[styles.socialLabel, { color: link.color }]}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.legalContainer}>
            <TouchableOpacity style={styles.legalItem} activeOpacity={0.7}>
              <View style={styles.legalLeft}>
                <Ionicons name="document-text" size={20} color="#6366f1" />
                <Text style={styles.legalText}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <View style={styles.legalDivider} />
            <TouchableOpacity style={styles.legalItem} activeOpacity={0.7}>
              <View style={styles.legalLeft}>
                <Ionicons name="shield-checkmark" size={20} color="#6366f1" />
                <Text style={styles.legalText}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <View style={styles.legalDivider} />
            <TouchableOpacity style={styles.legalItem} activeOpacity={0.7}>
              <View style={styles.legalLeft}>
                <Ionicons name="reader" size={20} color="#6366f1" />
                <Text style={styles.legalText}>Licenses</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ by the Sawaal Team</Text>
          <Text style={styles.footerCopyright}>© 2024 Sawaal. All rights reserved.</Text>
        </View>
      </ScrollView>
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
  appInfoSection: {
    alignItems: "center",
    paddingVertical: 40,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 12,
  },
  appTagline: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  missionCard: {
    backgroundColor: "#fffbeb",
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: "#fef3c7",
  },
  missionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  missionText: {
    fontSize: 15,
    color: "#0f172a",
    lineHeight: 24,
    fontWeight: "500",
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
    flexShrink: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  featureDescription: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 18,
    flexWrap: "wrap",
  },
  teamCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  teamAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  teamInfo: {
    flex: 1,
  },
  teamRole: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  socialContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  socialButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  legalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  legalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  legalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  legalText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  legalDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
  },
  footerCopyright: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
});
