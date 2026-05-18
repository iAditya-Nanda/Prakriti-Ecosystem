import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import QRCode from "react-native-qrcode-svg";

const SERVER = "http://100.111.171.19:8080";

const BusinessQR = ({ navigation }) => {
  const [mode, setMode] = useState("refill");
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(null);

  const generateQR = async () => {
    try {
      setLoading(true);

      const stored = await AsyncStorage.getItem("prakriti_user");
      const user = JSON.parse(stored);

      if (!user?.id) return Alert.alert("No Business Session Found");

      const res = await fetch(`${SERVER}/api/v1/qr/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: user.id, action: mode }),
      });

      const json = await res.json();
      if (!res.ok) return Alert.alert("Error", json.message || "QR failed");

      setQrData(json.qr);

      // Start polling QR scan status
      if (polling) clearInterval(polling);
      const interval = setInterval(() => checkScanStatus(json.qr.qr_id), 2000);
      setPolling(interval);

    } catch (e) {
      Alert.alert("Network Error");
    }
    setLoading(false);
  };

  const checkScanStatus = async (qr_id) => {
    const res = await fetch(`${SERVER}/api/v1/qr/status/${qr_id}`);
    const json = await res.json();

    if (json.is_scanned) {
      clearInterval(polling);
      setPolling(null);
      Alert.alert(
        "Scan Successful ✅",
        `+${json.points_awarded} points awarded to user #${json.scanned_by_user}`
      );
      setQrData(null); // Reset QR display
    }
  };

  useEffect(() => {
    return () => polling && clearInterval(polling);
  }, [polling]);

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
          <Text style={styles.headerTitle}>Reward QR Code</Text>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle-outline" size={26} color="#0E6E59" />
          </TouchableOpacity>
        </View>

        <View style={styles.scrollContent}>
          <Text style={styles.caption}>
            Tourists scan this to earn <Text style={{ fontWeight: "800", color: "#0E6E59" }}>Green Points</Text>.
          </Text>

          {/* QR Display Card */}
          <View style={styles.qrCard}>
            {loading ? (
              <ActivityIndicator size="large" color="#0E6E59" />
            ) : qrData ? (
              <View style={styles.qrWrapper}>
                <QRCode value={qrData.qr_id} size={200} color="#0E6E59" backgroundColor="#FFFFFF" />
                <Text style={styles.qrFooter}>QR ID: {qrData.qr_id}</Text>
              </View>
            ) : (
              <View style={styles.noQRContainer}>
                <MaterialCommunityIcons name="qrcode" size={72} color="#D8DFDC" />
                <Text style={styles.noQR}>Ready to generate QR</Text>
              </View>
            )}
          </View>

          {/* Mode Selector */}
          <Text style={styles.sectionTitle}>Select Reward Action</Text>
          <View style={styles.modeRow}>
            {[
              { key: "refill", label: "Water Refill", icon: "water-outline" },
              { key: "purchase", label: "Purchase", icon: "shopping-outline" },
              { key: "eco-action", label: "Eco Action", icon: "leaf-circle-outline" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.8}
                onPress={() => setMode(item.key)}
                style={[
                  styles.modeBtn,
                  mode === item.key ? styles.modeActive : styles.modeInactive,
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={18}
                  color={mode === item.key ? "#FFFFFF" : "#0E6E59"}
                />
                <Text style={[
                  styles.modeText,
                  mode === item.key ? styles.modeTextActive : styles.modeTextInactive,
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Trigger */}
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={generateQR}
            activeOpacity={0.88}
          >
            <Text style={styles.generateText}>Generate QR</Text>
          </TouchableOpacity>

          <Text style={styles.note}>QR automatically updates & waits for scan.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default BusinessQR;

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
  profileBtn: {
    padding: 4,
  },

  /* Spacing and Alignment Content */
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: "center",
  },

  caption: {
    textAlign: "center",
    color: "#8AA094",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 20,
  },

  /* Floating QR display container */
  qrCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
    alignItems: "center",
    justifyContent: "center",
    width: 250,
    height: 280,
    marginBottom: 24,
  },
  qrWrapper: {
    alignItems: "center",
  },
  qrFooter: {
    marginTop: 14,
    fontSize: 11,
    color: "#8AA094",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  noQRContainer: {
    alignItems: "center",
  },
  noQR: {
    color: "#8AA094",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },

  /* Section Title spacing */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },

  /* Mode selection pills */
  modeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 28,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  modeActive: {
    backgroundColor: "#0E6E59",
    borderColor: "#0E6E59",
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  modeInactive: {
    backgroundColor: "#EFF6F4",
    borderColor: "#EBEFEA",
  },
  modeText: {
    fontWeight: "700",
    fontSize: 12,
  },
  modeTextActive: {
    color: "#FFFFFF",
  },
  modeTextInactive: {
    color: "#0E6E59",
  },

  /* Solid Green Action CTA button */
  generateBtn: {
    backgroundColor: "#0E6E59",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  generateText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  note: {
    textAlign: "center",
    marginTop: 12,
    color: "#8AA094",
    fontSize: 12,
    fontWeight: "500",
  },
});
