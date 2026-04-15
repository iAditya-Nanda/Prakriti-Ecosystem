import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.31.3:8080/api/v1/auth/login";

const Login = ({ navigation }) => {
  const [role, setRole] = useState("user");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      return Alert.alert("Missing Fields", "Please enter login details.");
    }

    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: emailOrPhone.trim(),
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

  const handleGoogleLogin = () => {
    console.log("Google OAuth start for:", role);
  };

  return (
    <SafeAreaView style={styles.container}>

      <Image source={require('../../assets/prakriti.png')} style={styles.heroImage} />

      <View style={styles.headerSection}>
        <Text style={styles.appTitle}>Prakriti</Text>
        <Text style={styles.subtitle}>Travel Responsibly. Earn Green Points.</Text>
      </View>

      {/* ROLE SELECTOR */}
      <View style={styles.roleSelector}>
        {["user", "business", "verifier"].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleOption, role === r && styles.roleActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
              {r === "user" ? "Tourist / User" : r === "business" ? "Business" : "Verifier"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FORM */}
      <View style={styles.formSection}>
        <TextInput
          style={styles.input}
          placeholder="Email or Mobile Number"
          placeholderTextColor="#8A8A8A"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8A8A8A"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signupLinkWrapper}>
          <Text style={styles.signupText}>New here? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup", { role })}>
            <Text style={styles.signupAction}>Create an Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8", paddingHorizontal: 24, justifyContent: "center" },
  heroImage: { width: 120, height: 120, alignSelf: "center", marginBottom: 20, opacity: 0.95 },
  headerSection: { marginBottom: 26, alignItems: "center" },
  appTitle: { fontSize: 32, fontWeight: "700", color: "#2F5C39" },
  subtitle: { fontSize: 14, color: "#5F705F", marginTop: 4, textAlign: "center" },

  roleSelector: { flexDirection: "row", backgroundColor: "#E7EFEA", borderRadius: 12, marginBottom: 26, padding: 4 },
  roleOption: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  roleActive: { backgroundColor: "#2F5C39" },
  roleText: { fontSize: 13, fontWeight: "600", color: "#2F5C39" },
  roleTextActive: { color: "#FFFFFF" },

  formSection: { width: "100%" },
  input: {
    height: 52, backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 16,
    fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: "#E3E3E3",
  },
  forgotPassword: { alignSelf: "flex-end", fontSize: 13, color: "#2F5C39", marginBottom: 20 },
  loginButton: { height: 52, backgroundColor: "#2F5C39", borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  loginButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  signupLinkWrapper: { flexDirection: "row", justifyContent: "center", marginTop: 26 },
  signupText: { color: "#5B5B5B", fontSize: 14 },
  signupAction: { color: "#2F5C39", fontSize: 14, fontWeight: "600" },
});
