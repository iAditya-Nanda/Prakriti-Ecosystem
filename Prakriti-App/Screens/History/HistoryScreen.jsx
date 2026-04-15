import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_IP = "http://192.168.31.3:8080";

const ACTION_TYPES = [
  { label: "Waste Disposal", key: "waste", icon: "delete-sweep-outline" },
  { label: "Refill", key: "refill", icon: "water-outline" },
  { label: "compost", key: "compost", icon: "leaf-circle-outline" },
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
      const res = await fetch(`${SERVER_IP}/api/v1/history/${user.id}`);
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
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Eco Journey</Text>
        <Text style={styles.subtitle}>Recognize your positive impact 🌱</Text>

        {/* LOADING STATE */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2F5C39" />
            <Text style={{ marginTop: 10, color: "#5C6D60" }}>Fetching activity…</Text>
          </View>
        )}

        {/* NO DATA */}
        {!loading && history.length === 0 && (
          <View style={styles.center}>
            <MaterialCommunityIcons name="leaf-off" size={46} color="#8A9B92" />
            <Text style={styles.emptyText}>No green activities yet.</Text>
            <Text style={styles.emptySub}>Start scanning to earn points 🌍</Text>
          </View>
        )}

        {/* FILTERS */}
        {history.length > 0 && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
              <Pressable
                onPress={() => setFilter("all")}
                style={[styles.filterChip, filter === "all" && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>All</Text>
              </Pressable>

              {ACTION_TYPES.map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => setFilter(key)}
                  style={[styles.filterChip, filter === key && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* HISTORY LIST */}
            <View style={{ marginTop: 22 }}>
              {filteredHistory.map((item) => {
                const icon = ACTION_TYPES.find(a => a.key === item.type)?.icon || "leaf-outline";
                return (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.iconWrap}>
                      <MaterialCommunityIcons name={icon} size={22} color="#2F5C39" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemLocation}>{item.location}</Text>
                      <Text style={styles.itemTime}>{item.time}</Text>
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
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  title: { fontSize: 22, fontWeight: "800", color: "#2F5C39" },
  subtitle: { fontSize: 14, color: "#55675A", marginTop: 4 },

  center: { marginTop: 60, alignItems: "center" },
  emptyText: { fontSize: 17, marginTop: 10, fontWeight: "700", color: "#425349" },
  emptySub: { fontSize: 14, marginTop: 4, color: "#6F8077" },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E7EFEA",
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: "#2F5C39" },
  filterText: { color: "#2F5C39", fontWeight: "600", fontSize: 13 },
  filterTextActive: { color: "#FFFFFF" },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 40, height: 40,
    borderRadius: 8,
    backgroundColor: "#EAF3ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemTitle: { fontSize: 15, fontWeight: "700", color: "#1F2F25" },
  itemLocation: { fontSize: 13, color: "#6C7D73" },
  itemTime: { fontSize: 12, color: "#88988F", marginTop: 4 },

  pointsBadge: {
    backgroundColor: "#2F5C39",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pointsText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
