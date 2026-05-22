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

import { SERVER } from "../../config";

const statusColor = {
  Available: "#0E6E59",
  "Low Pressure": "#CFAA62",
  Closed: "#C84040",
};

const RefillStationsScreen = ({ navigation }) => {
  const [mode, setMode] = useState("map"); // map | list
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [error, setError] = useState(null);

  const loadStations = async () => {
    try {
      const res = await fetch(`${SERVER}/api/v1/refill/all`);
      const json = await res.json();
      setStations(json.refillStations || []);
    } catch (err) {
      console.log("Station Fetch Error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
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
          <Text style={styles.headerTitle}>Refill Water Stations</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.subText}>Reduce plastic. Carry & refill your bottle 🌿</Text>
        </View>

        {/* Tab Filters Styled as Premium Segment Control */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode("map")}
              style={[
                styles.filterBtn,
                mode === "map" && styles.filterActive,
              ]}
            >
              <Ionicons
                name="map-outline"
                size={18}
                color={mode === "map" ? "#0E6E59" : "#8AA094"}
              />
              <Text
                style={[
                  styles.filterText,
                  mode === "map" && styles.filterTextActive,
                ]}
              >
                Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode("list")}
              style={[
                styles.filterBtn,
                mode === "list" && styles.filterActive,
              ]}
            >
              <Ionicons
                name="list-outline"
                size={18}
                color={mode === "list" ? "#0E6E59" : "#8AA094"}
              />
              <Text
                style={[
                  styles.filterText,
                  mode === "list" && styles.filterTextActive,
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
            <Text style={{ marginTop: 12, color: "#8AA094", fontWeight: "600" }}>Loading stations…</Text>
          </View>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <View style={styles.center}>
            <MaterialCommunityIcons name="wifi-off" size={56} color="#8AA094" />
            <Text style={styles.errorTitle}>Unable to load stations</Text>
            <Text style={styles.errorSub}>Check your connection or try again later.</Text>
          </View>
        )}

        {/* EMPTY STATE */}
        {!loading && stations.length === 0 && !error && (
          <View style={styles.center}>
            <MaterialCommunityIcons name="water-off" size={56} color="#8AA094" />
            <Text style={styles.errorTitle}>No refill stations nearby</Text>
            <Text style={styles.errorSub}>Explore town to discover refill spots 🌍</Text>
          </View>
        )}

        {/* MAP VIEW */}
        {!loading && stations.length > 0 && mode === "map" && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: stations[0].coords.latitude,
              longitude: stations[0].coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {stations.map((s) => (
              <Marker key={s.id} coordinate={s.coords}>
                <MaterialCommunityIcons name="water" size={36} color="#0E6E59" />
              </Marker>
            ))}
          </MapView>
        )}

        {/* LIST VIEW */}
        {!loading && stations.length > 0 && mode === "list" && (
          <FlatList
            data={stations}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardDistance}>
                    <Ionicons name="navigate-outline" size={11} color="#8AA094" /> {item.distance}
                  </Text>
                </View>

                <View style={[styles.statusTag, { borderColor: statusColor[item.status] || "#777" }]}>
                  <Text style={[styles.statusText, { color: statusColor[item.status] || "#777" }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default RefillStationsScreen;

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

  /* SaaS Refill Station List Cards */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EBEFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardName: {
    fontSize: 15,
    fontWeight: "750",
    color: "#2E3B30",
  },
  cardDistance: {
    fontSize: 12.5,
    color: "#8AA094",
    fontWeight: "500",
  },

  statusTag: {
    marginTop: 10,
    borderWidth: 1.5,
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "750",
    textTransform: "uppercase",
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
