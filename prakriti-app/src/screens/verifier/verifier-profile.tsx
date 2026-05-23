import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SERVER } from "../../config";

interface UserProfile {
  id: number;
  name: string;
  contact: string;
  role: string;
  wallet_address?: string;
  balance?: number;
}

export default function VerifierProfile({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile Edit fields
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  // Change Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("prakriti_token");
      const storedUser = await AsyncStorage.getItem("prakriti_user");
      if (!storedUser) {
        Alert.alert("Error", "User session not found.");
        navigation.replace("Login");
        return;
      }
      const parsedUser = JSON.parse(storedUser);

      // Fetch fresh details from backend
      const res = await fetch(`${SERVER}/api/v1/auth/profile/${parsedUser.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setName(data.user.name);
        setContact(data.user.contact);
        await AsyncStorage.setItem("prakriti_user", JSON.stringify(data.user));
      } else {
        // Fallback to offline stored data
        setUser(parsedUser);
        setName(parsedUser.name);
        setContact(parsedUser.contact);
      }
    } catch (err) {
      console.log("Failed to load verifier profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!name.trim() || !contact.trim()) {
      Alert.alert("Required Fields", "Name and contact are required.");
      return;
    }

    setSavingProfile(true);
    try {
      const token = await AsyncStorage.getItem("prakriti_token");
      const res = await fetch(`${SERVER}/api/v1/auth/profile/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert("Success", "Profile updated successfully!");
        const updated = {
          ...user,
          name: data.user.name,
          contact: data.user.contact,
        } as UserProfile;
        setUser(updated);
        await AsyncStorage.setItem("prakriti_user", JSON.stringify(updated));
      } else {
        Alert.alert("Update Failed", data.error || "Could not update profile details.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to Prakriti servers.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Required Fields", "Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Validation Error", "New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const token = await AsyncStorage.getItem("prakriti_token");
      const res = await fetch(`${SERVER}/api/v1/auth/change-password/${user?.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert("Success", "Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Failed", data.error || "Could not change password.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to Prakriti servers.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E6E59" />
        <Text style={styles.loadingText}>Fetching profile details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header bar */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#0E6E59" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Console Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Profile Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.avatarWrapper}>
              <MaterialCommunityIcons name="shield-account" size={40} color="#0E6E59" />
            </View>
            <Text style={styles.profileName}>{user.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user.role.toUpperCase()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>GP Balance</Text>
                <Text style={styles.statValue}>{user.balance || 0} GP</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Node Status</Text>
                <Text style={[styles.statValue, { color: "#2ECC71" }]}>Active</Text>
              </View>
            </View>
          </View>

          {/* Edit Profile Panel */}
          <Text style={styles.panelTitle}>Personal Information</Text>
          <View style={styles.panelCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Enter name"
                placeholderTextColor="#8AA094"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact / Email</Text>
              <TextInput
                value={contact}
                onChangeText={setContact}
                style={styles.input}
                placeholder="Enter contact detail"
                placeholderTextColor="#8AA094"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              onPress={handleUpdateProfile}
              disabled={savingProfile}
              style={styles.primaryButton}
              activeOpacity={0.88}
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Edit Password Panel */}
          <Text style={styles.panelTitle}>Change Password</Text>
          <View style={styles.panelCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor="#8AA094"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#8AA094"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#8AA094"
              />
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={changingPassword}
              style={[styles.primaryButton, { backgroundColor: "#2E3B30" }]}
              activeOpacity={0.88}
            >
              {changingPassword ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Cryptographic Wallet Info */}
          <Text style={styles.panelTitle}>Secure Blockchain Info</Text>
          <View style={[styles.panelCard, styles.walletCard]}>
            <MaterialCommunityIcons name="wallet" size={24} color="#0E6E59" style={styles.walletIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.walletLabel}>Secure Wallet Address</Text>
              <Text style={styles.walletAddress}>
                {user.wallet_address || "GP_MASTER_WALLET_ADDRESS"}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9F8",
  },
  loadingText: {
    fontSize: 13,
    color: "#8AA094",
    fontWeight: "750",
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EBEFEA",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2E3B30",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6F4",
    borderWidth: 1,
    borderColor: "#D3E4DC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2E3B30",
    marginTop: 12,
  },
  roleBadge: {
    backgroundColor: "#EFF6F4",
    borderColor: "#D3E4DC",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0E6E59",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#EBEFEA",
    width: "100%",
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#8AA094",
    fontWeight: "650",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2E3B30",
    marginTop: 3,
  },
  panelTitle: {
    fontSize: 11.5,
    fontWeight: "850",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  panelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    color: "#8AA094",
    fontWeight: "750",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F4F6F4",
    borderWidth: 1,
    borderColor: "#EBEFEA",
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: "#2E3B30",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#0E6E59",
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 1,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13.5,
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  walletIcon: {
    marginTop: 2,
  },
  walletLabel: {
    fontSize: 9.5,
    color: "#8AA094",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  walletAddress: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#2E3B30",
    marginTop: 2,
  },
});
