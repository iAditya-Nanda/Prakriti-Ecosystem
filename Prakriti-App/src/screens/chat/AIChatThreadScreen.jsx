import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

const SERVER_IP = process.env.EXPO_PUBLIC_SERVER_IP || "http://192.168.31.3";
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

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("chat_history");
      const old = stored ? JSON.parse(stored) : [];
      
      // Filter out any existing welcome greetings in the saved history to avoid duplicate keys
      const oldFiltered = old.filter((item) => item.id !== "hello");
      
      // Avoid duplicating the initial message if it was already loaded in history
      const isAlreadySent = oldFiltered.some(
        (m) => m.text === initialMessage && m.sender === "user"
      );

      const start = [
        { id: "hello", sender: "bot", text: "Hi! I’m Prakriti AI 🌿 Ask me anything." },
        ...oldFiltered
      ];

      if (initialMessage && !isAlreadySent) {
        start.push({ id: `initial_${Date.now()}`, sender: "user", text: initialMessage });
      }

      setMessages(start);
      saveHistory(start);
      scrollToBottom();
    })();
  }, []);

  const saveHistory = async (msgs) =>
    AsyncStorage.setItem("chat_history", JSON.stringify(msgs));

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);

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

  const renderItem = ({ item }) => {
    const isUser = item.sender === "user";
    return (
      <View style={[styles.bubbleWrapper, isUser ? styles.rightAlign : styles.leftAlign]}>
        {!isUser && (
          <View style={styles.botAvatarWrapper}>
            <MaterialCommunityIcons name="leaf" size={14} color="#0E6E59" />
          </View>
        )}
        
        <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.botBubble]}>
          {item.text && (
            <Text style={[styles.msgText, isUser ? styles.userText : styles.botText]}>
              {item.text}
            </Text>
          )}
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.msgImage} />
          )}
        </View>

        {isUser && (
          <View style={styles.userAvatarWrapper}>
            <Ionicons name="person" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* Sleek Top Navigation Bar */}
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#0E6E59" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prakriti AI Copilot</Text>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={clearChat}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#C84040" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Typing Indicator */}
          {showTyping && (
            <View style={styles.typingWrapper}>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>Prakriti AI is thinking {typingDots}</Text>
              </View>
            </View>
          )}

          {/* Prompt Attach & Input Area */}
          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity
              onPress={sendImageForAnalysis}
              style={styles.attachBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="image-outline" size={22} color="#0E6E59" />
            </TouchableOpacity>

            <TextInput
              placeholder="Ask Prakriti AI…"
              placeholderTextColor="#8AA094"
              style={styles.input}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => ask(input)}
            />

            <TouchableOpacity
              onPress={() => ask(input)}
              style={styles.sendBtn}
              activeOpacity={0.8}
              disabled={loadingReply}
            >
              {loadingReply ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default AIChatThreadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F8", // Soft crisp light-grey SaaS base
  },

  /* Sleek Top Navigation Bar */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EBEFEA",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2E3B30",
  },
  clearBtn: {
    padding: 4,
  },

  /* Chat lists */
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  bubbleWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    width: "100%",
    gap: 8,
  },
  botAvatarWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6F4",
    borderWidth: 1,
    borderColor: "#D3E4DC",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0E6E59",
    alignItems: "center",
    justifyContent: "center",
  },
  leftAlign: {
    justifyContent: "flex-start",
  },
  rightAlign: {
    justifyContent: "flex-end",
  },

  /* High-end message bubbles */
  msgBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 0.5,
  },
  userBubble: {
    backgroundColor: "#0E6E59",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4, // bubble curve
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBEFEA",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 4, // bubble curve
  },

  msgText: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  userText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  botText: {
    color: "#2E3B30",
    fontWeight: "500",
  },
  msgImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#EBEFEA",
  },

  /* Typing indicators */
  typingWrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  typingBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBEFEA",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 12,
    color: "#8AA094",
    fontWeight: "600",
    fontStyle: "italic",
  },

  /* Bottom Docked Input */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#EBEFEA",
    gap: 10,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F6F4",
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#2E3B30",
    fontWeight: "500",
  },
  sendBtn: {
    backgroundColor: "#0E6E59",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0E6E59",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1.5,
  },
});
