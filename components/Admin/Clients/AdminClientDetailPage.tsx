
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { useAuth } from '../../../App';
import { adminGetClientById, adminGetFurnitureItemsByUserId, adminGetAssistanceRequestsByUserId, adminGetDeadlinesByUserId, adminGetPurchasedItemsByUserId } from '../../../services/dataService';
import { User, FurnitureItem, AssistanceRequest, AssistanceRequestStatus, Deadline, FurnitureStatus, PurchasedItem } from '../../../types';

// Icons
const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const AdminClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { addNotification } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<User | null>(null);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) {
        addNotification("ID do cliente não fornecido.", "error");
        navigate("/admin/clients");
        return;
      }
      setIsLoading(true);
      try {
        const clientData = await adminGetClientById(clientId);
        if (!clientData) {
          addNotification("Cliente não encontrado.", "error");
          navigate("/admin/clients");
          return;
        }
        setClient(clientData);
        
        // Data fetching is currently stubbed, will return empty arrays.
        // This will be implemented with Firestore in the next step.
        const [furnitureData, assistanceData, deadlinesData, purchasedData] = await Promise.all([
            adminGetFurnitureItemsByUserId(clientId),
            adminGetAssistanceRequestsByUserId(clientId),
            adminGetDeadlinesByUserId(clientId),
            adminGetPurchasedItemsByUserId(clientId),
        ]);
        setFurniture(furnitureData);
        setAssistanceRequests(assistanceData);
        setDeadlines(deadlinesData);
        setPurchasedItems(purchasedData);

      } catch (error) {
        console.error("Failed to fetch client details", error);
        addNotification("Erro ao carregar detalhes do cliente.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [clientId, navigate, addNotification]);

  if (isLoading) {
    return <LoadingSpinner text="Carregando detalhes do cliente..." className="mt-16" />;
  }

  if (!client) {
    return <Card title="Erro"><p>Cliente não encontrado.</p></Card>;
  }
  
  const activeFurniture = furniture.filter(f => f.status !== FurnitureStatus.Concluido);
  const openAssistance = assistanceRequests.filter(ar => ar.status !== AssistanceRequestStatus.Fechado && ar.status !== AssistanceRequestStatus.Resolvido);
  const upcomingDeadlines = deadlines.filter(d => new Date(d.date.split('/').reverse().join('-')) >= new Date());


  return (
    <div className="space-y-6">
        <Link to="/admin/clients" className="inline-flex items-center text-sky-600 hover:text-sky-800 mb-4 group">
            <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
            Voltar para Lista de Clientes
        </Link>

      <Card 
        title={`Detalhes do Cliente: ${client.name}`}
        actions={
            <Link to={`/admin/clients/${clientId}/edit`}>
                <Button variant="secondary" size="sm">Editar Cliente</Button>
            </Link>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
            <div className="md:col-span-1 flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg">
                <UserCircleIcon className="w-24 h-24 text-slate-500 mb-3" />
                <h2 className="text-2xl font-semibold text-slate-800">{client.name}</h2>
                <p className="text-slate-600">{client.email}</p>
                <p className="text-sm text-slate-500">Usuário: {client.username}</p>
                <p className="text-sm text-slate-500">ID: {client.id}</p>
            </div>
             <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SummaryCard title="Móveis Ativos" value={activeFurniture.length} linkTo={`/admin/clients/${clientId}/furniture`} linkText="Gerenciar Móveis"/>
                <SummaryCard title="Assistências Abertas" value={openAssistance.length} linkTo={`/admin/clients/${clientId}/assistance`} linkText="Gerenciar Assistência"/>
                <SummaryCard title="Próximos Prazos" value={upcomingDeadlines.length} linkTo={`/admin/clients/${clientId}/deadlines`} linkText="Gerenciar Prazos"/>
                <SummaryCard title="Itens Comprados (Histórico)" value={purchasedItems.length} linkTo={`/admin/clients/${clientId}/items`} linkText="Gerenciar Itens"/>
             </div>
        </div>
      </Card>

      <Card title="Gerenciamento Completo do Cliente">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
            <ManagementLink to={`/admin/clients/${clientId}/furniture`} title="Móveis" description="Status, logs de fabricação." />
            <ManagementLink to={`/admin/clients/${clientId}/assistance`} title="Assistência Técnica" description="Responder e gerenciar solicitações." />
            <ManagementLink to={`/admin/clients/${clientId}/messages`} title="Mensagens" description="Comunicar com o cliente." />
            <ManagementLink to={`/admin/clients/${clientId}/items`} title="Itens Comprados" description="Adicionar/editar itens do projeto." />
            <ManagementLink to={`/admin/clients/${clientId}/contract`} title="Contrato" description="Detalhes e upload do contrato." />
            <ManagementLink to={`/admin/clients/${clientId}/deadlines`} title="Prazos" description="Definir e acompanhar prazos." />
        </div>
      </Card>
    </div>
  );
};

interface SummaryCardProps {
    title: string;
    value: number | string;
    linkTo: string;
    linkText: string;
}
const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, linkTo, linkText}) => (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-slate-200">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <p className="text-3xl font-semibold text-slate-700 my-1">{value}</p>
        <Link to={linkTo} className="text-sm text-sky-600 hover:text-sky-800 hover:underline">
            {linkText} &rarr;
        </Link>
    </div>
);

interface ManagementLinkProps {
    to: string;
    title: string;
    description: string;
}
const ManagementLink: React.FC<ManagementLinkProps> = ({ to, title, description }) => (
    <Link to={to} className="block p-6 bg-slate-50 hover:bg-slate-100 rounded-lg shadow transition-all duration-200 hover:shadow-lg border border-slate-200">
        <h4 className="text-xl font-semibold text-sky-700 mb-1">{title}</h4>
        <p className="text-sm text-slate-600">{description}</p>
    </Link>
)


export default AdminClientDetailPage;