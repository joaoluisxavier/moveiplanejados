import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { useAuth } from '../../../App';
import { 
  adminGetDeadlinesByUserId, 
  adminAddDeadline, 
  adminUpdateDeadline, 
  adminDeleteDeadline,
  adminGetClientById
} from '../../../services/dataService';
import { Deadline, DeadlineType, User } from '../../../types';

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
const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);


interface DeadlineFormState {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD for input
  type: DeadlineType;
  details: string;
}

const initialDeadlineFormState: DeadlineFormState = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  type: DeadlineType.EntregaEstimada,
  details: '',
};

const AdminDeadlinesManagementPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAuth();

  const [client, setClient] = useState<User | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [formData, setFormData] = useState<DeadlineFormState>(initialDeadlineFormState);

  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors";

  const fetchDeadlines = useCallback(async () => {
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
      const deadlinesData = await adminGetDeadlinesByUserId(clientId);
      setDeadlines(deadlinesData);
    } catch (error) {
      console.error("Failed to fetch deadlines:", error);
      addNotification("Erro ao carregar prazos.", "error");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, addNotification, navigate]);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialDeadlineFormState);
    setEditingDeadline(null);
    setShowForm(false);
  };

  const handleEdit = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    const [day, month, year] = deadline.date.split('/');
    setFormData({
      id: deadline.id,
      title: deadline.title,
      date: `${year}-${month}-${day}`, // Convert to YYYY-MM-DD
      type: deadline.type,
      details: deadline.details || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setIsSubmitting(true);
    
    const [year, month, day] = formData.date.split('-');
    const dateForSave = `${day}/${month}/${year}`; // Convert back to DD/MM/YYYY

    const payload = {
      title: formData.title,
      date: dateForSave,
      type: formData.type,
      details: formData.details,
    };
    try {
      if (editingDeadline && editingDeadline.id) {
        await adminUpdateDeadline(editingDeadline.id, payload);
        addNotification("Prazo atualizado com sucesso!", "success");
      } else {
        await adminAddDeadline(clientId, payload);
        addNotification("Prazo adicionado com sucesso!", "success");
      }
      resetForm();
      fetchDeadlines();
    } catch (error) {
      console.error("Error saving deadline:", error);
      addNotification("Erro ao salvar prazo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (deadlineId: string, deadlineTitle: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o prazo "${deadlineTitle}"?`)) {
      try {
        await adminDeleteDeadline(deadlineId);
        addNotification(`Prazo "${deadlineTitle}" excluído.`, "success");
        fetchDeadlines();
      } catch (error) {
        console.error("Error deleting deadline:", error);
        addNotification("Erro ao excluir prazo.", "error");
      }
    }
  };
  
  const pageTitle = client ? `Gerenciar Prazos de ${client.name}` : "Gerenciar Prazos";

  return (
    <div className="space-y-6">
       <Link to={`/admin/clients/${clientId}`} className="inline-flex items-center text-sky-600 hover:text-sky-800 mb-0 group">
          <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar para Detalhes de {client?.name || 'Cliente'}
      </Link>
      <Card 
        title={showForm ? (editingDeadline ? "Editar Prazo" : "Adicionar Novo Prazo") : pageTitle}
        actions={!showForm && (
            <Button variant="primary" onClick={() => { setShowForm(true); setEditingDeadline(null); setFormData(initialDeadlineFormState);}} leftIcon={<PlusIcon className="w-5 h-5"/>}>
                Adicionar Prazo
            </Button>
        )}
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título do Prazo</label>
              <input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} required className={inputClasses} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data</label>
                <input type="date" name="date" id="date" value={formData.date} onChange={handleInputChange} required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Prazo</label>
                <select name="type" id="type" value={formData.type} onChange={handleInputChange} required className={inputClasses}>
                  {Object.values(DeadlineType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">Detalhes (Opcional)</label>
              <textarea name="details" id="details" value={formData.details} onChange={handleInputChange} rows={3} className={inputClasses} />
            </div>
            <div className="flex justify-end space-x-3 pt-3">
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>{editingDeadline ? "Salvar Alterações" : "Adicionar Prazo"}</Button>
            </div>
          </form>
        ) : (
          isLoading ? <LoadingSpinner text="Carregando prazos..." /> :
          deadlines.length === 0 ? <p className="text-center text-gray-500 py-8">Nenhum prazo cadastrado para este cliente.</p> :
          <div className="space-y-3">
            {deadlines.map(deadline => (
              <div key={deadline.id} className="p-4 border border-gray-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-semibold text-slate-700">{deadline.title}</h3>
                    <p className="text-sm text-gray-600">Data: {deadline.date} - Tipo: {deadline.type}</p>
                    {deadline.details && <p className="text-xs text-gray-500 mt-1">{deadline.details}</p>}
                  </div>
                  <div className="flex-shrink-0 space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(deadline)} className="p-1 text-blue-600"><EditIcon className="w-4 h-4"/></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(deadline.id, deadline.title)} className="p-1 text-red-600"><TrashIcon className="w-4 h-4"/></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDeadlinesManagementPage;