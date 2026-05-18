import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const SERVER = `${process.env.EXPO_PUBLIC_SERVER_IP || "http://192.168.31.3"}:8080`;

const BusinessApplyStamp = ({ navigation }) => {
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [checklist, setChecklist] = useState({
    refill: false,
    wasteSegregation: false,
    localProducts: false,
    noSingleUse: false,
  });

  const toggleCheck = (key) =>
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selected = result.assets || [result];
      setPhotos((prev) => [...prev, ...selected.map((i) => i.uri)]);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      return Alert.alert("Missing Info", "Please describe your sustainability practices.");
    }

    if (photos.length === 0) {
      return Alert.alert("Photos Required", "Please upload proof images.");
    }

    setLoading(true);

    try {
      const stored = await AsyncStorage.getItem("prakriti_user");
      const user = stored ? JSON.parse(stored) : null;

      if (!user || user.role !== "business") {
        Alert.alert("Session Error", "Please login as a Business.");
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append("business_id", user.id.toString());
      form.append("description", description.trim());
      form.append("checklist", JSON.stringify(checklist));

      photos.forEach((uri, index) => {
        form.append("photos", {
          uri,
          name: `photo_${Date.now()}_${index}.jpg`,
          type: "image/jpeg",
        });
      });

      const response = await fetch(`${SERVER}/api/v1/business/apply`, {
        method: "POST",
        body: form,
        headers: {
          "Accept": "application/json",
        },
      });

      const json = await response.json();
      console.log("Application Response:", json);

      if (!response.ok) {
        throw new Error(json.message || "Failed submitting application.");
      }

      Alert.alert("✅ Submitted!", "Your application is now under review.");
      navigation.replace("BusinessDashboard");

    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setLoading(false);
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
          <Text style={styles.headerTitle}>Green Stamp Application</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sustainability Description */}
          <View style={styles.aiCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="leaf" size={20} color="#0E6E59" />
              <Text style={styles.cardTitle}>Eco Practices Overview</Text>
            </View>

            <TextInput
              style={styles.aiInput}
              placeholder="Describe your environmental practices (e.g., we offer water refills, avoid single-use plastics, compost organic waste...)"
              placeholderTextColor="#8AA094"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Sustainability Practices Checklist */}
          <Text style={styles.sectionTitle}>Sustainability Practices</Text>
          <View style={styles.checklistCard}>
            {[
              { key: "refill", label: "Provides Water Refill" },
              { key: "wasteSegregation", label: "Segregates Waste Properly" },
              { key: "localProducts", label: "Promotes Local & Organic Products" },
              { key: "noSingleUse", label: "Avoids Single-Use Plastics" },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.8}
                style={[
                  styles.checkRow,
                  index < 3 && styles.borderBottom,
                ]}
                onPress={() => toggleCheck(item.key)}
              >
                <Text style={styles.checkLabel}>{item.label}</Text>
                <Ionicons
                  name={checklist[item.key] ? "checkbox" : "square-outline"}
                  size={22}
                  color={checklist[item.key] ? "#0E6E59" : "#8AA094"}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Image Upload Area */}
          <Text style={styles.sectionTitle}>Upload Proof Photos</Text>
          <View style={styles.uploadContainerCard}>
            <TouchableOpacity
              onPress={pickImage}
              style={styles.uploadBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="image-outline" size={20} color="#0E6E59" />
              <Text style={styles.uploadText}>Upload Proof Images</Text>
            </TouchableOpacity>

            {photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.previewScroll}
              >
                {photos.map((uri, i) => (
                  <View key={i} style={styles.previewWrapper}>
                    <Image source={{ uri }} style={styles.preview} />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.88}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Submit for Verification</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default BusinessApplyStamp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
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

  /* Scrollable Container Content */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  /* Descriptive Card Frame */
  aiCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E3B30",
  },
  aiInput: {
    backgroundColor: "#F4F6F4",
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    fontSize: 14,
    color: "#2E3B30",
    fontWeight: "500",
  },

  /* Subsection Header Styling */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8AA094",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },

  /* Checklist Container Cards */
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

  /* Upload Container Cards */
  uploadContainerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
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
  uploadBtn: {
    backgroundColor: "#EFF6F4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  uploadText: {
    color: "#0E6E59",
    fontWeight: "700",
    fontSize: 14,
  },
  previewScroll: {
    marginTop: 14,
  },
  previewWrapper: {
    padding: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
    marginRight: 10,
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },

  /* Solid Green Action CTA button */
  submitBtn: {
    backgroundColor: "#0E6E59",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
