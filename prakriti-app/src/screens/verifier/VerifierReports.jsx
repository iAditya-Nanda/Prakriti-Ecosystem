import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const VerifierReports = ({ navigation }) => {
  // Temporary values (replace with API later)
  const stats = {
    verifiedActions: 148,
    certifiedBusinesses: 9,
    plasticDivertedKg: 42.7,
  };

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
          <Text style={styles.headerTitle}>Verified Impact</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.scrollContent}>
          {/* Main Stat Dashboard Card */}
          <View style={styles.mainCard}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="recycle" size={32} color="#0E6E59" />
            </View>
            <Text style={styles.bigStatValue}>{stats.verifiedActions}</Text>
            <Text style={styles.mainStatLabel}>Eco Actions Verified</Text>
          </View>

          {/* Sub Stats Row Grid */}
          <View style={styles.subStatsRow}>
            <SmallStat
              value={stats.certifiedBusinesses}
              label="Businesses Certified"
              icon="store-check"
            />
            <SmallStat
              value={stats.plasticDivertedKg + " kg"}
              label="Plastic Diverted"
              icon="bottle-tonic-outline"
            />
          </View>

          {/* Advisory Notice */}
          <Text style={styles.note}>
            These numbers reflect the positive environmental impact validated through your work.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const SmallStat = ({ value, label, icon }) => (
  <View style={styles.smallCard}>
    <View style={styles.smallIconCircle}>
      <MaterialCommunityIcons name={icon} size={20} color="#0E6E59" />
    </View>
    <Text style={styles.smallValue}>{value}</Text>
    <Text style={styles.smallLabel}>{label}</Text>
  </View>
);

export default VerifierReports;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
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

  /* Spacing Content Container */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  /* Large Main Stat Widget Card */
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 20,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  bigStatValue: {
    fontSize: 48,
    fontWeight: "900",
    color: "#0E6E59",
    letterSpacing: -1,
  },
  mainStatLabel: {
    fontSize: 14,
    color: "#8AA094",
    fontWeight: "700",
    marginTop: 6,
    letterSpacing: 0.2,
  },

  /* Sub Stats Row Layout */
  subStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  smallIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  smallValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0E6E59",
  },
  smallLabel: {
    fontSize: 11,
    color: "#8AA094",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 14,
  },

  /* Note caption styling */
  note: {
    fontSize: 13,
    color: "#8AA094",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 19,
    paddingHorizontal: 20,
  },
});
