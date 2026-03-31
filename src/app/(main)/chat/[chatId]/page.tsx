'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  sendMessage,
  listenToMessages,
  listenToChat,
  endChat,
  setTyping,
  requestReveal,
  getUserProfile,
  blockUser,
} from '@/lib/firestore';
import UserAvatar from '@/components/UserAvatar';
import { Send, ArrowLeft, Flag, Ban, Eye, X, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  text: string;
  type: string;
  createdAt: any;
}

interface ChatData {
  id: string;
  members: string[];
  mode: string;
  isActive: boolean;
  typingUsers: string[];
  revealRequests: string[];
  revealed: boolean;
  [key: string]: unknown;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const partnerId = chatData?.members?.find((id: string) => id !== user?.uid) || '';
  const isAnonymous = chatData?.mode === 'anonymous' && !chatData?.revealed;
  const isActive = chatData?.isActive ?? true;
  const partnerTyping = chatData?.typingUsers?.includes(partnerId) || false;

  useEffect(() => {
    if (!chatId) return;
    const unsub = listenToChat(chatId, (data) => {
      setChatData(data as ChatData);
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (!partnerId || isAnonymous) return;
    getUserProfile(partnerId).then((profile) => {
      if (profile) setPartnerProfile(profile);
    });
  }, [partnerId, isAnonymous]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = listenToMessages(chatId, (msgs) => {
      setMessages(msgs as unknown as Message[]);
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  useEffect(() => {
    return () => {
      if (user && chatId) {
        setTyping(chatId, user.uid, false);
      }
    };
  }, [user, chatId]);

  const handleSend = async () => {
    if (!messageInput.trim() || !user || !isActive) return;
    const text = messageInput.trim();
    setMessageInput('');
    setTyping(chatId, user.uid, false);
    try {
      await sendMessage(chatId, user.uid, text);
    } catch (error) {
      toast.error(t('errorGeneral'));
    }
  };

  const handleTyping = useCallback(() => {
    if (!user || !chatId) return;
    setTyping(chatId, user.uid, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(chatId, user.uid, false);
    }, 2000);
  }, [user, chatId]);

  const handleEndChat = async () => {
    try {
      await endChat(chatId);
      toast.success(t('chatEnded'));
    } catch (error) {
      toast.error(t('errorGeneral'));
    }
  };

  const handleReveal = async () => {
    if (!user) return;
    try {
      await requestReveal(chatId, user.uid);
      toast.success(t('revealIdentity'));
    } catch (error) {
      toast.error(t('errorGeneral'));
    }
  };

  const handleBlock = async () => {
    if (!user || !partnerId) return;
    try {
      await blockUser(user.uid, partnerId);
      await endChat(chatId);
      toast.success(t('blockUser'));
      router.push('/home');
    } catch (error) {
      toast.error(t('errorGeneral'));
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] -mx-4 md:-mx-6 -mt-4 md:-mt-6 animate-fade-in bg-[#11110B]">
      {/* Chat Header */}
      <div className="bg-[#1c1a16] border-b border-[#3b3324] px-4 py-3 flex items-center gap-3 flex-shrink-0 z-10 relative shadow-sm">
        <button onClick={() => router.push('/home')} className="text-[#84796B] hover:text-[#F4EED9] transition-colors">
          <ArrowLeft size={20} />
        </button>

        <UserAvatar
          name={isAnonymous ? partnerId : partnerProfile?.displayName}
          photoURL={isAnonymous ? undefined : partnerProfile?.photoURL}
          anonymous={isAnonymous}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-sm text-[#F4EED9] truncate">
            {isAnonymous ? t('stranger') : (partnerProfile?.displayName || t('stranger'))}
          </h2>
          {partnerTyping ? (
            <span className="text-xs text-[#8B6D3B]">{t('typing')}</span>
          ) : (
            !isAnonymous && partnerProfile?.bio && (
              <p className="text-xs text-[#84796B] truncate">{partnerProfile.bio}</p>
            )
          )}
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-[#84796B] hover:text-[#F4EED9] transition-colors rounded-lg hover:bg-[#26231d]"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-44 bg-[#1c1a16] rounded-lg border border-[#383329] py-1 z-50 shadow-lg animate-slide-up">
              {isAnonymous && isActive && (
                <button
                  onClick={() => { handleReveal(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#F4EED9] hover:bg-[#26231d] transition-colors"
                >
                  <Eye size={15} className="text-[#84796B]" />
                  {t('revealIdentity')}
                </button>
              )}
              <button
                onClick={() => { handleBlock(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#F4EED9] hover:bg-[#26231d] transition-colors"
              >
                <Ban size={15} className="text-orange-400" />
                {t('blockUser')}
              </button>
              <button
                onClick={() => { toast.success(t('reportUser')); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#F4EED9] hover:bg-[#26231d] transition-colors"
              >
                <Flag size={15} className="text-red-400" />
                {t('reportUser')}
              </button>
              {isActive && (
                <button
                  onClick={() => { handleEndChat(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-[#26231d] transition-colors"
                >
                  <X size={15} />
                  {t('endChat')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reveal banner */}
      {chatData?.revealRequests?.length === 1 && !chatData?.revealed && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-center text-sm">
          {chatData.revealRequests.includes(user?.uid || '')
            ? <span className="text-blue-600">✨ {t('revealIdentity')} — waiting for partner...</span>
            : (
              <div className="flex items-center justify-center gap-3">
                <span className="text-blue-600">{t('stranger')} {t('revealRequest')}</span>
                <button onClick={handleReveal} className="btn-primary px-3 py-1 text-xs">{t('accept')}</button>
                <button className="btn-secondary px-3 py-1 text-xs">{t('decline')}</button>
              </div>
            )
          }
        </div>
      )}

      {chatData?.revealed && (
        <div className="bg-green-50 border-b border-green-100 px-4 py-2 text-center text-sm text-green-600">
          ✨ {t('bothRevealed')}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#11110B]">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center animate-fade-in">
                <div className="chat-bubble-system">{msg.text}</div>
              </div>
            );
          }

          const isMine = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className="flex flex-col gap-0.5 max-w-[75%]">
                <div className={isMine ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                  {msg.text}
                </div>
                <span className={`text-[10px] text-[#84796B] ${isMine ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        {partnerTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="chat-bubble-received flex items-center gap-2 py-3">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat ended */}
      {!isActive && (
        <div className="px-4 py-3 bg-[#1c1a16] border-t border-[#383329] text-center text-sm text-[#84796B]">
          <p className="mb-2">{t('chatEnded')}</p>
          <button
            onClick={() => router.push('/home')}
            className="mori-btn-primary rounded-lg px-6 py-2 text-sm"
          >
            {t('findAnother')}
          </button>
        </div>
      )}

      {/* Message Input */}
      {isActive && (
        <div className="px-4 py-3 bg-[#1c1a16] border-t border-[#383329] flex-shrink-0 relative z-10 w-full mb-12 sm:mb-0">
          <div className="flex items-center gap-2 max-w-lg mx-auto w-full">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={t('typeMessage')}
              className="mori-input w-full px-4 py-3 rounded-full flex-1"
            />
            <button
              onClick={handleSend}
              disabled={!messageInput.trim()}
              className="mori-btn-primary p-3 rounded-full disabled:opacity-30 flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}
