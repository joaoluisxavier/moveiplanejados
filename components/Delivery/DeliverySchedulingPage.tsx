
import React from 'react';
import Card from '../Common/Card';
import Button from '../Common/Button';
import { Link } from 'react-router-dom';

// Truck icon
const TruckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1M13 16l2.286 2.286A2 2 0 0017.172 19h2.828a2 2 0 001.789-2.828l-2.286-2.286M13 16H6a1 1 0 01-1-1V6a1 1 0 011-1h6.172a2 2 0 011.414.586l2.828 2.828a2 2 0 01.586 1.414V15a1 1 0 01-1 1z" />
  </svg>
);


const DeliverySchedulingPage: React.FC = () => {
  return (
    <Card title="Agendamento de Entrega e Montagem">
      <div className="text-center py-8">
        <TruckIcon className="w-20 h-20 mx-auto text-sky-500 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Pronto para receber seus móveis?</h2>
        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
          Para agendar a entrega e montagem dos seus móveis, por favor, entre em contato conosco.
          Nossa equipe ajudará a encontrar a melhor data e horário para você.
        </p>
        <div className="space-y-3 sm:space-y-0 sm:space-x-4">
            <Link to="/mensagens">
                <Button variant="primary" size="lg">
                    Enviar Mensagem
                </Button>
            </Link>
            <Button variant="secondary" size="lg" onClick={() => alert('Informações de contato: (XX) XXXX-XXXX ou contato@moveisplanejados.com')}>
                Ver Contato Telefônico/Email
            </Button>
        </div>
        <p className="text-sm text-gray-500 mt-8">
          Em breve, você poderá selecionar datas diretamente por aqui!
        </p>
      </div>
    </Card>
  );
};

export default DeliverySchedulingPage;
