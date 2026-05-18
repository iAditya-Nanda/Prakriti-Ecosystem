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
const API_URL = `${process.env.EXPO_PUBLIC_SERVER_IP || "http://192.168.31.3"}:8080/api/v1/auth/login`;

const Login = ({ navigation }) => {
  const [role, setRole] = useState("user");
  const [emailOrPhone, setEmailOrPhone] = useState("user@prakriti.ai");
  const [password, setPassword] = useState("prakriti@user");
  const [loading, setLoading] = useState(false);

  // Security & Focus States
  const [secureText, setSecureText] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Quick prefill trigger
  const handlePrefill = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "user") {
      setEmailOrPhone("user@prakriti.ai");
      setPassword("prakriti@user");
    } else if (selectedRole === "business") {
      setEmailOrPhone("business@prakriti.ai");
      setPassword("prakriti@business");
    } else if (selectedRole === "verifier") {
      setEmailOrPhone("verifier@prakriti.ai");
      setPassword("prakriti@verifier");
    }
  };

  // Dynamic autofill on manual email change (preserves keyboard typing pre-fills)
  const handleEmailChange = (text) => {
    setEmailOrPhone(text);
    const trimmed = text.trim();
    if (trimmed === "user@prakriti.ai") {
      setRole("user");
      setPassword("prakriti@user");
    } else if (trimmed === "business@prakriti.ai") {
      setRole("business");
      setPassword("prakriti@business");
    } else if (trimmed === "verifier@prakriti.ai") {
      setRole("verifier");
      setPassword("prakriti@verifier");
    }
  };

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      return Alert.alert("Missing Fields", "Please enter login details.");
    }

    setLoading(true);

    // Dynamic backend mapping to master contact 1234567890 for placeholder logins
    let contactToSend = emailOrPhone.trim();
    if (
      contactToSend === "user@prakriti.ai" ||
      contactToSend === "business@prakriti.ai" ||
      contactToSend === "verifier@prakriti.ai"
    ) {
      contactToSend = "1234567890";
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: contactToSend,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return Alert.alert("Login Failed", data.message || "Something went wrong.");
      }

      // ✅ Save session persistently
      await AsyncStorage.setItem("prakriti_user", JSON.stringify(data.user));
      await AsyncStorage.setItem("prakriti_role", data.user.role);

      // ✅ Navigate by role
      if (data.user.role === "user") navigation.replace("Home");
      else if (data.user.role === "business") navigation.replace("BusinessDashboard");
      else if (data.user.role === "verifier") navigation.replace("VerifierDashboard");

    } catch (err) {
      Alert.alert("Network Error", "Unable to connect to server.");
    }

    setLoading(false);
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
        <Text style={styles.mainHello}>Hello!</Text>
        <Text style={styles.mainWelcome}>Welcome to Prakriti</Text>
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
            <Text style={styles.formTitle}>Login</Text>

            {/* Email Input Pill */}
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
                placeholder="Email"
                placeholderTextColor="#A4B4A9"
                value={emailOrPhone}
                onChangeText={handleEmailChange}
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

            {/* Quick Prefill Badges Row */}
            <View style={styles.prefillContainer}>
              <Text style={styles.prefillTitle}>Quick Fill:</Text>
              <View style={styles.prefillRow}>
                <TouchableOpacity
                  style={[styles.prefillBadge, role === "user" && styles.prefillBadgeActive]}
                  onPress={() => handlePrefill("user")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.prefillBadgeText, role === "user" && styles.prefillBadgeTextActive]}>
                    Tourist
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.prefillBadge, role === "business" && styles.prefillBadgeActive]}
                  onPress={() => handlePrefill("business")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.prefillBadgeText, role === "business" && styles.prefillBadgeTextActive]}>
                    Business
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.prefillBadge, role === "verifier" && styles.prefillBadgeActive]}
                  onPress={() => handlePrefill("verifier")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.prefillBadgeText, role === "verifier" && styles.prefillBadgeTextActive]}>
                    Verifier
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword", { role: "user" })}
              activeOpacity={0.7}
              style={styles.forgotLinkContainer}
            >
              <Text style={styles.forgotText}>Forgot Password</Text>
            </TouchableOpacity>

            {/* Solid Teal Green CTA button matching screenshot */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.88}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* OR Login Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or login with</Text>
              <View style={styles.divider} />
            </View>

            {/* Rounded Square Social Buttons matching mockup */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialCard} activeOpacity={0.85}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCard} activeOpacity={0.85}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCard} activeOpacity={0.85}>
                <Ionicons name="logo-apple" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Footer Navigation */}
            <View style={styles.footer}>
              <Text style={styles.signupText}>Don't have account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Signup", { role: "user" })}
                activeOpacity={0.7}
              >
                <Text style={styles.signupAction}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Login;

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
    marginBottom: 24,
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

  prefillContainer: {
    marginBottom: 20,
    marginTop: 4,
  },
  prefillTitle: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  prefillRow: {
    flexDirection: "row",
    gap: 8,
  },
  prefillBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8DFDC",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  prefillBadgeActive: {
    borderColor: "#0E6E59",
    backgroundColor: "#EFF6F4",
  },
  prefillBadgeText: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "600",
  },
  prefillBadgeTextActive: {
    color: "#0E6E59",
    fontWeight: "700",
  },

  forgotLinkContainer: {
    alignSelf: "flex-end",
    marginBottom: 28,
  },
  forgotText: {
    fontSize: 13,
    color: "#0E6E59",
    fontWeight: "700",
  },

  /* Solid Forest Green CTA button matching screenshot */
  loginButton: {
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
    marginBottom: 28,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* Or login with Separator */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#D8DFDC",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#8AA094",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Social Rounded Square Cards matching mockup */
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 28,
  },
  socialCard: {
    width: 60,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: "#E6ECE9",
  },

  /* Footer Section links */
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  signupText: {
    color: "#8AA094",
    fontSize: 14,
    fontWeight: "500",
  },
  signupAction: {
    color: "#0E6E59",
    fontSize: 14,
    fontWeight: "700",
  },
});
