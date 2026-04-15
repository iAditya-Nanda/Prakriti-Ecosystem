import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

const SERVER = "http://192.168.31.3:8080";

const VerifierDashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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

      const res = await fetch(`${SERVER}/api/v1/verifier/${user.id}`);
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
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color="#2F5C39" size="large" />
        <Text style={{ marginTop: 10, color: "#4B5C51" }}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error || !verifier) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#B34040" />
        <Text style={{ marginTop: 8, color: "#B34040", fontWeight: "700" }}>{error}</Text>
        <Pressable style={styles.loginBtn} onPress={() => navigation.replace("Login")}>
          <Text style={styles.loginBtnText}>Go to Login</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { name, pendingVerifications, approvedActions, rejectedItems } = verifier;

  const metrics = [
    { label: "Pending Verifications", value: pendingVerifications, icon: "clipboard-clock-outline", color: "#B58B00" },
    { label: "Approved Actions", value: approvedActions, icon: "check-decagram-outline", color: "#2F5C39" },
    { label: "Rejected Items", value: rejectedItems, icon: "close-octagon-outline", color: "#B34040" },
  ];

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 8 }]}>

      {/* HEADER */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color="#2F5C39" />
          <Text style={styles.brand}>Prakriti Verifier</Text>
        </View>

        <Pressable onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle-outline" size={34} color="#2F5C39" />
        </Pressable>
      </View>

      {/* GREETING */}
      <View style={styles.headerTextBox}>
        <Text style={styles.greet}>Hello, {name} 👋</Text>
        <Text style={styles.subText}>You verify real-world sustainability impact across Himachal.</Text>
      </View>

      {/* METRICS */}
      <View style={styles.metricsContainer}>
        {metrics.map((m, i) => (
          <View key={i} style={styles.metricCard}>
            <MaterialCommunityIcons name={m.icon} size={26} color={m.color} />
            <View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9 }]}
          onPress={() => navigation.navigate("VerifierQueue")}
        >
          <MaterialCommunityIcons name="clipboard-list-outline" size={28} color="#2F5C39" />
          <Text style={styles.actionText}>Verification Queue</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9 }]}
          onPress={() => navigation.navigate("VerifierBusinessRequests")}
        >
          <MaterialCommunityIcons name="store-check-outline" size={28} color="#2F5C39" />
          <Text style={styles.actionText}>Business Requests</Text>
        </Pressable>
      </View>

      {/* CTA */}
      <Pressable
        onPress={() => navigation.navigate("VerifierReports")}
        style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]}
      >
        <MaterialCommunityIcons name="earth" size={20} color="#FFF" />
        <Text style={styles.ctaText}>View Verified Impact</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default VerifierDashboard;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9F8", paddingHorizontal: 20 },
  center: { justifyContent: "center", alignItems: "center" },

  loginBtn: { marginTop: 16, backgroundColor: "#2F5C39", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  loginBtnText: { color: "#FFF", fontWeight: "600" },

  topBar: { height: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 18, fontWeight: "800", color: "#2F5C39" },

  headerTextBox: { marginTop: 10, marginBottom: 20 },
  greet: { fontSize: 20, fontWeight: "800", color: "#1E3523" },
  subText: { fontSize: 13, color: "#63746B", marginTop: 4, lineHeight: 18 },

  metricsContainer: { marginTop: 10, marginBottom: 20, gap: 10 },
  metricCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, alignItems: "center", gap: 10, elevation: 2 },
  metricValue: { fontSize: 18, fontWeight: "800", color: "#2F5C39" },
  metricLabel: { fontSize: 13, color: "#5C6B61", marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#2F5C39", marginBottom: 8 },

  actionRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  actionCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 24, alignItems: "center", elevation: 2 },
  actionText: { marginTop: 10, fontWeight: "700", fontSize: 14, color: "#2F5C39" },

  ctaButton: { marginTop: 30, backgroundColor: "#2F5C39", borderRadius: 16, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  ctaText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
