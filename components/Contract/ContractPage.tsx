import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { ContractDetails } from '../../types';
import { getContractDetails } from '../../services/dataService';
import Card from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';
import Button from '../Common/Button';

// FileText Icon
const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);


const ContractPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [contract, setContract] = useState<ContractDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
          const data = await getContractDetails(currentUser.id);
          setContract(data);
        } catch (error) {
          console.error("Failed to fetch contract details", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [currentUser]);

  if (isLoading) {
    return <LoadingSpinner text="Carregando detalhes do contrato..." className="mt-16" />;
  }

  if (!contract) {
    return (
      <Card title="Seu Contrato">
        <p className="text-center text-gray-500 py-8">Nenhum contrato encontrado para sua conta.</p>
      </Card>
    );
  }

  return (
    <Card title="Detalhes do Seu Contrato">
        <div className="p-2 md:p-6 space-y-6">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                <FileTextIcon className="w-12 h-12 text-sky-600" />
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Contrato Nº: {contract.contractNumber}</h3>
                    <p className="text-sm text-gray-500">Assinado em: {contract.dateSigned}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">Cliente</p>
                    <p className="text-lg text-gray-800">{contract.clientName}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Endereço do Projeto</p>
                    <p className="text-lg text-gray-800">{contract.projectAddress}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Valor Total do Projeto</p>
                    <p className="text-lg font-semibold text-sky-700">
                    R$ {contract.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Condições de Pagamento</p>
                    <p className="text-gray-800">{contract.paymentTerms}</p>
                </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500">Escopo do Trabalho (Resumo)</p>
                <p className="text-gray-800 whitespace-pre-line">{contract.scopeOfWork}</p>
            </div>

            {contract.contractPdfUrl && (
                <div className="mt-8 text-center">
                <a href={contract.contractPdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" size="lg">
                        Visualizar Contrato Completo (PDF)
                    </Button>
                </a>
                <p className="text-xs text-gray-500 mt-2">(Abre em nova aba - arquivo de exemplo)</p>
                </div>
            )}
        </div>
    </Card>
  );
};

export default ContractPage;