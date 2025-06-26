import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import LoadingSpinner from '../../Common/LoadingSpinner';
import { useAuth } from '../../../App';
import { 
  adminGetContractDetailsByUserId, 
  adminUpdateContractDetails,
  adminGetClientById
} from '../../../services/dataService';
import { ContractDetails, User } from '../../../types';

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12.75h7.5M8.25M3.75 21V8.25A2.25 2.25 0 016 6h12a2.25 2.25 0 012.25 2.25v12.75A2.25 2.25 0 0118 23.25H6A2.25 2.25 0 013.75 21z" />
  </svg>
);

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);


interface ContractFormState {
  contractNumber: string;
  dateSigned: string; // YYYY-MM-DD for input
  projectAddress: string;
  paymentTerms: string;
  scopeOfWork: string;
  contractPdfUrl: string; // Will store filename
}

const initialContractFormState: ContractFormState = {
  contractNumber: '',
  dateSigned: new Date().toISOString().split('T')[0],
  projectAddress: '',
  paymentTerms: '',
  scopeOfWork: '',
  contractPdfUrl: '', // Stores filename
};

const AdminContractManagementPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAuth();

  const [client, setClient] = useState<User | null>(null);
  const [contract, setContract] = useState<ContractDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContractFormState>(initialContractFormState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [initialContractFileName, setInitialContractFileName] = useState<string | null>(null);

  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors";


  const fetchContractDetails = useCallback(async () => {
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

      const contractData = await adminGetContractDetailsByUserId(clientId);
      setContract(contractData);
      if (contractData) {
        const [day, month, year] = contractData.dateSigned.split('/');
        const currentContractFile = contractData.contractPdfUrl || '';
        setFormData({
          contractNumber: contractData.contractNumber,
          dateSigned: `${year}-${month}-${day}`,
          projectAddress: contractData.projectAddress,
          paymentTerms: contractData.paymentTerms,
          scopeOfWork: contractData.scopeOfWork,
          contractPdfUrl: currentContractFile,
        });
        setInitialContractFileName(currentContractFile);
      } else {
        setFormData(prev => ({
            ...initialContractFormState, 
            contractNumber: `CT-${clientData.id}-${Date.now().toString().slice(-4)}`
        }));
        setInitialContractFileName(null);
      }
      setSelectedFile(null); // Reset selected file on fetch
    } catch (error) {
      console.error("Failed to fetch contract details:", error);
      addNotification("Erro ao carregar detalhes do contrato.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [clientId, addNotification, navigate]);

  useEffect(() => {
    fetchContractDetails();
  }, [fetchContractDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, contractPdfUrl: file.name }));
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, contractPdfUrl: '' }));
    const fileInput = document.getElementById('contractFile') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = ""; 
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setIsSubmitting(true);
    
    const [year, month, day] = formData.dateSigned.split('-');
    const dateSignedForSave = `${day}/${month}/${year}`;

    const payload: Omit<ContractDetails, "userId" | "clientName"> = {
      contractNumber: formData.contractNumber,
      dateSigned: dateSignedForSave,
      projectAddress: formData.projectAddress,
      paymentTerms: formData.paymentTerms,
      scopeOfWork: formData.scopeOfWork,
      contractPdfUrl: formData.contractPdfUrl, 
      totalValue: contract?.totalValue || 0, 
    };

    try {
      await adminUpdateContractDetails(clientId, payload);
      addNotification("Detalhes do contrato salvos com sucesso!", "success");
      fetchContractDetails(); 
    } catch (error) {
      console.error("Error saving contract details:", error);
      addNotification("Erro ao salvar contrato.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const pageTitle = client ? `Gerenciar Contrato de ${client.name}` : "Gerenciar Contrato";
  const displayedFileName = selectedFile ? selectedFile.name : formData.contractPdfUrl;

  return (
    <div className="space-y-6">
       <Link to={`/admin/clients/${clientId}`} className="inline-flex items-center text-sky-600 hover:text-sky-800 mb-0 group">
          <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar para Detalhes de {client?.name || 'Cliente'}
      </Link>
      <Card title={pageTitle}>
        {isLoading ? (
          <LoadingSpinner text="Carregando contrato..." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 p-2 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label htmlFor="contractNumber" className="block text-sm font-medium text-gray-700">Número do Contrato</label>
                <input type="text" name="contractNumber" id="contractNumber" value={formData.contractNumber} onChange={handleInputChange} required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="dateSigned" className="block text-sm font-medium text-gray-700">Data de Assinatura</label>
                <input type="date" name="dateSigned" id="dateSigned" value={formData.dateSigned} onChange={handleInputChange} required className={inputClasses} />
              </div>
            </div>
            <div>
              <label htmlFor="projectAddress" className="block text-sm font-medium text-gray-700">Endereço do Projeto</label>
              <input type="text" name="projectAddress" id="projectAddress" value={formData.projectAddress} onChange={handleInputChange} required className={inputClasses} />
            </div>
             <div>
                <p className="text-sm font-medium text-gray-500">Valor Total do Projeto (Calculado)</p>
                <p className="text-lg font-semibold text-sky-700 mt-1">
                    R$ {contract?.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
                <p className="text-xs text-gray-500">Este valor é atualizado automaticamente com base nos itens comprados.</p>
            </div>
            <div>
              <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">Condições de Pagamento</label>
              <textarea name="paymentTerms" id="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} rows={3} required className={inputClasses} />
            </div>
            <div>
              <label htmlFor="scopeOfWork" className="block text-sm font-medium text-gray-700">Escopo do Trabalho (Resumo)</label>
              <textarea name="scopeOfWork" id="scopeOfWork" value={formData.scopeOfWork} onChange={handleInputChange} rows={4} required className={inputClasses} />
            </div>
            
            <div>
              <label htmlFor="contractFile" className="block text-sm font-medium text-gray-700">Arquivo do Contrato</label>
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <input 
                  type="file" 
                  name="contractFile" 
                  id="contractFile" 
                  onChange={handleFileChange} 
                  className="block w-full max-w-xs text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                />
                {displayedFileName && (
                  <div className="mt-2 sm:mt-0 flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50 flex-grow min-w-0">
                    <DocumentTextIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate" title={displayedFileName}>{displayedFileName}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => alert(`Mock download for: ${displayedFileName}`)} className="ml-auto p-1 text-sky-600 hover:text-sky-800" title="Download (Mock)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile} className="p-1 text-red-500 hover:text-red-700" title="Remover Arquivo">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.222.261m3.222.261L12 5.291M12 5.291L11.757 3.65a1.125 1.125 0 012.486 0L12 5.291z" /></svg>
                    </Button>
                  </div>
                )}
              </div>
               {!displayedFileName && (
                 <div className="mt-2 text-sm text-gray-500">Nenhum arquivo de contrato selecionado.</div>
               )}
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Salvar Detalhes do Contrato</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default AdminContractManagementPage;