import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';
import Header from '../components/Header';

export default function Messaging() {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const notificationSound = useRef(
    new Audio(
      'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
    )
  );

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    const fetchUserAndConnect = async () => {
      try {
        const res = await api.get('/user/me');
        setCurrentUser(res.data);
        newSocket.emit('join_room', res.data.id);
      } catch (err) {
        console.error('Socket init failed', err);
      }
    };

    fetchUserAndConnect();
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (message) => {
      // Parse attachment if returned as JSON string
      if (message.attachment && typeof message.attachment === 'string') {
        try {
          message.attachment = JSON.parse(message.attachment);
        } catch (e) {
          // ignore parse errors
        }
      }

      if (activeChat && activeChat.partner_id === message.sender_id) {
        setMessages((prev) => [...prev, message]);
        if (document.hasFocus()) {
          api.put(`/messages/read/${message.sender_id}`).catch(console.error);
        }
      } else {
        notificationSound.current
          .play()
          .catch((e) => console.warn('Audio blocked', e));
      }
      fetchConversations();
    });

    return () => socket.off('receive_message');
  }, [socket, activeChat, conversations]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (location.state?.startChatWith && !loading) {
      const { owner_id, business_name, logo_url, product } =
        location.state.startChatWith;
      const existing = conversations.find((c) => c.partner_id === owner_id);
      if (existing) {
        setActiveChat(existing);
      } else {
        setActiveChat({
          partner_id: owner_id,
          partner_name: business_name,
          partner_image: logo_url || 'https://via.placeholder.com/40',
          last_message: '',
          isTemp: true,
        });
      }
      // If a product was attached, set it in state so the composer shows it
      if (product) {
        setAttachment(product);
      }
      // clear navigation state so refresh doesn't re-open
      window.history.replaceState({}, document.title);
    }
  }, [loading, conversations, location.state]);

  useEffect(() => {
    if (activeChat) {
      if (!activeChat.isTemp) {
        fetchMessages(activeChat.partner_id);
      } else {
        setMessages([]);
      }
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    try {
      const res = await api.get(`/messages/${partnerId}`);
      // Normalize attachments (backend may return JSON strings)
      const msgs = res.data.map((m) => {
        if (m.attachment && typeof m.attachment === 'string') {
          try {
            return { ...m, attachment: JSON.parse(m.attachment) };
          } catch (e) {
            return m;
          }
        }
        return m;
      });
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeChat) return;
    if (!newMessage.trim() && !attachment) return;

    try {
      const payload = {
        receiverId: activeChat.partner_id,
        content: newMessage,
      };
      if (attachment) {
        payload.attachment = {
          type: 'product',
          product_id: attachment.id,
          snapshot: attachment,
        };
        payload.message_type = 'product';
      }

      const res = await api.post('/messages/send', payload);

      // Normalize returned attachment if needed
      const returned = res.data;
      if (returned.attachment && typeof returned.attachment === 'string') {
        try {
          returned.attachment = JSON.parse(returned.attachment);
        } catch (e) {
          // ignore
        }
      }

      setMessages([...messages, { ...returned, sender_type: 'me' }]);
      setNewMessage('');
      setAttachment(null);
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectChat = (conv) => {
    setActiveChat(conv);
    if (!conv.is_read && conv.last_message_sender_id === conv.partner_id) {
      api
        .put(`/messages/read/${conv.partner_id}`)
        .then(() => {
          setConversations((prev) =>
            prev.map((c) =>
              c.partner_id === conv.partner_id ? { ...c, is_read: true } : c
            )
          );
        })
        .catch((err) => console.error('Failed to mark read', err));
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-black">
        Loading messages...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-transparent font-sans">
      <Header title="Messaging" />

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-6 overflow-hidden">
        {/* CONVERSATION LIST */}
        <div className="w-80 bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-visible shrink-0 self-start">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-lg text-black">Messages</h3>
          </div>
          <div className="h-auto custom-scrollbar">
            {conversations.length === 0 && (
              <p className="p-6 text-center text-black text-sm">
                No recent conversations.
              </p>
            )}
            {conversations.map((conv) => {
              const isUnread =
                !conv.is_read &&
                conv.last_message_sender_id === conv.partner_id;
              return (
                <div
                  key={conv.partner_id}
                  onClick={() => handleSelectChat(conv)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-l-4 ${
                    activeChat?.partner_id === conv.partner_id
                      ? 'bg-brand-200 border-brand-500'
                      : isUnread
                        ? ' border-brand-200'
                        : ' border-transparent hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={conv.partner_image}
                    alt={conv.partner_name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm truncate ${isUnread ? 'font-bold text-black' : 'font-medium text-black'}`}
                    >
                      {conv.partner_name}
                    </h4>
                    <p
                      className={`text-xs truncate ${isUnread ? 'font-semibold text-black' : 'text-black'}`}
                    >
                      {currentUser?.id === conv.last_message_sender_id &&
                        'You: '}
                      {conv.last_message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 flex flex-col overflow-hidden">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white/50 backdrop-blur-sm">
                <img
                  src={activeChat.partner_image}
                  alt={activeChat.partner_name}
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                />
                <h3 className="font-bold text-black lg:text-lg">
                  {activeChat.partner_name}
                </h3>
              </div>

              {/* Messages List */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3 bg-gray-50/50">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_type === 'me';
                  return (
                    <div
                      key={idx}
                      className={`max-w-[70%] flex flex-col ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-br-sm'
                            : 'bg-white text-black border border-gray-100 rounded-bl-sm'
                        }`}
                      >
                        {/* Render product attachment inside the message bubble when present */}
                        {msg.attachment &&
                          msg.attachment.type === 'product' && (
                            <div className="flex items-center gap-3 mb-2 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                              <img
                                src={
                                  msg.attachment.snapshot?.image_url ||
                                  msg.attachment.snapshot?.image ||
                                  ''
                                }
                                alt={msg.attachment.snapshot?.name || 'product'}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-brand-700 truncate">
                                  {msg.attachment.snapshot?.name}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  {msg.attachment.snapshot?.price != null && (
                                    <div className="text-sm text-green-700 font-bold">
                                      $
                                      {Number(
                                        msg.attachment.snapshot.price
                                      ).toLocaleString()}
                                    </div>
                                  )}

                                  {/* Rating */}
                                  {(msg.attachment.snapshot?.rating ||
                                    msg.attachment.snapshot?.average_rating) !==
                                    undefined && (
                                    <div className="text-sm text-yellow-500 font-medium flex items-center gap-1">
                                      <span>★</span>
                                      <span className="text-black">
                                        {typeof (
                                          msg.attachment.snapshot?.rating ??
                                          msg.attachment.snapshot
                                            ?.average_rating
                                        ) === 'number'
                                          ? (
                                              msg.attachment.snapshot?.rating ??
                                              msg.attachment.snapshot
                                                ?.average_rating
                                            ).toFixed(1)
                                          : (msg.attachment.snapshot?.rating ??
                                            msg.attachment.snapshot
                                              ?.average_rating)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Distance */}
                                  {msg.attachment.snapshot?.distance !==
                                    undefined && (
                                    <div className="text-sm text-black">
                                      {msg.attachment.snapshot.distance}
                                      {msg.attachment.snapshot.distance_unit
                                        ? ` ${msg.attachment.snapshot.distance_unit}`
                                        : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-black">Product</div>
                            </div>
                          )}
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-black mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-gray-100 flex gap-3"
              >
                {attachment && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-lg w-full">
                    <img
                      src={attachment.image_url}
                      alt={attachment.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-black truncate">
                        {attachment.name}
                      </div>
                      {attachment.price != null && (
                        <div className="text-sm text-green-700 font-bold">
                          ${Number(attachment.price).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="text-black hover:text-black ml-2"
                      aria-label="Remove attachment"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-gray-100 border-0 text-black rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder-gray-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={!(newMessage.trim() || attachment)}
                  className="bg-brand-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-black">
              <div className="text-6xl mb-4 opacity-50"></div>
              <p className="text-lg font-medium text-black">
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>

        {/* RIGHT DASHBOARD (Helper) */}
        <aside className="hidden lg:flex flex-col gap-5 self-start sticky h-fit">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
            <h3 className="mt-0 mb-4 text-lg text-black font-bold pb-2 text-center">
              Dashboard (coming soon)
            </h3>

            <div className="flex flex-col gap-3">
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 hover:cursor-not-allowed text-black font-bold shadow-md transition-all text-center">
                Looking For
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 hover:cursor-not-allowed text-black font-bold shadow-md transition-all text-center">
                Selling
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 hover:cursor-not-allowed text-black font-bold shadow-md transition-all text-center">
                Jobs/Opportunities
              </button>
              <button
                onClick={() => navigate('/network')}
                className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-black font-bold shadow-md transition-all text-center"
              >
                My Network
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
