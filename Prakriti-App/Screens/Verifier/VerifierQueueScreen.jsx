import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

const SERVER = "http://192.168.31.3:8080";

const VerifierQueueScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("tourist");
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/v1/submissions/all?status=pending`);
      const json = await res.json();
      setSubmissions(json.submissions || []);
    } catch (err) {
      console.log("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filtered =
    filter === "all"
      ? submissions
      : submissions; // since all from here are tourist actions already

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => navigation.navigate("VerifierDetail", { submission: item })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.row}>
        <MaterialCommunityIcons
          name="account-check-outline"
          size={26}
          color="#2F5C39"
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.location}</Text>
          <Text style={styles.time}>{item.timestamp?.split("T")[0]}</Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={22} color="#6A7D71" />
      </View>

      <Text style={[styles.tag, styles.tagTourist]}>Tourist Action</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 6 }]}>
      {/* HEADER */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MaterialCommunityIcons name="shield-account" size={20} color="#2F5C39" />
          <Text style={styles.brand}>Prakriti Verifier</Text>
        </View>

        <Pressable onPress={() => navigation.navigate("VerifierProfile")}>
          <Ionicons name="person-circle-outline" size={32} color="#2F5C39" />
        </Pressable>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {[
          { key: "tourist", label: "Tourist Actions" },
          { key: "all", label: "All" },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[styles.filterBtn, filter === tab.key && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === tab.key && styles.filterTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* LOADING */}
      {loading && (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#2F5C39" />
        </View>
      )}

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons name="leaf-check" size={46} color="#2F5C39" />
          <Text style={styles.emptyTitle}>No Requests Right Now</Text>
          <Text style={styles.emptySub}>
            All user submissions are already reviewed. Check back later.
          </Text>
        </View>
      )}

      {/* LIST */}
      {!loading && filtered.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          style={{ marginTop: 10 }}
        />
      )}
    </SafeAreaView>
  );
};

export default VerifierQueueScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9F8", paddingHorizontal: 20 },

  topBar: {
    height: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { fontSize: 18, fontWeight: "800", color: "#2F5C39" },

  filterRow: {
    flexDirection: "row",
    backgroundColor: "#E4EEE7",
    borderRadius: 12,
    padding: 4,
    marginTop: 14,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  filterActive: { backgroundColor: "#2F5C39" },
  filterText: { color: "#2F5C39", fontWeight: "600", fontSize: 12 },
  filterTextActive: { color: "#FFFFFF" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontWeight: "700", fontSize: 15, color: "#1E2D23" },
  subtitle: { fontSize: 12, color: "#6A7D71", marginTop: 2 },
  time: { fontSize: 11, color: "#9AA79F", marginTop: 4 },

  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },
  tagTourist: { backgroundColor: "#E4F4E8", color: "#2F5C39" },

  emptyBox: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: "700", color: "#1F3A28" },
  emptySub: {
    textAlign: "center",
    color: "#6A7D71",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
});
