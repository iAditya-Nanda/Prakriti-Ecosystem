import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle, Path } from "react-native-svg";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const SERVER_IP = "http://192.168.31.3:8080";

const generatePath = (data, w, h) => {
  if (!data || data.length === 0) return "";
  const max = Math.max(...data);
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
  const insets = useSafeAreaInsets();
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
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2F5C39" />
        <Text style={{ marginTop: 8, color: "#435248" }}>Loading insights...</Text>
      </SafeAreaView>
    );
  }

  if (!metrics) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={42} color="#C84040" />
        <Text style={{ marginTop: 8, fontWeight: "700", color: "#C84040" }}>
          No business session found.
        </Text>
        <Pressable
          style={styles.loginBtn}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.loginBtnText}>Go to Login</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const visitsData = [2, 5, 8, 12, 10, 15, 18, metrics.visitors]; // auto trend continues

  const size = 130;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 6 }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#2F5C39" />
        </Pressable>
        <Text style={styles.headerTitle}>Business Insights</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

  {/* Metric Tiles */}
  <Text style={styles.sectionTitle}>Your Sustainability Impact</Text>
  <Text style={styles.sectionSubText}>
    These metrics reflect your real-world contribution to reducing waste and
    promoting mindful tourism in your area.
  </Text>

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
    <Svg width="100%" height="80">
      <Path
        d={generatePath(visitsData, Dimensions.get("window").width - 60, 70)}
        stroke="#2F5C39"
        strokeWidth="3"
        fill="none"
      />
    </Svg>
  </View>

  {/* Green Stamp Progress */}
  <Text style={styles.sectionTitle}>Progress Toward Green Stamp</Text>
  <Text style={styles.sectionSubText}>
    Your verification is based on refill service consistency, waste segregation,
    sourcing practices, and commitment to reducing single-use products.
  </Text>

  <View style={styles.progressContainer}>
    <Svg width={size} height={size}>
      <Circle cx={size/2} cy={size/2} r={radius} stroke="#DDE7E1" strokeWidth={stroke} fill="none"/>
      <Circle
        cx={size/2} cy={size/2} r={radius}
        stroke="#2F5C39" strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress * circumference}
        strokeLinecap="round" fill="none"
        rotation="-90"
        origin={`${size/2}, ${size/2}`}
      />
    </Svg>
    <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
  </View>

  {/* GREEN STAMP KNOWLEDGE PANEL */}
  <View style={styles.stampInfoCard}>
    <MaterialCommunityIcons name="leaf-circle" size={28} color="#2F5C39" />
    <Text style={styles.stampInfoTitle}>What is the Green Stamp?</Text>
    <Text style={styles.stampInfoText}>
      The **Green Stamp** is our sustainability certification for eco-friendly
      cafés, refill hubs, and local businesses. It reflects:
    </Text>

    <View style={{ marginTop: 10 }}>
      <Text style={styles.stampInfoBullet}>• Consistent free water refills</Text>
      <Text style={styles.stampInfoBullet}>• Responsible waste management</Text>
      <Text style={styles.stampInfoBullet}>• Preference for reusable products</Text>
      <Text style={styles.stampInfoBullet}>• Support for local, ethical supplies</Text>
    </View>

    <Text style={[styles.stampInfoText, { marginTop: 10 }]}>
      Once verified, your space becomes a **flagship Green Tourist Location**, featured across the app — increasing footfall and community credibility.
    </Text>
  </View>

</ScrollView>

    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: "#F7F9F8", paddingHorizontal: 20 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#2F5C39" },

  loginBtn: { marginTop: 20, backgroundColor: "#2F5C39", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },
  loginBtnText: { color: "#FFF", fontWeight: "700" },

  tilesRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  tile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 4,
    elevation: 2,
  },
  tileValue: { fontSize: 18, fontWeight: "800", color: "#2F5C39" },
  tileLabel: { fontSize: 12, color: "#647367", marginTop: 4 },

  sectionTitle: { marginTop: 30, marginBottom: 8, fontWeight: "800", fontSize: 15, color: "#213B27" },

  chartBox: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 10, elevation: 2 },

  progressContainer: { alignSelf: "center", marginTop: 20, marginBottom: 8 },
  progressText: { position: "absolute", top: "40%", alignSelf: "center", fontSize: 20, fontWeight: "800", color: "#2F5C39" },
  sectionSubText: {
  fontSize: 13,
  color: "#55675F",
  marginBottom: 10,
  marginTop: -4,
  lineHeight: 18,
},

stampInfoCard: {
  backgroundColor: "#FFFFFF",
  padding: 18,
  marginTop: 26,
  borderRadius: 16,
  elevation: 2,
},

stampInfoTitle: {
  fontSize: 16,
  fontWeight: "800",
  color: "#2F5C39",
  marginTop: 6,
},

stampInfoText: {
  fontSize: 13,
  color: "#4C5A53",
  marginTop: 6,
  lineHeight: 19,
},

stampInfoBullet: {
  fontSize: 13,
  color: "#2F5C39",
  fontWeight: "600",
  marginTop: 4,
},

});
