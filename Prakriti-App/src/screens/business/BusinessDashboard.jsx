import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");
const SERVER_IP = `${process.env.EXPO_PUBLIC_SERVER_IP || "http://192.168.31.3"}:8080`;

const BusinessDashboard = ({ navigation }) => {
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
      case "approved": return { bg: "#EFF6F4", text: "#0E6E59", label: "Green Certified", icon: "check-decagram" };
      case "pending": return { bg: "#FFF9E6", text: "#B58B00", label: "Pending Verification", icon: "clock-outline" };
      case "rejected": return { bg: "#FDF2F2", text: "#C84040", label: "Verification Failed", icon: "alert-decagram-outline" };
      default: return { bg: "#F3F5F4", text: "#5A6E60", label: "Uncertified", icon: "minus-circle-outline" };
    }
  };

  // ⏳ Loading Screen
  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: "#F4F7F5" }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0E6E59" />
        <Text style={{ marginTop: 12, color: "#8AA094", fontWeight: "600" }}>Loading console…</Text>
      </View>
    );
  }

  // ❌ No Session -> Show Login CTA
  if (noSession) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: "#F4F7F5" }]}>
        <StatusBar barStyle="dark-content" />
        <MaterialCommunityIcons name="shield-alert-outline" size={56} color="#0E6E59" />
        <Text style={styles.noSessionTitle}>Access Denied</Text>
        <Text style={styles.noSessionSubtitle}>Please login as a Business Account.</Text>

        <TouchableOpacity
          onPress={() => navigation.replace("Login")}
          style={styles.loginBtn}
          activeOpacity={0.88}
        >
          <Text style={styles.loginBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const badge = stampStyles(business.stampStatus);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* Sleek Top Navigation Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons name="leaf" size={20} color="#0E6E59" />
            <Text style={styles.brand}>Prakriti Business</Text>
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
            <View style={styles.businessTitleRow}>
              <Text style={styles.businessNameText} numberOfLines={1}>
                {business.businessName}
              </Text>
              <View style={[styles.stampStatusBadge, { backgroundColor: badge.bg }]}>
                <MaterialCommunityIcons name={badge.icon} size={14} color={badge.text} />
                <Text style={[styles.stampStatusText, { color: badge.text }]}>
                  {badge.label}
                </Text>
              </View>
            </View>
            <Text style={styles.locationText}>
              <Ionicons name="location-outline" size={12} color="#8AA094" /> {business.location}
            </Text>
          </View>

          {/* SaaS Style Metric Dashboard Widgets */}
          <View style={styles.metricsContainer}>
            <MetricCard
              label="Visitors"
              value={business.metrics.visitors}
              icon="account-group-outline"
              trend="+12.4% this week"
            />
            <MetricCard
              label="Points Issued"
              value={business.metrics.pointsIssued}
              icon="ticket-percent-outline"
              trend="+8.2% vs avg"
            />
            <MetricCard
              label="Refills Given"
              value={business.metrics.refillsGiven}
              icon="water-outline"
              trend="+4.8% growth"
            />
          </View>

          {/* Section Divider */}
          <Text style={styles.sectionTitle}>Manage</Text>

          {/* Descriptive Grid List Cards */}
          <View style={styles.actionGridContainer}>
            <ActionCard
              title="Apply Certification"
              description="Submit sustainability logs to achieve official Green Stamp approval status."
              icon="certificate-outline"
              onPress={() => navigation.navigate("BusinessApplyStamp")}
            />
            <ActionCard
              title="View Insights"
              description="Analyze visitor behavior, points issuance logs, and water refill statistics."
              icon="chart-timeline-variant"
              onPress={() => navigation.navigate("BusinessInsights")}
            />
            <ActionCard
              title="Generate QR"
              description="Create standard QR scan codes for customers to instantly claim rewards."
              icon="qrcode-scan"
              onPress={() => navigation.navigate("BusinessQR")}
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Premium Metric Panel Widget
const MetricCard = ({ label, value, icon, trend }) => (
  <View style={styles.metricCard}>
    <View style={styles.metricTopRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <MaterialCommunityIcons name={icon} size={18} color="#8AA094" />
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <View style={styles.trendRow}>
      <Ionicons name="trending-up-outline" size={12} color="#0E6E59" />
      <Text style={styles.trendText}>{trend}</Text>
    </View>
  </View>
);

// Modern Descriptive Action Card
const ActionCard = ({ title, description, icon, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.actionCard}
    activeOpacity={0.8}
  >
    <View style={styles.actionLeftFrame}>
      <View style={styles.actionIconCircle}>
        <MaterialCommunityIcons name={icon} size={22} color="#0E6E59" />
      </View>
    </View>
    <View style={styles.actionRightContent}>
      <View style={styles.actionHeaderRow}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Ionicons name="chevron-forward-outline" size={16} color="#8AA094" />
      </View>
      <Text style={styles.actionDesc} numberOfLines={2}>
        {description}
      </Text>
    </View>
  </TouchableOpacity>
);

export default BusinessDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  noSessionTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "800",
    color: "#2E3B30",
  },
  noSessionSubtitle: {
    color: "#8AA094",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  loginBtn: {
    marginTop: 24,
    backgroundColor: "#0E6E59",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  loginBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },

  /* Sleek SaaS Top Navigation Bar */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#EBEFEA",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brand: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0E6E59",
    letterSpacing: 0.2,
    marginLeft: 4,
  },
  badgePill: {
    backgroundColor: "#EFF6F4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0E6E59",
    textTransform: "uppercase",
  },
  profileBtn: {
    padding: 4,
  },

  /* scrollContent margins */
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  /* Business Welcome Section */
  welcomeSection: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: "#8AA094",
    fontWeight: "600",
  },
  businessTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    flexWrap: "wrap",
    gap: 8,
  },
  businessNameText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2E3B30",
    flexShrink: 1,
  },
  stampStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stampStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  locationText: {
    fontSize: 13,
    color: "#8AA094",
    fontWeight: "500",
    marginTop: 4,
  },

  /* Metrics panels layout */
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 28,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  metricTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: "#8AA094",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2E3B30",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
  },
  trendText: {
    fontSize: 9.5,
    color: "#0E6E59",
    fontWeight: "600",
  },

  /* Action Cards operations grid */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  actionGridContainer: {
    gap: 10,
  },
  actionCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  actionLeftFrame: {
    marginRight: 14,
    justifyContent: "center",
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  actionRightContent: {
    flex: 1,
  },
  actionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E3B30",
  },
  actionDesc: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "500",
    marginTop: 4,
    lineHeight: 16,
  },
});
