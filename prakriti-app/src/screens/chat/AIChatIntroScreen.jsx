import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

const AIChatIntroScreen = ({ navigation }) => {
  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const history = await AsyncStorage.getItem("chat_history");
        if (history) {
          const parsed = JSON.parse(history);
          // If there's more than just the greeting (which is 1 message), redirect to Thread
          if (parsed && parsed.length > 1) {
            navigation.replace("AIChatThread", { initialMessage: null });
          }
        }
      } catch (e) {
        console.log("Error loading chat history in intro:", e);
      }
    })();
  }, []);

  const startChat = () => {
    if (!text.trim()) return;
    navigation.navigate("AIChatThread", { initialMessage: text });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* Sleek Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#0E6E59" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centerHero}>
          {/* Sparkly Premium Logo Capsule */}
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="robot-happy-outline" size={36} color="#0E6E59" />
            </View>
            <Ionicons name="sparkles" size={18} color="#D4AF37" style={styles.sparkleIcon} />
          </View>

          <Text style={styles.title}>Prakriti AI Copilot</Text>
          <Text style={styles.subtitle}>
            Ask anything about waste sorting, water refill hubs, local composting, or sustainable Himachal travel tips 🌿
          </Text>

          {/* Quick suggestions chips */}
          <View style={styles.suggestionsGrid}>
            {[
              "Where is the nearest water refill?",
              "How do I dispose of a plastic cup?",
              "What items are hazardous?",
              "Earn points compost drop limit"
            ].map((query) => (
              <TouchableOpacity
                key={query}
                onPress={() => navigation.navigate("AIChatThread", { initialMessage: query })}
                style={styles.suggestionChip}
                activeOpacity={0.8}
              >
                <Text style={styles.suggestionText}>{query}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chat input bar */}
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Ask Prakriti AI anything..."
              placeholderTextColor="#8AA094"
              style={styles.input}
              value={text}
              onChangeText={setText}
              onSubmitEditing={startChat}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={startChat}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default AIChatIntroScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },

  /* Sleek Top Navigation Bar */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#EBEFEA",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2E3B30",
  },

  /* Centered Hero section */
  centerHero: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: -20,
  },

  logoBadgeContainer: {
    position: "relative",
    marginBottom: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D3E4DC",
  },
  sparkleIcon: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2E3B30",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13.5,
    color: "#8AA094",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "500",
    paddingHorizontal: 10,
  },

  /* suggestions chips */
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 36,
    width: "100%",
  },
  suggestionChip: {
    backgroundColor: "#EFF6F4",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#D3E4DC",
  },
  suggestionText: {
    fontSize: 12,
    color: "#0E6E59",
    fontWeight: "750",
    textAlign: "center",
  },

  /* Chat Input capsule */
  inputRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0.5,
    padding: 4,
    alignItems: "center",
    width: "100%",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    height: 40,
    fontSize: 14.5,
    color: "#2E3B30",
    fontWeight: "500",
  },
  sendBtn: {
    backgroundColor: "#0E6E59",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});
