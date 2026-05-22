import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

import { SERVER } from "../../config";

const VerifierBusinessRequests = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>Business Stamp Requests</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Filters Styled as Premium Segment Control */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            {[
              { key: "pending", label: "Pending" },
              { key: "approved", label: "Approved" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => setFilter(tab.key)}
                style={[
                  styles.filterBtn,
                  filter === tab.key && styles.filterActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === tab.key && styles.filterTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LOADING INDICATOR */}
        {loading ? (
          <View style={[styles.center, { flex: 1 }]}>
            <ActivityIndicator size="large" color="#0E6E59" />
            <Text style={{ marginTop: 12, color: "#8AA094", fontWeight: "600" }}>Loading requests…</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("VerifierRequestDetail", { application: item })}
              >
                <View style={styles.cardIconCircle}>
                  <MaterialCommunityIcons name="storefront-outline" size={22} color="#0E6E59" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Business #{item.business_id}</Text>
                  <Text style={styles.cardSubtitle}>
                    <Ionicons name="calendar-outline" size={11} color="#8AA094" /> {item.created_at.split(" ")[0]}
                  </Text>
                </View>

                <Ionicons name="chevron-forward-outline" size={16} color="#8AA094" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={56} color="#8AA094" />
                <Text style={styles.emptyTitle}>No Requests Right Now</Text>
                <Text style={styles.emptySub}>
                  {filter === "pending"
                    ? "No pending business stamp requests."
                    : "No approved records found."}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default VerifierBusinessRequests;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
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

  /* tab Segment Control container */
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#F0F3F1",
    borderRadius: 20,
    padding: 3,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 9.5,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  filterActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6A7D6E",
  },
  filterTextActive: {
    color: "#0E6E59",
    fontWeight: "700",
  },

  /* FlatList spacing */
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  /* Business Stamp Requests List Cards */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#2E3B30",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#8AA094",
    marginTop: 3,
    fontWeight: "500",
  },

  /* Empty State displays */
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
    lineHeight: 18,
    fontWeight: "500",
  },
});
