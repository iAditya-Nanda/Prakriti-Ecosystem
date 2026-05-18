import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Alert,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const SERVER = "http://100.111.171.19:8080";

const VerifierDetailScreen = ({ route, navigation }) => {
  const { submission } = route.params;

  const review = async (action) => {
    try {
      const res = await fetch(`${SERVER}/api/v1/submissions/${submission.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewer_id: 1,
          remarks: action === "approve" ? "Valid action" : "Invalid proof",
        }),
      });

      const json = await res.json();
      console.log(json);
      Alert.alert("Success", `Submission ${action}ed.`);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", "Failed to submit review.");
    }
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
          <Text style={styles.headerTitle}>Review Submission</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.scrollContent}>
          
          {/* Submission Info Card */}
          <View style={styles.card}>
            {submission.image ? (
              <Image source={{ uri: SERVER + submission.image }} style={styles.image} />
            ) : (
              <View style={styles.noImageFrame}>
                <MaterialCommunityIcons name="image-off" size={48} color="#D8DFDC" />
                <Text style={styles.noImageText}>No proof photo uploaded</Text>
              </View>
            )}
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{submission.title}</Text>
              <Text style={styles.location}>
                <Ionicons name="location-outline" size={13} color="#8AA094" /> {submission.location}
              </Text>
            </View>
          </View>

          {/* Action Button Row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => review("reject")}
              style={[styles.actionBtn, styles.reject]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => review("approve")}
              style={[styles.actionBtn, styles.approve]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
};

export default VerifierDetailScreen;

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

  /* Spacing Content Container */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  /* Detail Card View Frame */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  image: {
    width: "100%",
    height: 240,
    backgroundColor: "#EFF6F4",
  },
  noImageFrame: {
    width: "100%",
    height: 200,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "600",
    marginTop: 8,
  },
  textContainer: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2E3B30",
  },
  location: {
    fontSize: 13,
    color: "#8AA094",
    fontWeight: "600",
    marginTop: 6,
  },

  /* Action button row layout */
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  approve: {
    backgroundColor: "#0E6E59",
    shadowColor: "#0E6E59",
  },
  reject: {
    backgroundColor: "#C84040",
    shadowColor: "#C84040",
  },
  btnText: {
    color: "#FFFFFF",
    fontWeight: "750",
    fontSize: 15,
  },
});
