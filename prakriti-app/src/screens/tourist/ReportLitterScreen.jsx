import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  StatusBar,
  Animated,
  Easing,
  TouchableOpacity
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SERVER_8000, SERVER_8080 } from "../../config";

const SERVER = SERVER_8000;
const SERVER_CHECK = SERVER_8080;
const DETECT_URL = `${SERVER}/api/v1/ai/detect_litter`;

const ReportLitterScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [phase, setPhase] = useState("camera"); // camera | analyzing | location | done
  const [image, setImage] = useState(null);
  const [detection, setDetection] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  // Animations
  const laserAnim = useRef(new Animated.Value(0)).current;
  const [scanStatus, setScanStatus] = useState("Initializing Litter Engine...");

  // Scanning laser animation trigger
  useEffect(() => {
    if (phase === "analyzing") {
      setScanStatus("Prakriti Alert Vision starting...");
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ])
      ).start();

      const logs = [
        "Uploading environmental snapshot...",
        "Running spatial volume analysis...",
        "Identifying litter density details...",
        "Acquiring precise GPS coordinates...",
        "Finalizing incident reporting logs..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setScanStatus(logs[i % logs.length]);
        i++;
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [phase]);

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      setImage(photo.uri);
      
      // Instantly open the new spectacular scanning page
      setPhase("analyzing");
      detectLitter(photo.uri);
    } catch {
      Alert.alert("Camera Error", "Please try again.");
    }
  };

  const detectLitter = async (uri) => {
    try {
      const fd = new FormData();
      fd.append("image", {
        uri,
        name: `litter_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const res = await fetch(DETECT_URL, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = await res.json();
      const result = json?.detection;

      if (!result) throw new Error("Invalid response");

      if (result.is_litter) {
        setDetection(result);
        setPhase("location");
      } else {
        Alert.alert("No Litter Detected", "Try again with a clearer angle.");
        setPhase("camera");
      }
    } catch (err) {
      Alert.alert("Analysis Failed", "Please retake photo clearly.");
      setPhase("camera");
    }
  };

  const fetchLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
  };

  useEffect(() => {
    if (phase === "location") fetchLocation();
  }, [phase]);

  const submitReport = async () => {
    try {
      if (!image || !coords) {
        Alert.alert("Missing Data", "Photo or location not found.");
        return;
      }

      setLoading(true);

      const token = await AsyncStorage.getItem("prakriti_token");
      if (!token) {
        Alert.alert(
          "Session Refresh Required",
          "Your current session doesn't have an active security token.\n\nPlease log out from your Profile screen and log back in to fully enable reports! 🌿"
        );
        setPhase("camera");
        setLoading(false);
        return;
      }

      const storedUser = await AsyncStorage.getItem("prakriti_user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userId = user?.id || 7;

      const fd = new FormData();
      fd.append("file", {
        uri: image,
        name: `litter_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const uploadHeaders = {};
      if (token) {
        uploadHeaders["Authorization"] = `Bearer ${token}`;
      }

      const uploadRes = await fetch(
        `${SERVER_CHECK}/api/v1/submissions/upload`,
        {
          method: "POST",
          headers: uploadHeaders,
          body: fd,
        }
      );

      const uploadJson = await uploadRes.json();
      const imageUrl = uploadJson?.url;
      if (!imageUrl) throw new Error("Upload failed");

      const submissionHeaders = {
        "Content-Type": "application/json",
      };
      if (token) {
        submissionHeaders["Authorization"] = `Bearer ${token}`;
      }

      const submissionRes = await fetch(
        `${SERVER_CHECK}/api/v1/submissions/add`,
        {
          method: "POST",
          headers: submissionHeaders,
          body: JSON.stringify({
            user_id: userId,
            title: `Litter: ${detection?.litter_type || "Report"}`,
            location: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
            image_url: imageUrl,
          }),
        }
      );

      const submissionJson = await submissionRes.json();
      console.log("Created Submission:", submissionJson);

      setPhase("done");
    } catch (err) {
      console.log(err);
      Alert.alert("Failed to submit", "Please try again.");
      setPhase("camera");
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <Center>
        <ActivityIndicator size="large" color="#0E6E59" />
      </Center>
    );
  }

  if (!permission.granted) {
    return (
      <Center>
        <View style={styles.permissionIconCircle}>
          <Ionicons name="camera-outline" size={32} color="#C84040" />
        </View>
        <Text style={styles.permissionText}>Camera access is required to capture and report litter incidents.</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </Center>
    );
  }

  // Calculate laser moving height
  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 218] // sweeps the height of 220px image container
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* STEP 1: CAMERA VIEW */}
      {phase === "camera" && (
        <View style={styles.fullscreen}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
          />

          <View style={styles.overlay}>
            <Text style={styles.scanHint}>Capture the litter incident</Text>

            {/* Glowing target corners styled in alerting red */}
            <View style={styles.scanCenter}>
              <View style={styles.scanFrame}>
                <View style={[styles.targetCorner, styles.tLeft]} />
                <View style={[styles.targetCorner, styles.tRight]} />
                <View style={[styles.targetCorner, styles.bLeft]} />
                <View style={[styles.targetCorner, styles.bRight]} />
              </View>
            </View>

            {/* Floating Top Back Action */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Trigger Button */}
            <View style={styles.bottomCenter}>
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={takePhoto}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="camera" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* NEW SPECTACULAR DEDICATED SCANNING PAGE */}
      {phase === "analyzing" && (
        <View style={styles.analyzingPage}>
          <View style={styles.analyzingHeader}>
            <MaterialCommunityIcons name="alert-octagon" size={24} color="#C84040" />
            <Text style={styles.analyzingTitle}>Prakriti Vision AI</Text>
          </View>

          {/* Centered Image Card with sweeping red laser overlay */}
          <View style={styles.scanningCardContainer}>
            {image && (
              <Image source={{ uri: image }} style={styles.scanningPreviewImage} />
            )}
            
            {/* The sweeping laser line */}
            <Animated.View style={[styles.laserLine, { transform: [{ translateY: laserTranslateY }] }]} />
          </View>

          {/* Custom loader stats logs */}
          <View style={styles.analysisDetailsContainer}>
            <ActivityIndicator size="small" color="#C84040" />
            <Text style={styles.scanStatusText}>{scanStatus}</Text>
          </View>

          <Text style={styles.analyzingFooter}>
            Scanning spatial landmarks for Himachal litter reporting compliance
          </Text>
        </View>
      )}

      {/* STEP 3: GEO-LOCATION CONFIRM */}
      {phase === "location" && detection && (
        <View style={styles.locationScreen}>
          {/* Top header welcome */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setPhase("camera")}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-outline" size={24} color="#C84040" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Incident Information</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.locationContent}>
            {/* Captured Preview image */}
            <Image source={{ uri: image }} style={styles.preview} />

            {/* Confirmed alert badge status */}
            <View style={styles.alertBadge}>
              <Ionicons name="alert-circle" size={18} color="#C84040" />
              <Text style={styles.alertTitle}>Litter Confirmed</Text>
            </View>

            <Text style={styles.subtitle}>{detection.summary}</Text>
            <Text style={styles.details}>
              Type: {detection.litter_type}  •  Confidence: {(detection.confidence * 100).toFixed(0)}%
            </Text>

            {/* Interactive map coordinates tracker */}
            <View style={styles.mapWrap}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: coords?.latitude || 28.61,
                  longitude: coords?.longitude || 77.23,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={(e) => setCoords(e.nativeEvent.coordinate)}
              >
                {coords && (
                  <Marker coordinate={coords}>
                    <MaterialCommunityIcons name="alert-octagon" size={32} color="#C84040" />
                  </Marker>
                )}
              </MapView>
            </View>

            {/* Submission triggers */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={submitReport}
              activeOpacity={0.88}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.submitText}>Submit Report & Earn +10 Points</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 4: THANK YOU SUCCESS VIEW */}
      {phase === "done" && (
        <Center>
          <View style={styles.doneIconCircle}>
            <Ionicons name="shield-checkmark" size={40} color="#0E6E59" />
          </View>
          <Text style={styles.doneTitle}>Report Submitted</Text>
          <Text style={styles.doneMsg}>A community verifier will review the coordinates.</Text>
          <Text style={styles.pendingText}>Points will be awarded once approved. 🌿</Text>

          <TouchableOpacity
            style={styles.backBtnHome}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Return Home</Text>
          </TouchableOpacity>
        </Center>
      )}
    </View>
  );
};

const Center = ({ children }) => (
  <View style={styles.centeredContainer}>
    {children}
  </View>
);

export default ReportLitterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fullscreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: "#F8F9F8",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  /* Permissions */
  permissionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FDF2F2",
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
    backgroundColor: "#C84040",
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontWeight: "750",
    fontSize: 14.5,
  },

  /* Viewfinder camera */
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  scanHint: {
    position: "absolute",
    top: 72,
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scanCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderRadius: 24,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
  },
  targetCorner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#C84040",
    borderWidth: 4,
  },
  tLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 20,
  },
  tRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 20,
  },
  bLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 20,
  },

  bottomCenter: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    alignItems: "center",
  },
  captureBtn: {
    backgroundColor: "#C84040",
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },

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

  /* NEW SPECTACULAR DEDICATED SCANNING PAGE */
  analyzingPage: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    width: "100%"
  },
  analyzingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
  },
  analyzingTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2E3B30",
  },
  scanningCardContainer: {
    width: 220,
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#EBEFEA",
    backgroundColor: "#FFFFFF",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  scanningPreviewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  laserLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#C84040",
    shadowColor: "#C84040",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  analysisDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 28,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBEFEA",
  },
  scanStatusText: {
    fontSize: 13.5,
    color: "#2E3B30",
    fontWeight: "750",
  },
  analyzingFooter: {
    fontSize: 11.5,
    color: "#8AA094",
    fontWeight: "500",
    textAlign: "center",
    position: "absolute",
    bottom: 40,
    paddingHorizontal: 30,
    lineHeight: 16,
  },

  /* Geo Confirmation Screen layout */
  locationScreen: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },
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

  locationContent: {
    flex: 1,
    paddingTop: 16,
    alignItems: "center",
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    backgroundColor: "#F4F6F4",
  },

  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FDF2F2",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 12,
  },
  alertTitle: {
    fontSize: 11.5,
    fontWeight: "850",
    color: "#C84040",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15.5,
    color: "#2E3B30",
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  details: {
    fontSize: 12,
    color: "#8AA094",
    marginTop: 4,
    fontWeight: "600",
  },

  /* Map wraps */
  mapWrap: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
    alignSelf: "stretch",
  },
  map: {
    flex: 1,
  },

  /* submit CTA */
  submitBtn: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: "#0E6E59",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    alignSelf: "stretch",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  /* Done thanks screens */
  doneIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2E3B30",
  },
  doneMsg: {
    fontSize: 14.5,
    color: "#8AA094",
    fontWeight: "500",
    marginTop: 6,
    textAlign: "center",
  },
  pendingText: {
    fontSize: 13,
    color: "#0E6E59",
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  backBtnHome: {
    marginTop: 32,
    backgroundColor: "#0E6E59",
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 25,
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
