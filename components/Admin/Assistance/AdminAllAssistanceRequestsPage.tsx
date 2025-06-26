
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { useAuth } from '../../../App';
import { 
  adminGetAllAssistanceRequests,
  adminGetAllClients 
} from '../../../services/dataService';
import { AssistanceRequest, AssistanceRequestStatus, User } from '../../../types';

// Helper function to get status badge styling (similar to AdminAssistanceManagementPage)
const StatusBadge: React.FC<{ status: AssistanceRequestStatus }> = ({ status }) => {
  let colorClasses = '';
  switch (status) {
    case AssistanceRequestStatus.Aberto: colorClasses = 'bg-blue-100 text-blue-800'; break;
    case AssistanceRequestStatus.EmAnalise: colorClasses = 'bg-yellow-100 text-yellow-800'; break;
    case AssistanceRequestStatus.Agendado: colorClasses = 'bg-purple-100 text-purple-800'; break;
    case AssistanceRequestStatus.Resolvido: colorClasses = 'bg-green-100 text-green-800'; break;
    case AssistanceRequestStatus.Fechado: colorClasses = 'bg-gray-200 text-gray-800 border border-gray-400'; break;
    default: colorClasses = 'bg-gray-100 text-gray-800';
  }
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colorClasses}`}>{status}</span>;
};


const AdminAllAssistanceRequestsPage: React.FC = () => {
  const { addNotification } = useAuth();
  const [allRequests, setAllRequests] = useState<AssistanceRequest[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllPendingRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsData, clientsData] = await Promise.all([
        adminGetAllAssistanceRequests(),
        adminGetAllClients()
      ]);
      
      const pendingRequests = requestsData.filter(
        req => req.status === AssistanceRequestStatus.Aberto || req.status === AssistanceRequestStatus.EmAnalise
      );
      setAllRequests(pendingRequests);
      setClients(clientsData);

    } catch (error) {
      console.error("Failed to fetch all assistance requests or clients:", error);
      addNotification("Erro ao carregar todas as solicitações de assistência.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchAllPendingRequests();
  }, [fetchAllPendingRequests]);

  const getClientName = (userId: string): string => {
    const client = clients.find(c => c.id === userId);
    return client ? client.name : 'Cliente Desconhecido';
  };

  return (
    <div className="space-y-6">
      <Card title="Todas as Solicitações de Assistência Pendentes">
        {isLoading ? (
          <LoadingSpinner text="Carregando solicitações..." />
        ) : allRequests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhuma solicitação de assistência pendente no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Assunto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Data</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/admin/clients/${req.userId}/assistance`} className="text-sm font-medium text-sky-600 hover:text-sky-800">
                        {getClientName(req.userId)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{req.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/admin/clients/${req.userId}/assistance`}>
                        <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-800">
                          Gerenciar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAllAssistanceRequestsPage;
