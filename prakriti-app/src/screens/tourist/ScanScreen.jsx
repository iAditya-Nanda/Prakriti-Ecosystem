import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

import { SERVER } from "../../config";

const ScanScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [points, setPoints] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [actionType, setActionType] = useState("");

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color="#0E6E59" /></View>;
  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: "#F8F9F8", paddingHorizontal: 40 }]}>
        <View style={styles.permissionIconCircle}>
          <Ionicons name="camera-outline" size={32} color="#0E6E59" />
        </View>
        <Text style={styles.permissionText}>Camera access is required to scan sustainability reward QR codes.</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async ({ data }) => {
    if (isScanned) return;
    setIsScanned(true);

    try {
      const qr_id = data.trim();

      const token = await AsyncStorage.getItem("prakriti_token");
      if (!token) {
        Alert.alert(
          "Session Refresh Required",
          "Your current session doesn't have an active security token.\n\nPlease log out from your Profile screen and log back in to scan rewards! 🌿"
        );
        setIsScanned(false);
        return;
      }

      const stored = await AsyncStorage.getItem("prakriti_user");
      const user = JSON.parse(stored);

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${SERVER}/api/v1/qr/scan`, {
        method: "POST",
        headers,
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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={isScanned ? undefined : handleScan}
      />

      {/* Futuristic Target Guide Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.instructionText}>Scan a Green Reward QR</Text>
        
        {/* Frame box with clean green outline styling */}
        <View style={styles.scanFrameContainer}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Translucent Floating Close Action */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Floating Success Modal sheet */}
      {isScanned && (
        <Animated.View style={[styles.confirmationCard, { opacity: fadeAnim }]}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#0E6E59" />
            <Text style={styles.confirmTitle}>Reward Earned</Text>
          </View>

          <Text style={styles.confirmDesc}>
            Completed eco action <Text style={{ fontWeight: "750", color: "#2E3B30" }}>{actionType}</Text> at:
          </Text>
          <Text style={styles.businessName}>{businessName}</Text>

          <View style={styles.pointsBox}>
            <Text style={styles.pointsValue}>+{points}</Text>
            <Text style={styles.pointsLabel}>GREEN POINTS ISSUED</Text>
          </View>

          <Text style={styles.reinforceText}>Great action! You are protecting the ecosystem. 🌿</Text>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              resetScan();
              navigation.goBack();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default ScanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Camera permissions dialog */
  permissionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 14.5,
    color: "#8AA094",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  permissionButton: {
    backgroundColor: "#0E6E59",
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 25,
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontWeight: "750",
    fontSize: 14.5,
  },

  /* Camera UI Guide */
  overlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  instructionText: {
    position: "absolute",
    top: 72,
    fontSize: 15.5,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  /* Clean glowing corners instead of full white border box */
  scanFrameContainer: {
    width: 240,
    height: 240,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#0E6E59",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },

  /* Circular close overlay button */
  closeButton: {
    position: "absolute",
    top: 60,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Success Confirmation Sheet */
  confirmationCard: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0E6E59",
  },
  confirmDesc: {
    fontSize: 13.5,
    color: "#8AA094",
    textAlign: "center",
    fontWeight: "500",
  },
  businessName: {
    fontSize: 15,
    color: "#2E3B30",
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },

  /* Points readout */
  pointsBox: {
    marginTop: 18,
    alignItems: "center",
    backgroundColor: "#EFF6F4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#D3E4DC",
    width: "100%",
  },
  pointsValue: {
    fontSize: 38,
    fontWeight: "900",
    color: "#0E6E59",
    letterSpacing: -1,
  },
  pointsLabel: {
    fontSize: 10.5,
    color: "#8AA094",
    fontWeight: "800",
    marginTop: 3,
    letterSpacing: 0.8,
  },

  reinforceText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 12.5,
    color: "#8AA094",
    fontWeight: "500",
  },

  doneButton: {
    marginTop: 20,
    backgroundColor: "#0E6E59",
    paddingVertical: 13,
    width: "100%",
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
