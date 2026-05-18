import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Ellipse } from "react-native-svg";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");
const API_BASE = `${process.env.EXPO_PUBLIC_SERVER_IP || "http://192.168.31.3"}:8080/api/v1/auth/signup`;

const Signup = ({ navigation, route }) => {
  const initialRole = route?.params?.role || "user";
  const [role, setRole] = useState(initialRole);

  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Security & Focus States
  const [secureText, setSecureText] = useState(true);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !emailOrPhone.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          contact: emailOrPhone.trim(),
          password: password.trim(),
          role: role,
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        await AsyncStorage.setItem("prakriti_user", JSON.stringify(data.user));
        await AsyncStorage.setItem("prakriti_role", data.user.role);

        Alert.alert("Success 🎉", "Account created successfully!");

        if (data.user.role === "user") navigation.replace("Home");
        else if (data.user.role === "business") navigation.replace("BusinessDashboard");
        else if (data.user.role === "verifier") navigation.replace("VerifierDashboard");
      } else if (res.status === 409) {
        Alert.alert("Already Registered", "This email or phone is already in use.");
      } else if (res.status === 400) {
        Alert.alert("Invalid Details", "Please check your info and try again.");
      } else {
        Alert.alert("Server Error", data?.message || "Something went wrong.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // Exact asymmetric Bezier path for the white card top edge matching the plantland curve
  const asymmetricPath = `M 0 80 
                          C ${width * 0.35} 100, ${width * 0.65} 15, ${width} 25 
                          L ${width} ${height} 
                          L 0 ${height} 
                          Z`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Curved abstract leaf overlay in top-left matching mockup */}
      <View style={styles.leafOverlayContainer}>
        <Svg height={160} width={160}>
          <Path
            d="M-20 -20 C35 -20, 95 20, 95 80 C95 140, 25 160, -20 160 Z"
            fill="#116D59"
            opacity={0.35}
          />
          <Path
            d="M-40 -40 C25 -40, 75 0, 75 55 C75 110, 15 115, -40 115 Z"
            fill="#116D59"
            opacity={0.25}
          />
        </Svg>
      </View>

      {/* Deep green top header branding area */}
      <View style={styles.topHeaderSection}>
        <Text style={styles.mainHello}>Sign Up!</Text>
        <Text style={styles.mainWelcome}>Create your Prakriti account</Text>
      </View>

      {/* Custom SVG Potted Plant sitting perfectly on the wave curve peak */}
      <View style={styles.pottedPlantContainer}>
        <Svg height={120} width={70} viewBox="0 0 70 120">
          {/* Leaves */}
          <Path d="M35 70 C20 40, 20 5, 35 0 C50 5, 50 40, 35 70 Z" fill="#2E7E6B" />
          <Path d="M35 70 C12 50, 8 20, 24 8 C32 24, 32 50, 35 70 Z" fill="#4AA792" opacity={0.9} />
          <Path d="M35 70 C58 50, 62 20, 46 8 C38 24, 38 50, 35 70 Z" fill="#226454" opacity={0.95} />
          {/* Pot */}
          <Path d="M22 70 L48 70 L42 96 L28 96 Z" fill="#FFFFFF" />
          {/* Pot Shadow */}
          <Ellipse cx={35} cy={99} rx={14} ry={2.5} fill="rgba(0,0,0,0.06)" />
        </Svg>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Asymmetric Curved white background panel */}
          <View style={styles.asymmetricBgContainer}>
            <Svg height={height} width={width}>
              <Path d={asymmetricPath} fill="#EFF2F1" />
            </Svg>
          </View>

          {/* Form Content aligned on top of curved panel */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Sign Up</Text>

            {/* iOS-Style Segmented Control for fast role toggling */}
            <View style={styles.segmentedControl}>
              {["user", "business", "verifier"].map((r) => (
                <TouchableOpacity
                  key={r}
                  activeOpacity={0.8}
                  style={[styles.segmentBtn, role === r && styles.segmentActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.segmentText, role === r && styles.segmentTextActive]}>
                    {r === "user" ? "Tourist" : r === "business" ? "Business" : "Verifier"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Full Name Input Pill */}
            <View
              style={[
                styles.inputWrapper,
                isNameFocused && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={isNameFocused ? "#0E6E59" : "#8AA090"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#A4B4A9"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                autoCapitalize="words"
              />
            </View>

            {/* Email/Mobile Input Pill */}
            <View
              style={[
                styles.inputWrapper,
                isEmailFocused && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={isEmailFocused ? "#0E6E59" : "#8AA090"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email or Mobile Number"
                placeholderTextColor="#A4B4A9"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input Pill */}
            <View
              style={[
                styles.inputWrapper,
                isPasswordFocused && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={isPasswordFocused ? "#0E6E59" : "#8AA090"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A4B4A9"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                activeOpacity={0.7}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={secureText ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#8AA090"
                />
              </TouchableOpacity>
            </View>

            {/* Solid Forest Green CTA button matching layout */}
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              activeOpacity={0.88}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Footer Navigation */}
            <View style={styles.footer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.7}
              >
                <Text style={styles.loginAction}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E6E59", // Solid deep plantland green header
  },
  leafOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  topHeaderSection: {
    height: 190,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    zIndex: 10,
  },
  mainHello: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  mainWelcome: {
    fontSize: 15,
    color: "#A6D5CB",
    marginTop: 4,
    fontWeight: "500",
  },

  /* Custom SVG Potted plant sitting directly on top of the curve's peak */
  pottedPlantContainer: {
    position: "absolute",
    right: 42,
    top: 105,
    zIndex: 20,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 100, // push form controls down to align correctly with wave SVG overlay
    paddingBottom: 40,
  },
  asymmetricBgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },

  formContainer: {
    paddingHorizontal: 32,
    zIndex: 10,
    marginTop: 40,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0E6E59",
    marginBottom: 20,
  },

  /* Sleek iOS Segmented Control Selector */
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F0F3F1",
    borderRadius: 20,
    marginBottom: 24,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9.5,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6A7D6E",
  },
  segmentTextActive: {
    color: "#0E6E59",
    fontWeight: "700",
  },

  /* Border-free Pill Inputs from Screenshot */
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    marginBottom: 14,
    paddingHorizontal: 20,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapperFocused: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#A6D5CB",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#2E3B30",
    fontWeight: "500",
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
  },

  /* Solid Forest Green CTA button matching mockup */
  signupButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0E6E59",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 10,
    marginBottom: 24,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* Footer Section links */
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#8AA094",
    fontSize: 14,
    fontWeight: "500",
  },
  loginAction: {
    color: "#0E6E59",
    fontSize: 14,
    fontWeight: "700",
  },
});
