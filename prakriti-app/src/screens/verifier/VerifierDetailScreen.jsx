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
  ScrollView,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SERVER } from "../../config";

const VerifierDetailScreen = ({ route, navigation }) => {
  const { submission } = route.params;

  const review = async (action) => {
    try {
      const token = await AsyncStorage.getItem("prakriti_token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${SERVER}/api/v1/submissions/${submission.id}/review`, {
        method: "POST",
        headers,
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Submission Info Details Card */}
          <View style={styles.infoCard}>
            <Text style={styles.title}>{submission.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.location}>
                <Ionicons name="location-outline" size={13} color="#8AA094" /> {submission.location}
              </Text>
              <Text style={styles.date}>
                <Ionicons name="calendar-outline" size={13} color="#8AA094" /> {submission.timestamp?.split("T")[0] || "Today"}
              </Text>
            </View>
          </View>

          {/* 1st SCANNED IMAGE */}
          <Text style={styles.imageSectionTitle}>1st: Scanned Waste Item</Text>
          <View style={styles.imageCard}>
            {submission.scanned_image ? (
              <Image
                source={{
                  uri: submission.scanned_image.startsWith("http")
                    ? submission.scanned_image
                    : (SERVER + submission.scanned_image)
                }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageFrame}>
                <MaterialCommunityIcons name="image-off" size={36} color="#B5C4BC" />
                <Text style={styles.noImageText}>No original scan captured</Text>
              </View>
            )}
            <View style={styles.imageTagBadge}>
              <Text style={styles.imageTagText}>ORIGINAL SCAN</Text>
            </View>
          </View>

          {/* 2nd DISPOSAL PROOF IMAGE */}
          <Text style={styles.imageSectionTitle}>2nd: Disposal Proof Photo</Text>
          <View style={styles.imageCard}>
            {submission.image ? (
              <Image
                source={{
                  uri: submission.image.startsWith("http")
                    ? submission.image
                    : (SERVER + submission.image)
                }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageFrame}>
                <MaterialCommunityIcons name="image-off" size={36} color="#B5C4BC" />
                <Text style={styles.noImageText}>No proof photo uploaded</Text>
              </View>
            )}
            <View style={[styles.imageTagBadge, { backgroundColor: "#EFF6F4" }]}>
              <Text style={[styles.imageTagText, { color: "#0E6E59" }]}>DISPOSAL PROOF</Text>
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
        </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Submission Info Header Card */
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2E3B30",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  location: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "600",
  },

  /* Image Section Title spacing */
  imageSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6A7D6E",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 8,
  },

  /* Card frames for stacked images */
  imageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#EFF6F4",
  },
  noImageFrame: {
    width: "100%",
    height: 140,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "600",
    marginTop: 6,
  },

  /* Absolute badge on images */
  imageTagBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#EFF3F1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  imageTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6A7D6E",
    letterSpacing: 0.5,
  },

  /* Action button row layout */
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
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
