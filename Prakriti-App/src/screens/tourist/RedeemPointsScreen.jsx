import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const rewards = [
  {
    id: "1",
    title: "10% Off at Blue Leaf Eco Café",
    cost: 60,
    emoji: "☕",
  },
  {
    id: "2",
    title: "Free Bottle Refill Token",
    cost: 45,
    emoji: "💧",
  },
  {
    id: "3",
    title: "Local Souvenir: Eco Badge",
    cost: 90,
    emoji: "🎒",
  },
  {
    id: "4",
    title: "Support Tree Plantation (1 Sapling)",
    cost: 120,
    emoji: "🌱",
  },
];

const RedeemPointsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const loadPoints = async () => {
      try {
        const stored = await AsyncStorage.getItem("prakriti_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserPoints(parsed.balance || 0);
        }
      } catch (err) {
        console.log("Failed to load points on Redeem screen:", err);
      }
    };
    loadPoints();
  }, []);

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
          <Text style={styles.headerTitle}>Redeem Points</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Sparkling Active Balance Board */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceCard}>
            <View style={styles.sparkleIconWrapper}>
              <Ionicons name="sparkles" size={20} color="#D4AF37" />
            </View>
            <Text style={styles.balanceValue}>{userPoints} Green Points</Text>
            <Text style={styles.balanceSub}>Your sustainability impact score</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available Rewards</Text>

        {/* REWARDS CATALOG FLATLIST */}
        <FlatList
          data={rewards}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const canRedeem = userPoints >= item.cost;
            return (
              <View style={styles.card}>
                {/* Emoji left icon with nice soft backdrop circle */}
                <View style={styles.emojiBackdrop}>
                  <Text style={styles.rewardEmoji}>{item.emoji}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardTitle}>{item.title}</Text>
                  <Text style={styles.rewardCost}>
                    <Ionicons name="sparkles" size={11} color="#0E6E59" /> {item.cost} Points
                  </Text>
                </View>

                {/* Styled curves action buttons */}
                <TouchableOpacity
                  style={[
                    styles.redeemBtn,
                    !canRedeem && styles.redeemDisabled,
                  ]}
                  disabled={!canRedeem}
                  onPress={() => console.log("Redeem clicked")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.redeemText, !canRedeem && styles.redeemTextDisabled]}>
                    {canRedeem ? "Redeem" : "Locked"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
};

export default RedeemPointsScreen;

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

  /* Balance Panel styles */
  balanceContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  balanceCard: {
    backgroundColor: "#EFF6F4",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D3E4DC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  sparkleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0E6E59",
    marginTop: 10,
    letterSpacing: -0.2,
  },
  balanceSub: {
    fontSize: 12.5,
    color: "#8AA094",
    fontWeight: "500",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "850",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },

  /* list styles */
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 80,
  },

  /* SaaS Reward Catalog Cards */
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  emojiBackdrop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4F6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardEmoji: {
    fontSize: 22,
  },
  rewardTitle: {
    fontSize: 14.5,
    fontWeight: "750",
    color: "#2E3B30",
  },
  rewardCost: {
    fontSize: 12,
    color: "#0E6E59",
    fontWeight: "700",
    marginTop: 3,
  },

  /* Redeem CTA buttons */
  redeemBtn: {
    backgroundColor: "#0E6E59",
    paddingVertical: 8.5,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  redeemDisabled: {
    backgroundColor: "#F4F6F4",
    borderWidth: 1,
    borderColor: "#EBEFEA",
  },
  redeemText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12.5,
  },
  redeemTextDisabled: {
    color: "#8AA094",
    fontWeight: "700",
  },
});
