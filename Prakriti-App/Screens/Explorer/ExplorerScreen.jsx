import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    FlatList,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const SERVER_IP = "http://192.168.31.3:8080";

const levelColor = {
    Gold: "#CFAA62",
    Silver: "#A4A9B6",
    Certified: "#2E5D3F",
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
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.title}>Explore Green Places</Text>
                <Text style={styles.subtitle}>Himachal • Sustainable & Local</Text>
            </View>

            {/* Toggle */}
            <View style={styles.toggleRow}>
                <Pressable
                    onPress={() => setViewMode("map")}
                    style={[styles.toggleBtn, viewMode === "map" && styles.toggleActive]}
                >
                    <MaterialCommunityIcons
                        name="map"
                        size={18}
                        color={viewMode === "map" ? "#FFF" : "#2E5D3F"}
                    />
                    <Text style={[styles.toggleText, viewMode === "map" && styles.toggleTextActive]}>
                        Map
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setViewMode("list")}
                    style={[styles.toggleBtn, viewMode === "list" && styles.toggleActive]}
                >
                    <MaterialCommunityIcons
                        name="view-list"
                        size={18}
                        color={viewMode === "list" ? "#FFF" : "#2E5D3F"}
                    />
                    <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>
                        List
                    </Text>
                </Pressable>
            </View>

            {/* Loading */}
            {loading && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2E5D3F" />
                    <Text style={styles.loadingText}>Fetching eco places…</Text>
                </View>
            )}

            {/* Error */}
            {error && !loading && (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="wifi-off" size={48} color="#7A8A82" />
                    <Text style={styles.errorText}>Unable to load places</Text>
                    <Text style={styles.errorSub}>Check your connection.</Text>
                </View>
            )}

            {/* Empty */}
            {!loading && !error && places.length === 0 && (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="map-marker-off" size={48} color="#7A8A82" />
                    <Text style={styles.errorText}>No places available</Text>
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
                            <MaterialCommunityIcons name="map-marker" size={38} color="#2E5D3F" />
                        </Marker>
                    ))}
                </MapView>
            )}

            {/* LIST VIEW */}
            {!loading && places.length > 0 && viewMode === "list" && (
                <FlatList
                    data={places}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <Text style={styles.cardName}>{item.name}</Text>
                                <Text style={styles.cardDistance}>{item.distance}</Text>
                            </View>

                            <View style={[styles.levelTag, { borderColor: levelColor[item.level] }]}>
                                <Text style={[styles.levelText, { color: levelColor[item.level] }]}>
                                    {item.level} Stamp
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
    );
};

export default ExplorerScreen;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F5F8F6" },
    header: { padding: 20 },
    title: { fontSize: 20, fontWeight: "800", color: "#2E5D3F" },
    subtitle: { fontSize: 13, color: "#6F7D75", marginTop: 4 },

    toggleRow: { flexDirection: "row", backgroundColor: "#E3ECE6", borderRadius: 10, marginHorizontal: 20 },
    toggleBtn: { flex: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", paddingVertical: 8, gap: 6 },
    toggleActive: { backgroundColor: "#2E5D3F", borderRadius: 10 },
    toggleText: { color: "#2E5D3F", fontWeight: "700" },
    toggleTextActive: { color: "#FFF" },

    map: { flex: 1, marginTop: 12 },

    card: { backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 14, elevation: 3 },
    cardHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
    cardName: { fontSize: 16, fontWeight: "700", color: "#1F2F25" },
    cardDistance: { fontSize: 13, color: "#55675F" },

    levelTag: { marginTop: 8, borderWidth: 1.4, alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    levelText: { fontSize: 12, fontWeight: "700" },

    tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
    tagChip: { backgroundColor: "#E7EFEA", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginRight: 6, marginBottom: 6 },
    tagText: { fontSize: 12, fontWeight: "600", color: "#2E5D3F" },

    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 10, color: "#6F7D75" },
    errorText: { marginTop: 14, fontSize: 16, fontWeight: "700", color: "#435247" },
    errorSub: { color: "#6F7D75", marginTop: 4 },
});
