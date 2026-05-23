import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  ActivityIndicator
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVER } from "../../config";

const SplashScreen = ({ navigation }) => {
  const videoRef = useRef(null);

  // Background video player setup
  const backgroundPlayer = useVideoPlayer(require("../../../assets/prakriti-video.mp4"), player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Setup for foreground video player if you decide to use it in the future:
  /*
  const foregroundPlayer = useVideoPlayer(require("../../../assets/prakriti-video.mp4"), player => {
    player.loop = false;
    player.muted = true;
    player.play();
  });

  useEventListener(foregroundPlayer, "playToEnd", () => {
    handleEnd();
  });
  */

  // Check login & role
  const handleEnd = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("prakriti_user");
      const storedRole = await AsyncStorage.getItem("prakriti_role");
      const storedToken = await AsyncStorage.getItem("prakriti_token");

      if (storedUser && storedRole && storedToken) {
        try {
          const res = await fetch(`${SERVER}/api/v1/auth/verify-token`, {
            headers: { "Authorization": `Bearer ${storedToken}` }
          });
          if (res.status === 401) {
            await AsyncStorage.multiRemove(["prakriti_token", "prakriti_user", "prakriti_role"]);
            return navigation.replace("Login");
          }
        } catch (netErr) {
          // Keep offline session for resilience
          console.log("[Splash Debug] Offline fallback permitted:", netErr);
        }

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
        <VideoView
          player={backgroundPlayer}
          style={styles.backgroundVideo}
          contentFit="cover"
          nativeControls={false}
        />
        <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      {/* MAIN FOREGROUND VIDEO */}
      <View style={styles.foregroundWrapper}>
        {/* 
        <VideoView
          player={foregroundPlayer}
          style={styles.foregroundVideo}
          contentFit="contain"
          nativeControls={false}
        />
        */}

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
