import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import ProgressBar from '../../Common/ProgressBar';
import { useAuth } from '../../../App';
import { 
  adminGetFurnitureItemsByUserId, 
  adminAddFurnitureItem, 
  adminUpdateFurnitureItem, 
  adminDeleteFurnitureItem,
  adminGetClientById
} from '../../../services/dataService';
import { FurnitureItem, FurnitureStatus, User } from '../../../types';
import { FURNITURE_STATUS_ORDER } from '../../../constants';

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
const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);
const ImagePlaceholderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const MAX_IMAGES = 6; 

interface FurnitureFormState {
  name: string;
  description: string;
  status: FurnitureStatus;
  estimatedCompletionDate: string; // YYYY-MM-DD for input
  projectValue: number; 
}

const initialFormState: FurnitureFormState = {
  name: '',
  description: '',
  status: FurnitureStatus.PagamentoAprovado, // Updated default status
  estimatedCompletionDate: new Date().toISOString().split('T')[0],
  projectValue: 0, 
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const AdminFurnitureManagementPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAuth();

  const [client, setClient] = useState<User | null>(null);
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FurnitureItem | null>(null);
  
  const [formData, setFormData] = useState<FurnitureFormState>(initialFormState);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]); 
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]); 

  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors";


  const fetchFurnitureItems = useCallback(async () => {
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
      const furnitureData = await adminGetFurnitureItemsByUserId(clientId);
      setItems(furnitureData);
    } catch (error) {
      console.error("Failed to fetch furniture items:", error);
      addNotification("Erro ao carregar móveis do cliente.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [clientId, addNotification, navigate]);

  useEffect(() => {
    fetchFurnitureItems();
  }, [fetchFurnitureItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const totalImages = currentImageUrls.length + newImageFiles.length + filesArray.length;
      if (totalImages > MAX_IMAGES) {
        addNotification(`Você pode carregar no máximo ${MAX_IMAGES} imagens.`, "error");
        return;
      }
      setNewImageFiles(prev => [...prev, ...filesArray].slice(0, MAX_IMAGES - currentImageUrls.length));
    }
  };

  const removeCurrentImageUrl = (index: number) => {
    setCurrentImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImageFile = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    const fileInput = document.getElementById('imageFiles') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingItem(null);
    setShowForm(false);
    setCurrentImageUrls([]);
    setNewImageFiles([]);
  };

  const handleEdit = (item: FurnitureItem) => {
    setEditingItem(item);
    const [day, month, year] = item.estimatedCompletionDate.split('/');
    const dateForInput = `${year}-${month}-${day}`;

    setFormData({
      name: item.name,
      description: item.description,
      status: item.status,
      estimatedCompletionDate: dateForInput,
      projectValue: item.projectValue || 0, 
    });
    setCurrentImageUrls(item.imageUrls || []);
    setNewImageFiles([]);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setIsSubmitting(true);

    let submissionDate = formData.estimatedCompletionDate;
    if (formData.estimatedCompletionDate.includes('-')) {
        const [year, month, day] = formData.estimatedCompletionDate.split('-');
        submissionDate = `${day}/${month}/${year}`;
    }

    const newBase64Images = await Promise.all(newImageFiles.map(file => fileToBase64(file)));
    const finalImageUrls = [...currentImageUrls, ...newBase64Images].slice(0, MAX_IMAGES);

    const payload = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        estimatedCompletionDate: submissionDate,
        imageUrls: finalImageUrls,
        projectValue: formData.projectValue, 
    };

    try {
      if (editingItem && editingItem.id) {
        await adminUpdateFurnitureItem(editingItem.id, payload as Partial<Omit<FurnitureItem, 'id' | 'userId' | 'manufacturingLog'>>);
        addNotification("Móvel atualizado com sucesso!", "success");
      } else {
        await adminAddFurnitureItem(clientId, payload as Omit<FurnitureItem, 'id' | 'userId' | 'manufacturingLog' | 'dimensions' | 'material'>);
        addNotification("Móvel adicionado com sucesso!", "success");
      }
      resetForm();
      fetchFurnitureItems();
    } catch (error) {
      console.error("Error saving furniture item:", error);
      addNotification("Erro ao salvar móvel.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string, itemName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o móvel "${itemName}"?`)) {
      try {
        await adminDeleteFurnitureItem(itemId);
        addNotification(`Móvel "${itemName}" excluído.`, "success");
        fetchFurnitureItems();
      } catch (error) {
        console.error("Error deleting furniture item:", error);
        addNotification("Erro ao excluir móvel.", "error");
      }
    }
  };

  if (isLoading && !client) {
    return <LoadingSpinner text="Verificando cliente..." />;
  }
  
  const pageTitle = client ? `Gerenciar Móveis de ${client.name}` : "Gerenciar Móveis";

  const combinedImagePreviews = [
    ...currentImageUrls,
    ...newImageFiles.map(file => URL.createObjectURL(file)) // Create temporary URLs for preview
  ];


  return (
    <div className="space-y-6">
      <Link to={`/admin/clients/${clientId}`} className="inline-flex items-center text-sky-600 hover:text-sky-800 mb-0 group">
          <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar para Detalhes de {client?.name || 'Cliente'}
      </Link>
      <Card 
        title={showForm ? (editingItem ? "Editar Móvel" : "Adicionar Novo Móvel") : pageTitle}
        actions={!showForm && (
            <Button variant="primary" onClick={() => { setShowForm(true); setEditingItem(null); setFormData(initialFormState); setCurrentImageUrls([]); setNewImageFiles([]);}} leftIcon={<PlusIcon className="w-5 h-5"/>}>
                Adicionar Móvel
            </Button>
        )}
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Móvel</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className={inputClasses} />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={3} required className={inputClasses} />
            </div>
            
            <div>
              <label htmlFor="imageFiles" className="block text-sm font-medium text-gray-700">Imagens (Máx. {MAX_IMAGES})</label>
              <input 
                type="file" 
                name="imageFiles" 
                id="imageFiles" 
                multiple 
                accept="image/*" 
                onChange={handleFileChange} 
                className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                disabled={(currentImageUrls.length + newImageFiles.length) >= MAX_IMAGES}
              />
              {(currentImageUrls.length + newImageFiles.length) >= MAX_IMAGES && <p className="text-xs text-red-500 mt-1">Limite de {MAX_IMAGES} imagens atingido.</p>}
              
              <div className="mt-2 flex flex-wrap gap-2">
                {currentImageUrls.map((url, index) => (
                  <div key={`current-${index}`} className="relative w-24 h-24 border rounded">
                    <img src={url} alt={`Imagem existente ${index + 1}`} className="w-full h-full object-cover rounded" />
                    <button type="button" onClick={() => removeCurrentImageUrl(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 text-xs w-5 h-5 flex items-center justify-center">&times;</button>
                  </div>
                ))}
                {newImageFiles.map((file, index) => (
                  <div key={`new-${index}`} className="relative w-24 h-24 border rounded">
                    <img src={URL.createObjectURL(file)} alt={`Nova imagem ${index + 1}`} className="w-full h-full object-cover rounded" />
                    <button type="button" onClick={() => removeNewImageFile(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 text-xs w-5 h-5 flex items-center justify-center">&times;</button>
                  </div>
                ))}
                 {combinedImagePreviews.length === 0 && (
                    <div className="w-24 h-24 border rounded border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <ImagePlaceholderIcon className="w-10 h-10 text-gray-400" />
                    </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" id="status" value={formData.status} onChange={handleInputChange} required className={inputClasses}>
                  {FURNITURE_STATUS_ORDER.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="estimatedCompletionDate" className="block text-sm font-medium text-gray-700">Data Estimada de Conclusão</label>
                <input type="date" name="estimatedCompletionDate" id="estimatedCompletionDate" 
                       value={formData.estimatedCompletionDate}
                       onChange={(e) => setFormData(prev => ({ ...prev, estimatedCompletionDate: e.target.value }))}
                       required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="projectValue" className="block text-sm font-medium text-gray-700">Valor do Projeto (R$)</label>
                <input 
                    type="number" 
                    name="projectValue" 
                    id="projectValue" 
                    value={formData.projectValue} 
                    onChange={handleInputChange} 
                    step="0.01" 
                    min="0"
                    required 
                    className={inputClasses} 
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>{editingItem ? "Salvar Alterações" : "Adicionar Móvel"}</Button>
            </div>
          </form>
        ) : (
          isLoading ? <LoadingSpinner text="Carregando móveis..." /> :
          items.length === 0 ? <p className="text-center text-gray-500 py-8">Nenhum móvel cadastrado para este cliente.</p> :
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex gap-4">
                <div className="flex-shrink-0 w-24 h-24">
                   {item.imageUrls && item.imageUrls.length > 0 ? (
                        <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover rounded" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded">
                            <ImagePlaceholderIcon className="w-10 h-10 text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold text-sky-700">{item.name}</h3>
                            <p className="text-sm text-gray-600 mb-1">{item.description.substring(0,100)}...</p>
                            <p className="text-xs text-gray-500">Status: <span className="font-medium">{item.status}</span> | Prev. Conclusão: {item.estimatedCompletionDate}</p>
                            {typeof item.projectValue === 'number' && (
                                <p className="text-xs text-gray-500">Valor: <span className="font-medium">R$ {item.projectValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></p>
                            )}
                        </div>
                         <div className="flex-shrink-0 ml-4 space-x-2 flex sm:flex-col sm:space-x-0 sm:space-y-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5"/></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.name)} className="p-1 text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5"/></Button>
                        </div>
                    </div>
                    <ProgressBar percentage={(FURNITURE_STATUS_ORDER.indexOf(item.status) + 1) / FURNITURE_STATUS_ORDER.length * 100} showPercentageText={false} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminFurnitureManagementPage;