
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../App';
import { Message } from '../../types';
import { getMessages, sendMessage } from '../../services/dataService';
import { getGeminiChatResponse } from '../../services/geminiService';
import Card from '../Common/Card';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';

const MessageBubble: React.FC<{ message: Message; isUser: boolean }> = ({ message, isUser }) => {
  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow ${
          isUser 
          ? 'bg-sky-600 text-white' 
          : 'bg-gray-200 text-gray-800'
      }`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-sky-200' : 'text-gray-500'} text-right`}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

const MessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isAiAssistantActive, setIsAiAssistantActive] = useState(false);
  const [aiResponseLoading, setAiResponseLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const data = await getMessages(currentUser.id);
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentUser]);


  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!currentUser || !newMessage.trim()) return;

    setIsSending(true);
    const userMsgContent = newMessage; // Store content before clearing input for AI
    setNewMessage(''); // Clear input immediately for better UX

    try {
      if (isAiAssistantActive) {
        // Add user message immediately
        const userMsgObject: Message = { 
            id: Date.now().toString(), 
            userId: currentUser.id,
            sender: 'cliente', 
            content: userMsgContent, 
            timestamp: new Date().toISOString(),
            read: true,
        };
        setMessages(prev => [...prev, userMsgObject]);
        
        setAiResponseLoading(true);
        const aiResponse = await getGeminiChatResponse(userMsgContent); // Use stored content
        const aiMsgObject: Message = { 
            id: (Date.now() + 1).toString(), 
            userId: currentUser.id, 
            sender: 'empresa', // Simulating AI as company representative
            content: aiResponse, 
            timestamp: new Date().toISOString(),
            read: false,
        };
        setMessages(prev => [...prev, aiMsgObject]);
        setAiResponseLoading(false);

      } else {
        const sentMessage = await sendMessage(currentUser.id, userMsgContent, 'cliente'); // Use stored content
        setMessages(prev => [...prev, sentMessage]);
         // Simulate company auto-reply for demo
        setTimeout(async () => {
            if (currentUser?.id) { // Check currentUser.id before using
                const reply = await sendMessage(currentUser.id, "Recebemos sua mensagem e responderemos em breve.", 'empresa');
                setMessages(prev => [...prev, reply]);
            }
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      // Show error to user
      // Re-populate newMessage if sending failed for non-AI?
      // setNewMessage(userMsgContent); // Or use addNotification
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card title={isAiAssistantActive ? "Assistente Virtual AI" : "Suas Mensagens com a Empresa"} 
        actions={
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAiAssistantActive(!isAiAssistantActive)}
            >
                {isAiAssistantActive ? "Falar com Atendente" : "Usar Assistente AI"}
            </Button>
        }
    >
      <div className="flex flex-col h-[70vh]">
        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-50 rounded-t-lg">
          {isLoading ? (
            <LoadingSpinner text="Carregando mensagens..." />
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma mensagem ainda. Envie uma para começar!</p>
          ) : (
            messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} isUser={msg.sender === 'cliente'} />
            ))
          )}
          {aiResponseLoading && (
            <div className="flex justify-start mb-3">
                 <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow bg-gray-200 text-gray-800">
                    <LoadingSpinner size="sm" text="Assistente pensando..." />
                 </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSending && !aiResponseLoading && handleSendMessage()}
              placeholder={isAiAssistantActive ? "Pergunte algo ao assistente..." : "Digite sua mensagem..."}
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
              disabled={isSending || aiResponseLoading}
            />
            <Button onClick={handleSendMessage} isLoading={isSending || aiResponseLoading} disabled={!newMessage.trim()}>
              {isSending || aiResponseLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MessagesPage;