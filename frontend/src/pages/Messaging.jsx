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
      const { owner_id, business_name, logo_url } =
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
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const res = await api.post('/messages/send', {
        receiverId: activeChat.partner_id,
        content: newMessage,
      });

      setMessages([...messages, { ...res.data, sender_type: 'me' }]);
      setNewMessage('');
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
      <div className="h-screen flex items-center justify-center text-gray-400">
        Loading messages...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-transparent font-sans">
      <Header title="Messaging" />

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-6 overflow-hidden">
        {/* CONVERSATION LIST */}
        <div className="w-80 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-visible shrink-0 self-start">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-800">Messages</h3>
          </div>
          <div className="h-auto custom-scrollbar">
            {conversations.length === 0 && (
              <p className="p-6 text-center text-gray-400 text-sm">
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
                      ? 'bg-blue-50 border-blue-500'
                      : isUnread
                        ? 'bg-white border-blue-400'
                        : 'bg-white border-transparent hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={conv.partner_image}
                    alt={conv.partner_name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}
                    >
                      {conv.partner_name}
                    </h4>
                    <p
                      className={`text-xs truncate ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}
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
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white/50 backdrop-blur-sm">
                <img
                  src={activeChat.partner_image}
                  alt={activeChat.partner_name}
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                />
                <h3 className="font-bold text-gray-800 lg:text-lg">
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
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
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
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-gray-100 border-0 text-gray-800 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <div className="text-6xl mb-4 opacity-50"></div>
              <p className="text-lg font-medium">
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>

        {/* RIGHT DASHBOARD (Helper) */}
        <aside className="hidden lg:flex flex-col gap-5 self-start sticky h-fit">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
            <h3 className="mt-0 mb-4 text-lg text-gray-800 font-bold pb-2 text-center">
              Dashboard (coming soon)
            </h3>

            <div className="flex flex-col gap-3">
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center">
                Looking For
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center">
                Selling
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center">
                Jobs/Opportunities
              </button>
              <button
                onClick={() => navigate('/network')}
                className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center"
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
