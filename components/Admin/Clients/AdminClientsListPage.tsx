import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { useAuth } from '../../../App';
import { adminGetAllClients, adminDeleteClient } from '../../../services/dataService';
import { User } from '../../../types';

// Icons
const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.222.261m3.222.261L12 5.291M12 5.291L11.757 3.65a1.125 1.125 0 012.486 0L12 5.291z" />
  </svg>
);


const AdminClientsListPage: React.FC = () => {
  const { addNotification } = useAuth();
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const clientsData = await adminGetAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error("Failed to fetch clients", error);
      addNotification("Erro ao carregar clientes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${clientName} e todos os seus dados associados? Esta ação é irreversível e o registro de autenticação precisará ser removido manualmente no console do Firebase.`)) {
      try {
        await adminDeleteClient(clientId);
        addNotification(`Dados do cliente ${clientName} excluídos com sucesso.`, "success");
        fetchClients(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete client", error);
        addNotification("Erro ao excluir cliente.", "error");
      }
    }
  };
  
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner text="Carregando lista de clientes..." className="mt-16" />;
  }

  return (
    <Card 
        title="Gerenciar Clientes"
        actions={
            <Link to="/admin/clients/new">
                <Button variant="primary" size="md" leftIcon={<PlusIcon className="w-5 h-5"/>}>
                    Novo Cliente
                </Button>
            </Link>
        }
    >
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar cliente por nome, usuário ou email..."
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          {searchTerm ? 'Nenhum cliente encontrado com os termos da busca.' : 'Nenhum cliente cadastrado.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Usuário</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/admin/clients/${client.id}`} className="text-sm font-medium text-sky-600 hover:text-sky-800">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link to={`/admin/clients/${client.id}/edit`} title="Editar Cliente">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-1">
                        <EditIcon className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to={`/admin/clients/${client.id}`} title="Ver Detalhes do Cliente">
                      <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-800 p-1">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Button>
                    </Link>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteClient(client.id, client.name)} 
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Excluir Cliente"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default AdminClientsListPage;