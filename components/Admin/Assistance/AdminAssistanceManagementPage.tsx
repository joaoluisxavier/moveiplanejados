
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { useAuth } from '../../../App';
import { 
  adminGetAssistanceRequestsByUserId, 
  adminUpdateAssistanceRequest,
  adminGetClientById
} from '../../../services/dataService';
import { AssistanceRequest, AssistanceRequestStatus, User } from '../../../types';

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

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
  return <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${colorClasses}`}>{status}</span>;
};

const AdminAssistanceManagementPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAuth();

  const [client, setClient] = useState<User | null>(null);
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState<AssistanceRequest | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState<AssistanceRequestStatus | ''>('');

  const fetchAssistanceRequests = useCallback(async () => {
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
      const data = await adminGetAssistanceRequestsByUserId(clientId);
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch assistance requests:", error);
      addNotification("Erro ao carregar solicitações de assistência.", "error");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, addNotification, navigate]);

  useEffect(() => {
    fetchAssistanceRequests();
  }, [fetchAssistanceRequests]);

  const handleEdit = (request: AssistanceRequest) => {
    setEditingRequest(request);
    setResolutionNotes(request.resolutionNotes || '');
    setNewStatus(request.status);
  };

  const handleSave = async () => {
    if (!editingRequest || !newStatus) return;
    try {
      await adminUpdateAssistanceRequest(editingRequest.id, {
        status: newStatus,
        resolutionNotes: resolutionNotes,
        // imageUrls are not edited by admin, they are preserved by dataService if not passed
      });
      addNotification("Solicitação de assistência atualizada.", "success");
      setEditingRequest(null);
      setResolutionNotes('');
      setNewStatus('');
      fetchAssistanceRequests();
    } catch (error) {
      console.error("Error updating assistance request:", error);
      addNotification("Erro ao atualizar solicitação.", "error");
    }
  };
  
  const pageTitle = client ? `Gerenciar Assistência de ${client.name}` : "Gerenciar Assistência";

  return (
    <div className="space-y-6">
       <Link to={`/admin/clients/${clientId}`} className="inline-flex items-center text-sky-600 hover:text-sky-800 mb-0 group">
          <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar para Detalhes de {client?.name || 'Cliente'}
      </Link>
      <Card title={pageTitle}>
        {isLoading ? (
          <LoadingSpinner text="Carregando solicitações..." />
        ) : requests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhuma solicitação de assistência para este cliente.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="p-4 border border-gray-200 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                  <h4 className="text-lg font-semibold text-sky-700">{req.subject}</h4>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-sm text-gray-500 mb-1">Data: {req.date}</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap mb-2">{req.description}</p>
                
                {req.imageUrls && req.imageUrls.length > 0 && (
                  <div className="mt-3 mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Imagens Anexadas pelo Cliente:</p>
                    <div className="flex flex-wrap gap-2">
                      {req.imageUrls.map((url, idx) => (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-24 h-24 block rounded-md overflow-hidden border-2 border-transparent hover:border-sky-500 transition-all shadow-md"
                          title={`Ver imagem ${idx + 1} em tamanho real`}
                        >
                          <img src={url} alt={`Imagem ${idx + 1} da solicitação`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {editingRequest?.id === req.id ? (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <h5 className="text-md font-semibold text-slate-700 mb-2">Atualizar Solicitação</h5>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">Novo Status</label>
                      <select 
                        id="status" 
                        value={newStatus} 
                        onChange={(e) => setNewStatus(e.target.value as AssistanceRequestStatus)}
                        className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                      >
                        {Object.values(AssistanceRequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="mt-2">
                      <label htmlFor="resolutionNotes" className="block text-sm font-medium text-gray-700">Notas de Resolução / Observações</label>
                      <textarea 
                        id="resolutionNotes" 
                        rows={3} 
                        value={resolutionNotes} 
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                      />
                    </div>
                    <div className="mt-3 flex space-x-2 justify-end">
                      <Button variant="secondary" size="sm" onClick={() => setEditingRequest(null)}>Cancelar</Button>
                      <Button variant="primary" size="sm" onClick={handleSave}>Salvar Alterações</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {req.resolutionNotes && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm font-semibold text-green-700">Resolução da Empresa:</p>
                        <p className="text-sm text-green-600 whitespace-pre-wrap">{req.resolutionNotes}</p>
                      </div>
                    )}
                    <div className="mt-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(req)}>Atualizar Status/Notas</Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAssistanceManagementPage;