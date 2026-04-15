import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const SERVER = "http://192.168.31.3:8080";

const ScanScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [points, setPoints] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [actionType, setActionType] = useState("");

  if (!permission) return <View style={styles.center}><Text>Loading...</Text></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera access needed to scan QR.</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const handleScan = async ({ data }) => {
    if (isScanned) return;
    setIsScanned(true);

    try {
      // The QR displays only qr_id string
      const qr_id = data.trim();

      const stored = await AsyncStorage.getItem("prakriti_user");
      const user = JSON.parse(stored);

      const res = await fetch(`${SERVER}/api/v1/qr/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_id, user_id: user.id }),
      });

      const json = await res.json();
      console.log("QR Scan Result:", json);

      if (json.message?.includes("points issued")) {
        setPoints(json.points_awarded || 0);
        setBusinessName(json.business_name || "Green Partner Location");
        setActionType(json.action || "Action");
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.log("Scan Error:", err);
    }
  };

  const resetScan = () => {
    fadeAnim.setValue(0);
    setIsScanned(false);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={isScanned ? undefined : handleScan}
      />

      {/* UI Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.instructionText}>Scan a Green Reward QR</Text>
        <View style={styles.scanFrame} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Success Card */}
      {isScanned && (
        <Animated.View style={[styles.confirmationCard, { opacity: fadeAnim }]}>
          <Text style={styles.confirmTitle}>Reward Earned ✅</Text>

          <Text style={styles.confirmDesc}>
            You performed a <Text style={{ fontWeight: "700" }}>{actionType}</Text> at:
          </Text>
          <Text style={styles.businessName}>{businessName}</Text>

          <View style={styles.pointsBox}>
            <Text style={styles.pointsValue}>+{points}</Text>
            <Text style={styles.pointsLabel}>Green Points</Text>
          </View>

          <Text style={styles.reinforceText}>Great actions protect the ecosystem 🌿</Text>

          <Pressable style={styles.doneButton} onPress={() => { resetScan(); navigation.goBack(); }}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
};

export default ScanScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  permissionText: { fontSize: 15, color: "#333", marginBottom: 16, textAlign: "center" },
  permissionButton: { backgroundColor: "#2F5C39", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  permissionButtonText: { color: "#FFF", fontWeight: "600" },

  overlay: { position: "absolute", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" },
  instructionText: { position: "absolute", top: 70, fontSize: 16, fontWeight: "600", color: "#FFFFFF" },

  scanFrame: { width: 230, height: 230, borderRadius: 14, borderWidth: 3, borderColor: "#FFFFFFD9" },

  closeButton: { position: "absolute", top: 50, right: 28 },

  confirmationCard: {
    position: "absolute",
    bottom: 60,
    left: 24,
    right: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    elevation: 8,
  },

  confirmTitle: { fontSize: 20, fontWeight: "800", color: "#2F5C39" },
  confirmDesc: { marginTop: 6, fontSize: 14, color: "#4B4B4B", textAlign: "center" },

  businessName: { fontSize: 15, color: "#2F5C39", fontWeight: "800", marginTop: 4, textAlign: "center" },

  pointsBox: { marginTop: 14, alignItems: "center" },
  pointsValue: { fontSize: 44, fontWeight: "800", color: "#2F5C39" },
  pointsLabel: { fontSize: 13, color: "#666" },

  reinforceText: { marginTop: 10, textAlign: "center", fontSize: 13, color: "#2F5C39", fontWeight: "600" },

  doneButton: { marginTop: 18, backgroundColor: "#2F5C39", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12 },
  doneButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
