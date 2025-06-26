
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { useAuth } from '../../../App';
import { 
    adminGetAllClients, 
    adminGetAllAssistanceRequests,
    adminGetAllFurnitureItems // New import
} from '../../../services/dataService';
import { User, AssistanceRequest, AssistanceRequestStatus, FurnitureItem, FurnitureStatus } from '../../../types';
import { FURNITURE_STATUS_ORDER } from '../../../constants';


// Icons (can be moved to a shared icons file if used frequently)
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);
const WrenchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.528-1.036.09-2.379-.938-2.908L10.5 7.5M11.42 15.17L7.5 10.5M4.364 4.364l2.496 3.03c.528 1.036.09 2.379-.938 2.908L3.516 12.08A2.652 2.652 0 003.516 17.25L9.345 21" />
    </svg>
);
const ListBulletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
);


const AdminDashboardPage: React.FC = () => {
  const { currentAdminUser, addNotification } = useAuth();
  const [clients, setClients] = useState<User[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [allFurnitureItems, setAllFurnitureItems] = useState<FurnitureItem[]>([]); // New state
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the new report
  const [reportStatusFilter, setReportStatusFilter] = useState<FurnitureStatus | 'todos'>('todos');
  const [reportLoading, setReportLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setReportLoading(true);
      try {
        const [clientsData, requestsData, furnitureData] = await Promise.all([
          adminGetAllClients(),
          adminGetAllAssistanceRequests(),
          adminGetAllFurnitureItems(), // Fetch all furniture
        ]);
        setClients(clientsData);
        setAssistanceRequests(requestsData);
        setAllFurnitureItems(furnitureData);
      } catch (error) {
        console.error("Failed to fetch admin dashboard data", error);
        addNotification("Erro ao carregar dados do painel administrativo.", "error");
      } finally {
        setIsLoading(false);
        setReportLoading(false);
      }
    };
    fetchData();
  }, [addNotification]);

  const openAssistanceRequests = assistanceRequests.filter(
    req => req.status === AssistanceRequestStatus.Aberto || req.status === AssistanceRequestStatus.EmAnalise
  );

  // Prepare data for the report
  const clientFurnitureReportData = clients.map(client => {
    const clientItems = allFurnitureItems.filter(item => 
      item.userId === client.id && 
      (reportStatusFilter === 'todos' || item.status === reportStatusFilter)
    );
    return {
      client,
      items: clientItems,
    };
  }).filter(entry => entry.items.length > 0);


  if (isLoading) {
    return <LoadingSpinner text="Carregando painel administrativo..." className="mt-16" />;
  }


  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg">
        <div className="p-6">
            <h1 className="text-3xl font-bold">Bem-vindo, {currentAdminUser?.name}!</h1>
            <p className="mt-2 text-slate-100">Gerencie clientes, projetos e comunicações.</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-sky-100 rounded-full mr-4">
               <UsersIcon className="w-8 h-8 text-sky-600" />
            </div>
            <div>
                <p className="text-sm text-gray-500">Total de Clientes</p>
                <p className="text-2xl font-semibold text-gray-800">{clients.length}</p>
            </div>
          </div>
        </Card>
        <Card>
           <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-full mr-4">
                <WrenchIcon className="w-8 h-8 text-amber-600" />
            </div>
            <div>
                <p className="text-sm text-gray-500">Assistências Abertas</p>
                <p className="text-2xl font-semibold text-gray-800">{openAssistanceRequests.length}</p>
            </div>
           </div>
        </Card>
        <Card>
           <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full mr-4">
                 <ListBulletIcon className="w-8 h-8 text-green-600"/>
            </div>
            <div>
                <p className="text-sm text-gray-500">Total de Móveis Cadastrados</p>
                <p className="text-2xl font-semibold text-gray-800">{allFurnitureItems.length}</p> 
            </div>
           </div>
        </Card>
      </div>

      <Card title="Ações Rápidas Administrativas">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/admin/clients">
            <Button variant="ghost" className="w-full justify-start py-4 border-slate-600 text-slate-700 hover:bg-slate-300">
              <UsersIcon className="w-5 h-5 mr-2" />
              Ver Todos os Clientes
            </Button>
          </Link>
          <Link to="/admin/clients/new">
            <Button variant="ghost" className="w-full justify-start py-4 border-slate-600 text-slate-700 hover:bg-slate-300">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
              Adicionar Novo Cliente
            </Button>
          </Link>
           <Link to="/admin/assistance-all">
            <Button variant="ghost" className="w-full justify-start py-4 border-slate-600 text-slate-700 hover:bg-slate-300">
              <WrenchIcon className="w-5 h-5 mr-2" />
              Ver Todas Assistências
            </Button>
          </Link>
        </div>
      </Card>
      
      {openAssistanceRequests.length > 0 && (
        <Card title="Solicitações de Assistência Pendentes (Últimas 5)">
          <div className="space-y-3">
            {openAssistanceRequests.slice(0, 5).map(req => {
              const client = clients.find(c => c.id === req.userId);
              return (
                <div key={req.id} className="p-3 border border-gray-300 rounded-lg hover:shadow-md transition-shadow bg-amber-50">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-md font-semibold text-amber-800">{req.subject}</h4>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">{req.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">Cliente: <Link to={`/admin/clients/${req.userId}`} className="text-sky-600 hover:underline">{client?.name || 'Desconhecido'} ({client?.username})</Link></p>
                  <p className="text-xs text-gray-500">Data: {req.date}</p>
                  <Link to={`/admin/clients/${req.userId}/assistance`} className="mt-2 inline-block">
                    <Button size="sm" variant="secondary">Ver Detalhes da Assistência</Button>
                  </Link>
                </div>
              );
            })}
             {openAssistanceRequests.length > 0 && (
                 <Link to="/admin/assistance-all" className="block text-center mt-3"> 
                    <Button variant="primary">Ver todas as solicitações pendentes ({openAssistanceRequests.length})</Button>
                </Link>
            )}
          </div>
        </Card>
      )}

      {/* New Report Section */}
      <Card title="Relatório de Clientes por Status de Fabricação">
        <div className="mb-4">
            <label htmlFor="reportStatusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Status da Linha do Tempo:
            </label>
            <select
                id="reportStatusFilter"
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value as FurnitureStatus | 'todos')}
                className="w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
            >
                <option value="todos">Todos os Status</option>
                {FURNITURE_STATUS_ORDER.map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
        </div>

        {reportLoading ? (
            <LoadingSpinner text="Gerando relatório..." />
        ) : clientFurnitureReportData.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
                {reportStatusFilter === 'todos' ? 'Nenhum móvel encontrado para os clientes.' : `Nenhum cliente com móveis no status "${reportStatusFilter}".`}
            </p>
        ) : (
            <div className="space-y-6">
                {clientFurnitureReportData.map(({ client: reportClient, items: clientItems }) => (
                    <div key={reportClient.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <h4 className="text-xl font-semibold text-sky-700 mb-2">
                            Cliente: <Link to={`/admin/clients/${reportClient.id}`} className="hover:underline">{reportClient.name}</Link> ({reportClient.username})
                        </h4>
                        {clientItems.length === 0 ? (
                             <p className="text-sm text-gray-500 italic">Nenhum item encontrado para este cliente com o filtro atual.</p>
                        ) : (
                            <ul className="space-y-2 list-disc list-inside pl-2">
                                {clientItems.map(item => (
                                    <li key={item.id} className="text-sm text-gray-700">
                                        <span className="font-medium">{item.name}</span> - Status: <span className="font-semibold">{item.status}</span>
                                        <br />
                                        <span className="text-xs text-gray-500">Prev. Conclusão: {item.estimatedCompletionDate} | Valor: R$ {item.projectValue?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || 'N/A'}</span>
                                        <Link to={`/admin/clients/${reportClient.id}/items`} className="ml-2 text-xs text-sky-600 hover:underline">(Gerenciar Itens)</Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        )}
      </Card>

    </div>
  );
};

export default AdminDashboardPage;
