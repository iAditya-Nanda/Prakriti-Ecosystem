import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  ActivityIndicator
} from "react-native";
import { Video } from "expo-av";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SplashScreen = ({ navigation }) => {
  const videoRef = useRef(null);

  // Check login & role
  const handleEnd = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("prakriti_user");
      const storedRole = await AsyncStorage.getItem("prakriti_role");

      if (storedUser && storedRole) {
        if (storedRole === "user") return navigation.replace("Home");
        if (storedRole === "business") return navigation.replace("BusinessDashboard");
        if (storedRole === "verifier") return navigation.replace("VerifierDashboard");
      }

      // default fallback → Login
      navigation.replace("Login");
    } catch {
      navigation.replace("Login");
    }
  };

  // Fallback timeout if video doesn't end
  useEffect(() => {
    const timer = setTimeout(handleEnd, 7500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* BLURRED BACKGROUND FILL VIDEO */}
      <View style={styles.backgroundWrapper}>
        <Video
          source={require("../../../assets/prakriti-video.mp4")}
          style={styles.backgroundVideo}
          resizeMode="cover"
          shouldPlay
          isLooping
          isMuted
        />
        <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      {/* MAIN FOREGROUND VIDEO */}
      <View style={styles.foregroundWrapper}>
        {/* <Video
          ref={videoRef}
          source={require("../../../assets/prakriti-video.mp4")}
          style={styles.foregroundVideo}
          resizeMode="contain"
          shouldPlay
          isLooping={false}
          isMuted
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) handleEnd();
          }}
        /> */}

        {/* WELCOME TITLE */}
        <Text style={styles.welcomeText}>Welcome to Prakriti</Text>

        {/* TOP GRADIENT FEATHER */}
        <LinearGradient
          colors={["#000000A0", "transparent"]}
          style={styles.topFade}
        />

        {/* BOTTOM GRADIENT FEATHER */}
        <LinearGradient
          colors={["transparent", "#000000A0"]}
          style={styles.bottomFade}
        />

        {/* LOADING INDICATOR */}
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingText}>Preparing your eco-journey…</Text>
        </View>
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  backgroundWrapper: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  backgroundVideo: { width: "100%", height: "100%", position: "absolute" },

  foregroundWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  foregroundVideo: { width: "100%", height: "100%" },

  topFade: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 150,
    zIndex: 40,
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 150,
    zIndex: 40,
  },

  welcomeText: {
    position: "absolute",
    top: 70,
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 8,
    zIndex: 60,
    letterSpacing: 1.3,
  },

  loadingWrapper: {
    position: "absolute",
    bottom: 75,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 60,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 6,
    fontWeight: "600",
    fontSize: 14,
    opacity: 0.9,
  },
});
