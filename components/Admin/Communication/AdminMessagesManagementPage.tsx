import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { useAuth } from '../../../App';
import { 
  adminGetMessagesByUserId, 
  adminSendMessage,
  adminGetClientById
} from '../../../services/dataService';
import { Message, User } from '../../../types';

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const MessageBubble: React.FC<{ message: Message; isAdminMessage: boolean }> = ({ message, isAdminMessage }) => {
  return (
    <div className={`flex mb-3 ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow ${
          isAdminMessage 
          ? 'bg-slate-600 text-white' 
          : 'bg-sky-100 text-sky-800' // Client messages slightly different for admin view
      }`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 ${isAdminMessage ? 'text-slate-200' : 'text-sky-600'} text-right`}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          {' - '}{message.sender === 'cliente' ? 'Cliente' : 'Empresa/Admin'}
        </p>
      </div>
    </div>
  );
};

const AdminMessagesManagementPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAuth(); // currentAdminUser is also available if needed

  const [client, setClient] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      const clientData = await adminGetClientById(clientId);
      if (!clientData) {
        addNotification("Cliente não encontrado.", "error");
        navigate("/admin/clients");
        return;
      }
      setClient(clientData);
      const data = await adminGetMessagesByUserId(clientId);
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      addNotification("Erro ao carregar mensagens.", "error");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, addNotification, navigate]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!clientId || !newMessage.trim()) return;
    setIsSending(true);
    try {
      // Admin always sends as 'admin' or 'empresa'
      const sentMessage = await adminSendMessage(clientId, newMessage);
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
      addNotification("Erro ao enviar mensagem.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const pageTitle = client ? `Mensagens com ${client.name}` : "Mensagens com Cliente";

  return (
    <div className="space-y-6">
      <Link to={`/admin/clients/${clientId}`} className="inline-flex items-center text-sky-600 hover:text-sky-800 mb-0 group">
          <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar para Detalhes de {client?.name || 'Cliente'}
      </Link>
      <Card title={pageTitle}>
        <div className="flex flex-col h-[70vh]">
          <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-slate-50 rounded-t-lg">
            {isLoading ? (
              <LoadingSpinner text="Carregando mensagens..." />
            ) : messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma mensagem trocada com este cliente ainda.</p>
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} isAdminMessage={msg.sender === 'admin' || msg.sender === 'empresa'} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                placeholder="Digite sua mensagem para o cliente..."
                className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none"
                disabled={isSending}
              />
              <Button onClick={handleSendMessage} isLoading={isSending} disabled={!newMessage.trim()} variant="primary">
                {isSending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminMessagesManagementPage;