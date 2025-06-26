
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { FurnitureItem, FurnitureStatus } from '../../types';
import { getFurnitureItems } from '../../services/dataService';
import Card from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';
import ProgressBar from '../Common/ProgressBar';
import { FURNITURE_STATUS_ORDER } from '../../constants';

const ImagePlaceholderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const FurnitureItemCard: React.FC<{ item: FurnitureItem }> = ({ item }) => {
  const progressPercentage = (FURNITURE_STATUS_ORDER.indexOf(item.status) + 1) / FURNITURE_STATUS_ORDER.length * 100;
  const displayImageUrl = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      {displayImageUrl ? (
         <img src={displayImageUrl} alt={item.name} className="w-full h-48 object-cover rounded-t-xl" />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-xl">
            <ImagePlaceholderIcon className="w-16 h-16 text-gray-400" />
        </div>
      )}
      <div className="p-5">
        <h3 className="text-xl font-semibold text-sky-800 mb-2">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-3 h-16 overflow-hidden">{item.description}</p>
        
        <div className="mb-3">
          <span className="text-xs font-medium inline-block py-1 px-2.5 leading-none text-center whitespace-nowrap align-baseline bg-sky-200 text-sky-800 rounded-full">
            {item.status}
          </span>
        </div>
        
        <ProgressBar percentage={progressPercentage} label="Progresso da Fabricação" />

        <p className="text-sm text-gray-500 mt-3">
          Conclusão Estimada: <span className="font-medium">{item.estimatedCompletionDate}</span>
        </p>
        <Link to={`/meus-moveis/${item.id}`} className="mt-4 inline-block text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
          Ver Detalhes
        </Link>
      </div>
    </Card>
  );
};

const FurnitureTrackingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FurnitureStatus | 'todos'>('todos');

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
          const data = await getFurnitureItems(currentUser.id);
          setFurnitureItems(data);
        } catch (error) {
          console.error("Failed to fetch furniture items", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [currentUser]);

  if (isLoading) {
    return <LoadingSpinner text="Carregando seus móveis..." className="mt-16" />;
  }

  const filteredItems = filter === 'todos' 
    ? furnitureItems 
    : furnitureItems.filter(item => item.status === filter);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Meus Móveis Planejados</h2>
            <div>
                <label htmlFor="statusFilter" className="mr-2 text-sm font-medium text-gray-700">Filtrar por status:</label>
                <select 
                    id="statusFilter"
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value as FurnitureStatus | 'todos')}
                    className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                >
                    <option value="todos">Todos</option>
                    {FURNITURE_STATUS_ORDER.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
        </div>
      </Card>

      {filteredItems.length === 0 ? (
        <Card>
            <p className="text-center text-gray-600 py-8">
                {filter === 'todos' ? 'Você ainda não possui móveis cadastrados.' : `Nenhum móvel encontrado com o status "${filter}".`}
            </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <FurnitureItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FurnitureTrackingPage;
