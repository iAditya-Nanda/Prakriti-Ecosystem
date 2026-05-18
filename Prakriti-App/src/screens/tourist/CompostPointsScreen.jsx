import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

const SERVER_IP = `${process.env.EXPO_PUBLIC_SERVER_IP || "http://192.168.31.3"}:8080`;

const CompostPointsScreen = ({ navigation }) => {
  const [view, setView] = useState("map"); // map | list

  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCompostPoints = async () => {
    try {
      const res = await fetch(`${SERVER_IP}/api/v1/compost/all`);
      const json = await res.json();
      setPoints(json.compostPoints || []);
    } catch (err) {
      console.log("Compost fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompostPoints();
  }, []);

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
            <Ionicons name="close-outline" size={26} color="#0E6E59" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compost Drop Points</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.subText}>Drop your food scraps instead of trashing them 🌱</Text>
        </View>

        {/* Informative Gardens Banner */}
        <View style={styles.banner}>
          <MaterialCommunityIcons name="leaf-circle" size={24} color="#0E6E59" />
          <Text style={styles.bannerText}>
            Your compost supports local gardens & keeps Himachal clean.
          </Text>
        </View>

        {/* Tab Filters Styled as Premium Segment Control */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView("map")}
              style={[
                styles.filterBtn,
                view === "map" && styles.filterActive,
              ]}
            >
              <Ionicons
                name="map-outline"
                size={18}
                color={view === "map" ? "#0E6E59" : "#8AA094"}
              />
              <Text
                style={[
                  styles.filterText,
                  view === "map" && styles.filterTextActive,
                ]}
              >
                Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView("list")}
              style={[
                styles.filterBtn,
                view === "list" && styles.filterActive,
              ]}
            >
              <Ionicons
                name="list-outline"
                size={18}
                color={view === "list" ? "#0E6E59" : "#8AA094"}
              />
              <Text
                style={[
                  styles.filterText,
                  view === "list" && styles.filterTextActive,
                ]}
              >
                List
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LOADING INDICATOR */}
        {loading && (
          <View style={[styles.center, { flex: 1 }]}>
            <ActivityIndicator size="large" color="#0E6E59" />
            <Text style={{ marginTop: 12, color: "#8AA094", fontWeight: "600" }}>Loading compost points…</Text>
          </View>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <View style={styles.center}>
            <MaterialCommunityIcons name="wifi-off" size={56} color="#8AA094" />
            <Text style={styles.errorTitle}>Unable to load data</Text>
            <Text style={styles.errorSub}>Check your internet connection.</Text>
          </View>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && points.length === 0 && (
          <View style={styles.center}>
            <MaterialCommunityIcons name="compost" size={56} color="#8AA094" />
            <Text style={styles.errorTitle}>No compost points available</Text>
            <Text style={styles.errorSub}>Explore the city for nearby drop hubs 🌱</Text>
          </View>
        )}

        {/* MAP VIEW */}
        {!loading && points.length > 0 && view === "map" && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: points[0].coords.latitude,
              longitude: points[0].coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {points.map(p => (
              <Marker key={p.id} coordinate={p.coords}>
                <MaterialCommunityIcons name="compost" size={38} color="#0E6E59" />
              </Marker>
            ))}
          </MapView>
        )}

        {/* LIST VIEW */}
        {!loading && points.length > 0 && view === "list" && (
          <FlatList
            data={points}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardBenefit}>{item.benefit}</Text>
                  <Text style={styles.cardDistance}>
                    <Ionicons name="navigate-outline" size={11} color="#8AA094" /> {item.distance} away
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={16} color="#8AA094" />
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default CompostPointsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
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

  /* Regional instruction banner */
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: "center",
  },
  subText: {
    fontSize: 12.5,
    color: "#8AA094",
    fontWeight: "500",
    textAlign: "center",
  },

  /* Informative Gardens Banner styling */
  banner: {
    marginTop: 14,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#EFF6F4",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#D3E4DC",
  },
  bannerText: {
    fontSize: 13,
    color: "#0E6E59",
    flex: 1,
    fontWeight: "700",
    lineHeight: 18,
  },

  /* tab Segment Control container */
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#F0F3F1",
    borderRadius: 20,
    padding: 3,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 9.5,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  filterActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  filterText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#6A7D6E",
  },
  filterTextActive: {
    color: "#0E6E59",
    fontWeight: "700",
  },

  /* Map View Full height */
  map: {
    flex: 1,
    marginTop: 10,
  },

  /* List view content padding */
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 80, // Tab-bar headroom
  },

  /* SaaS Compost Point List Cards */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "750",
    color: "#2E3B30",
  },
  cardBenefit: {
    fontSize: 13,
    color: "#8AA094",
    marginTop: 3,
    fontWeight: "500",
  },
  cardDistance: {
    fontSize: 12,
    color: "#8AA094",
    marginTop: 6,
    fontWeight: "500",
  },

  /* Error displays */
  errorTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "800",
    color: "#2E3B30",
  },
  errorSub: {
    color: "#8AA094",
    marginTop: 4,
    fontWeight: "500",
    textAlign: "center",
  },
});
