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

import { CHAT_URL, CLEAR_URL, ANALYZE_URL } from "../../config";

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

      setMessages(start);
      saveHistory(start);
      scrollToBottom();

      // Automatically send the initial message to the server if not already sent
      if (initialMessage && !isAlreadySent) {
        await ask(initialMessage);
      }
    })();
  }, []);

  const saveHistory = async (msgs) =>
    AsyncStorage.setItem("chat_history", JSON.stringify(msgs));

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);

  const ask = async (text) => {
    if (!text.trim()) return;
    setInput("");

    // Create unique non-colliding ID for the user message
    const userMsgId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const userMsg = { id: userMsgId, sender: "user", text };
    setMessages((prev) => {
      const updated = [...prev, userMsg];
      saveHistory(updated);
      return updated;
    });
    scrollToBottom();

    setLoadingReply(true);
    setShowTyping(true);

    // Create unique non-colliding ID specifically for the bot message
    const botMsgId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const botMsg = { id: botMsgId, sender: "bot", text: "" };

    try {
      // Perform a standard POST request which is 100% supported on all physical phones
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json" // Request standard JSON instead of event-stream
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const json = await res.json();
      const reply = json.assistant || "I’m here to help 🌱";

      // Hide the loading state
      setLoadingReply(false);
      setShowTyping(false);

      // Inject the bot message bubble in the UI
      setMessages((prev) => [...prev, botMsg]);
      scrollToBottom();

      // High-performance typewriter character-by-character animation
      let currentText = "";
      let index = 0;
      const interval = setInterval(() => {
        if (index < reply.length) {
          currentText += reply[index];
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId ? { ...msg, text: currentText } : msg
            )
          );
          scrollToBottom();
          index++;
        } else {
          clearInterval(interval);
          // Persist the final state in the history once streaming completes
          setMessages((prev) => {
            saveHistory(prev);
            return prev;
          });
        }
      }, 12); // 12ms per character creates an incredibly satisfying, fluid typing effect!

    } catch (e) {
      console.log("Chat error:", e);
      setLoadingReply(false);
      setShowTyping(false);

      // Display a visual error bubble so the user understands why the API failed
      const errorMsg = {
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sender: "bot",
        text: `⚠️ **Connection Error**: Could not get a response from Prakriti AI.\n\nPlease verify that your server is running on the backend laptop.\n\n*(Endpoint: ${CHAT_URL})*`
      };

      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== botMsgId);
        const updated = [...filtered, errorMsg];
        saveHistory(updated);
        return updated;
      });
      scrollToBottom();
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

    // Append user image using functional updater with unique ID
    const userMsgId = `user_img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const userMsg = { id: userMsgId, sender: "user", image: uri };
    setMessages((prev) => {
      const updated = [...prev, userMsg];
      return updated;
    });
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
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const json = await res.json();
      const summary = json.analysis.summary;
      const steps = json.analysis.instructions.join("\n• ");
      const reply = `🌿 **${summary}**\n\n**How to dispose:**\n• ${steps}`;
      const botMsg = { id: Date.now().toString(), sender: "bot", text: reply };

      setMessages((prev) => {
        const updated = [...prev, botMsg];
        saveHistory(updated);
        return updated;
      });
      scrollToBottom();
    } catch (err) {
      console.log("Analysis error:", err);
      // Display a visual error bubble for image analysis failure
      const errorMsg = {
        id: `err_${Date.now()}`,
        sender: "bot",
        text: `⚠️ **Analysis Error**: Could not analyze the image.\n\nPlease verify that your AI vision server is running on the backend laptop.\n\n*(Endpoint: ${ANALYZE_URL})*`
      };
      setMessages((prev) => {
        const updated = [...prev, errorMsg];
        saveHistory(updated);
        return updated;
      });
      scrollToBottom();
    } finally {
      setShowTyping(false);
    }
  };

  const clearChat = async () => {
    try {
      // Fire-and-forget clear request to backend without blocking local UI reset
      fetch(CLEAR_URL, { method: "POST" }).catch((e) => 
        console.log("Backend chat clear error (ignoring to reset locally):", e)
      );
    } catch (err) {
      console.log("Clear request error:", err);
    }

    // Always clear local history instantly
    await AsyncStorage.removeItem("chat_history");
    setMessages([{ id: "hello", sender: "bot", text: "Hi! I’m Prakriti AI 🌿 Ask me anything." }]);
    scrollToBottom();
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

      <View style={{ flex: 1 }}>
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
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => `${item.id || "msg"}_${index}`}
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
      </View>
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
