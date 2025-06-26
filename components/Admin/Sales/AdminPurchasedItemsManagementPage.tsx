
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
// Removed ProgressBar as PurchasedItem doesn't have a status progression like FurnitureItem
import { useAuth } from '../../../App';
import { 
  adminGetPurchasedItemsByUserId, // Changed
  adminAddPurchasedItem,         // Changed
  adminUpdatePurchasedItem,       // Changed
  adminDeletePurchasedItem,     // Changed
  adminGetClientById 
} from '../../../services/dataService';
import { PurchasedItem, User } from '../../../types'; // Changed FurnitureItem to PurchasedItem
// Removed FURNITURE_STATUS_ORDER as it's not relevant for PurchasedItem

// Icons (can be shared or kept local if specific)
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

interface PurchasedItemFormState {
  name: string;
  quantity: number;
  unitPrice: number;
  details: string;
  // imageUrls are handled by currentImageUrls and newImageFiles
}

const initialPurchasedItemFormState: PurchasedItemFormState = {
  name: '',
  quantity: 1,
  unitPrice: 0,
  details: '',
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const AdminPurchasedItemsManagementPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAuth();

  const [client, setClient] = useState<User | null>(null);
  const [items, setItems] = useState<PurchasedItem[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchasedItem | null>(null); 
  
  const [formData, setFormData] = useState<PurchasedItemFormState>(initialPurchasedItemFormState); 
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors";

  const fetchPurchasedItems = useCallback(async () => { 
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
      const purchasedData = await adminGetPurchasedItemsByUserId(clientId); 
      setItems(purchasedData);
    } catch (error) {
      console.error("Failed to fetch purchased items:", error);
      addNotification("Erro ao carregar itens comprados do cliente.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [clientId, addNotification, navigate]);

  useEffect(() => {
    fetchPurchasedItems();
  }, [fetchPurchasedItems]);

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
    const fileInput = document.getElementById('imageFilesPurchasedItemPage') as HTMLInputElement; 
    if (fileInput) {
        fileInput.value = "";
    }
  };

  const resetForm = () => {
    setFormData(initialPurchasedItemFormState);
    setEditingItem(null);
    setShowForm(false);
    setCurrentImageUrls([]);
    setNewImageFiles([]);
  };

  const handleEdit = (item: PurchasedItem) => { 
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      details: item.details || '',
    });
    setCurrentImageUrls(item.imageUrls || []);
    setNewImageFiles([]);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setIsSubmitting(true);

    const newBase64Images = await Promise.all(newImageFiles.map(file => fileToBase64(file)));
    const finalImageUrls = [...currentImageUrls, ...newBase64Images].slice(0, MAX_IMAGES);

    const payload: Omit<PurchasedItem, 'id' | 'userId' | 'totalPrice'> = { // totalPrice is calculated by service
        name: formData.name,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        details: formData.details,
        imageUrls: finalImageUrls,
    };

    try {
      if (editingItem && editingItem.id) {
        await adminUpdatePurchasedItem(editingItem.id, payload);
        addNotification("Item comprado atualizado com sucesso!", "success");
      } else {
        await adminAddPurchasedItem(clientId, payload);
        addNotification("Item comprado adicionado com sucesso!", "success");
      }
      resetForm();
      fetchPurchasedItems();
    } catch (error) {
      console.error("Error saving purchased item:", error);
      addNotification("Erro ao salvar item comprado.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string, itemName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o item comprado "${itemName}"?`)) {
      try {
        await adminDeletePurchasedItem(itemId); 
        addNotification(`Item comprado "${itemName}" excluído.`, "success");
        fetchPurchasedItems();
      } catch (error) {
        console.error("Error deleting purchased item:", error);
        addNotification("Erro ao excluir item comprado.", "error");
      }
    }
  };
  
  const pageTitle = client ? `Gerenciar Itens Comprados de ${client.name}` : "Gerenciar Itens Comprados";
  const totalPurchasedValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const combinedImagePreviews = [
    ...currentImageUrls,
    ...newImageFiles.map(file => URL.createObjectURL(file))
  ];

  return (
    <div className="space-y-6">
      <Link to={`/admin/clients/${clientId}`} className="inline-flex items-center text-sky-600 hover:text-sky-800 mb-0 group">
          <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar para Detalhes de {client?.name || 'Cliente'}
      </Link>
      <Card 
        title={showForm ? (editingItem ? "Editar Item Comprado" : "Adicionar Novo Item Comprado") : pageTitle}
        actions={!showForm && (
            <Button variant="primary" onClick={() => { setShowForm(true); setEditingItem(null); setFormData(initialPurchasedItemFormState); setCurrentImageUrls([]); setNewImageFiles([]);}} leftIcon={<PlusIcon className="w-5 h-5"/>}>
                Adicionar Item
            </Button>
        )}
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Item</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className={inputClasses} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantidade</label>
                <input type="number" name="quantity" id="quantity" value={formData.quantity} onChange={handleInputChange} min="1" required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">Preço Unitário (R$)</label>
                <input type="number" name="unitPrice" id="unitPrice" value={formData.unitPrice} onChange={handleInputChange} step="0.01" min="0" required className={inputClasses} />
              </div>
            </div>

            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">Detalhes</label>
              <textarea name="details" id="details" value={formData.details} onChange={handleInputChange} rows={3} className={inputClasses} />
            </div>
            
            <div>
              <label htmlFor="imageFilesPurchasedItemPage" className="block text-sm font-medium text-gray-700">Imagens (Máx. {MAX_IMAGES})</label>
              <input 
                type="file" 
                name="imageFilesPurchasedItemPage" 
                id="imageFilesPurchasedItemPage" 
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
            
            <div className="flex justify-end space-x-3 pt-3">
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>{editingItem ? "Salvar Alterações" : "Adicionar Item"}</Button>
            </div>
          </form>
        ) : (
          isLoading ? <LoadingSpinner text="Carregando itens comprados..." /> :
          items.length === 0 ? <p className="text-center text-gray-500 py-8">Nenhum item comprado cadastrado para este cliente.</p> :
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Qtd.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Preço Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Preço Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                           {item.imageUrls && item.imageUrls.length > 0 ? (
                                <img className="h-12 w-12 rounded-md object-cover" src={item.imageUrls[0]} alt={item.name} />
                            ) : (
                                <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                                    <ImagePlaceholderIcon className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{item.details || 'Sem detalhes adicionais'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.name)} className="p-1 text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5"/></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
               <tfoot className="bg-slate-100">
                  <tr>
                      <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-slate-700 uppercase">
                          Valor Total dos Itens Listados:
                      </td>
                      <td className="px-6 py-3 text-left text-sm font-bold text-sky-700">
                          R$ {totalPurchasedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                  </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminPurchasedItemsManagementPage;
