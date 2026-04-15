import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const ANALYZER_URL = "http://192.168.31.3:8000/analyze";
const SUBMIT_SERVER = "http://192.168.31.3:8080";

const HowToDisposeScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [phase, setPhase] = useState("scan"); // scan | result | verify | done
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [detected, setDetected] = useState(null); // parsed from API (.analysis)
  const [modelUsed, setModelUsed] = useState(null);
  const [previewURI, setPreviewURI] = useState(null);
  const [proofImage, setProofImage] = useState(null);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scanPulse = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;

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

  const startFade = () => {
    fadeIn.setValue(0);
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  if (!permission)
    return (
      <Center>
        <Text>Loading…</Text>
      </Center>
    );
  if (!permission.granted) {
    return (
      <Center>
        <Text style={styles.permissionText}>Camera access needed.</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </Pressable>
      </Center>
    );
  }

  /** Utilities **/
  const capture = async () => {
    if (!cameraRef.current) return null;
    // takePictureAsync is supported by CameraView
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.85,
      skipProcessing: true,
    });
    return photo?.uri || null;
  };

  // Optionally downscale before upload (faster network & inference)
  const downscaleForUpload = async (uri) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch {
      return uri; // fallback to original if manipulation fails
    }
  };

  const uploadToAnalyzer = async (uri) => {
    setUploadProgress(0);

    const randomName = `prakriti_capture_${Date.now()}.jpg`;

    const fd = new FormData();
    fd.append("image", {
      uri,
      name: randomName,
      type: "image/jpeg",
    });

    // Allow up to 2 minutes for slow model inference
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

  /** UX flows **/
  const scanTrash = async () => {
    try {
      setProcessing(true);
      setDetected(null);

      // Capture frame
      const rawUri = await capture();
      if (!rawUri) throw new Error("Could not capture image");
      setPreviewURI(rawUri);

      // Downscale and upload
      const uploadUri = await downscaleForUpload(rawUri);
      const result = await uploadToAnalyzer(uploadUri);

      setDetected(result.analysis);
      setModelUsed(result.model_used || null);
      setPhase("result");
      startFade();
    } catch (e) {
      console.error("scanTrash error", e);
      Alert.alert(
        "Analysis failed",
        "Please try again with a clearer view of the item."
      );
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

      // 1️⃣ Upload image
      const fd = new FormData();
      fd.append("file", {
        uri: img,
        name: `disposal_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const uploadRes = await fetch(
        `${SUBMIT_SERVER}/api/v1/submissions/upload`,
        {
          method: "POST",
          body: fd,
        }
      );

      const uploadJson = await uploadRes.json();
      const imageUrl = uploadJson?.url;
      if (!imageUrl) throw new Error("Upload failed");

      // 2️⃣ Create submission entry
      const submissionRes = await fetch(
        `${SUBMIT_SERVER}/api/v1/submissions/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: 7, // TODO: replace with stored session user_id
            title: `Correct Disposal: ${detected?.summary || "Item"}`,
            location: "Self-confirmed location", // Optional: you can later attach map coords
            image_url: imageUrl,
          }),
        }
      );

      const submissionJson = await submissionRes.json();
      console.log("Submission Recorded:", submissionJson);

      // 3️⃣ Finish UI
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

  // Visual helpers
  const confPct = detected?.confidence
    ? Math.round(detected.confidence * 100)
    : 0;
  const category = detected?.disposal_category || "unknown";
  const material = detected?.material || "—";
  const recyclable = detected?.recyclable === true;
  const hazardous = detected?.hazardous === true;

  const pulseBorder = scanPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.35)"],
  });

  return (
    <View style={styles.container}>
      {/* PHASE — SCAN */}
      {phase === "scan" && (
        <View style={styles.fullscreen}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
          />

          {/* Header hint */}
          <Text style={styles.scanHint}>Point at the trash item</Text>

          {/* Animated focus frame */}
          <View style={styles.scanCenter}>
            <Animated.View
              style={[styles.scanFrame, { borderColor: pulseBorder }]}
            />
            <Animated.View
              style={[
                styles.ring,
                {
                  transform: [
                    {
                      scale: ringScale.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1.15],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>

          {/* Capture */}
          <View style={styles.captureWrapper}>
            <Pressable style={styles.captureButton} onPress={scanTrash}>
              <MaterialCommunityIcons name="camera" size={28} color="#FFF" />
            </Pressable>
          </View>
        </View>
      )}

      {/* PROCESSING OVERLAY */}
      {processing && (
        <View style={styles.processing}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.processingText}>
            Analyzing with Prakriti Vision…
          </Text>
        </View>
      )}

      {/* PHASE — RESULT */}
      {phase === "result" && detected && (
        <Animated.View style={[styles.sheet, { opacity: fadeIn }]}>
          {/* Preview */}
          {previewURI ? (
            <Image source={{ uri: previewURI }} style={styles.preview} />
          ) : null}

          {/* Headline */}
          <Text style={styles.itemTitle}>
            {detected.summary || "Detected Item"}
          </Text>
          <Text style={styles.itemType}>
            {material !== "—" ? `${material} • ` : ""}
            {category.toUpperCase()}
          </Text>

          {/* Chips */}
          <View style={styles.chipsRow}>
            <Chip
              icon={recyclable ? "recycle" : "close-circle-outline"}
              text={recyclable ? "Recyclable" : "Not Recyclable"}
              tone={recyclable ? "good" : "bad"}
            />
            <Chip
              icon={
                hazardous ? "alert-octagon-outline" : "shield-check-outline"
              }
              text={hazardous ? "Hazardous" : "Safe"}
              tone={hazardous ? "warn" : "good"}
            />
            <Chip icon="gauge" text={`Confidence ${confPct}%`} />
          </View>

          {/* Instructions */}
          <Text style={styles.stepsTitle}>How to Dispose</Text>
          {(detected.instructions || []).map((s, i) => (
            <Text key={`step-${i}`} style={styles.stepLine}>
              • {s}
            </Text>
          ))}

          {/* Alternatives */}
          {Array.isArray(detected.suggested_alternatives) &&
            detected.suggested_alternatives.length > 0 && (
              <>
                <Text style={[styles.stepsTitle, { marginTop: 12 }]}>
                  Sustainable Alternatives
                </Text>
                {detected.suggested_alternatives.map((s, i) => (
                  <Text key={`alt-${i}`} style={styles.altLine}>
                    • {s}
                  </Text>
                ))}
              </>
            )}

          {/* Follow-up */}
          {detected.follow_up_question ? (
            <Pressable style={styles.followBtn} onPress={openFollowUpInChat}>
              <MaterialCommunityIcons
                name="robot-outline"
                size={18}
                color="#2F5C39"
              />
              <Text style={styles.followText}>
                {detected.follow_up_question}
              </Text>
            </Pressable>
          ) : null}

          {/* Verify CTA */}
          <Pressable
            style={styles.verifyButton}
            onPress={() => setPhase("verify")}
          >
            <Text style={styles.verifyText}>
              I did it — Verify & Earn Points
            </Text>
          </Pressable>

          {/* Model Footnote */}
          {!!modelUsed && (
            <Text style={styles.footnote}>Analyzed by {modelUsed}</Text>
          )}
        </Animated.View>
      )}

      {/* PHASE — PROOF */}
      {phase === "verify" && (
        <View style={styles.fullscreen}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
          />
          <Text style={styles.verifyHint}>
            Capture proof of correct disposal
          </Text>
          <View style={styles.captureWrapper}>
            <Pressable style={styles.captureButton} onPress={captureProof}>
              <MaterialCommunityIcons name="check" size={28} color="#FFF" />
            </Pressable>
          </View>
        </View>
      )}

      {phase === "uploading" && (
        <View style={styles.processing}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.processingText}>Submitting proof…</Text>
        </View>
      )}

      {/* PHASE — DONE */}
      {phase === "done" && (
        <View style={styles.doneCard}>
          <Text style={styles.doneTitle}>Submission Sent 🌿</Text>
          <Text style={styles.doneMsg}>
            A verifier will review your proof shortly.
          </Text>

          <Text style={styles.pendingText}>
            Points will be awarded once verified.
          </Text>

          {proofImage && (
            <Image source={{ uri: proofImage }} style={styles.proofImg} />
          )}

          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Return Home</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default HowToDisposeScreen;

/** Small Components **/
const Center = ({ children }) => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F7F9F8",
    }}
  >
    {children}
  </View>
);

const Chip = ({ icon, text, tone = "neutral" }) => {
  const palette = {
    good: { bg: "#E7F6EC", fg: "#2F5C39" },
    bad: { bg: "#FFF0F0", fg: "#C63F3F" },
    warn: { bg: "#FFF6E5", fg: "#B58B00" },
    neutral: { bg: "#EAF1EC", fg: "#2F5C39" },
  }[tone] || { bg: "#EAF1EC", fg: "#2F5C39" };

  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      <MaterialCommunityIcons name={icon} size={14} color={palette.fg} />
      <Text style={[styles.chipText, { color: palette.fg }]}>{text}</Text>
    </View>
  );
};

/** Styles **/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  fullscreen: { flex: 1, justifyContent: "center", alignItems: "center" },

  scanHint: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  scanCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  scanFrame: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderRadius: 18,
  },
  ring: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },

  captureWrapper: {
    position: "absolute",
    bottom: 70,
    width: "100%",
    alignItems: "center",
  },
  captureButton: {
    backgroundColor: "#2F5C39",
    padding: 22,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },

  processing: {
    position: "absolute",
    top: "44%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  processingText: { color: "#FFF", marginTop: 10, fontWeight: "700" },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  preview: {
    width: 96,
    height: 96,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: "#F1F1F1",
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#223B2A",
    textAlign: "center",
  },
  itemType: { fontSize: 13, color: "#6C7D73", marginTop: 4, marginBottom: 12 },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
  },
  chipText: { fontSize: 12, fontWeight: "700" },

  stepsTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 6,
    alignSelf: "flex-start",
    color: "#1D2E23",
  },
  stepLine: {
    fontSize: 14,
    color: "#334238",
    marginTop: 3,
    alignSelf: "flex-start",
  },
  altLine: {
    fontSize: 13,
    color: "#415749",
    marginTop: 2,
    alignSelf: "flex-start",
  },

  followBtn: {
    marginTop: 12,
    alignSelf: "stretch",
    backgroundColor: "#F0F6F2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  followText: {
    fontSize: 13,
    color: "#2F5C39",
    fontWeight: "700",
    flexShrink: 1,
  },

  verifyButton: {
    marginTop: 16,
    backgroundColor: "#2F5C39",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignSelf: "stretch",
    alignItems: "center",
  },
  verifyText: { color: "#FFF", fontWeight: "800", fontSize: 14 },

  footnote: { fontSize: 11, color: "#6A7B70", marginTop: 10 },

  verifyHint: {
    position: "absolute",
    top: 80,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  doneCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FFF6",
    paddingHorizontal: 24,
  },
  doneTitle: { fontSize: 26, fontWeight: "900", color: "#2F5C39" },
  donePoints: {
    fontSize: 18,
    marginTop: 6,
    fontWeight: "700",
    color: "#415D49",
  },
  proofImg: {
    width: 140,
    height: 140,
    borderRadius: 18,
    marginTop: 18,
    backgroundColor: "#EDEDED",
  },
  backBtn: {
    marginTop: 28,
    backgroundColor: "#2F5C39",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  backBtnText: { color: "#FFF", fontWeight: "800" },

  permissionText: { color: "#23412A", fontWeight: "700", marginBottom: 12 },
  permissionButton: {
    backgroundColor: "#2F5C39",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  permissionButtonText: { color: "#FFF", fontWeight: "700" },
  doneMsg: { marginTop: 6, fontSize: 14, color: "#4F6057" },
pendingText: { marginTop: 10, fontSize: 13, fontWeight: "600", color: "#2F5C39" },
});
