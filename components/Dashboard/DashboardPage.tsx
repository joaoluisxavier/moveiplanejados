
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../App';
import Card from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';
import Button from '../Common/Button';
import { FurnitureItem, Deadline, FurnitureStatus } from '../../types';
import { getFurnitureItems, getDeadlines } from '../../services/dataService';
import ProgressBar from '../Common/ProgressBar';
import { FURNITURE_STATUS_ORDER } from '../../constants';

// Simple SVG Icons
const CalendarDaysIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);
const WrenchScrewdriverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.528-1.036.09-2.379-.938-2.908L10.5 7.5M11.42 15.17L7.5 10.5M4.364 4.364l2.496 3.03c.528 1.036.09 2.379-.938 2.908L3.516 12.08A2.652 2.652 0 003.516 17.25L9.345 21" />
  </svg>
);
const TruckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1M13 16l2.286 2.286A2 2 0 0017.172 19h2.828a2 2 0 001.789-2.828l-2.286-2.286M13 16H6a1 1 0 01-1-1V6a1 1 0 011-1h6.172a2 2 0 011.414.586l2.828 2.828a2 2 0 01.586 1.414V15a1 1 0 01-1 1z" />
  </svg>
);
const ShoppingBagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);


const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
          const [itemsData, deadlinesData] = await Promise.all([
            getFurnitureItems(currentUser.id),
            getDeadlines(currentUser.id),
          ]);
          setFurnitureItems(itemsData);
          setDeadlines(deadlinesData.filter(d => new Date(d.date.split('/').reverse().join('-')) >= new Date()));
        } catch (error) {
          console.error("Failed to fetch dashboard data", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [currentUser]);

  if (isLoading) {
    return <LoadingSpinner text="Carregando seu painel..." className="mt-16" />;
  }

  const activeProjects = furnitureItems.filter(item => 
    item.status !== FurnitureStatus.Concluido
  );
  
  const upcomingDeadline = deadlines.length > 0 ? deadlines[0] : null;

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-lg">
        <div className="p-6">
            <h1 className="text-3xl font-bold">Olá, {currentUser?.name}!</h1>
            <p className="mt-2 text-sky-100">Bem-vindo(a) de volta ao seu portal de acompanhamento de projetos.</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats Cards */}
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-sky-100 rounded-full mr-4">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-sky-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6A1.125 1.125 0 012.25 10.875v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
                </svg>
            </div>
            <div>
                <p className="text-sm text-gray-500">Projetos Ativos</p>
                <p className="text-2xl font-semibold text-gray-800">{activeProjects.length}</p>
            </div>
          </div>
        </Card>
        <Card>
           <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-full mr-4">
                <CalendarDaysIcon className="w-8 h-8 text-amber-600" />
            </div>
            <div>
                <p className="text-sm text-gray-500">Próximo Prazo</p>
                {upcomingDeadline ? (
                    <>
                        <p className="text-xl font-semibold text-gray-800">{upcomingDeadline.title}</p>
                        <p className="text-sm text-gray-600">{upcomingDeadline.date}</p>
                    </>
                ) : (
                    <p className="text-xl font-semibold text-gray-800">Nenhum</p>
                )}
            </div>
           </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                    <TruckIcon className="w-8 h-8 text-green-600" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Itens Prontos</p>
                    <p className="text-2xl font-semibold text-gray-800">
                        {furnitureItems.filter(item => item.status === FurnitureStatus.ProntoParaEntrega).length}
                    </p>
                </div>
            </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Ações Rápidas">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/meus-moveis">
            <Button variant="ghost" className="w-full justify-start py-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6A1.125 1.125 0 012.25 10.875v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
              </svg>
              Ver Meus Móveis
            </Button>
          </Link>
          <Link to="/assistencia">
            <Button variant="ghost" className="w-full justify-start py-4">
              <WrenchScrewdriverIcon className="w-5 h-5 mr-2" />
              Solicitar Assistência
            </Button>
          </Link>
          <Link to="/itens-comprados">
            <Button variant="ghost" className="w-full justify-start py-4">
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
              Comprar Novamente
            </Button>
          </Link>
        </div>
      </Card>
      
      {activeProjects.length > 0 && (
        <Card title="Acompanhamento Rápido de Móveis">
          <div className="space-y-4">
            {activeProjects.slice(0, 3).map(item => (
              <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold text-sky-700">{item.name}</h4>
                  <Link to={`/meus-moveis/${item.id}`} className="text-sm text-sky-600 hover:underline">Ver Detalhes</Link>
                </div>
                <p className="text-sm text-gray-600 mb-1">Status: <span className="font-medium">{item.status}</span></p>
                <ProgressBar 
                  percentage={(FURNITURE_STATUS_ORDER.indexOf(item.status) + 1) / FURNITURE_STATUS_ORDER.length * 100} 
                  showPercentageText 
                />
              </div>
            ))}
            {activeProjects.length > 3 && (
                 <Link to="/meus-moveis" className="block text-center mt-4">
                    <Button variant="primary">Ver todos os móveis ({activeProjects.length})</Button>
                </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;