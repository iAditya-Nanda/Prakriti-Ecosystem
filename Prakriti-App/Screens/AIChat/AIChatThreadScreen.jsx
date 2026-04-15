import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const SERVER_IP = "http://192.168.31.3";
const CHAT_URL = `${SERVER_IP}:8001/chat`;
const CLEAR_URL = `${SERVER_IP}:8001/clear_history`;
const ANALYZE_URL = `${SERVER_IP}:8000/analyze`;

const AIChatThreadScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { initialMessage } = route.params;

  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [typingDots, setTypingDots] = useState("•");

  // ✅ Smooth typing dot cycle, no interpolation
  useEffect(() => {
    if (!showTyping) return;
    const frames = ["•", "••", "•••"];
    let i = 0;
    const id = setInterval(() => {
      setTypingDots(frames[i % frames.length]);
      i++;
    }, 500);
    return () => clearInterval(id);
  }, [showTyping]);

  // ✅ Load chat history + insert greeting + initial user message
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("chat_history");
      const old = stored ? JSON.parse(stored) : [];
      const start = [
        { id: "hello", sender: "bot", text: "Hi! I’m Prakriti AI 🌿 Ask me anything." },
        ...old,
        { id: Date.now().toString(), sender: "user", text: initialMessage }
      ];
      setMessages(start);
      scrollToBottom();
    })();
  }, []);

  const saveHistory = async (msgs) =>
    AsyncStorage.setItem("chat_history", JSON.stringify(msgs));

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);

  // ✅ Send text message to chat model
  const ask = async (text) => {
    if (!text.trim()) return;
    setInput("");

    const newMsgs = [...messages, { id: Date.now().toString(), sender: "user", text }];
    setMessages(newMsgs);
    saveHistory(newMsgs);
    scrollToBottom();

    setLoadingReply(true);
    setShowTyping(true);

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const json = await res.json();
      const reply = json.assistant || "I’m here to help 🌱";

      const updated = [...newMsgs, { id: Date.now().toString(), sender: "bot", text: reply }];
      setMessages(updated);
      saveHistory(updated);
      scrollToBottom();
    } catch (e) {
      console.log("Chat error:", e);
    } finally {
      setLoadingReply(false);
      setShowTyping(false);
    }
  };

  // ✅ Send image to analyzer model (8000)
  const sendImageForAnalysis = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    const uri = result.assets[0].uri;
    const fd = new FormData();
    fd.append("image", { uri, name: `item_${Date.now()}.jpg`, type: "image/jpeg" });

    const userMsgs = [...messages, { id: Date.now().toString(), sender: "user", image: uri }];
    setMessages(userMsgs);
    scrollToBottom();
    setShowTyping(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const json = await res.json();

      const summary = json.analysis.summary;
      const steps = json.analysis.instructions.join("\n• ");
      const reply = `🌿 **${summary}**\n\n**How to dispose:**\n• ${steps}`;

      const updated = [...userMsgs, { id: Date.now().toString(), sender: "bot", text: reply }];
      setMessages(updated);
      saveHistory(updated);
      scrollToBottom();
    } catch (err) {
      console.log("Analysis error:", err);
    } finally {
      setShowTyping(false);
    }
  };

  const clearChat = async () => {
    await fetch(CLEAR_URL, { method: "POST" });
    await AsyncStorage.removeItem("chat_history");
    setMessages([{ id: "hello", sender: "bot", text: "Chat cleared ✅" }]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.msgBubble, item.sender === "user" ? styles.right : styles.left]}>
      {item.text && <Text style={[styles.msgText, item.sender === "user" && { color: "#FFF" }]}>{item.text}</Text>}
      {item.image && <Image source={{ uri: item.image }} style={styles.msgImage} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#2F5C39" />
        </Pressable>
        <Text style={styles.headerTitle}>Prakriti AI Copilot</Text>
        <Pressable onPress={clearChat}>
          <MaterialCommunityIcons name="delete-outline" size={22} color="#C63F3F" />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
        />

        {/* ✅ Typing indicator fixed */}
        {showTyping && <Text style={styles.typing}>Prakriti AI is thinking {typingDots}</Text>}

        {/* Input */}
        <View style={[styles.inputRow, { paddingBottom: insets.bottom || 12 }]}>
          <Pressable onPress={sendImageForAnalysis} style={styles.attachBtn}>
            <MaterialCommunityIcons name="image-multiple" size={22} color="#2F5C39" />
          </Pressable>

          <TextInput
            placeholder="Ask Prakriti…"
            style={styles.input}
            value={input}
            onChangeText={setInput}
          />

          <Pressable onPress={() => ask(input)} style={styles.sendBtn}>
            {loadingReply ? <ActivityIndicator color="#FFF" /> : <MaterialCommunityIcons name="send" size={20} color="#FFF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AIChatThreadScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9F8" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E0E6E2" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#2F5C39" },

  msgBubble: { padding: 12, borderRadius: 14, marginBottom: 10, maxWidth: "75%" },
  left: { backgroundColor: "#EAF3ED", alignSelf: "flex-start" },
  right: { backgroundColor: "#2F5C39", alignSelf: "flex-end" },

  msgText: { fontSize: 14 },
  msgImage: { width: 170, height: 170, borderRadius: 12, marginTop: 6 },

  typing: { textAlign: "center", color: "#6A7B70", marginBottom: 6, fontSize: 13, fontStyle: "italic" },

  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: "#E0E6E2" },
  attachBtn: { paddingRight: 6 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 10, fontSize: 15 },
  sendBtn: { backgroundColor: "#2F5C39", padding: 12, borderRadius: 14 },
});
