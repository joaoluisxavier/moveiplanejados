
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { FurnitureItem, ManufacturingLogEntry, FurnitureStatus } from '../../types';
import { getFurnitureItemDetails } from '../../services/dataService';
import Card from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';
import ProgressBar from '../Common/ProgressBar';
import Button from '../Common/Button'; 
import { FURNITURE_STATUS_ORDER } from '../../constants';

// --- Icons ---
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ImagePlaceholderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);
// --- End Icons ---


const FurnitureDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const { currentUser } = useAuth();
  const [item, setItem] = useState<FurnitureItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageOpacity, setImageOpacity] = useState(1); // For fade transition

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser && itemId) {
        setIsLoading(true);
        try {
          const data = await getFurnitureItemDetails(itemId, currentUser.id);
          setItem(data);
          setSelectedImageIndex(0); 
          setImageOpacity(1); 
        } catch (error) {
          console.error("Failed to fetch furniture item details", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [currentUser, itemId]);

  const handleImageNavigation = (newIndex: number) => {
    if (newIndex === selectedImageIndex || !item || !item.imageUrls || !item.imageUrls[newIndex]) return;

    setImageOpacity(0); 

    setTimeout(() => {
      setSelectedImageIndex(newIndex); 
      setImageOpacity(1); 
    }, 300); 
  };

  const goToPrevImage = () => {
    if (!item || !item.imageUrls || item.imageUrls.length === 0) return;
    if (selectedImageIndex > 0) {
      handleImageNavigation(selectedImageIndex - 1);
    }
  };

  const goToNextImage = () => {
    if (!item || !item.imageUrls || item.imageUrls.length === 0) return;
    if (selectedImageIndex < item.imageUrls.length - 1) {
      handleImageNavigation(selectedImageIndex + 1);
    }
  };


  if (isLoading) {
    return <LoadingSpinner text="Carregando detalhes do móvel..." className="mt-16" />;
  }

  if (!item) {
    return (
      <Card>
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold text-gray-700">Móvel não encontrado.</h2>
          <Link to="/meus-moveis" className="mt-4 inline-block text-sky-600 hover:text-sky-800">
            Voltar para Meus Móveis
          </Link>
        </div>
      </Card>
    );
  }

  const progressPercentage = (FURNITURE_STATUS_ORDER.indexOf(item.status) + 1) / FURNITURE_STATUS_ORDER.length * 100;
  const displayImageUrl = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[selectedImageIndex] : null;
  const currentStatusIndex = FURNITURE_STATUS_ORDER.indexOf(item.status);


  return (
    <div className="space-y-6">
      <Card>
        <Link to="/meus-moveis" className="text-sm text-sky-600 hover:underline mb-4 inline-block">
          &larr; Voltar para Meus Móveis
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Image Gallery Section */}
          <div className="space-y-3">
            <div className="relative aspect-w-16 aspect-h-12 md:aspect-h-10">
              {displayImageUrl ? (
                  <img 
                    src={displayImageUrl} 
                    alt={`${item.name} - Imagem ${selectedImageIndex + 1}`} 
                    className="w-full h-full object-contain rounded-lg shadow-lg bg-gray-100"
                    style={{ opacity: imageOpacity, transition: 'opacity 0.3s ease-in-out' }}
                    aria-live="polite"
                  />
              ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg shadow-lg">
                      <ImagePlaceholderIcon className="w-24 h-24 text-gray-400" />
                      <span className="sr-only">Nenhuma imagem disponível</span>
                  </div>
              )}

              {item.imageUrls && item.imageUrls.length > 1 && (
                <>
                  <button
                    onClick={goToPrevImage}
                    disabled={selectedImageIndex === 0}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition-all duration-150 ease-in-out disabled:opacity-20 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-75"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={goToNextImage}
                    disabled={selectedImageIndex === item.imageUrls.length - 1}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition-all duration-150 ease-in-out disabled:opacity-20 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-75"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnail navigation removed as per user request for a cleaner design */}
          </div>
          {/* End Image Gallery Section */}

          <div>
            <h2 className="text-3xl font-bold text-sky-800 mb-3">{item.name}</h2>
            <p className="text-gray-600 mb-4 whitespace-pre-line">{item.description}</p>
            
            <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <p className="text-sm text-slate-700">Status Atual: <span className="font-semibold text-lg text-sky-700">{item.status}</span></p>
                <p className="text-sm text-slate-700">Estimativa de Conclusão: <span className="font-semibold">{item.estimatedCompletionDate}</span></p>
                {typeof item.projectValue === 'number' && (
                     <p className="text-sm text-slate-700">Valor deste Item/Projeto: <span className="font-semibold text-green-700">R$ {item.projectValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                )}
                {item.dimensions && <p className="text-sm text-slate-700">Dimensões: <span className="font-semibold">{item.dimensions}</span></p>}
                {item.material && <p className="text-sm text-slate-700">Material Principal: <span className="font-semibold">{item.material}</span></p>}
            </div>

            <ProgressBar percentage={progressPercentage} label="Progresso Geral da Fabricação" />

            <div className="mt-6">
                <Link to="/contrato">
                    <Button variant="ghost" className="w-full" leftIcon={<FileTextIcon className="w-5 h-5"/>}>
                        Ver Contrato Geral do Projeto
                    </Button>
                </Link>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Linha do Tempo da Fabricação">
        <div className="relative pl-6">
          <div className="absolute left-[1.125rem] top-0 bottom-0 w-0.5 bg-sky-200" aria-hidden="true"></div>
          
          {FURNITURE_STATUS_ORDER.map((status, index) => {
            const logEntry = item.manufacturingLog.find(log => log.stage === status);
            const isCompleted = index <= currentStatusIndex;
            const isActive = index === currentStatusIndex;

            return (
              <div key={status} className="relative mb-8 pl-8 group" style={{ paddingLeft: '2.5rem'}}>
                <div className={`absolute left-[1.125rem] top-1 w-6 h-6 rounded-full transform -translate-x-1/2 flex items-center justify-center
                  ${isCompleted ? 'bg-sky-600' : 'bg-gray-300'} 
                  ${isActive ? 'ring-4 ring-sky-200' : ''}
                `} aria-hidden="true">
                  {isCompleted ? <CheckCircleIcon className="w-4 h-4 text-white" /> : <ClockIcon className="w-3 h-3 text-gray-500" />}
                </div>
                
                <div className={`transition-all duration-300 ${isCompleted ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                    <h4 className={`text-lg font-semibold ${isCompleted ? 'text-sky-700' : 'text-gray-600'}`}>{status}</h4>
                    {logEntry ? (
                        <>
                            <p className="text-sm text-gray-500">{logEntry.date}</p>
                            {logEntry.notes && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{logEntry.notes}</p>}
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Pendente</p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default FurnitureDetailPage;
