import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://192.168.31.3:8080/api/v1/auth/signup";

const Signup = ({ navigation, route }) => {
  const initialRole = route?.params?.role || "user";
  const [role, setRole] = useState(initialRole);

  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !emailOrPhone || !password) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          contact: emailOrPhone,
          password: password,
          role: role,
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        await AsyncStorage.setItem("prakriti_user", JSON.stringify(data.user));
        await AsyncStorage.setItem("prakriti_role", data.user.role);

        Alert.alert("Success 🎉", "Account created successfully!");

        if (data.user.role === "user") navigation.replace("Home");
        if (data.user.role === "business")
          navigation.replace("BusinessDashboard");
        if (data.user.role === "verifier")
          navigation.replace("VerifierDashboard");
      } else if (res.status === 409) {
        Alert.alert(
          "Already Registered",
          "This email or phone is already in use."
        );
      } else if (res.status === 400) {
        Alert.alert("Invalid Details", "Please check your info and try again.");
      } else {
        Alert.alert("Server Error", data?.message || "Something went wrong.");
      }
    } catch (err) {
      Alert.alert(
        "Network Error",
        "Unable to connect to server. Check internet / backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Image
          source={require("../../assets/prakriti.png")}
          style={styles.heroImage}
        />

        <View style={styles.headerSection}>
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Prakriti and start contributing to responsible and sustainable
            travel.
          </Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSelector}>
          {["user", "business", "verifier"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleOption, role === r && styles.roleActive]}
              onPress={() => setRole(r)}
            >
              <Text
                style={[styles.roleText, role === r && styles.roleTextActive]}
              >
                {r === "user"
                  ? "Tourist / User"
                  : r === "business"
                  ? "Business"
                  : "Verifier"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs */}
        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#8A8A8A"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email or Mobile Number"
            placeholderTextColor="#8A8A8A"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
          />

          <TextInput
            style={styles.input}
            placeholder="Create Password"
            placeholderTextColor="#8A8A8A"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginLinkWrapper}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginAction}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 24,
    marginTop: 20,
  },
  heroImage: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginTop: 30,
    marginBottom: 20,
    opacity: 0.95,
  },

  headerSection: { marginBottom: 28 },
  appTitle: { fontSize: 28, fontWeight: "700", color: "#2F5C39" },
  subtitle: { fontSize: 14, color: "#5F705F", marginTop: 8, lineHeight: 18 },

  roleSelector: {
    flexDirection: "row",
    backgroundColor: "#E7EFEA",
    borderRadius: 12,
    marginBottom: 30,
    padding: 4,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  roleActive: { backgroundColor: "#2F5C39" },
  roleText: { fontSize: 13, fontWeight: "600", color: "#2F5C39" },
  roleTextActive: { color: "#FFFFFF" },

  formSection: { width: "100%" },
  input: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E3E3E3",
  },

  signupButton: {
    height: 52,
    backgroundColor: "#2F5C39",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  signupButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  loginLinkWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 26,
  },
  loginText: { color: "#5B5B5B", fontSize: 14 },
  loginAction: { color: "#2F5C39", fontSize: 14, fontWeight: "600" },
});
