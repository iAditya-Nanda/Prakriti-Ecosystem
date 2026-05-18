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
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

const SERVER_IP = `${process.env.EXPO_PUBLIC_SERVER_IP || "http://192.168.31.3"}:8080`;

const levelColor = {
  Gold: "#CFAA62",
  Silver: "#A4A9B6",
  Certified: "#0E6E59",
};

const ExplorerScreen = () => {
  const [viewMode, setViewMode] = useState("map");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPlaces = async () => {
    try {
      const res = await fetch(`${SERVER_IP}/api/v1/places/all`);
      const json = await res.json();
      setPlaces(json.places || []);
    } catch (err) {
      console.log("Places fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* Sleek Top Navigation Bar */}
        <View style={styles.topBar}>
          <View style={styles.welcomeSection}>
            <Text style={styles.titleText}>Explore Green Places</Text>
            <Text style={styles.subText}>Himachal • Sustainable & Local</Text>
          </View>
        </View>

        {/* Tab Filters Styled as Premium Segment Control */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setViewMode("map")}
              style={[
                styles.filterBtn,
                viewMode === "map" && styles.filterActive,
              ]}
            >
              <MaterialCommunityIcons
                name="map"
                size={18}
                color={viewMode === "map" ? "#0E6E59" : "#8AA094"}
              />
              <Text
                style={[
                  styles.filterText,
                  viewMode === "map" && styles.filterTextActive,
                ]}
              >
                Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setViewMode("list")}
              style={[
                styles.filterBtn,
                viewMode === "list" && styles.filterActive,
              ]}
            >
              <MaterialCommunityIcons
                name="view-list"
                size={18}
                color={viewMode === "list" ? "#0E6E59" : "#8AA094"}
              />
              <Text
                style={[
                  styles.filterText,
                  viewMode === "list" && styles.filterTextActive,
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
            <Text style={{ marginTop: 12, color: "#8AA094", fontWeight: "600" }}>Fetching eco places…</Text>
          </View>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <View style={styles.center}>
            <MaterialCommunityIcons name="wifi-off" size={56} color="#8AA094" />
            <Text style={styles.errorTitle}>Unable to load places</Text>
            <Text style={styles.errorSub}>Check your connection.</Text>
          </View>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && places.length === 0 && (
          <View style={styles.center}>
            <MaterialCommunityIcons name="map-marker-off" size={56} color="#8AA094" />
            <Text style={styles.errorTitle}>No places available</Text>
          </View>
        )}

        {/* MAP VIEW */}
        {!loading && places.length > 0 && viewMode === "map" && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: places[0].coords.latitude,
              longitude: places[0].coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {places.map((p) => (
              <Marker key={p.id} coordinate={p.coords}>
                <MaterialCommunityIcons name="map-marker" size={38} color="#0E6E59" />
              </Marker>
            ))}
          </MapView>
        )}

        {/* LIST VIEW */}
        {!loading && places.length > 0 && viewMode === "list" && (
          <FlatList
            data={places}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardDistance}>
                    <Ionicons name="navigate-outline" size={11} color="#8AA094" /> {item.distance}
                  </Text>
                </View>

                <View style={[styles.levelTag, { borderColor: levelColor[item.level] }]}>
                  <Text style={[styles.levelText, { color: levelColor[item.level] }]}>
                    {item.level} Certified
                  </Text>
                </View>

                <View style={styles.tagRow}>
                  {item.tags.map((t, index) => (
                    <View key={index} style={styles.tagChip}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default ExplorerScreen;

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
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#EBEFEA",
  },
  welcomeSection: {
    justifyContent: "center",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2E3B30",
  },
  subText: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "500",
    marginTop: 2,
  },

  /* tab Segment Control container */
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
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

  /* SaaS Place List Cards */
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
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "750",
    color: "#2E3B30",
  },
  cardDistance: {
    fontSize: 12.5,
    color: "#8AA094",
    fontWeight: "500",
  },

  levelTag: {
    marginTop: 10,
    borderWidth: 1.5,
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "750",
    textTransform: "uppercase",
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 6,
  },
  tagChip: {
    backgroundColor: "#EFF6F4",
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0E6E59",
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
  },
});
