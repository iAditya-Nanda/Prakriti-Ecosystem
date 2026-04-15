import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MapView, { Marker } from "react-native-maps";

const SERVER = "http://192.168.31.3:8000";
const SERVER_CHECK = "http://192.168.31.3:8080";
const DETECT_URL = `${SERVER}/detect_litter`;

const ReportLitterScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [phase, setPhase] = useState("camera");
  const [image, setImage] = useState(null);
  const [detection, setDetection] = useState(null);

  const [coords, setCoords] = useState(null);

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      setImage(photo.uri);
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

      setPhase("analyzing");

      // 1️⃣ Upload Image
      const fd = new FormData();
      fd.append("file", {
        uri: image,
        name: `litter_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const uploadRes = await fetch(
        `${SERVER_CHECK}/api/v1/submissions/upload`,
        {
          method: "POST",
          body: fd,
        }
      );

      const uploadJson = await uploadRes.json();
      const imageUrl = uploadJson?.url;
      if (!imageUrl) throw new Error("Upload failed");

      // 2️⃣ Create Submission Entry
      const submissionRes = await fetch(
        `${SERVER_CHECK}/api/v1/submissions/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: 7, // TODO: replace with stored user ID
            title: detection?.litter_type || "Litter Report",
            location: `${coords.latitude.toFixed(
              4
            )}, ${coords.longitude.toFixed(4)}`,
            image_url: imageUrl,
          }),
        }
      );

      const submissionJson = await submissionRes.json();
      console.log("Created Submission:", submissionJson);

      // 3️⃣ Move to Thank You Screen
      setPhase("done");
    } catch (err) {
      console.log(err);
      Alert.alert("Failed to submit", "Please try again.");
      setPhase("camera");
    }
  };

  if (!permission)
    return (
      <Center>
        <Text>Loading…</Text>
      </Center>
    );
  if (!permission.granted)
    return (
      <Center>
        <Text style={styles.permissionText}>
          Camera required to report litter.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
        </Pressable>
      </Center>
    );

  return (
    <View style={styles.container}>
      {/* STEP 1: CAMERA */}
      {phase === "camera" && (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
          />
          <Text style={styles.scanHint}>Capture the litter</Text>
          <View style={styles.bottomCenter}>
            <Pressable style={styles.captureBtn} onPress={takePhoto}>
              <MaterialCommunityIcons name="camera" size={30} color="#FFF" />
            </Pressable>
          </View>
        </>
      )}

      {/* STEP 2: ANALYZING */}
      {phase === "analyzing" && (
        <Center>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.analyzingText}>
            Analyzing with Prakriti Vision…
          </Text>
        </Center>
      )}

      {/* STEP 3: LOCATION */}
      {phase === "location" && detection && (
        <View style={styles.locationScreen}>
          <Image source={{ uri: image }} style={styles.preview} />

          <Text style={styles.title}>Litter Confirmed ✅</Text>
          <Text style={styles.subtitle}>{detection.summary}</Text>

          <Text style={styles.details}>
            Type: {detection.litter_type} • Confidence:{" "}
            {(detection.confidence * 100).toFixed(0)}%
          </Text>

          <View style={styles.mapWrap}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: coords?.latitude || 28.61,
                longitude: coords?.longitude || 77.23,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              onPress={(e) => setCoords(e.nativeEvent.coordinate)}
            >
              {coords && <Marker coordinate={coords} />}
            </MapView>
          </View>

          <Pressable style={styles.submitBtn} onPress={submitReport}>
            <Text style={styles.submitText}>
              Submit Report & Earn +10 Points
            </Text>
          </Pressable>
        </View>
      )}

      {/* STEP 4: DONE */}
      {phase === "done" && (
        <Center>
          <Text style={styles.doneTitle}>Submitted for Verification 🌿</Text>
          <Text style={styles.doneMsg}>
            A community verifier will review your report.
          </Text>
          <Text style={styles.points}>
            Points will be awarded once verified
          </Text>

          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Return Home</Text>
          </Pressable>
        </Center>
      )}
    </View>
  );
};

const Center = ({ children }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {children}
  </View>
);

export default ReportLitterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  scanHint: {
    position: "absolute",
    top: 80,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomCenter: {
    position: "absolute",
    bottom: 70,
    width: "100%",
    alignItems: "center",
  },
  captureBtn: { backgroundColor: "#2F5C39", padding: 22, borderRadius: 50 },

  analyzingText: { marginTop: 12, color: "#FFF", fontWeight: "600" },

  locationScreen: { flex: 1, backgroundColor: "#F7F9F8" },
  preview: {
    width: 110,
    height: 110,
    alignSelf: "center",
    borderRadius: 14,
    marginTop: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
    color: "#2F5C39",
  },
  subtitle: { textAlign: "center", color: "#4F6057", marginTop: 4 },
  details: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 13,
    color: "#6D7D73",
  },

  mapWrap: { flex: 1, margin: 16, borderRadius: 14, overflow: "hidden" },
  map: { flex: 1 },

  submitBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#2F5C39",
    alignItems: "center",
  },
  submitText: { color: "#FFF", fontWeight: "700" },

  doneTitle: { fontSize: 26, fontWeight: "800", color: "#2F5C39" },
  doneMsg: { marginTop: 6, fontSize: 15, color: "#4F5D51" },
  points: { marginTop: 14, fontSize: 20, fontWeight: "800", color: "#2F5C39" },
  backBtn: {
    marginTop: 26,
    backgroundColor: "#2F5C39",
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 14,
  },
  backBtnText: { color: "#FFF", fontWeight: "700" },

  permissionText: { color: "#FFF", marginBottom: 12 },
  permissionBtn: { backgroundColor: "#2F5C39", padding: 12, borderRadius: 8 },
  permissionBtnText: { color: "#FFF", fontWeight: "700" },
});
