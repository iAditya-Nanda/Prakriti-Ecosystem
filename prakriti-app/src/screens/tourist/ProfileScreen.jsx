import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SERVER } from "../../config";

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState(null);
  const [avatarColor, setAvatarColor] = useState("#0E6E59");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem("prakriti_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);

      // Generate a pleasant organic tone background color for avatar
      const colors = ["#0E6E59", "#118A74", "#2E8B57", "#4E9A85", "#5C9E89", "#3F8A6B"];
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
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Identity Card */}
          <View style={styles.profileCard}>
            {/* Avatar circle */}
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{getInitial()}</Text>
            </View>

            <Text style={styles.name}>{user?.name || "Guest User"}</Text>
            <Text style={styles.email}>{user?.contact || "demo@prakriti.app"}</Text>
            {user?.wallet_address && (
              <Text style={{ fontSize: 11, color: "#8AA094", marginTop: 4, fontFamily: "monospace" }}>
                Wallet: {user.wallet_address.substring(0, 10)}...{user.wallet_address.substring(user.wallet_address.length - 4)}
              </Text>
            )}
            
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{(user?.role || "user").toUpperCase()}</Text>
            </View>

            {/* Premium environmental impact stats */}
            <View style={styles.impactRow}>
              <View style={styles.impactItem}>
                <Text style={styles.impactValue}>{user?.balance !== undefined ? user.balance : 0}</Text>
                <Text style={styles.impactLabel}>Green Points</Text>
              </View>

              {/* Vertical Hairline separator */}
              <View style={styles.divider} />

              <View style={styles.impactItem}>
                <Text style={styles.impactValue}>{user?.actions_logged !== undefined ? user.actions_logged : 0}</Text>
                <Text style={styles.impactLabel}>Actions Logged</Text>
              </View>
            </View>
          </View>

          {/* Action List Settings Menu */}
          <Text style={styles.sectionTitle}>Account Options</Text>
          
          <View style={styles.actionList}>
            <ProfileRow
              icon="pencil-outline"
              label="Edit Profile"
              onPress={() => {}}
            />
            <ProfileRow
              icon="sparkles-outline"
              label="Redeem Green Points"
              onPress={() => navigation.navigate("RedeemPoints")}
            />
            <ProfileRow
              icon="time-outline"
              label="Activity History"
              onPress={() => navigation.navigate("History")}
            />
            <ProfileRow
              icon="information-outline"
              label="About Prakriti App"
              onPress={() => {}}
            />
          </View>

          {/* Logout Button nested safely inside the scroll */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const ProfileRow = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.row}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={20} color="#0E6E59" />
    <Text style={styles.rowLabel}>{label}</Text>
    <Ionicons name="chevron-forward-outline" size={16} color="#8AA094" />
  </TouchableOpacity>
);

export default ProfileScreen;

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

  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },

  /* SaaS Identity Card Widget styling */
  profileCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
    marginBottom: 20,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  name: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2E3B30",
  },
  email: {
    fontSize: 13,
    color: "#8AA094",
    marginTop: 3,
    fontWeight: "500",
  },

  roleBadge: {
    backgroundColor: "#EFF6F4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: "#D3E4DC",
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0E6E59",
    letterSpacing: 0.5,
  },

  /* double column impact grids */
  impactRow: {
    flexDirection: "row",
    marginTop: 24,
    alignSelf: "stretch",
    alignItems: "center",
  },
  impactItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "#EBEFEA",
  },
  impactValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0E6E59",
  },
  impactLabel: {
    fontSize: 12,
    color: "#8AA094",
    marginTop: 3,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "850",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },

  /* setting menu options */
  actionList: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F6F4",
  },
  rowLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "650",
    color: "#2E3B30",
    marginLeft: 12,
  },

  /* Crimson Logout Action */
  logoutBtn: {
    marginTop: 32,
    backgroundColor: "#C84040",
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 25,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#C84040",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14.5,
  },
});
