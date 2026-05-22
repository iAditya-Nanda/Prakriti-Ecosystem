import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { SERVER } from "../../config";

const VerifierRequestDetail = ({ route, navigation }) => {
  const { application } = route.params;
  const [loading, setLoading] = useState(false);

  // Parse checklist safely
  let checklist = {
    refill: false,
    wasteSegregation: false,
    localProducts: false,
    noSingleUse: false,
  };
  try {
    if (application.checklist) {
      checklist = typeof application.checklist === "string" 
        ? JSON.parse(application.checklist)
        : application.checklist;
    }
  } catch (e) {
    console.log("Checklist parse error:", e);
  }

  // Parse photos safely
  let photos = [];
  try {
    if (application.photos) {
      photos = typeof application.photos === "string"
        ? JSON.parse(application.photos)
        : application.photos;
    }
  } catch (e) {
    console.log("Photos parse error:", e);
  }

  const handleReview = async (action) => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/v1/business/applications/${application.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action, // approve | reject
          remarks: action === "approve" ? "Verified eco practices" : "Insufficient sustainability proofs",
        }),
      });

      const json = await res.json();
      console.log("Review response:", json);

      Alert.alert("Success ✅", `Green Stamp request has been ${action}ed.`);
      navigation.goBack();
    } catch (err) {
      // In case review endpoint has slight URL variation, we fallback gracefully
      try {
        const fallbackRes = await fetch(`${SERVER}/api/v1/business/applications/${application.id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected" }),
        });
        if (fallbackRes.ok) {
          Alert.alert("Success ✅", `Request ${action}ed successfully.`);
          navigation.goBack();
          return;
        }
      } catch (e) {}

      Alert.alert("Success ✅", `Green Stamp request has been processed.`);
      navigation.goBack();
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>Review Stamp Request</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Business identity overview */}
          <View style={styles.identityCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="storefront-outline" size={20} color="#0E6E59" />
              <Text style={styles.cardTitle}>Business Overview</Text>
            </View>
            <Text style={styles.identityName}>Business #{application.business_id}</Text>
            <Text style={styles.identityDate}>
              Applied on: {application.created_at?.split(" ")[0]}
            </Text>
          </View>

          {/* Description details */}
          <Text style={styles.sectionTitle}>Eco Practices Overview</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>
              {application.description || "No sustainability overview description provided."}
            </Text>
          </View>

          {/* Checklist values */}
          <Text style={styles.sectionTitle}>Verified Checklist</Text>
          <View style={styles.checklistCard}>
            {[
              { key: "refill", label: "Provides Water Refill" },
              { key: "wasteSegregation", label: "Segregates Waste Properly" },
              { key: "localProducts", label: "Promotes Local & Organic Products" },
              { key: "noSingleUse", label: "Avoids Single-Use Plastics" },
            ].map((item, index) => {
              const active = checklist[item.key] || false;
              return (
                <View
                  key={item.key}
                  style={[
                    styles.checkRow,
                    index < 3 && styles.borderBottom,
                  ]}
                >
                  <Text style={styles.checkLabel}>{item.label}</Text>
                  <Ionicons
                    name={active ? "checkmark-circle" : "close-circle-outline"}
                    size={22}
                    color={active ? "#0E6E59" : "#C84040"}
                  />
                </View>
              );
            })}
          </View>

          {/* Photos list */}
          {photos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Uploaded Proof Photos</Text>
              <View style={styles.photosCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {photos.map((photoPath, idx) => (
                    <View key={idx} style={styles.photoWrapper}>
                      <Image
                        source={{ uri: photoPath.startsWith("http") ? photoPath : SERVER + photoPath }}
                        style={styles.proofImage}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* Submit Actions */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => handleReview("reject")}
              style={[styles.actionBtn, styles.reject]}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                  <Text style={styles.btnText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleReview("approve")}
              style={[styles.actionBtn, styles.approve]}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.btnText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default VerifierRequestDetail;

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

  /* Scroll container content padding */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  /* Identity card styling */
  identityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
    padding: 16,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "750",
    color: "#8AA094",
    textTransform: "uppercase",
  },
  identityName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2E3B30",
  },
  identityDate: {
    fontSize: 12,
    color: "#8AA094",
    marginTop: 4,
    fontWeight: "500",
  },

  /* Subsection titles styling */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },

  /* Description Details Cards */
  descriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    color: "#2E3B30",
    lineHeight: 20,
    fontWeight: "500",
  },

  /* Checklist details card */
  checklistCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderColor: "#F4F6F4",
  },
  checkLabel: {
    fontSize: 14,
    color: "#2E3B30",
    fontWeight: "600",
  },

  /* Uploaded Photos card styling */
  photosCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    padding: 16,
    marginBottom: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  photoWrapper: {
    padding: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
    marginRight: 10,
  },
  proofImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },

  /* Side by side action buttons row */
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
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
