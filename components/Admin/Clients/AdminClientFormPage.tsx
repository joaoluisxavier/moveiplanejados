import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { useAuth } from '../../../App';
import { adminGetClientById, adminAddClient, adminUpdateClient } from '../../../services/dataService';
import { User } from '../../../types';

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const AdminClientFormPage: React.FC = () => {
  const { clientId } = useParams<{ clientId?: string }>();
  const navigate = useNavigate();
  const { addNotification, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Used for new client's provisional password, or new password when editing
  const [isEditing, setIsEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (clientId) {
      setIsEditing(true);
      setPageLoading(true);
      adminGetClientById(clientId)
        .then(client => {
          if (client) {
            setName(client.name);
            setUsername(client.username);
            setEmail(client.email);
            // Do NOT pre-fill password for editing
            setPassword(''); 
          } else {
            addNotification("Cliente não encontrado para edição.", "error");
            navigate('/admin/clients');
          }
        })
        .catch(err => {
          console.error("Error fetching client for edit:", err);
          addNotification("Erro ao carregar dados do cliente.", "error");
        })
        .finally(() => setPageLoading(false));
    } else {
        // Reset password field if creating new after editing
        setPassword('');
    }
  }, [clientId, navigate, addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      addNotification("Nome, usuário e email são obrigatórios.", "error");
      return;
    }
    if (!isEditing && !password.trim()) {
        addNotification("Senha é obrigatória para novos clientes.", "error");
        return;
    }

    setPageLoading(true);
    try {
      if (isEditing && clientId) {
        const updates: Partial<User> = { name, username, email };
        if (password.trim() !== '') { // Only include password if it's been entered for update
          updates.password = password;
        }
        await adminUpdateClient(clientId, updates);
        addNotification("Cliente atualizado com sucesso!", "success");
        navigate(`/admin/clients/${clientId}`);
      } else {
        const newClient = await adminAddClient({ name, username, email, password });
        addNotification("Cliente adicionado com sucesso!", "success");
        navigate(`/admin/clients/${newClient.id}`);
      }
    } catch (error) {
      console.error("Error saving client:", error);
      addNotification("Erro ao salvar cliente.", "error");
    } finally {
      setPageLoading(false);
    }
  };

  if (pageLoading && isEditing) {
    return <LoadingSpinner text="Carregando dados do cliente..." />;
  }

  return (
    <div className="max-w-2xl mx-auto">
        <Link to={isEditing ? `/admin/clients/${clientId}` : "/admin/clients"} className="inline-flex items-center text-sky-600 hover:text-sky-800 mb-6 group">
            <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
            {isEditing ? 'Voltar para Detalhes do Cliente' : 'Voltar para Lista de Clientes'}
        </Link>
      <Card title={isEditing ? "Editar Cliente" : "Adicionar Novo Cliente"}>
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          <div>
            <label htmlFor="client-name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input
              type="text"
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div>
            <label htmlFor="client-username" className="block text-sm font-medium text-gray-700">Nome de Usuário (para login)</label>
            <input
              type="text"
              id="client-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div>
            <label htmlFor="client-email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="client-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          
          {isEditing ? (
            <div>
              <label htmlFor="client-new-password" className="block text-sm font-medium text-gray-700">Nova Senha</label>
              <input
                type="password"
                id="client-new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
              <p className="text-xs text-gray-500 mt-1">Se preenchido, a senha do cliente será alterada.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="client-password" className="block text-sm font-medium text-gray-700">Senha (Provisória)</label>
              <input
                type="password"
                id="client-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder='Mínimo 6 caracteres'
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
               <p className="text-xs text-gray-500 mt-1">Esta senha será utilizada para o login do cliente.</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => navigate(isEditing ? `/admin/clients/${clientId}` : '/admin/clients')} disabled={pageLoading || authLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={pageLoading || authLoading}>
              {isEditing ? 'Salvar Alterações' : 'Adicionar Cliente'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminClientFormPage;