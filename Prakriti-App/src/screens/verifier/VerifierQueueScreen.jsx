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

const SERVER = `${process.env.EXPO_PUBLIC_SERVER_IP || "http://192.168.31.3"}:8080`;

const VerifierQueueScreen = ({ navigation }) => {
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

  const filtered = submissions; // currently tourist actions are the baseline items

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("VerifierDetail", { submission: item })}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={styles.row}>
        <View style={styles.cardIconCircle}>
          <MaterialCommunityIcons
            name="account-check-outline"
            size={22}
            color="#0E6E59"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>
            <Ionicons name="location-outline" size={11} color="#8AA094" /> {item.location}
          </Text>
          <Text style={styles.cardTime}>
            <Ionicons name="calendar-outline" size={11} color="#8AA094" /> {item.timestamp?.split("T")[0]}
          </Text>
        </View>

        <Ionicons name="chevron-forward-outline" size={16} color="#8AA094" />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.tagTourist}>
          <Text style={styles.tagTouristText}>Tourist Action</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Verification Queue</Text>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle-outline" size={26} color="#0E6E59" />
          </TouchableOpacity>
        </View>

        {/* Tab Filters Styled as Premium Segment Control */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            {[
              { key: "tourist", label: "Tourist Actions" },
              { key: "all", label: "All" },
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
        {loading && (
          <View style={[styles.center, { flex: 1 }]}>
            <ActivityIndicator size="large" color="#0E6E59" />
            <Text style={{ marginTop: 12, color: "#8AA094", fontWeight: "600" }}>Loading queue…</Text>
          </View>
        )}

        {/* EMPTY STATE */}
        {!loading && filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="leaf-check" size={56} color="#8AA094" />
            <Text style={styles.emptyTitle}>No Requests Right Now</Text>
            <Text style={styles.emptySub}>
              All user submissions are already reviewed. Check back later.
            </Text>
          </View>
        )}

        {/* REQUESTS LIST */}
        {!loading && filtered.length > 0 && (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default VerifierQueueScreen;

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
  profileBtn: {
    padding: 4,
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

  /* Queue Request List Cards */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  cardTime: {
    fontSize: 11,
    color: "#8AA094",
    marginTop: 3,
    fontWeight: "500",
  },

  cardFooter: {
    borderTopWidth: 1,
    borderColor: "#F4F6F4",
    marginTop: 12,
    paddingTop: 10,
  },
  tagTourist: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EFF6F4",
  },
  tagTouristText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0E6E59",
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
