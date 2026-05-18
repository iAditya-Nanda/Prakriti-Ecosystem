
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    FlatList,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const rewards = [
    {
        id: "1",
        title: "10% Off at Blue Leaf Eco Café",
        cost: 60,
        emoji: "☕",
    },
    {
        id: "2",
        title: "Free Bottle Refill Token",
        cost: 45,
        emoji: "💧",
    },
    {
        id: "3",
        title: "Local Souvenir: Eco Badge",
        cost: 90,
        emoji: "🎒",
    },
    {
        id: "4",
        title: "Support Tree Plantation (1 Sapling)",
        cost: 120,
        emoji: "🌱",
    },
];

const RedeemPointsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [userPoints, setUserPoints] = useState(0);

    useEffect(() => {
        const loadPoints = async () => {
            try {
                const stored = await AsyncStorage.getItem("prakriti_user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setUserPoints(parsed.balance || 0);
                }
            } catch (err) {
                console.log("Failed to load points on Redeem screen:", err);
            }
        };
        loadPoints();
    }, []);

    return (
        <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 6 }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="chevron-left" size={26} color="#2F5C39" />
                </Pressable>
                <Text style={styles.headerTitle}>Redeem Points</Text>
                <View style={{ width: 26 }} />
            </View>

            {/* POINT BALANCE */}
            <View style={styles.balanceCard}>
                <Ionicons name="sparkles-outline" size={22} color="#2F5C39" />
                <Text style={styles.balanceValue}>{userPoints} Green Points</Text>
                <Text style={styles.balanceSub}>Your sustainability impact score</Text>
            </View>

            {/* REWARDS LIST */}
            <FlatList
                data={rewards}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ padding: 18 }}
                renderItem={({ item }) => (
                    <View style={styles.rewardCard}>
                        <Text style={styles.rewardEmoji}>{item.emoji}</Text>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.rewardTitle}>{item.title}</Text>
                            <Text style={styles.rewardCost}>{item.cost} Points</Text>
                        </View>

                        <Pressable
                            style={[
                                styles.redeemBtn,
                                userPoints < item.cost && styles.redeemDisabled,
                            ]}
                            disabled={userPoints < item.cost}
                            onPress={() => console.log("Redeem clicked")}
                        >
                            <Text style={styles.redeemText}>
                                {userPoints < item.cost ? "Not Enough" : "Redeem"}
                            </Text>
                        </Pressable>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

export default RedeemPointsScreen;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F9F8" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingBottom: 10,
    },
    headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#2F5C39" },

    balanceCard: {
        backgroundColor: "#EAF3ED",
        marginHorizontal: 18,
        borderRadius: 14,
        padding: 18,
        alignItems: "center",
        marginBottom: 16,
    },
    balanceValue: { fontSize: 24, fontWeight: "800", color: "#2F5C39", marginTop: 8 },
    balanceSub: { fontSize: 12, color: "#587062", marginTop: 4 },

    rewardCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        elevation: 2,
    },
    rewardEmoji: { fontSize: 28, marginRight: 12 },
    rewardTitle: { fontSize: 15, fontWeight: "700", color: "#213B27" },
    rewardCost: { fontSize: 12, color: "#647367", marginTop: 2 },

    redeemBtn: {
        backgroundColor: "#2F5C39",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    redeemDisabled: { backgroundColor: "#C8D1CC" },
    redeemText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
});
