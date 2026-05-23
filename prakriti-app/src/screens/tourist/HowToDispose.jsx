import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Alert,
  StatusBar,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ANALYZE_URL, SERVER } from "../../config";

const ANALYZER_URL = ANALYZE_URL;
const SUBMIT_SERVER = SERVER;


const HowToDisposeScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [phase, setPhase] = useState("scan"); // scan | analyzing | result | verify | uploading | done
  const [processing, setProcessing] = useState(false);

  const [detected, setDetected] = useState(null); // parsed from API (.analysis)
  const [modelUsed, setModelUsed] = useState(null);
  const [previewURI, setPreviewURI] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [scannedImageName, setScannedImageName] = useState(null);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scanPulse = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Status text cycle during scanning
  const [scanStatus, setScanStatus] = useState("Initializing Vision Engine...");

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(scanPulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Scanning laser animation trigger
  useEffect(() => {
    if (phase === "analyzing") {
      setScanStatus("Prakriti Vision starting...");
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

      // Cycle status logs
      const logs = [
        "Uploading environmental snapshot...",
        "Analyzing waste material components...",
        "Identifying recyclability thresholds...",
        "Formulating eco-friendly instructions...",
        "Finalizing carbon balance insights..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setScanStatus(logs[i % logs.length]);
        i++;
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [phase]);

  const startFade = () => {
    fadeIn.setValue(0);
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
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
          <Ionicons name="camera-outline" size={32} color="#0E6E59" />
        </View>
        <Text style={styles.permissionText}>Camera access is required to identify waste items with Prakriti Vision AI.</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </Center>
    );
  }

  const capture = async () => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.85,
      skipProcessing: true,
    });
    return photo?.uri || null;
  };

  const downscaleForUpload = async (uri) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch {
      return uri;
    }
  };

  const uploadToAnalyzer = async (uri) => {
    const randomName = `prakriti_capture_${Date.now()}.jpg`;

    const fd = new FormData();
    fd.append("image", {
      uri,
      name: randomName,
      type: "image/jpeg",
    });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120_000);

    try {
      const res = await fetch(ANALYZER_URL, {
        method: "POST",
        body: fd,
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(`Analyzer returned ${res.status}`);

      const json = await res.json();
      if (!json?.analysis) throw new Error("Malformed analyzer response");

      return json;
    } finally {
      clearTimeout(timer);
    }
  };

  const scanTrash = async () => {
    try {
      setProcessing(true);
      setDetected(null);

      const rawUri = await capture();
      if (!rawUri) throw new Error("Could not capture image");
      setPreviewURI(rawUri);

      // Move instantly to analyzing screen page!
      setPhase("analyzing");

      const uploadUri = await downscaleForUpload(rawUri);
      const result = await uploadToAnalyzer(uploadUri);

      setDetected(result.analysis);
      setModelUsed(result.model_used || null);
      setScannedImageName(result.source_image || null);
      setPhase("result");
      startFade();
    } catch (e) {
      console.error("scanTrash error", e);
      Alert.alert(
        "Analysis failed",
        "Please try again with a clearer view of the item."
      );
      setPhase("scan");
    } finally {
      setProcessing(false);
    }
  };

  const captureProof = async () => {
    try {
      const img = await capture();
      if (!img) return;

      setProofImage(img);
      setPhase("uploading");

      const token = await AsyncStorage.getItem("prakriti_token");
      console.log("[Proof Upload Debug] Loaded Token:", token);
      if (!token) {
        Alert.alert(
          "Session Refresh Required",
          "Your current session doesn't have an active security token.\n\nPlease log out from your Profile screen and log back in to fully enable point rewards! 🌿"
        );
        setPhase("verify");
        return;
      }

      const storedUser = await AsyncStorage.getItem("prakriti_user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userId = user?.id || 7;
      console.log("[Proof Upload Debug] Loaded User ID:", userId);

      const fd = new FormData();
      fd.append("file", {
        uri: img,
        name: `disposal_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const uploadHeaders = {};
      if (token) {
        uploadHeaders["Authorization"] = `Bearer ${token}`;
      }
      console.log("[Proof Upload Debug] Requesting upload to:", `${SUBMIT_SERVER}/api/v1/submissions/upload`);
      console.log("[Proof Upload Debug] Headers:", uploadHeaders);

      const uploadRes = await fetch(
        `${SUBMIT_SERVER}/api/v1/submissions/upload`,
        {
          method: "POST",
          headers: uploadHeaders,
          body: fd,
        }
      );

      console.log("[Proof Upload Debug] Upload Response Status:", uploadRes.status);
      const uploadText = await uploadRes.text();
      console.log("[Proof Upload Debug] Upload Response Body:", uploadText);

      let uploadJson;
      try {
        uploadJson = JSON.parse(uploadText);
      } catch (jsonErr) {
        throw new Error(`Upload returned non-JSON: ${uploadText}`);
      }

      const imageUrl = uploadJson?.url;
      if (!imageUrl) throw new Error("Upload failed to return image URL");
      console.log("[Proof Upload Debug] Uploaded Image URL:", imageUrl);

      const submissionHeaders = {
        "Content-Type": "application/json",
      };
      if (token) {
        submissionHeaders["Authorization"] = `Bearer ${token}`;
      }
      console.log("[Proof Upload Debug] Submitting transaction to:", `${SUBMIT_SERVER}/api/v1/submissions/add`);

      const submissionRes = await fetch(
        `${SUBMIT_SERVER}/api/v1/submissions/add`,
        {
          method: "POST",
          headers: submissionHeaders,
          body: JSON.stringify({
            user_id: userId,
            title: `Correct Disposal: ${detected?.summary || "Item"}`,
            location: "Himachal Eco Zone",
            image_url: imageUrl,
            scanned_image_url: scannedImageName ? `/uploads/${scannedImageName}` : null,
          }),
        }
      );

      console.log("[Proof Upload Debug] Submission Status:", submissionRes.status);
      const submissionText = await submissionRes.text();
      console.log("[Proof Upload Debug] Submission Response:", submissionText);

      let submissionJson;
      try {
        submissionJson = JSON.parse(submissionText);
      } catch (jsonErr) {
        throw new Error(`Submission returned non-JSON: ${submissionText}`);
      }

      console.log("Submission Recorded:", submissionJson);

      setPhase("done");
    } catch (err) {
      console.log(err);
      Alert.alert("Upload Failed", "Please try again.");
      setPhase("verify");
    }
  };

  const openFollowUpInChat = () => {
    const ask =
      detected?.follow_up_question ||
      `Help with disposing: ${detected?.summary || "this item"}`;
    navigation.navigate("AIChatThread", { initialMessage: ask });
  };

  const confPct = detected?.confidence
    ? Math.round(detected.confidence * 100)
    : 0;
  const category = detected?.disposal_category || "unknown";
  const material = detected?.material || "—";
  const recyclable = detected?.recyclable === true;
  const hazardous = detected?.hazardous === true;

  const pulseBorder = scanPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(14, 110, 89, 0.9)", "rgba(14, 110, 89, 0.4)"],
  });

  // Calculate laser moving height
  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 218] // sweeps the height of 220px image container
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* PHASE — CAMERA SCAN VIEW */}
      {phase === "scan" && (
        <View style={styles.fullscreen}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
          />

          <View style={styles.overlay}>
            <Text style={styles.scanHint}>Point at the trash item</Text>

            {/* Glowing target corners */}
            <View style={styles.scanCenter}>
              <Animated.View
                style={[styles.scanFrame, { borderColor: pulseBorder }]}
              >
                <View style={[styles.targetCorner, styles.tLeft]} />
                <View style={[styles.targetCorner, styles.tRight]} />
                <View style={[styles.targetCorner, styles.bLeft]} />
                <View style={[styles.targetCorner, styles.bRight]} />
              </Animated.View>
            </View>

            {/* Floating Top Back Action */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Translucent Capture Button */}
            <View style={styles.captureWrapper}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={scanTrash}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="camera" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* NEW SPECTACULAR DEDICATED SCANNING PAGE/STATE */}
      {phase === "analyzing" && (
        <View style={styles.analyzingPage}>
          <View style={styles.analyzingHeader}>
            <MaterialCommunityIcons name="robot" size={24} color="#0E6E59" />
            <Text style={styles.analyzingTitle}>Prakriti Vision AI</Text>
          </View>

          {/* Centered Image Card with sweeping green laser overlay */}
          <View style={styles.scanningCardContainer}>
            {previewURI && (
              <Image source={{ uri: previewURI }} style={styles.scanningPreviewImage} />
            )}
            
            {/* The sweeping laser line */}
            <Animated.View style={[styles.laserLine, { transform: [{ translateY: laserTranslateY }] }]} />
          </View>

          {/* Custom loader stats logs */}
          <View style={styles.analysisDetailsContainer}>
            <ActivityIndicator size="small" color="#0E6E59" />
            <Text style={styles.scanStatusText}>{scanStatus}</Text>
          </View>

          <Text style={styles.analyzingFooter}>
            Aligning local compliance metrics for Himachal Pradesh Eco System
          </Text>
        </View>
      )}

      {/* PHASE — RESULT SHEET */}
      {phase === "result" && detected && (
        <Animated.View style={[styles.sheet, { opacity: fadeIn }]}>
          <View style={styles.pullBar} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: "100%" }}
            contentContainerStyle={styles.sheetScrollContent}
          >
            {/* Preview image */}
            {previewURI && (
              <Image source={{ uri: previewURI }} style={styles.preview} />
            )}

            {/* Headline labels */}
            <Text style={styles.itemTitle}>{detected.summary || "Detected Item"}</Text>
            <Text style={styles.itemType}>
              {material !== "—" ? `${material} • ` : ""}
              {category.toUpperCase()}
            </Text>

            {/* Custom styled Indicator pills */}
            <View style={styles.chipsRow}>
              <Chip
                icon={recyclable ? "recycle" : "close-circle-outline"}
                text={recyclable ? "Recyclable" : "Non-Recyclable"}
                tone={recyclable ? "good" : "bad"}
              />
              <Chip
                icon={hazardous ? "alert-octagon-outline" : "shield-check-outline"}
                text={hazardous ? "Hazardous" : "Eco-Safe"}
                tone={hazardous ? "warn" : "good"}
              />
              <Chip icon="gauge" text={`Confidence ${confPct}%`} tone="neutral" />
            </View>

            {/* Instruction Lists */}
            <Text style={styles.stepsTitle}>How to Dispose</Text>
            {(detected.instructions || []).map((s, i) => (
              <View key={`step-${i}`} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle-outline" size={15} color="#0E6E59" />
                <Text style={styles.stepLine}>{s}</Text>
              </View>
            ))}

            {/* Alternatives section */}
            {Array.isArray(detected.suggested_alternatives) &&
              detected.suggested_alternatives.length > 0 && (
                <>
                  <Text style={[styles.stepsTitle, { marginTop: 16 }]}>
                    Sustainable Alternatives
                  </Text>
                  {detected.suggested_alternatives.map((s, i) => (
                    <View key={`alt-${i}`} style={styles.bulletRow}>
                      <Ionicons name="leaf-outline" size={15} color="#0E6E59" />
                      <Text style={styles.altLine}>{s}</Text>
                    </View>
                  ))}
                </>
              )}

            {/* Follow-up question widget */}
            {detected.follow_up_question && (
              <TouchableOpacity
                style={styles.followBtn}
                onPress={openFollowUpInChat}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="robot-outline" size={18} color="#0E6E59" />
                <Text style={styles.followText}>{detected.follow_up_question}</Text>
                <Ionicons name="chevron-forward-outline" size={14} color="#0E6E59" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            )}

            {/* Submission Verification button */}
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => setPhase("verify")}
              activeOpacity={0.88}
            >
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.verifyText}>Verify & Earn Points</Text>
            </TouchableOpacity>

            {modelUsed && <Text style={styles.footnote}>Powered by {modelUsed}</Text>}
          </ScrollView>
        </Animated.View>
      )}

      {/* PHASE — PROOF CAMERA */}
      {phase === "verify" && (
        <View style={styles.fullscreen}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
          />

          <View style={styles.overlay}>
            <Text style={styles.verifyHint}>Capture proof of correct disposal</Text>

            <TouchableOpacity
              onPress={() => setPhase("result")}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.captureWrapper}>
              <TouchableOpacity
                style={[styles.captureButton, { backgroundColor: "#0E6E59" }]}
                onPress={captureProof}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* SUBMITTING PROOF LOADER */}
      {phase === "uploading" && (
        <View style={styles.analyzingPage}>
          <View style={styles.analyzingHeader}>
            <MaterialCommunityIcons name="cloud-upload" size={24} color="#0E6E59" />
            <Text style={styles.analyzingTitle}>Uploading Proof</Text>
          </View>

          {/* Centered Image Card with sweeping green laser overlay */}
          <View style={styles.scanningCardContainer}>
            {proofImage && (
              <Image source={{ uri: proofImage }} style={styles.scanningPreviewImage} />
            )}
            <ActivityIndicator size="large" color="#0E6E59" style={StyleSheet.absoluteFillObject} />
          </View>

          <View style={styles.analysisDetailsContainer}>
            <Text style={styles.scanStatusText}>Submitting carbon confirmation proof...</Text>
          </View>
        </View>
      )}

      {/* PHASE — DONE STATUS PANEL */}
      {phase === "done" && (
        <View style={styles.doneCard}>
          <View style={styles.doneIconCircle}>
            <Ionicons name="shield-checkmark" size={40} color="#0E6E59" />
          </View>
          <Text style={styles.doneTitle}>Submission Sent</Text>
          <Text style={styles.doneMsg}>A verifier will validate your proof shortly.</Text>
          <Text style={styles.pendingText}>Points will be awarded once approved. 🌿</Text>

          {proofImage && <Image source={{ uri: proofImage }} style={styles.proofImg} />}

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setPhase("scan");
              navigation.goBack();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const Center = ({ children }) => (
  <View style={styles.centeredContainer}>
    {children}
  </View>
);

const Chip = ({ icon, text, tone = "neutral" }) => {
  const palette = {
    good: { bg: "#EFF6F4", fg: "#0E6E59" },
    bad: { bg: "#FDF2F2", fg: "#C84040" },
    warn: { bg: "#FEF7E0", fg: "#B58B00" },
    neutral: { bg: "#F4F6F4", fg: "#2E3B30" },
  }[tone] || { bg: "#F4F6F4", fg: "#2E3B30" };

  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      <MaterialCommunityIcons name={icon} size={14} color={palette.fg} />
      <Text style={[styles.chipText, { color: palette.fg }]}>{text}</Text>
    </View>
  );
};

export default HowToDisposeScreen;

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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9F8",
    paddingHorizontal: 40,
  },

  /* Permissions */
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
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontWeight: "750",
    fontSize: 14.5,
  },

  /* Scan Overlays */
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
    position: "relative",
  },
  targetCorner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#0E6E59",
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

  /* Capture tools overlay */
  captureWrapper: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    alignItems: "center",
  },
  captureButton: {
    backgroundColor: "#0E6E59",
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
    backgroundColor: "#0E6E59",
    shadowColor: "#0E6E59",
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
    fontWeight: "700",
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

  /* Results bottom sheet panel */
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  pullBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#EBEFEA",
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },

  preview: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: "#F4F6F4",
    borderWidth: 1,
    borderColor: "#EBEFEA",
  },
  itemTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2E3B30",
    textAlign: "center",
  },
  itemType: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "750",
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  chipsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: "800",
  },

  /* Instructions Lists */
  stepsTitle: {
    fontSize: 12,
    fontWeight: "850",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    alignSelf: "flex-start",
    marginBottom: 10,
    marginTop: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginVertical: 4,
    alignSelf: "flex-start",
  },
  stepLine: {
    fontSize: 14,
    color: "#2E3B30",
    fontWeight: "500",
    flex: 1,
  },
  altLine: {
    fontSize: 13.5,
    color: "#2E3B30",
    fontWeight: "500",
    flex: 1,
  },

  /* Followup Capsule */
  followBtn: {
    marginTop: 20,
    alignSelf: "stretch",
    backgroundColor: "#EFF6F4",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 0.5,
    borderColor: "#D3E4DC",
  },
  followText: {
    fontSize: 13,
    color: "#0E6E59",
    fontWeight: "750",
    flexShrink: 1,
  },

  /* Confirm point verification CTA */
  verifyButton: {
    marginTop: 22,
    backgroundColor: "#0E6E59",
    paddingVertical: 14,
    borderRadius: 25,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  footnote: {
    fontSize: 11,
    color: "#8AA094",
    marginTop: 12,
    fontWeight: "500",
  },

  /* Verify guidelines */
  verifyHint: {
    position: "absolute",
    top: 72,
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  /* Done state screen elements */
  doneCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9F8",
    paddingHorizontal: 24,
  },
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
  proofImg: {
    width: 160,
    height: 160,
    borderRadius: 20,
    marginTop: 22,
    backgroundColor: "#EFF6F4",
    borderWidth: 1,
    borderColor: "#EBEFEA",
  },
  backBtn: {
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
