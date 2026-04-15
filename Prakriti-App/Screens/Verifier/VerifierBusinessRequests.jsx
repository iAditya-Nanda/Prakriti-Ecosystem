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

const VerifierBusinessRequests = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("pending"); // pending | approved

  const loadApps = async () => {
    try {
      const res = await fetch(`${SERVER}/api/v1/business/applications`);
      const json = await res.json();
      setApplications(json.applications || []);
    } catch (err) {
      console.log("Error fetching:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const filtered = applications.filter((app) => app.status === filter);

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 6 }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#2F5C39" />
        </Pressable>
        <Text style={styles.headerTitle}>Business Stamp Requests</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {["pending", "approved"].map((t) => (
          <Pressable
            key={t}
            onPress={() => setFilter(t)}
            style={[styles.tabBtn, filter === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>
              {t === "pending" ? "Pending" : "Approved"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2F5C39" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("VerifierRequestDetail", { application: item })}
            >
              <MaterialCommunityIcons name="storefront-outline" size={26} color="#2F5C39" />

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>Business #{item.business_id}</Text>
                <Text style={styles.sub}>{item.created_at.split(" ")[0]}</Text>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={22} color="#2F5C39" />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={34} color="#2F5C39" />
              <Text style={styles.emptyText}>
                {filter === "pending" ? "No pending requests." : "No approved records yet."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default VerifierBusinessRequests;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9F8", paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#2F5C39" },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#E6EFE9",
    borderRadius: 10,
    marginBottom: 12,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#2F5C39" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#2F5C39" },
  tabTextActive: { color: "#FFFFFF" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
  },
  name: { fontSize: 15, fontWeight: "700", color: "#1F3326" },
  sub: { fontSize: 13, color: "#6A746E" },

  emptyBox: { marginTop: 60, alignItems: "center" },
  emptyText: { marginTop: 8, color: "#55645D", fontSize: 14 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
