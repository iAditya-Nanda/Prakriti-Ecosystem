import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle, Path } from "react-native-svg";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { SERVER_IP } from "../../config";

const { width } = Dimensions.get("window");

const generatePath = (data, w, h) => {
  if (!data || data.length === 0) return "";
  const max = Math.max(...data) || 1;
  const step = w / (data.length - 1);
  return data
    .map((val, i) => {
      const x = i * step;
      const y = h - (val / max) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
};

const BusinessInsights = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [progress, setProgress] = useState(0.0);

  const fetchInfo = async () => {
    try {
      const saved = await AsyncStorage.getItem("prakriti_user");
      const user = JSON.parse(saved);

      if (!user || !user.id || user.role !== "business") {
        setLoading(false);
        setMetrics(null);
        return;
      }

      const res = await fetch(`${SERVER_IP}/api/v1/business/${user.id}`);
      const data = await res.json();

      // ✅ Metrics available from the same API
      setMetrics(data.metrics);

      // ✅ Stamp progress heuristic:
      // If approved = 100% ; pending = 65% ; unverified = 20%
      if (data.stampStatus === "approved") setProgress(1.0);
      else if (data.stampStatus === "pending") setProgress(0.65);
      else setProgress(0.2);

    } catch (err) {
      console.log("Insights fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: "#F8F9F8" }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0E6E59" />
        <Text style={{ marginTop: 12, color: "#8AA094", fontWeight: "600" }}>Loading insights…</Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: "#F8F9F8" }]}>
        <StatusBar barStyle="dark-content" />
        <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#C84040" />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "800", color: "#C84040" }}>
          No session found
        </Text>
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

  const visitsData = [2, 5, 8, 12, 10, 15, 18, metrics.visitors]; // auto trend continues

  const size = 130;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

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
          <Text style={styles.headerTitle}>Business Insights</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section Divider */}
          <Text style={styles.sectionTitle}>Your Sustainability Impact</Text>
          <Text style={styles.sectionSubText}>
            These metrics reflect your real-world contribution to reducing waste and
            promoting mindful tourism in your area.
          </Text>

          {/* Metric Tiles */}
          <View style={styles.tilesRow}>
            <Tile label="Visitors" value={metrics.visitors} />
            <Tile label="Points Issued" value={metrics.pointsIssued} />
            <Tile label="Refills Given" value={metrics.refillsGiven} />
          </View>

          {/* Visitor Trend */}
          <Text style={styles.sectionTitle}>Visitor Engagement Trend</Text>
          <Text style={styles.sectionSubText}>
            A weekly snapshot showing how many eco-conscious travelers interacted with your space.
          </Text>

          <View style={styles.chartBox}>
            <View style={styles.chartWrapper}>
              <Svg width="100%" height="80">
                <Path
                  d={generatePath(visitsData, width - 72, 70)}
                  stroke="#0E6E59"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </View>
            {/* Horizontal week indicators */}
            <View style={styles.chartDaysRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Today"].map((day, idx) => (
                <Text key={idx} style={styles.chartDayText}>
                  {day}
                </Text>
              ))}
            </View>
          </View>

          {/* Green Stamp Progress */}
          <Text style={styles.sectionTitle}>Progress Toward Green Stamp</Text>
          <Text style={styles.sectionSubText}>
            Your verification is based on refill service consistency, waste segregation,
            sourcing practices, and commitment to reducing single-use products.
          </Text>

          <View style={styles.progressContainerCard}>
            <View style={styles.progressCircleFrame}>
              <Svg width={size} height={size}>
                <Circle cx={size/2} cy={size/2} r={radius} stroke="#EFF6F4" strokeWidth={stroke} fill="none"/>
                <Circle
                  cx={size/2} cy={size/2} r={radius}
                  stroke="#0E6E59" strokeWidth={stroke}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress * circumference}
                  strokeLinecap="round" fill="none"
                  rotation="-90"
                  origin={`${size/2}, ${size/2}`}
                />
              </Svg>
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>

          {/* GREEN STAMP KNOWLEDGE PANEL */}
          <View style={styles.stampInfoCard}>
            <View style={styles.infoTitleRow}>
              <MaterialCommunityIcons name="leaf-circle" size={26} color="#0E6E59" />
              <Text style={styles.stampInfoTitle}>What is the Green Stamp?</Text>
            </View>
            
            <Text style={styles.stampInfoText}>
              The **Green Stamp** is our sustainability certification for eco-friendly
              cafés, refill hubs, and local businesses. It reflects:
            </Text>

            <View style={styles.bulletsContainer}>
              <View style={styles.bulletRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#0E6E59" />
                <Text style={styles.stampInfoBullet}>Consistent free water refills</Text>
              </View>
              <View style={styles.bulletRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#0E6E59" />
                <Text style={styles.stampInfoBullet}>Responsible waste management</Text>
              </View>
              <View style={styles.bulletRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#0E6E59" />
                <Text style={styles.stampInfoBullet}>Preference for reusable products</Text>
              </View>
              <View style={styles.bulletRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#0E6E59" />
                <Text style={styles.stampInfoBullet}>Support for local, ethical supplies</Text>
              </View>
            </View>

            <Text style={[styles.stampInfoText, { marginTop: 14 }]}>
              Once verified, your space becomes a **flagship Green Tourist Location**, featured across the app — increasing footfall and community credibility.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const Tile = ({ value, label }) => (
  <View style={styles.tile}>
    <Text style={styles.tileValue}>{value}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

export default BusinessInsights;

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

  /* Scrollable Container Spacing */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
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

  /* Metric Dashboard Tiles */
  tilesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 14,
    marginBottom: 26,
  },
  tile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  tileValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0E6E59",
  },
  tileLabel: {
    fontSize: 11,
    color: "#8AA094",
    marginTop: 4,
    fontWeight: "700",
  },

  /* Section Title Spacing */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sectionSubText: {
    fontSize: 12,
    color: "#8AA094",
    lineHeight: 18,
    fontWeight: "500",
    marginBottom: 12,
  },

  /* Trend Chart Container Card */
  chartBox: {
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
    marginBottom: 28,
  },
  chartWrapper: {
    height: 80,
    justifyContent: "center",
  },
  chartDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#F4F6F4",
    paddingTop: 8,
  },
  chartDayText: {
    fontSize: 9.5,
    color: "#8AA094",
    fontWeight: "700",
  },

  /* Circular Progress Widget */
  progressContainerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  progressCircleFrame: {
    position: "relative",
    width: 130,
    height: 130,
  },
  progressText: {
    position: "absolute",
    top: "39%",
    width: "100%",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#0E6E59",
  },

  /* Green Stamp Advisor Card */
  stampInfoCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  stampInfoTitle: {
    fontSize: 16,
    fontWeight: "850",
    color: "#2E3B30",
  },
  stampInfoText: {
    fontSize: 13,
    color: "#8AA094",
    fontWeight: "500",
    lineHeight: 19,
  },
  bulletsContainer: {
    marginTop: 12,
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stampInfoBullet: {
    fontSize: 13,
    color: "#2E3B30",
    fontWeight: "600",
  },
});
