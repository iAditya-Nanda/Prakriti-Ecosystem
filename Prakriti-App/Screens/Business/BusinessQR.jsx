import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import QRCode from "react-native-qrcode-svg";

const SERVER = "http://192.168.31.3:8080";

const BusinessQR = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 6 }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#2F5C39" />
        </Pressable>
        <Text style={styles.headerTitle}>Reward QR Code</Text>
        <Pressable onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle-outline" size={26} color="#2F5C39" />
        </Pressable>
      </View>

      <Text style={styles.caption}>
        Tourists scan this to earn <Text style={{ fontWeight: "700" }}>Green Points</Text>.
      </Text>

      {/* QR Box */}
      <View style={styles.qrCard}>
        {loading ? (
          <ActivityIndicator size="large" color="#2F5C39" />
        ) : qrData ? (
          <>
            <QRCode value={qrData.qr_id} size={200} color="#23452F" backgroundColor="#FFFFFF" />
            <Text style={styles.qrFooter}>QR ID: {qrData.qr_id}</Text>
          </>
        ) : (
          <Text style={styles.noQR}>Generate a QR below</Text>
        )}
      </View>

      {/* Mode Selector */}
      <Text style={styles.modeTitle}>Select Reward Action</Text>
      <View style={styles.modeRow}>
        {[
          { key: "refill", label: "Water Refill", icon: "water-outline" },
          { key: "purchase", label: "Purchase", icon: "shopping-outline" },
          { key: "eco-action", label: "Eco Action", icon: "leaf-circle-outline" },
        ].map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setMode(item.key)}
            style={[styles.modeBtn, mode === item.key && styles.modeActive]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={20}
              color={mode === item.key ? "#FFFFFF" : "#2F5C39"}
            />
            <Text style={[styles.modeText, mode === item.key && styles.modeTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.generateBtn} onPress={generateQR}>
        <Text style={styles.generateText}>Generate QR</Text>
      </Pressable>

      <Text style={styles.note}>QR automatically updates & waits for scan.</Text>

    </SafeAreaView>
  );
};

export default BusinessQR;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9F8", paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#2F5C39" },
  caption: { textAlign: "center", color: "#55655A", marginBottom: 14 },
  qrCard: { alignSelf: "center", backgroundColor: "#FFF", padding: 22, borderRadius: 18, elevation: 3, alignItems: "center" },
  qrFooter: { marginTop: 8, fontSize: 13, color: "#4E5D52" },
  noQR: { color: "#7C8A83" },
  modeTitle: { textAlign: "center", fontSize: 14, marginTop: 18, fontWeight: "700", color: "#2F5C39" },
  modeRow: { flexDirection: "row", marginTop: 12 },
  modeBtn: { flex: 1, paddingVertical: 10, backgroundColor: "#E9F1EC", borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", marginHorizontal: 4 },
  modeActive: { backgroundColor: "#2F5C39" },
  modeText: { fontWeight: "600", color: "#2F5C39" },
  modeTextActive: { color: "#FFF" },
  generateBtn: { backgroundColor: "#2F5C39", marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  generateText: { color: "#FFF", fontWeight: "700" },
  note: { textAlign: "center", marginTop: 10, color: "#77857B", fontSize: 12 },
});
