import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Users, Search } from 'lucide-react';
import io from 'socket.io-client';

const ChatPanel = ({ isOpen, onClose, currentUser, selectedConnection }) => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const messagesEndRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isOpen && currentUser) {
      const token = localStorage.getItem('token');
      const newSocket = io(import.meta.env.VITE_API_URL, {
        auth: {
          token: token
        }
      });
      setSocket(newSocket);

      // Join user's room
      newSocket.emit('join');

      // Get online users on connection
      newSocket.emit('get_online_users');

      // Listen for incoming messages
      newSocket.on('receive_message', (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      // Listen for message sent confirmation (don't add to messages, just for confirmation)
      newSocket.on('message_sent', (message) => {
        // Message already added optimistically, just scroll
        scrollToBottom();
      });

      // Listen for online users list
      newSocket.on('online_users', (userIds) => {
        setOnlineUsers(new Set(userIds));
      });

      // Listen for user coming online
      newSocket.on('user_online', (userId) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      // Listen for user going offline
      newSocket.on('user_offline', (userId) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      // Handle connection errors
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Handle disconnection
      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          newSocket.connect();
        }
      });

      // Handle reconnection
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        // Re-join user's room after reconnection
        newSocket.emit('join');
        // Get online users again after reconnection
        newSocket.emit('get_online_users');
      });

      // Handle message errors
      newSocket.on('message_error', (error) => {
        console.error('Message error:', error);
      });

      return () => {
        // Clean up all event listeners
        newSocket.off('receive_message');
        newSocket.off('message_sent');
        newSocket.off('online_users');
        newSocket.off('user_online');
        newSocket.off('user_offline');
        newSocket.off('connect_error');
        newSocket.off('disconnect');
        newSocket.off('reconnect');
        newSocket.off('message_error');
        newSocket.close();
      };
    }
  }, [isOpen, currentUser]);

  // Fetch user conversations
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchConversations();
    }
  }, [isOpen, currentUser]);

  // Handle direct conversation initiation from selectedConnection
  useEffect(() => {
    if (selectedConnection && currentUser) {
      const directConversation = {
        _id: `direct_${selectedConnection._id}`,
        otherUser: selectedConnection,
        lastMessage: { text: "Start a conversation...", timestamp: new Date() },
        unreadCount: 0
      };
      setActiveConversation(directConversation);
      fetchMessages(selectedConnection._id);
      markMessagesAsRead(selectedConnection._id);
    }
  }, [selectedConnection, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/messages/conversations/${currentUser._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/messages/conversation/${currentUser._id}/${otherUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !socket) return;

    const messageText = newMessage.trim();
    const messageData = {
      receiverId: activeConversation.otherUser._id,
      text: messageText
    };

    // Optimistic update - add message immediately to UI
    const optimisticMessage = {
      _id: `temp_${Date.now()}`,
      senderId: { _id: currentUser._id, name: currentUser.name },
      receiverId: { _id: activeConversation.otherUser._id },
      text: messageText,
      timestamp: new Date(),
      isRead: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    scrollToBottom();

    socket.emit('send_message', messageData);
  };

  const selectConversation = (conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.otherUser._id);
    // Mark messages as read when opening conversation
    markMessagesAsRead(conversation.otherUser._id);
  };

  const markMessagesAsRead = async (senderId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/messages/read/${senderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Refresh conversations to update unread count
      fetchConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <MessageCircle size={24} />
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Chat Content */}
      <div className="flex-1 flex overflow-hidden">
          {/* Left Half - Conversations List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto bg-white">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                      activeConversation && activeConversation.otherUser._id === conversation.otherUser._id
                        ? 'bg-blue-100 border-l-4 border-l-blue-500'
                        : 'hover:bg-blue-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold">
                          {conversation.otherUser.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">
                            {conversation.otherUser.name}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center animate-pulse">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.text}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(conversation.lastMessage.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Users className="text-white" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-600">Connect with study partners to start chatting!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Half - Active Conversation */}
          <div className="w-1/2 flex flex-col">
            {activeConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {activeConversation.otherUser.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {activeConversation.otherUser.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {onlineUsers.has(activeConversation.otherUser._id) ? (
                        <>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <p className="text-xs text-green-200 font-medium">Online</p>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <p className="text-xs text-gray-300 font-medium">Offline</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.senderId._id === currentUser._id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                            message.senderId._id === currentUser._id
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId._id === currentUser._id
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white shadow-lg">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* No Conversation Selected */
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageCircle className="text-white" size={40} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the left to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default ChatPanel;
