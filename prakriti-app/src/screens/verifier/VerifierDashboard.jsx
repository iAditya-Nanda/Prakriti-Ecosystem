import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

import { SERVER } from "../../config";

const VerifierDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [verifier, setVerifier] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem("prakriti_user");
      const user = JSON.parse(stored);

      if (!user || user.role !== "verifier") {
        setError("No verifier session found.");
        setLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem("prakriti_token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${SERVER}/api/v1/verifier/${user.id}`, {
        headers,
      });
      const json = await res.json();

      setVerifier(json);
    } catch (err) {
      console.log("Verifier Fetch Error:", err);
      setError("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: "#F8F9F8" }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color="#0E6E59" size="large" />
        <Text style={{ marginTop: 12, color: "#8AA094", fontWeight: "600" }}>Loading console…</Text>
      </View>
    );
  }

  if (error || !verifier) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: "#F8F9F8" }]}>
        <StatusBar barStyle="dark-content" />
        <MaterialCommunityIcons name="shield-alert-outline" size={56} color="#C84040" />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "800", color: "#C84040" }}>{error}</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.replace("Login")}
          activeOpacity={0.88}
        >
          <Text style={styles.loginBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle both standard database verifier keys and master bypass verifier keys (verifierName, verifiedCount, pendingCount)
  const name = verifier.name || verifier.verifierName || "Verifier";
  const pendingVerifications = verifier.pendingVerifications !== undefined 
    ? verifier.pendingVerifications 
    : (verifier.pendingCount !== undefined ? verifier.pendingCount : 0);
  const approvedActions = verifier.approvedActions !== undefined 
    ? verifier.approvedActions 
    : (verifier.verifiedCount !== undefined ? verifier.verifiedCount : 0);
  const rejectedItems = verifier.rejectedItems !== undefined ? verifier.rejectedItems : 0;

  const metrics = [
    { label: "Pending Verifications", value: pendingVerifications, icon: "clipboard-clock-outline", color: "#B58B00", bg: "#FFF9E6" },
    { label: "Approved Actions", value: approvedActions, icon: "check-decagram-outline", color: "#0E6E59", bg: "#EFF6F4" },
    { label: "Rejected Items", value: rejectedItems, icon: "close-octagon-outline", color: "#C84040", bg: "#FDF2F2" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* Sleek Top Navigation Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color="#0E6E59" />
            <Text style={styles.brand}>Prakriti Verifier</Text>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle-outline" size={26} color="#0E6E59" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Welcome User Greeting */}
          <View style={styles.welcomeSection}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.verifierNameText}>Hello, {name} 👋</Text>
            <Text style={styles.subText}>You verify real-world sustainability impact across Himachal.</Text>
          </View>

          {/* Metrics Segment Rows */}
          <View style={styles.metricsContainer}>
            {metrics.map((m, i) => (
              <View key={i} style={styles.metricCard}>
                <View style={[styles.metricIconCircle, { backgroundColor: m.bg }]}>
                  <MaterialCommunityIcons name={m.icon} size={22} color={m.color} />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricValue}>{m.value}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Quick Actions Grid */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("VerifierQueue")}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconCircle}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={24} color="#0E6E59" />
              </View>
              <Text style={styles.actionText}>Verification Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("VerifierBusinessRequests")}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconCircle}>
                <MaterialCommunityIcons name="store-check-outline" size={24} color="#0E6E59" />
              </View>
              <Text style={styles.actionText}>Business Requests</Text>
            </TouchableOpacity>
          </View>

          {/* Primary View Verified Impact CTA */}
          <TouchableOpacity
            onPress={() => navigation.navigate("VerifierReports")}
            style={styles.ctaButton}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="earth" size={20} color="#FFFFFF" />
            <Text style={styles.ctaText}>View Verified Impact</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default VerifierDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  loginBtn: {
    marginTop: 24,
    backgroundColor: "#0E6E59",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
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
    gap: 6,
  },
  brand: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0E6E59",
  },
  profileBtn: {
    padding: 4,
  },

  /* Scrollable Spacing Container */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  /* Welcome Section */
  welcomeSection: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: "#8AA094",
    fontWeight: "600",
  },
  verifierNameText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2E3B30",
    marginTop: 2,
  },
  subText: {
    fontSize: 13,
    color: "#8AA094",
    fontWeight: "500",
    marginTop: 4,
    lineHeight: 18,
  },

  /* Metric Card List spacing */
  metricsContainer: {
    gap: 10,
    marginBottom: 26,
  },
  metricCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  metricIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2E3B30",
  },
  metricLabel: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "600",
    marginTop: 1,
  },

  /* Section Title Spacing */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  /* Action Card Grid Columns */
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E3B30",
  },

  /* Primary Action solid green CTA button */
  ctaButton: {
    backgroundColor: "#0E6E59",
    borderRadius: 25,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
