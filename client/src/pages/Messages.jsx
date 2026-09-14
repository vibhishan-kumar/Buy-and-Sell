import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MessageSquare, Send, User, Package, Check, CheckCheck, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Messages() {
  const { user } = useAuth();
  const { socket, decrementMessages } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const initialConvId = searchParams.get('conv');

  // Load conversations
  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      const list = data.conversations || [];
      setConversations(list);

      if (initialConvId) {
        setActiveConvId(parseInt(initialConvId, 10));
      } else if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [initialConvId]);

  // When activeConvId changes, load its message thread
  useEffect(() => {
    if (!activeConvId) return;

    // Find conversation meta
    const conv = conversations.find((c) => c.id === activeConvId);
    if (conv) {
      setActiveConversation(conv);
      // Decrement unread count in socket context
      if (conv.unread_count > 0) {
        decrementMessages(conv.unread_count);
        // mark local as 0
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
        );
      }
    }

    async function loadMessages() {
      setLoadingMsgs(true);
      try {
        const data = await api.getMessages(activeConvId);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMsgs(false);
      }
    }
    loadMessages();

    // Join socket room
    if (socket) {
      socket.emit('join_conversation', activeConvId);
    }

    return () => {
      if (socket) {
        socket.emit('leave_conversation', activeConvId);
      }
    };
  }, [activeConvId, socket]);

  // Listen for real-time incoming messages in current active conversation
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversation_id === activeConvId) {
        setMessages((prev) => [...prev, msg]);
      } else {
        // Increment unread count for other conversation in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === msg.conversation_id
              ? { ...c, last_message: msg.message_text, unread_count: (c.unread_count || 0) + 1 }
              : c
          )
        );
      }
    };

    const handleTyping = (data) => {
      if (data.conversationId === activeConvId) {
        setTypingUser(data.userName || 'Other student');
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (data.conversationId === activeConvId) {
        setIsTyping(false);
        setTypingUser('');
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, activeConvId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvId) return;

    const textToSend = messageText.trim();
    setMessageText('');

    if (socket) {
      socket.emit('stop_typing', { conversationId: activeConvId });
    }

    try {
      const res = await api.sendMessage(activeConvId, textToSend);
      // Update conversations last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, last_message: textToSend, updated_at: new Date() } : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (!socket || !activeConvId) return;

    socket.emit('typing', { conversationId: activeConvId, userName: user.name });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: activeConvId });
    }, 2000);
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem 1.25rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Campus Student Chat</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Real-time peer-to-peer communication powered by Socket.IO
        </p>
      </div>

      <div className="chat-container">
        {/* Left: Conversation List */}
        <div className="conversation-list">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>Conversations</span>
          </div>

          {loadingConvs ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No messages yet. Find a product on the marketplace and tap "Message Seller" to start a chat!
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveConvId(c.id);
                    setSearchParams({ conv: c.id });
                  }}
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                >
                  <img
                    src={c.other_user_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={c.other_user_name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {c.other_user_name}
                      </span>
                      {c.unread_count > 0 && (
                        <span className="badge badge-active" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    {c.product_name && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 600, marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Item: {c.product_name}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.last_message || 'Chat started'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Active Chat View */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '520px', background: '#fff' }}>
          {activeConvId && activeConversation ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={activeConversation.other_user_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={activeConversation.other_user_name}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{activeConversation.other_user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activeConversation.other_user_department || 'University of Hyderabad'}
                    </div>
                  </div>
                </div>

                {/* Product Context Shortcut */}
                {activeConversation.product_id && (
                  <Link
                    to={`/products/${activeConversation.product_id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--primary)' }}
                  >
                    <Package size={14} color="var(--teal)" />
                    <span style={{ fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeConversation.product_name}
                    </span>
                    {activeConversation.product_price && (
                      <span style={{ fontWeight: 800 }}>₹{parseFloat(activeConversation.product_price).toLocaleString('en-IN')}</span>
                    )}
                  </Link>
                )}
              </div>

              {/* Chat Messages Body */}
              <div className="chat-messages">
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading message thread...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Send a message to coordinate pickup or ask questions about the item.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOutgoing = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`message-bubble ${isOutgoing ? 'message-outgoing' : 'message-incoming'}`}
                      >
                        <div>{m.message_text}</div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
                            gap: '0.3rem',
                            opacity: 0.8
                          }}
                        >
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isOutgoing && (
                            <span>{m.is_read ? <CheckCheck size={12} /> : <Check size={12} />}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Real-time Typing Indicator */}
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                    {typingUser} is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', background: '#fff' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type a message (e.g. Is this still available? Let's meet at library steps)..."
                  value={messageText}
                  onChange={handleInputChange}
                  style={{ borderRadius: 'var(--radius-full)' }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!messageText.trim()}
                  style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, flexShrink: 0 }}
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: '2rem' }}>
              <MessageSquare size={52} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <h3>Select a Conversation</h3>
              <p style={{ fontSize: '0.88rem' }}>Choose an existing chat thread or start a new inquiry from the marketplace.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
