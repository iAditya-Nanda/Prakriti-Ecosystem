import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const G = { xs: 6, sm: 10, md: 12, lg: 16, xl: 20 };

const HomeScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();

  const cardGap = 12;
  const hPad = G.xl;
  const cardWidth = useMemo(() => Math.min(width - hPad * 2, 520), [width]);

  const handleChatPress = async () => {
    try {
      const history = await AsyncStorage.getItem("chat_history");
      if (history) {
        const parsed = JSON.parse(history);
        // If there's more than just the greeting (which is 1 message), continue active chat directly
        if (parsed && parsed.length > 1) {
          navigation.navigate("AIChatThread", { initialMessage: null });
          return;
        }
      }
    } catch (e) {
      console.log("Error checking chat history:", e);
    }
    // Otherwise, onboard with the clean intro screen
    navigation.navigate("AIChatIntro");
  };

  const prompts = [
    "Blue Leaf Eco Café nearby—refill to avoid 1–2 bottles.",
    "Walk short hops today—cut CO₂ and breathe easier.",
    "Green Market Corner: refills + low-waste gifts.",
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* Sleek Top Navigation Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons name="leaf" size={20} color="#0E6E59" />
            <Text style={styles.brand}>prakriti</Text>
          </View>

          <View style={styles.topActionsRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate("RedeemPoints")}
              style={styles.pointsPill}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={13} color="#D4AF37" />
              <Text style={styles.pointsText}>120</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              activeOpacity={0.8}
              style={styles.profileBtn}
            >
              <Ionicons name="person-circle-outline" size={26} color="#0E6E59" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Primary Quick Scan Actions */}
          <View style={styles.primaryRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Scan")}
              style={styles.primaryCard}
              activeOpacity={0.8}
            >
              <View style={styles.primaryIconBadge}>
                <MaterialCommunityIcons name="qrcode-scan" size={22} color="#0E6E59" />
              </View>
              <Text style={styles.primaryTitle}>Scan QR</Text>
              <Text style={styles.primarySub}>Record eco action fast</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("HowToDispose")}
              style={styles.primaryCard}
              activeOpacity={0.8}
            >
              <View style={[styles.primaryIconBadge, { backgroundColor: "#EFF6F4" }]}>
                <MaterialCommunityIcons name="delete-sweep-outline" size={22} color="#0E6E59" />
              </View>
              <Text style={styles.primaryTitle}>Scan Trash (AI)</Text>
              <Text style={styles.primarySub}>Identify & sort correctly</Text>
            </TouchableOpacity>
          </View>

          {/* Prakriti AI Copilot Widget */}
          <View style={styles.aiBlock}>
            <View style={styles.aiHeader}>
              <MaterialCommunityIcons name="robot-happy-outline" size={20} color="#0E6E59" />
              <Text style={styles.aiTitle}>Prakriti AI Copilot</Text>
            </View>

            <View style={styles.aiRow}>
              <TouchableOpacity
                style={styles.aiFakeInput}
                onPress={handleChatPress}
                activeOpacity={0.8}
              >
                <Text style={styles.aiFakeInputText}>Ask how to dispose… e.g., coffee lid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChatPress}
                style={styles.aiSend}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.chipsRow}>
              {["Plastic bottle", "Food box", "Coffee lid", "Wet waste"].map((query) => (
                <TouchableOpacity
                  key={query}
                  onPress={() =>
                    navigation.navigate("AIChatThread", { initialMessage: query })
                  }
                  style={styles.chip}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipText}>{query}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Suggestions Horizontal Carousel */}
          <Text style={styles.sectionTitle}>Suggestions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToAlignment="center"
            decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
            snapToInterval={cardWidth + cardGap}
            contentContainerStyle={{ paddingRight: G.xl - cardGap }}
            style={{ marginBottom: G.lg }}
          >
            {prompts.map((msg, i) => (
              <View
                key={`p-${i}`}
                style={[
                  styles.promptCard,
                  { width: cardWidth, marginRight: i === prompts.length - 1 ? 0 : cardGap }
                ]}
              >
                <Text style={styles.promptText}>{msg}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Waste Action Center */}
          <Text style={styles.sectionTitle}>Waste Action Center</Text>
          <View style={styles.grid}>
            <GridItem
              icon="recycle"
              label="How to Dispose?"
              onPress={() => navigation.navigate("HowToDispose")}
            />
            <GridItem
              icon="water-outline"
              label="Refill Stations"
              onPress={() => navigation.navigate("RefillStations")}
            />
            <GridItem
              icon="leaf-circle-outline"
              label="Compost Points"
              onPress={() => navigation.navigate("CompostPoints")}
            />
            <GridItem
              icon="alert-octagon-outline"
              label="Report Litter"
              onPress={() => navigation.navigate("ReportLitter")}
              accent
            />
          </View>

          {/* Full Width Disposal CTA */}
          <TouchableOpacity
            onPress={() => navigation.navigate("HowToDispose")}
            style={styles.disposalCTA}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FFFFFF" />
            <Text style={styles.disposalCTAText}>Have trash? Dispose properly</Text>
          </TouchableOpacity>

          {/* Map CTA outline button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Explorer")}
            style={styles.mapCTA}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={18} color="#0E6E59" />
            <Text style={styles.mapText}>View Green Places Map</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const GridItem = ({ icon, label, onPress, accent }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.gridItem, accent && styles.gridAccent]}
    activeOpacity={0.8}
  >
    <View style={[styles.gridIconCircle, { backgroundColor: accent ? "#FDF2F2" : "#EFF6F4" }]}>
      <MaterialCommunityIcons name={icon} size={22} color={accent ? "#C84040" : "#0E6E59"} />
    </View>
    <Text style={[styles.gridText, accent && { color: "#C84040" }]}>{label}</Text>
  </TouchableOpacity>
);

export default HomeScreen;

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
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brand: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0E6E59",
    letterSpacing: 0.2,
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6F4",
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: "#D3E4DC",
  },
  pointsText: {
    color: "#0E6E59",
    fontWeight: "800",
    fontSize: 13,
  },
  profileBtn: {
    padding: 2,
  },

  /* Scrollable container content */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // headroom for tab navigator
  },

  /* Primary pair cards */
  primaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  primaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  primaryIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "800",
    color: "#2E3B30",
  },
  primarySub: {
    marginTop: 3,
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "500",
  },

  /* AI block */
  aiBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
    marginBottom: 24,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2E3B30",
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiFakeInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#F4F6F4",
  },
  aiFakeInputText: {
    color: "#8AA094",
    fontSize: 13,
    fontWeight: "500",
  },
  aiSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0E6E59",
    alignItems: "center",
    justifyContent: "center",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#EFF6F4",
    justifyContent: "center",
  },
  chipText: {
    color: "#0E6E59",
    fontWeight: "700",
    fontSize: 12,
  },

  /* Carousel section styling */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  promptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  promptText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#2E3B30",
    fontWeight: "500",
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  gridItem: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  gridAccent: {
    borderColor: "#FDF2F2",
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  gridText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E3B30",
  },

  /* Disposal Full Width CTA */
  disposalCTA: {
    backgroundColor: "#0E6E59",
    borderRadius: 25,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  disposalCTAText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* Map outline CTA */
  mapCTA: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EFF6F4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    width: "100%",
  },
  mapText: {
    color: "#0E6E59",
    fontWeight: "800",
    fontSize: 14,
  },
});
