/* eslint-disable react/no-unescaped-entities */
"use client";

import BackButton from "@/components/back-button";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FAQItem {
  question: string;
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "How do I create a quiz?",
    answer:
      'To create a quiz, go to the Quiz tab at the bottom navigation bar and tap the "Create New Quiz" button. Fill in the quiz details, add questions with multiple choice answers, and publish when ready.',
    icon: "help-circle",
  },
  {
    question: "How does the ranking system work?",
    answer:
      "Your rank is determined by the total points you earn from completing quizzes. As you accumulate more points, you'll progress through ranks: Rising Star → Smart Cookie → Trivia Titan → Knowledge Ninja → Brain Blaster → Quiz Overlord.",
    icon: "trophy",
  },
  {
    question: "Can I edit my quiz after publishing?",
    answer:
      "Yes! Go to your Library tab, find your quiz, and tap the edit button. You can modify questions, answers, and quiz details at any time.",
    icon: "create",
  },
  {
    question: "How are quiz points calculated?",
    answer:
      "Points are awarded based on the difficulty of the quiz and your performance. Harder quizzes give more points. You earn full points for perfect scores and partial points based on your accuracy.",
    icon: "calculator",
  },
  {
    question: "What happens to my bookmarked quizzes?",
    answer:
      "Bookmarked quizzes are saved to your account and can be accessed anytime from the Library tab under the Bookmarked section. They sync across all your devices.",
    icon: "bookmark",
  },
  {
    question: "Can I take a quiz multiple times?",
    answer:
      "Yes! You can retake any quiz as many times as you want. Your latest score will be saved, and you can track your improvement over time.",
    icon: "refresh",
  },
];

const SUPPORT_OPTIONS = [
  {
    title: "Email Support",
    description: "Get help via email",
    icon: "mail" as const,
    action: () => Linking.openURL("mailto:support@sawaal.app"),
  },
  {
    title: "Report a Bug",
    description: "Let us know about issues",
    icon: "bug" as const,
    action: () => Alert.alert("Report Bug", "Bug reporting feature coming soon!"),
  },
  {
    title: "Feature Request",
    description: "Suggest new features",
    icon: "bulb" as const,
    action: () => Alert.alert("Feature Request", "Feature request form coming soon!"),
  },
  {
    title: "Community Guidelines",
    description: "Learn our community rules",
    icon: "people" as const,
    action: () => Alert.alert("Community Guidelines", "Guidelines page coming soon!"),
  },
];

export default function HelpSupport() {
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="help-circle" size={48} color="#6366f1" />
          </View>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions or get in touch with our support team
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.supportGrid}>
            {SUPPORT_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.supportCard}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={styles.supportIconContainer}>
                  <Ionicons name={option.icon} size={24} color="#6366f1" />
                </View>
                <Text style={styles.supportTitle}>{option.title}</Text>
                <Text style={styles.supportDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {FAQ_DATA.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeaderLeft}>
                    <View style={styles.faqIconContainer}>
                      <Ionicons name={faq.icon} size={20} color="#6366f1" />
                    </View>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                  </View>
                  <Ionicons
                    name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
                {expandedIndex === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Additional Help */}
        <View style={[styles.section, styles.helpSection]}>
          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Ionicons name="chatbubbles" size={32} color="#6366f1" />
            </View>
            <Text style={styles.helpTitle}>Still need help?</Text>
            <Text style={styles.helpText}>
              Our support team is here to assist you. Send us an email and we'll get back to you
              within 24 hours.
            </Text>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => Linking.openURL("mailto:support@sawaal.app")}
            >
              <LinearGradient
                colors={["#6366f1", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.helpButtonGradient}
              >
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.helpButtonText}>Contact Support</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  heroSection: {
    alignItems: "center",
    paddingVertical: 40,
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#c7d2fe",
  },
  heroTitle: {
    fontSize: 24,
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
  supportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  supportCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  supportIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    textAlign: "center",
  },
  supportDescription: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },
  faqContainer: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  faqIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 64,
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    fontWeight: "500",
  },
  helpSection: {
    marginBottom: 20,
  },
  helpCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  helpIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 20,
  },
  helpButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  helpButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  helpButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
});
