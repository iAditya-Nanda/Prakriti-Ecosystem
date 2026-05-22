import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SERVER } from "../../config";

const ACTION_TYPES = [
  { label: "Waste Disposal", key: "waste", icon: "delete-sweep-outline" },
  { label: "Refill", key: "refill", icon: "water-outline" },
  { label: "Compost", key: "compost", icon: "leaf-circle-outline" },
  { label: "Reuse / Eco Shopping", key: "shopping", icon: "recycle" },
];

const HistoryScreen = () => {
  const [filter, setFilter] = useState("all");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem("prakriti_user");
      if (!stored) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(stored);
      const res = await fetch(`${SERVER}/api/v1/history/${user.id}`);
      const json = await res.json();

      if (json.history) setHistory(json.history.reverse()); // newest first
    } catch (err) {
      console.log("History Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = filter === "all"
    ? history
    : history.filter(item => item.type === filter);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9F8" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.titleText}>Your Eco Journey</Text>
            <Text style={styles.subText}>Recognize your positive impact 🌱</Text>
          </View>

          {/* LOADING STATE */}
          {loading && (
            <View style={[styles.center, { flex: 1 }]}>
              <ActivityIndicator size="large" color="#0E6E59" />
              <Text style={{ marginTop: 12, color: "#8AA094", fontWeight: "600" }}>Fetching activity…</Text>
            </View>
          )}

          {/* NO DATA STATE */}
          {!loading && history.length === 0 && (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="leaf-off" size={56} color="#8AA094" />
              <Text style={styles.emptyTitle}>No Green Activities Yet</Text>
              <Text style={styles.emptySub}>Start scanning to earn green points 🌍</Text>
            </View>
          )}

          {/* FILTERS & HISTORY LIST */}
          {!loading && history.length > 0 && (
            <>
              {/* Scrolling Horizontal Filter Chips */}
              <View style={styles.filterScrollWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    onPress={() => setFilter("all")}
                    activeOpacity={0.8}
                    style={[
                      styles.filterChip,
                      filter === "all" ? styles.filterChipActive : styles.filterChipInactive,
                    ]}
                  >
                    <Text style={[
                      styles.filterText,
                      filter === "all" ? styles.filterTextActive : styles.filterTextInactive,
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>

                  {ACTION_TYPES.map(({ key, label }) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setFilter(key)}
                      activeOpacity={0.8}
                      style={[
                        styles.filterChip,
                        filter === key ? styles.filterChipActive : styles.filterChipInactive,
                      ]}
                    >
                      <Text style={[
                        styles.filterText,
                        filter === key ? styles.filterTextActive : styles.filterTextInactive,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* History Activity List Cards */}
              <View style={styles.historyListContainer}>
                {filteredHistory.map((item) => {
                  const icon = ACTION_TYPES.find(a => a.key === item.type)?.icon || "leaf";
                  return (
                    <View key={item.id} style={styles.historyItem}>
                      <View style={styles.iconWrap}>
                        <MaterialCommunityIcons name={icon} size={22} color="#0E6E59" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemLocation}>
                          <Ionicons name="location-outline" size={11} color="#8AA094" /> {item.location}
                        </Text>
                        <Text style={styles.itemTime}>
                          <Ionicons name="calendar-outline" size={11} color="#8AA094" /> {item.time}
                        </Text>
                      </View>

                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>+{item.points}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },
  center: {
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Scroll container content padding */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120, // space for standard tab bar
  },

  /* Welcome Section */
  welcomeSection: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2E3B30",
  },
  subText: {
    fontSize: 14,
    color: "#8AA094",
    fontWeight: "500",
    marginTop: 4,
  },

  /* Empty state display styles */
  emptyBox: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "800",
    color: "#2E3B30",
  },
  emptySub: {
    textAlign: "center",
    color: "#8AA094",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },

  /* Filters list horizontal padding */
  filterScrollWrapper: {
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9.5,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: "#0E6E59",
    borderColor: "#0E6E59",
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipInactive: {
    backgroundColor: "#EFF6F4",
    borderColor: "#EBEFEA",
  },
  filterText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  filterTextInactive: {
    color: "#0E6E59",
  },

  /* History list card container */
  historyListContainer: {
    marginTop: 16,
    gap: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E3B30",
  },
  itemLocation: {
    fontSize: 12.5,
    color: "#8AA094",
    marginTop: 3,
    fontWeight: "500",
  },
  itemTime: {
    fontSize: 11,
    color: "#8AA094",
    marginTop: 3,
    fontWeight: "500",
  },

  /* points badge container */
  pointsBadge: {
    backgroundColor: "#EFF6F4",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: "#D3E4DC",
  },
  pointsText: {
    color: "#0E6E59",
    fontSize: 13,
    fontWeight: "800",
  },
});
