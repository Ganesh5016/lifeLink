// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Message {
  _id: string;
  sender: { _id: string; name: string };
  content: string;
  createdAt: string;
}

export default function ChatScreen({ route, navigation }: any) {
  const { requestId, recipientName } = route.params || {};
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    socket?.emit('join_chat', { requestId });
    socket?.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => { socket?.off('new_message'); socket?.emit('leave_chat', { requestId }); };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/chat/${requestId}`);
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    try {
      await api.post(`/chat/${requestId}/message`, { content: trimmed });
    } catch {}
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender._id === user?._id;
    return (
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
        {!isMe && <Text style={styles.senderName}>{item.sender.name}</Text>}
        <Text style={[styles.msgText, isMe && styles.myMsgText]}>{item.content}</Text>
        <Text style={[styles.time, isMe && styles.myTime]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{recipientName || 'Chat'}</Text>
          <Text style={styles.subTitle}>Blood Request Chat</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#ef4444" style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={i => i._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.empty}>No messages yet. Start the conversation!</Text>
          }
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor="#475569"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 8 },
  backText: { color: '#ef4444', fontSize: 22, fontWeight: '700' },
  headerTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  subTitle: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  msgList: { padding: 16, gap: 8 },
  bubble: {
    maxWidth: '78%', borderRadius: 18, padding: 12, marginVertical: 2,
  },
  myBubble: {
    alignSelf: 'flex-end', backgroundColor: '#ef4444',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start', backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  senderName: { color: '#94a3b8', fontSize: 11, marginBottom: 2, fontWeight: '600' },
  msgText: { color: '#cbd5e1', fontSize: 15, lineHeight: 20 },
  myMsgText: { color: '#fff' },
  time: { color: '#64748b', fontSize: 10, marginTop: 4, textAlign: 'right' },
  myTime: { color: 'rgba(255,255,255,0.6)' },
  empty: { color: '#475569', textAlign: 'center', marginTop: 60, fontSize: 14 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#111118',
  },
  input: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    color: '#f8fafc', fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  sendIcon: { color: '#fff', fontSize: 18 },
});
