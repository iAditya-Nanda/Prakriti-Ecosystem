import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

const SERVER_IP = "http://192.168.31.3:8080";

const BusinessDashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [noSession, setNoSession] = useState(false);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("prakriti_user");
        const storedRole = await AsyncStorage.getItem("prakriti_role");

        const user = storedUser ? JSON.parse(storedUser) : null;

        // ✅ Check session existence
        if (!user || storedRole !== "business") {
          setNoSession(true);
          setLoading(false);
          return;
        }

        // ✅ Fetch business dashboard data
        const response = await fetch(`${SERVER_IP}/api/v1/business/${user.id}`);
        const json = await response.json();

        setBusiness(json);
      } catch (err) {
        console.log("Dashboard Fetch Error:", err);
        setNoSession(true);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, []);

  const stampStyles = (status) => {
    switch (status) {
      case "approved": return { bg: "#2F5C39", text: "#FFFFFF" };
      case "pending": return { bg: "#FFF2CC", text: "#B58B00" };
      case "rejected": return { bg: "#FCE5E5", text: "#C84040" };
      default: return { bg: "#DDE5DF", text: "#3A4B3C" };
    }
  };

  // ⏳ Loading Screen
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#2F5C39" />
        <Text style={{ marginTop: 10, color: "#435248" }}>Loading dashboard…</Text>
      </SafeAreaView>
    );
  }

  // ❌ No Session -> Show Login CTA
  if (noSession) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <MaterialCommunityIcons name="account-alert-outline" size={48} color="#2F5C39" />
        <Text style={styles.noSessionTitle}>No business session found</Text>
        <Text style={styles.noSessionSubtitle}>Please login as a Business Account.</Text>

        <Pressable
          onPress={() => navigation.replace("Login")}
          style={styles.loginBtn}
        >
          <Text style={styles.loginBtnText}>Go to Login</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const badge = stampStyles(business.stampStatus);

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 8 }]}>

      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="leaf" size={22} color="#2F5C39" />
          <Text style={styles.brand}>Prakriti Business</Text>
        </View>

        <Pressable onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle-outline" size={34} color="#2F5C39" />
        </Pressable>
      </View>

      {/* Hero */}
      <View style={styles.heroCard}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" }}
          style={styles.avatar}
        />

        <Text style={styles.title}>{business.businessName}</Text>
        <Text style={styles.subtitle}>{business.location}</Text>

        <View style={[styles.stampBadge, { backgroundColor: badge.bg }]}>
          <MaterialCommunityIcons name="check-decagram" size={18} color={badge.text} />
          <Text style={[styles.stampText, { color: badge.text }]}>
            {business.stampStatus === "approved" ? "Green Stamp Certified" :
             business.stampStatus === "pending" ? "Awaiting Verification" :
             "Not Certified"}
          </Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsContainer}>
        <Metric label="Visitors" value={business.metrics.visitors} icon="account-group" />
        <Metric label="Points Issued" value={business.metrics.pointsIssued} icon="ticket-percent" />
        <Metric label="Refills Given" value={business.metrics.refillsGiven} icon="water" />
      </View>

      {/* Action Grid */}
      <Text style={styles.sectionTitle}>Manage</Text>
      <View style={styles.actionGrid}>
        <ActionCard label="Apply Certification" icon="certificate-outline" onPress={() => navigation.navigate("BusinessApplyStamp")} />
        <ActionCard label="View Insights" icon="chart-line" onPress={() => navigation.navigate("BusinessInsights")} />
        <ActionCard label="Generate QR" icon="qrcode-scan" onPress={() => navigation.navigate("BusinessQR")} />
      </View>

    </SafeAreaView>
  );
};

const Metric = ({ label, value, icon }) => (
  <View style={styles.metricCard}>
    <MaterialCommunityIcons name={icon} size={22} color="#23452F" />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const ActionCard = ({ label, icon, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.92 }]}>
    <MaterialCommunityIcons name={icon} size={24} color="#2F5C39" />
    <Text style={styles.actionText}>{label}</Text>
  </Pressable>
);

export default BusinessDashboard;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F8F5", paddingHorizontal: 22 },
  center: { justifyContent: "center", alignItems: "center" },

  noSessionTitle: { marginTop: 12, fontSize: 17, fontWeight: "800", color: "#2F5C39" },
  noSessionSubtitle: { color: "#6C7D73", marginTop: 4, textAlign: "center" },

  loginBtn: { marginTop: 20, backgroundColor: "#2F5C39", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },
  loginBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brand: { fontSize: 18, fontWeight: "800", color: "#2F5C39" },

  heroCard: { backgroundColor: "#FFF", paddingVertical: 28, borderRadius: 20, marginTop: 26, alignItems: "center", elevation: 3 },
  avatar: { width: 72, height: 72, borderRadius: 16, marginBottom: 12 },
  title: { fontSize: 19, fontWeight: "800", color: "#2F5C39" },
  subtitle: { fontSize: 13, color: "#5F6E64", marginTop: 2 },

  stampBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginTop: 14 },
  stampText: { fontSize: 13, fontWeight: "700" },

  metricsContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  metricCard: { flex: 1, alignItems: "center", backgroundColor: "#FFF", paddingVertical: 18, borderRadius: 16, marginHorizontal: 4 },
  metricValue: { fontSize: 18, fontWeight: "800", color: "#2F5C39", marginTop: 4 },
  metricLabel: { fontSize: 12, color: "#63746B", marginTop: 2 },

  sectionTitle: { marginTop: 34, marginBottom: 12, fontSize: 15, fontWeight: "800", color: "#2F5C39" },
  actionGrid: { flexDirection: "row", justifyContent: "space-between" },
  actionCard: { flex: 1, backgroundColor: "#FFF", borderRadius: 16, paddingVertical: 20, alignItems: "center", marginHorizontal: 4, elevation: 2 },
  actionText: { marginTop: 8, fontSize: 13, fontWeight: "700", color: "#2F5C39" },
});
