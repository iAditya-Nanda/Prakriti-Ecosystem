import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const SERVER = "http://192.168.31.3:8080";

const BusinessApplyStamp = ({ navigation }) => {
  const insets = useSafeAreaInsets();

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
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 6 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#2F5C39" />
        </Pressable>
        <Text style={styles.headerTitle}>Green Stamp Application</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>

        {/* Sustainability Description */}
        <View style={styles.aiCard}>
          <MaterialCommunityIcons name="leaf" size={22} color="#2F5C39" />
          <Text style={styles.aiTitle}>Tell us about your eco practices</Text>

          <TextInput
            style={styles.aiInput}
            placeholder="e.g., We offer water refills, avoid plastic, compost organic waste..."
            placeholderTextColor="#6E7C71"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Checklist */}
        <Text style={styles.sectionTitle}>Sustainability Practices</Text>
        {[
          { key: "refill", label: "Provides Water Refill" },
          { key: "wasteSegregation", label: "Segregates Waste Properly" },
          { key: "localProducts", label: "Promotes Local & Organic Products" },
          { key: "noSingleUse", label: "Avoids Single-Use Plastics" },
        ].map((item) => (
          <Pressable key={item.key} style={styles.checkRow} onPress={() => toggleCheck(item.key)}>
            <MaterialCommunityIcons
              name={checklist[item.key] ? "checkbox-marked" : "checkbox-blank-outline"}
              size={22}
              color="#2F5C39"
            />
            <Text style={styles.checkLabel}>{item.label}</Text>
          </Pressable>
        ))}

        {/* Image Upload */}
        <Text style={styles.sectionTitle}>Upload Proof Photos</Text>
        <Pressable onPress={pickImage} style={styles.uploadBtn}>
          <Ionicons name="image-outline" size={20} color="#2F5C39" />
          <Text style={styles.uploadText}>Upload Images</Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.preview} />
          ))}
        </ScrollView>

        {/* Submit */}
        <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit for Verification</Text>}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
};

export default BusinessApplyStamp;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9F8", paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#2F5C39",
  },

  aiCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    marginBottom: 20,
  },
  aiTitle: { fontSize: 15, fontWeight: "800", color: "#2F5C39", marginTop: 6 },
  aiSubtitle: {
    color: "#63746B",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  aiInput: {
    marginTop: 10,
    backgroundColor: "#F1F5F3",
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    fontSize: 14,
    color: "#213B27",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#213B27",
    marginBottom: 8,
    marginTop: 18,
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: "#2F5C39",
    fontWeight: "600",
  },

  uploadBtn: {
    backgroundColor: "#EAF3ED",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    elevation: 1,
  },
  uploadText: { color: "#2F5C39", fontWeight: "700", fontSize: 14 },

  preview: {
    width: 95,
    height: 95,
    borderRadius: 14,
    marginRight: 12,
    marginTop: 10,
  },

  submitBtn: {
    backgroundColor: "#2F5C39",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 28,
    marginBottom: 30,
    elevation: 2,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
