import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

const ForgotPassword = ({ navigation, route }) => {
  // If came from Login, default role is preserved
  const initialRole = route?.params?.role || "user";
  const [role, setRole] = useState(initialRole);
  const [emailOrPhone, setEmailOrPhone] = useState("");

  const handleReset = () => {
    console.log("Password Reset Request:", { role, emailOrPhone });

    // API POST → `/auth/reset-password` with { role, identifier: emailOrPhone }
    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* Sleek Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#0E6E59" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Console</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Header Description */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your registered email or phone to receive secure reset instructions.
            </Text>
          </View>

          {/* Role Selector Segment Control */}
          <View style={styles.roleSelector}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.roleOption, role === "user" && styles.roleActive]}
              onPress={() => setRole("user")}
            >
              <Text style={[styles.roleText, role === "user" && styles.roleTextActive]}>
                Tourist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.roleOption, role === "business" && styles.roleActive]}
              onPress={() => setRole("business")}
            >
              <Text style={[styles.roleText, role === "business" && styles.roleTextActive]}>
                Business
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.roleOption, role === "verifier" && styles.roleActive]}
              onPress={() => setRole("verifier")}
            >
              <Text style={[styles.roleText, role === "verifier" && styles.roleTextActive]}>
                Verifier
              </Text>
            </TouchableOpacity>
          </View>

          {/* Secure Input Box */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#8AA094" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email or Mobile Number"
              placeholderTextColor="#8AA094"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Reset Action */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.88}
          >
            <Text style={styles.resetText}>Send Reset Link</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },

  /* Sleek Top Navigation Bar */
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

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  headerSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2E3B30",
  },
  subtitle: {
    fontSize: 13.5,
    color: "#8AA094",
    marginTop: 6,
    lineHeight: 20,
    fontWeight: "500",
  },

  /* Role selector Segment Control styling */
  roleSelector: {
    flexDirection: "row",
    backgroundColor: "#F0F3F1",
    borderRadius: 20,
    padding: 3,
    marginBottom: 24,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 9.5,
    borderRadius: 17,
    alignItems: "center",
  },
  roleActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  roleText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#6A7D6E",
  },
  roleTextActive: {
    color: "#0E6E59",
    fontWeight: "750",
  },

  /* Secure text inputs styling */
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14.5,
    color: "#2E3B30",
    fontWeight: "500",
  },

  /* Reset Submit action styles */
  resetButton: {
    height: 48,
    backgroundColor: "#0E6E59",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  resetText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
