import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  role: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

const INITIAL_CHATS: Chat[] = [
  {
    id: '1',
    name: 'Ahmad Ali Electrician',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
    role: 'Electrician',
    lastMessage: "Sure, I'll be there in 10 minutes.",
    time: '12:45 PM',
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Malik Brothers Plumbing',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    role: 'Plumber',
    lastMessage: 'Budget looks fine. Send address please.',
    time: '10:30 AM',
    unreadCount: 0,
  },
  {
    id: '3',
    name: 'Nadia Mehndi Art',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'Mehndi Artist',
    lastMessage: 'Perfect, see you tomorrow.',
    time: 'Yesterday',
    unreadCount: 0,
  },
];

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  time: string;
}

export default function MessagesView() {
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({
    '1': [
      { id: '1', text: 'Hello, are you available now?', sender: 'user', time: '12:40 PM' },
      { id: '2', text: "Yes, I am free. What is the issue?", sender: 'other', time: '12:42 PM' },
      { id: '3', text: 'A socket in my lounge is sparking.', sender: 'user', time: '12:43 PM' },
      { id: '4', text: "Got it. I'll head out. Sure, I'll be there in 10 minutes.", sender: 'other', time: '12:45 PM' },
    ],
    '2': [
      { id: '1', text: 'Hey, I need a plumber to fix the kitchen sink.', sender: 'user', time: '10:20 AM' },
      { id: '2', text: 'Sure, budget is Rs. 1,200.', sender: 'other', time: '10:25 AM' },
      { id: '3', text: 'Okay, I agree.', sender: 'user', time: '10:28 AM' },
      { id: '4', text: 'Budget looks fine. Send address please.', sender: 'other', time: '10:30 AM' },
    ],
    '3': [
      { id: '1', text: 'Can you come tomorrow at 2 PM?', sender: 'user', time: '6:00 PM' },
      { id: '2', text: 'Yes, that works.', sender: 'other', time: '6:15 PM' },
      { id: '3', text: 'Perfect, see you tomorrow.', sender: 'user', time: '6:16 PM' },
    ],
  });

  const [inputMessage, setInputMessage] = useState('');

  const handleOpenChat = (chat: Chat) => {
    // Reset unread count
    setChats(
      chats.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
    );
    setSelectedChat(chat);
  };

  const handleSendMessage = () => {
    if (!selectedChat || inputMessage.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const chatId = selectedChat.id;
    const currentChatMessages = messages[chatId] || [];

    setMessages({
      ...messages,
      [chatId]: [...currentChatMessages, newMessage],
    });

    // Update last message in the chat thread list
    setChats(
      chats.map((c) =>
        c.id === chatId ? { ...c, lastMessage: inputMessage.trim(), time: 'Just now' } : c
      )
    );

    setInputMessage('');

    // Simulate auto response after 1.5 seconds
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for your message! I will get back to you shortly.',
        sender: 'other',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), responseMessage],
      }));

      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId ? { ...c, lastMessage: responseMessage.text, time: 'Just now' } : c
        )
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Chat List */}
      <ScrollView style={styles.chatList} contentContainerStyle={{ paddingBottom: 100 }}>
        {chats.map((chat) => (
          <Pressable
            key={chat.id}
            style={styles.chatItem}
            onPress={() => handleOpenChat(chat)}
          >
            <Image source={{ uri: chat.avatar }} style={styles.avatar} />

            <View style={styles.chatDetails}>
              <View style={styles.chatRow}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>

              <View style={styles.chatRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {chat.lastMessage}
                </Text>
                {chat.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Interactive Chat Room Modal */}
      {selectedChat && (
        <Modal
          visible={selectedChat !== null}
          animationType="slide"
          onRequestClose={() => setSelectedChat(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatRoomContainer}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { paddingTop: insets.top > 0 ? insets.top + 5 : 15 }]}>
              <Pressable onPress={() => setSelectedChat(null)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>

              <Image source={{ uri: selectedChat.avatar }} style={styles.modalAvatar} />

              <View style={styles.modalHeaderDetails}>
                <Text style={styles.modalName}>{selectedChat.name}</Text>
                <Text style={styles.modalRole}>{selectedChat.role}</Text>
              </View>

              <Pressable style={styles.callBtn}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Messages Body */}
            <ScrollView
              style={styles.messagesBody}
              contentContainerStyle={styles.messagesContent}
              ref={(ref) => {
                // Auto scroll to bottom
                setTimeout(() => ref?.scrollToEnd({ animated: true }), 100);
              }}
            >
              {(messages[selectedChat.id] || []).map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubbleContainer,
                      isUser ? styles.messageUser : styles.messageOther,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isUser ? styles.bubbleUser : styles.bubbleOther,
                      ]}
                    >
                      <Text style={isUser ? styles.bubbleUserText : styles.bubbleOtherText}>
                        {msg.text}
                      </Text>
                    </View>
                    <Text style={styles.messageTime}>{msg.time}</Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Bar */}
            <View style={[styles.inputBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 10 }]}>
              <TextInput
                style={styles.inputField}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                value={inputMessage}
                onChangeText={setInputMessage}
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  inputMessage.trim() === '' ? styles.sendBtnDisabled : styles.sendBtnEnabled,
                ]}
                onPress={handleSendMessage}
                disabled={inputMessage.trim() === ''}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#082C18',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: '#E5E7EB',
  },
  chatDetails: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  chatTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Modal styling
  chatRoomContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    backgroundColor: '#082C18',
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
    marginRight: 10,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  modalHeaderDetails: {
    flex: 1,
  },
  modalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalRole: {
    fontSize: 11,
    color: '#34D399',
  },
  callBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  messagesBody: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 25,
  },
  messageBubbleContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#082C18',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  bubbleUserText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  bubbleOtherText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    marginHorizontal: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    color: '#1F2937',
    marginRight: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnEnabled: {
    backgroundColor: '#10B981',
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
