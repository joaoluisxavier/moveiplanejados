
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { Deadline, DeadlineType } from '../../types';
import { getDeadlines } from '../../services/dataService';
import Card from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';

const DeadlineTypeColors: Record<DeadlineType, string> = {
  [DeadlineType.Pagamento]: 'bg-red-100 text-red-800 border-red-300',
  [DeadlineType.EntregaEstimada]: 'bg-sky-100 text-sky-800 border-sky-300',
  [DeadlineType.MontagemEstimada]: 'bg-teal-100 text-teal-800 border-teal-300',
  [DeadlineType.InicioProducao]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [DeadlineType.FinalProducao]: 'bg-green-100 text-green-800 border-green-300',
};

// Calendar Icon
const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008zM12 15h.008v.008H12v-.008zM12 12h.008v.008H12v-.008zM9.75 15h.008v.008H9.75v-.008zM9.75 12h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5v-.008zM7.5 12h.008v.008H7.5v-.008zm4.5-3.75h.008v.008H12v-.008zm2.25-3.75h.008v.008H14.25v-.008zm0 3.75h.008v.008H14.25v-.008zm2.25-3.75h.008v.008H16.5v-.008zm0 3.75h.008v.008H16.5v-.008z" />
  </svg>
);


const DeadlinesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
          const data = await getDeadlines(currentUser.id);
          setDeadlines(data);
        } catch (error) {
          console.error("Failed to fetch deadlines", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [currentUser]);

  if (isLoading) {
    return <LoadingSpinner text="Carregando prazos..." className="mt-16" />;
  }

  return (
    <div className="space-y-6">
      <Card title="Seus Prazos e Datas Importantes">
        <p className="text-gray-600 mb-6">Acompanhe todos os prazos relevantes do seu projeto. Prazos passados são exibidos para referência.</p>
        {deadlines.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum prazo cadastrado no momento.</p>
        ) : (
          <div className="space-y-4">
            {deadlines.map(deadline => {
              const isPast = new Date(deadline.date.split('/').reverse().join('-')) < new Date(new Date().toDateString());
              return (
                <div key={deadline.id} className={`p-5 rounded-lg border flex items-start space-x-4 ${DeadlineTypeColors[deadline.type]} ${isPast ? 'opacity-70' : ''}`}>
                  <div className="flex-shrink-0 pt-1">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h3 className={`text-lg font-semibold ${isPast ? 'line-through' : ''}`}>{deadline.title}</h3>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${DeadlineTypeColors[deadline.type].replace('bg-', 'border-').replace('text-', 'text-')} border`}>
                            {deadline.type}
                        </span>
                    </div>
                    <p className={`text-md font-medium ${isPast ? 'text-gray-500' : DeadlineTypeColors[deadline.type].split(' ')[1]}`}>{deadline.date}</p>
                    {deadline.details && <p className="text-sm mt-1">{deadline.details}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DeadlinesPage;
