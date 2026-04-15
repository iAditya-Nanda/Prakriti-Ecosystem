import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    FlatList,
    ActivityIndicator
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

const SERVER_IP = "http://192.168.31.3:8080";

const CompostPointsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
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
        <SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom || 14 }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="close" size={26} color="#2F5C39" />
                </Pressable>

                <Text style={styles.title}>Compost Drop Points</Text>
                <View style={{ width: 26 }} />
            </View>

            <Text style={styles.subtitle}>Drop your food scraps instead of trashing them 🌱</Text>

            {/* BANNER */}
            <View style={styles.banner}>
                <MaterialCommunityIcons name="leaf-circle" size={26} color="#2F5C39" />
                <Text style={styles.bannerText}>
                    Your compost supports local gardens & keeps Himachal clean.
                </Text>
            </View>

            {/* Toggle */}
            <View style={styles.toggleRow}>
                <Pressable
                    onPress={() => setView("map")}
                    style={[styles.toggleBtn, view === "map" && styles.toggleActive]}
                >
                    <Ionicons name="map-outline" size={18} color={view === "map" ? "#FFF" : "#2F5C39"} />
                    <Text style={[styles.toggleText, view === "map" && styles.toggleTextActive]}>
                        Map
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setView("list")}
                    style={[styles.toggleBtn, view === "list" && styles.toggleActive]}
                >
                    <Ionicons name="list-outline" size={18} color={view === "list" ? "#FFF" : "#2F5C39"} />
                    <Text style={[styles.toggleText, view === "list" && styles.toggleTextActive]}>
                        List
                    </Text>
                </Pressable>
            </View>

            {/* LOADING */}
            {loading && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2F5C39" />
                    <Text style={{ marginTop: 8, color: "#6C7D73" }}>Loading compost points…</Text>
                </View>
            )}

            {/* ERROR */}
            {error && !loading && (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="wifi-off" size={46} color="#88988F" />
                    <Text style={styles.errorText}>Unable to load data</Text>
                    <Text style={styles.errorSub}>Check your internet connection.</Text>
                </View>
            )}

            {/* EMPTY */}
            {!loading && !error && points.length === 0 && (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="compost" size={46} color="#88988F" />
                    <Text style={styles.errorText}>No compost points available</Text>
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
                            <MaterialCommunityIcons name="compost" size={40} color="#2F5C39" />
                        </Marker>
                    ))}
                </MapView>
            )}

            {/* LIST VIEW */}
            {!loading && points.length > 0 && view === "list" && (
                <FlatList
                    data={points}
                    keyExtractor={i => String(i.id)}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardName}>{item.name}</Text>
                                <Text style={styles.cardBenefit}>{item.benefit}</Text>
                                <Text style={styles.cardDistance}>{item.distance} away</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={22} color="#6C7D73" />
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

export default CompostPointsScreen;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F9F8" },

    header: {
        marginTop: 8,
        paddingHorizontal: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: { fontSize: 18, fontWeight: "800", color: "#2F5C39" },
    subtitle: { textAlign: "center", marginTop: 4, fontSize: 13, color: "#55675F" },

    banner: {
        marginTop: 14,
        marginHorizontal: 18,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#EAF3ED",
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    bannerText: { fontSize: 13, color: "#2F5C39", flex: 1, fontWeight: "600" },

    toggleRow: { flexDirection: "row", marginHorizontal: 18, marginTop: 14, backgroundColor: "#E4EFE7", borderRadius: 12 },
    toggleBtn: { flex: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 8 },
    toggleActive: { backgroundColor: "#2F5C39", borderRadius: 12 },
    toggleText: { color: "#2F5C39", fontWeight: "700" },
    toggleTextActive: { color: "#FFF" },

    map: { flex: 1, marginTop: 12 },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        elevation: 3,
    },
    cardName: { fontSize: 15, color: "#203B2A", fontWeight: "700" },
    cardBenefit: { fontSize: 13, color: "#647367", marginTop: 3 },
    cardDistance: { fontSize: 12, color: "#89998F", marginTop: 6 },

    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText: { marginTop: 10, color: "#41524A", fontSize: 16, fontWeight: "700" },
    errorSub: { marginTop: 4, color: "#718379", fontSize: 13 },
});
