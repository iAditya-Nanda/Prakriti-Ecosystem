import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER = "http://192.168.31.3:8080";

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState(null);
  const [avatarColor, setAvatarColor] = useState("#8AB78A");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem("prakriti_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);

      // Generate a random pleasant background color for avatar
      const colors = ["#7FB77E", "#6BAF92", "#8AB7A1", "#9FC8A6", "#7FB8B8", "#9CD4C3"];
      setAvatarColor(colors[Math.floor(Math.random() * colors.length)]);

      // Fetch fresh live details from PostgreSQL & Blockchain
      try {
        const res = await fetch(`${SERVER}/api/v1/auth/profile/${parsed.id}`);
        const json = await res.json();
        if (json.success && json.user) {
          const updatedUser = { ...parsed, ...json.user };
          setUser(updatedUser);
          await AsyncStorage.setItem("prakriti_user", JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.log("Failed to fetch fresh profile data:", err);
      }
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("prakriti_user");
    await AsyncStorage.removeItem("prakriti_role");

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const getInitial = () => user?.name ? user.name.charAt(0).toUpperCase() : "G";

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 6 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#2F5C39" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Profile Identity */}
        <View style={styles.profileCard}>

          {/* Avatar Initial */}
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitial()}</Text>
          </View>

          <Text style={styles.name}>{user?.name || "Guest User"}</Text>
          <Text style={styles.email}>{user?.contact || "demo@prakriti.app"}</Text>
          {user?.wallet_address && (
            <Text style={{ fontSize: 11, color: "#647367", marginTop: 4, fontFamily: "monospace" }}>
              Wallet: {user.wallet_address.substring(0, 10)}...{user.wallet_address.substring(user.wallet_address.length - 4)}
            </Text>
          )}
          <Text style={styles.roleBadge}>{(user?.role || "user").toUpperCase()}</Text>

          <View style={styles.impactRow}>
            <View style={styles.impactItem}>
              <Text style={styles.impactValue}>{user?.balance !== undefined ? user.balance : 0}</Text>
              <Text style={styles.impactLabel}>Green Points</Text>
            </View>
            <View style={styles.impactItem}>
              <Text style={styles.impactValue}>{user?.actions_logged !== undefined ? user.actions_logged : 0}</Text>
              <Text style={styles.impactLabel}>Actions Logged</Text>
            </View>
          </View>
        </View>

        {/* Action List */}
        <View style={styles.actionList}>
          <ProfileRow icon="pencil-outline" label="Edit Profile" onPress={() => {}} />
          <ProfileRow icon="sparkles-outline" label="Redeem Green Points" onPress={() => navigation.navigate("RedeemPoints")} />
          <ProfileRow icon="time-outline" label="Activity History" onPress={() => navigation.navigate("History")} />
          <ProfileRow icon="information-outline" label="About Prakriti" onPress={() => {}} />
        </View>

      </ScrollView>

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const ProfileRow = ({ icon, label, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.93 }]}>
    <Ionicons name={icon} size={22} color="#2F5C39" />
    <Text style={styles.rowLabel}>{label}</Text>
    <MaterialCommunityIcons name="chevron-right" size={22} color="#647367" />
  </Pressable>
);

export default ProfileScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9F8" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingBottom: 10 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#2F5C39" },

  profileCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 18,
    paddingVertical: 26,
    borderRadius: 18,
    elevation: 3,
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 42, fontWeight: "800", color: "#FFFFFF" },

  name: { fontSize: 20, fontWeight: "800", color: "#2F5C39", marginTop: 2 },
  email: { fontSize: 13, color: "#647367", marginTop: 2 },
  roleBadge: { fontSize: 12, marginTop: 8, fontWeight: "700", color: "#2F5C39", backgroundColor: "#E3EFE7", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },

  impactRow: { flexDirection: "row", marginTop: 20, justifyContent: "center", gap: 50 },
  impactItem: { alignItems: "center" },
  impactValue: { fontSize: 18, fontWeight: "800", color: "#2F5C39" },
  impactLabel: { fontSize: 12, color: "#647367", marginTop: 2 },

  actionList: { backgroundColor: "#FFFFFF", marginHorizontal: 18, borderRadius: 16, paddingVertical: 6, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#213B27", marginLeft: 12 },

  logoutBtn: { position: "absolute", bottom: 20, alignSelf: "center", backgroundColor: "#C84040", paddingVertical: 12, paddingHorizontal: 36, borderRadius: 14 },
  logoutText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
