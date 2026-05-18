import "react-native-gesture-handler"; // must be first import
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// Screens - Auth Modules
import SplashScreen from "./src/screens/auth/SplashScreen";
import Login from "./src/screens/auth/Login";
import Signup from "./src/screens/auth/SignUp";
import ForgotPassword from "./src/screens/auth/ForgotPassword";

// Screens - Tourist / Eco Ecosystem Modules
import HomeScreen from "./src/screens/tourist/HomeScreen";
import HistoryScreen from "./src/screens/tourist/HistoryScreen";
import ExplorerScreen from "./src/screens/tourist/ExplorerScreen";
import ScanScreen from "./src/screens/tourist/ScanScreen";
import HowToDisposeScreen from "./src/screens/tourist/HowToDispose";
import RefillStationsScreen from "./src/screens/tourist/RefillStationsScreen";
import CompostPointsScreen from "./src/screens/tourist/CompostPointsScreen";
import ReportLitterScreen from "./src/screens/tourist/ReportLitterScreen";
import RedeemPointsScreen from "./src/screens/tourist/RedeemPointsScreen";
import ProfileScreen from "./src/screens/tourist/ProfileScreen";

// Screens - Conversational Chat Modules
import AIChatIntroScreen from "./src/screens/chat/AIChatIntroScreen";
import AIChatThreadScreen from "./src/screens/chat/AIChatThreadScreen";

// Screens - Business Operator Modules
import BusinessDashboard from "./src/screens/business/BusinessDashboard";
import BusinessApplyStamp from "./src/screens/business/BusinessApplyStamp";
import BusinessInsights from "./src/screens/business/BusinessInsights";
import BusinessQR from "./src/screens/business/BusinessQR";

// Screens - Community Verifier Console Modules
import VerifierDashboard from "./src/screens/verifier/VerifierDashboard";
import VerifierDetailScreen from "./src/screens/verifier/VerifierDetailScreen";
import VerifierQueueScreen from "./src/screens/verifier/VerifierQueueScreen";
import VerifierBusinessRequests from "./src/screens/verifier/VerifierBusinessRequests";
import VerifierRequestDetail from "./src/screens/verifier/VerifierRequestDetail";
import VerifierReports from "./src/screens/verifier/VerifierReports";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ScanButton = ({ onPress }) => (
  <TouchableOpacity style={styles.scanButtonWrapper} onPress={onPress} activeOpacity={0.88}>
    <View style={styles.scanButtonInner}>
      <MaterialCommunityIcons name="qrcode-scan" size={26} color="#FFFFFF" />
    </View>
  </TouchableOpacity>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#0E6E59",
        tabBarInactiveTintColor: "#8AA094",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 4,
        },
        tabBarStyle: {
          height: Platform.OS === "ios" ? 82 : 72,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EBEFEA",
          paddingBottom: Platform.OS === "ios" ? 22 : 12,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.02,
          shadowRadius: 8,
          elevation: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: "",
          tabBarIcon: () => null,
          tabBarButton: (props) => <ScanButton {...props} />,
        }}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color }) => (
            <Ionicons name="time-outline" size={22} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Explorer"
        component={ExplorerScreen}
        options={{
          tabBarLabel: "Explore",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Splash" component={SplashScreen} />

                    <Stack.Screen name="Login" component={Login} />
                    <Stack.Screen name="Signup" component={Signup} />
                    <Stack.Screen name="Home" component={MainTabs} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />

                    <Stack.Screen name="HowToDispose" component={HowToDisposeScreen} />
                    <Stack.Screen
                        name="RefillStations"
                        component={RefillStationsScreen}
                        options={{ presentation: "modal", headerShown: false }}
                    />
                    <Stack.Screen
                        name="CompostPoints"
                        component={CompostPointsScreen}
                        options={{ presentation: "modal", headerShown: false }}
                    />
                    <Stack.Screen name="ReportLitter" component={ReportLitterScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="AIChatIntro" component={AIChatIntroScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="AIChatThread" component={AIChatThreadScreen} options={{ headerShown: false }} />
                    <Stack.Screen
                        name="RedeemPoints"
                        component={RedeemPointsScreen}
                        options={{ presentation: "modal", headerShown: false }}
                    />
                    <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="BusinessDashboard" component={BusinessDashboard} options={{ headerShown: false }} />
                    <Stack.Screen name="BusinessApplyStamp" component={BusinessApplyStamp} options={{ headerShown: false }} />
                    <Stack.Screen name="BusinessInsights" component={BusinessInsights} options={{ headerShown: false }} />
                    <Stack.Screen name="BusinessQR" component={BusinessQR} options={{ headerShown: false }} />

                    <Stack.Screen name="VerifierDashboard" component={VerifierDashboard} options={{ headerShown: false }} />
                    <Stack.Screen name="VerifierDetail" component={VerifierDetailScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="VerifierQueue" component={VerifierQueueScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="VerifierBusinessRequests" component={VerifierBusinessRequests} options={{ headerShown: false }} />
                    <Stack.Screen name="VerifierRequestDetail" component={VerifierRequestDetail} options={{ headerShown: false }} />
                    <Stack.Screen name="VerifierReports" component={VerifierReports} options={{ headerShown: false }} />
                </Stack.Navigator>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
  scanButtonWrapper: {
    position: "absolute",
    alignSelf: "center",
    bottom: 14,
  },
  scanButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#0E6E59",
    borderWidth: 5,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
});
