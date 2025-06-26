
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { PurchasedItem } from '../../types';
import { getPurchasedItems } from '../../services/dataService';
import Card from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';
import Button from '../Common/Button'; // Import Button
import { Link } from 'react-router-dom'; // Import Link

const ImagePlaceholderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

// Shopping cart icon for new purchases
const ShoppingCartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);


const PurchasedItemsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<PurchasedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
          const data = await getPurchasedItems(currentUser.id);
          setItems(data);
        } catch (error) {
          console.error("Failed to fetch purchased items", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [currentUser]);

  const totalProjectValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (isLoading) {
    return <LoadingSpinner text="Carregando seus itens..." className="mt-16" />;
  }

  return (
    <div className="space-y-8">
      <Card title="Deseja Comprar Novamente ou Iniciar um Novo Projeto?">
        <div className="p-2 md:p-4 text-center">
            <ShoppingCartIcon className="w-16 h-16 mx-auto text-sky-600 mb-4" />
            <p className="text-gray-700 mb-3 text-lg">
                Para adquirir novos itens, solicitar modificações em projetos existentes ou iniciar um novo projeto de móveis planejados, entre em contato conosco.
            </p>
            <p className="text-gray-600 mb-6">
                Nossa equipe está pronta para te atender e ajudar a realizar suas ideias!
            </p>
            <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
                <Link to="/mensagens">
                    <Button variant="primary" size="lg" leftIcon={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    }>
                        Enviar Mensagem
                    </Button>
                </Link>
                <Button variant="secondary" size="lg" onClick={() => alert('Entre em contato:\nTelefone: (XX) XXXX-XXXX\nEmail: contato@moveisplanejados.com')}>
                    Ver Contato (Telefone/Email)
                </Button>
            </div>
        </div>
      </Card>

      <Card title="Seus Itens Adquiridos Anteriormente">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum item comprado encontrado anteriormente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalhes
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qtd.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Unit.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
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
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.details || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                      R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100">
                  <tr>
                      <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">
                          Valor Total (Itens Anteriores Listados):
                      </td>
                      <td className="px-6 py-3 text-left text-sm font-bold text-sky-700">
                          R$ {totalProjectValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                  </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PurchasedItemsPage;
