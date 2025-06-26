
import { 
  User, 
  FurnitureItem, 
  FurnitureStatus, 
  Deadline, 
  DeadlineType,
  AssistanceRequest, 
  AssistanceRequestStatus,
  Message,
  PurchasedItem,
  ContractDetails,
  ManufacturingLogEntry
} from '../types';
import { FURNITURE_STATUS_ORDER } from '../constants';
import { 
    getMockUserById,
    // Note: User data itself is managed by authService and its localStorage persistence.
    // dataService will only rely on getMockUserById for user details like name.
} from './authService';

// --- LocalStorage Keys ---
const MOCK_FURNITURE_ITEMS_STORAGE_KEY = 'mockFurnitureItemsData';
const MOCK_DEADLINES_STORAGE_KEY = 'mockDeadlinesData';
const MOCK_ASSISTANCE_REQUESTS_STORAGE_KEY = 'mockAssistanceRequestsData';
const MOCK_MESSAGES_STORAGE_KEY = 'mockMessagesData';
const MOCK_PURCHASED_ITEMS_STORAGE_KEY = 'mockPurchasedItemsData';
const MOCK_CONTRACT_DETAILS_STORAGE_KEY = 'mockContractDetailsData';

// --- Helper function for loading from localStorage ---
function loadFromLocalStorage<T>(key: string, defaultValue: T[], validator?: (item: T) => boolean): T[] {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      const parsedValue = JSON.parse(storedValue);
      if (Array.isArray(parsedValue)) {
        if (parsedValue.length === 0) {
          console.log(`dataService: Successfully loaded empty array from localStorage for key ${key}.`);
          return parsedValue; // Empty array is a valid state.
        }
        // Non-empty array, check validator if provided
        if (validator) {
          if (parsedValue[0] !== undefined && validator(parsedValue[0])) {
            console.log(`dataService: Successfully loaded and validated ${parsedValue.length} items from localStorage for key ${key}.`);
            return parsedValue;
          } else {
            console.warn(`dataService: Validator failed for key ${key} or data structure malformed. First item:`, parsedValue[0], `Falling back to default and overwriting localStorage.`);
          }
        } else { // No validator, non-empty array is considered valid
          console.log(`dataService: Successfully loaded ${parsedValue.length} items from localStorage for key ${key} (no validator).`);
          return parsedValue;
        }
      } else { // parsedValue is not an array
        console.warn(`dataService: Non-array data found in localStorage for key ${key}. Value:`, parsedValue, `Falling back to default and overwriting localStorage.`);
      }
    } else { // storedValue is null (key not found)
        console.log(`dataService: No data found for key ${key}. Initializing with default data and saving to localStorage.`);
    }
  } catch (error) { // Catches JSON.parse errors or other errors during load
    console.error(`dataService: Error loading/parsing localStorage for key ${key}:`, error, `Falling back to default and overwriting localStorage.`);
  }
  // Fallback: Use default and save it.
  console.log(`dataService: Using default data for key ${key} and saving to localStorage.`);
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return [...defaultValue]; // Return a *copy* of the default values
}

// --- Manufacturing Log Creation ---
const createInitialManufacturingLog = (status: FurnitureStatus): ManufacturingLogEntry[] => {
  const log: ManufacturingLogEntry[] = [];
  const today = new Date();
  const currentIndex = FURNITURE_STATUS_ORDER.indexOf(status);
  
  for (let i = 0; i <= currentIndex; i++) {
    const stageDate = new Date(today);
    // Ensure daysForThisStage calculation doesn't create future dates for past stages unnecessarily.
    // This logic attempts to make past stages appear reasonably in the past.
    const daysToSubtract = (currentIndex - i) * 7 + (i === currentIndex ? 0 : Math.floor(Math.random() * 5) + 2); // Randomize slightly
    stageDate.setDate(today.getDate() - daysToSubtract);
    
    log.push({
      stage: FURNITURE_STATUS_ORDER[i],
      date: stageDate.toLocaleDateString('pt-BR'),
      notes: `Etapa de ${FURNITURE_STATUS_ORDER[i].toLowerCase()} iniciada.`
    });
  }
  return log;
};

// --- Default Data ---
const defaultFurnitureItems: FurnitureItem[] = [
  { 
    id: 'f1', userId: '1',
    name: 'Cozinha Planejada Premium (João)', 
    description: 'Cozinha completa com armários em MDF Naval, bancada em quartzo e ferragens premium.',
    imageUrls: ['https://picsum.photos/seed/kitchen_joao/600/400'], 
    status: FurnitureStatus.ProducaoIniciada, 
    estimatedCompletionDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    manufacturingLog: createInitialManufacturingLog(FurnitureStatus.ProducaoIniciada),
    projectValue: 25000,
  },
  { 
    id: 'f2', userId: '1',
    name: 'Guarda-Roupa Casal Moderno (João)', 
    description: 'Guarda-roupa com 6 portas, espelho central, gavetas internas e maleiro.',
    imageUrls: ['https://picsum.photos/seed/wardrobe_joao/600/400'], 
    status: FurnitureStatus.ProntoParaEntrega, 
    estimatedCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    manufacturingLog: createInitialManufacturingLog(FurnitureStatus.ProntoParaEntrega),
    projectValue: 8500,
  },
  { 
    id: 'f3', userId: '2',
    name: 'Painel de TV Sala (Maria)', 
    description: 'Painel ripado com nichos iluminados para TV de até 75 polegadas.',
    imageUrls: ['https://picsum.photos/seed/tvpanel_maria/600/400'], 
    status: FurnitureStatus.Concluido, 
    estimatedCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    manufacturingLog: createInitialManufacturingLog(FurnitureStatus.Concluido),
    projectValue: 3200,
  },
   { 
    id: 'f4', userId: '1',
    name: 'Escritório Home Office (João)', 
    description: 'Bancada de estudos e armário aéreo.',
    imageUrls: ['https://picsum.photos/seed/office_joao/600/400'], 
    status: FurnitureStatus.DescritivoAprovado, 
    estimatedCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    manufacturingLog: createInitialManufacturingLog(FurnitureStatus.DescritivoAprovado),
    projectValue: 4800,
  },
];
const defaultDeadlines: Deadline[] = [
  { id: 'd1', userId: '1', title: 'Pagamento Entrada Cozinha (João)', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), type: DeadlineType.Pagamento, details: "50% do valor total." },
  { id: 'd2', userId: '1', title: 'Início Produção Cozinha (João)', date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), type: DeadlineType.InicioProducao },
  { id: 'd3', userId: '2', title: 'Estimativa Entrega Painel TV (Maria)', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), type: DeadlineType.EntregaEstimada },
];
const defaultAssistanceRequests: AssistanceRequest[] = [
  { 
    id: 'ar1', 
    userId: '1', 
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), 
    subject: 'Porta do armário desalinhada (João)', 
    description: 'Uma das portas do armário da cozinha parece estar um pouco desalinhada na parte superior.', 
    status: AssistanceRequestStatus.Resolvido, 
    resolutionNotes: "Técnico visitou e ajustou a dobradiça. Problema resolvido.",
    imageUrls: ['https://picsum.photos/seed/assistance_ar1_img1/300/200', 'https://picsum.photos/seed/assistance_ar1_img2/300/200']
  },
  { 
    id: 'ar2', 
    userId: '2', 
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), 
    subject: 'Luz de LED do painel piscando (Maria)', 
    description: 'A fita de LED de um dos nichos do painel da TV começou a piscar intermitentemente.', 
    status: AssistanceRequestStatus.EmAnalise,
    imageUrls: [] 
  },
];
const defaultMessages: Message[] = [
  { id: 'm1', userId: '1', sender: 'empresa', content: 'Olá João, bem-vindo ao portal do cliente! Seu projeto da cozinha já está em produção.', timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toLocaleString('pt-BR'), read: true },
  { id: 'm2', userId: '1', sender: 'cliente', content: 'Obrigado! Alguma previsão para o término da produção?', timestamp: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toLocaleString('pt-BR'), read: true },
  { id: 'm3', userId: '2', sender: 'empresa', content: 'Olá Maria, o painel da sua TV está pronto para agendamento de entrega.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleString('pt-BR'), read: false },
];
const defaultPurchasedItems: PurchasedItem[] = [
  { id: 'pi1', userId: '1', name: 'Cozinha Planejada Premium (Histórico)', quantity: 1, unitPrice: 25000, totalPrice: 25000, imageUrls: ['https://picsum.photos/seed/kitchen_joao_item/100/100'], details: 'MDF Naval, Quartzo, Ferragens Blum' },
  { id: 'pi2', userId: '1', name: 'Guarda-Roupa Casal Moderno (Histórico)', quantity: 1, unitPrice: 8500, totalPrice: 8500, imageUrls: ['https://picsum.photos/seed/wardrobe_joao_item/100/100'], details: '6 portas, Espelho, MDF Branco TX' },
  { id: 'pi3', userId: '2', name: 'Painel de TV Sala (Histórico)', quantity: 1, unitPrice: 3200, totalPrice: 3200, imageUrls: ['https://picsum.photos/seed/tvpanel_maria_item/100/100'], details: 'Ripado, Nichos Iluminados, MDF Amadeirado' },
];
const defaultContractDetails: ContractDetails[] = [
 {
  userId: '1',
  contractNumber: 'CT-2024-00123',
  clientName: 'João Silva', 
  dateSigned: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
  projectAddress: 'Rua das Palmeiras, 123, Bairro Feliz, Cidade Alegre - UF',
  totalValue: 33500.00, 
  paymentTerms: '50% de entrada, 50% na entrega. Parcelamento em até 10x no cartão.',
  scopeOfWork: 'Fornecimento e instalação de cozinha planejada, guarda-roupa casal, conforme projetos aprovados.',
  contractPdfUrl: '/sample-contract.pdf' 
 },
 {
  userId: '2',
  contractNumber: 'CT-2024-00124',
  clientName: 'Maria Oliveira',
  dateSigned: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
  projectAddress: 'Avenida das Acácias, 456, Centro, Cidade Alegre - UF',
  totalValue: 3200.00, 
  paymentTerms: 'Pagamento integral na aprovação do projeto.',
  scopeOfWork: 'Fornecimento e instalação de painel de TV, conforme projeto aprovado.',
  contractPdfUrl: 'contrato_maria_assinado.pdf' 
 }
];

// --- Validators for loaded data (simple checks) ---
const isFurnitureItem = (item: any): item is FurnitureItem => typeof item?.id === 'string' && typeof item?.name === 'string';
const isDeadline = (item: any): item is Deadline => typeof item?.id === 'string' && typeof item?.title === 'string';
const isAssistanceRequest = (item: any): item is AssistanceRequest => typeof item?.id === 'string' && typeof item?.subject === 'string';
const isMessage = (item: any): item is Message => typeof item?.id === 'string' && typeof item?.content === 'string';
const isPurchasedItem = (item: any): item is PurchasedItem => typeof item?.id === 'string' && typeof item?.name === 'string';
const isContractDetails = (item: any): item is ContractDetails => typeof item?.userId === 'string' && typeof item?.contractNumber === 'string';

// --- Initialize Data Arrays with localStorage ---
let mockFurnitureItems: FurnitureItem[] = loadFromLocalStorage(MOCK_FURNITURE_ITEMS_STORAGE_KEY, defaultFurnitureItems, isFurnitureItem);
let mockDeadlines: Deadline[] = loadFromLocalStorage(MOCK_DEADLINES_STORAGE_KEY, defaultDeadlines, isDeadline);
let mockAssistanceRequests: AssistanceRequest[] = loadFromLocalStorage(MOCK_ASSISTANCE_REQUESTS_STORAGE_KEY, defaultAssistanceRequests, isAssistanceRequest);
let mockMessages: Message[] = loadFromLocalStorage(MOCK_MESSAGES_STORAGE_KEY, defaultMessages, isMessage);
let mockPurchasedItems: PurchasedItem[] = loadFromLocalStorage(MOCK_PURCHASED_ITEMS_STORAGE_KEY, defaultPurchasedItems, isPurchasedItem);
let mockContractDetails: ContractDetails[] = loadFromLocalStorage(MOCK_CONTRACT_DETAILS_STORAGE_KEY, defaultContractDetails, isContractDetails);

// --- Save Functions ---
const saveMockFurnitureItemsToLocalStorage = () => { try { localStorage.setItem(MOCK_FURNITURE_ITEMS_STORAGE_KEY, JSON.stringify(mockFurnitureItems)); console.log(`dataService: Saved ${mockFurnitureItems.length} furniture items to localStorage.`); } catch (e) { console.error(`dataService: Error saving to localStorage key ${MOCK_FURNITURE_ITEMS_STORAGE_KEY}:`, e); } };
const saveMockDeadlinesToLocalStorage = () => { try { localStorage.setItem(MOCK_DEADLINES_STORAGE_KEY, JSON.stringify(mockDeadlines)); console.log(`dataService: Saved ${mockDeadlines.length} deadlines to localStorage.`); } catch (e) { console.error(`dataService: Error saving to localStorage key ${MOCK_DEADLINES_STORAGE_KEY}:`, e); } };
const saveMockAssistanceRequestsToLocalStorage = () => { try { localStorage.setItem(MOCK_ASSISTANCE_REQUESTS_STORAGE_KEY, JSON.stringify(mockAssistanceRequests)); console.log(`dataService: Saved ${mockAssistanceRequests.length} assistance requests to localStorage.`); } catch (e) { console.error(`dataService: Error saving to localStorage key ${MOCK_ASSISTANCE_REQUESTS_STORAGE_KEY}:`, e); } };
const saveMockMessagesToLocalStorage = () => { try { localStorage.setItem(MOCK_MESSAGES_STORAGE_KEY, JSON.stringify(mockMessages)); console.log(`dataService: Saved ${mockMessages.length} messages to localStorage.`); } catch (e) { console.error(`dataService: Error saving to localStorage key ${MOCK_MESSAGES_STORAGE_KEY}:`, e); } };
const saveMockPurchasedItemsToLocalStorage = () => { try { localStorage.setItem(MOCK_PURCHASED_ITEMS_STORAGE_KEY, JSON.stringify(mockPurchasedItems)); console.log(`dataService: Saved ${mockPurchasedItems.length} purchased items to localStorage.`); } catch (e) { console.error(`dataService: Error saving to localStorage key ${MOCK_PURCHASED_ITEMS_STORAGE_KEY}:`, e); } };
const saveMockContractDetailsToLocalStorage = () => { try { localStorage.setItem(MOCK_CONTRACT_DETAILS_STORAGE_KEY, JSON.stringify(mockContractDetails)); console.log(`dataService: Saved ${mockContractDetails.length} contract details to localStorage.`); } catch (e) { console.error(`dataService: Error saving to localStorage key ${MOCK_CONTRACT_DETAILS_STORAGE_KEY}:`, e); } };


const simulateApiCall = <T,>(data: T, delay = 50): Promise<T> => // Reduced delay for faster UI updates
  new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), delay));

const updateContractTotalValue = (userId: string) => {
    const contractIndex = mockContractDetails.findIndex(c => c.userId === userId);
    if (contractIndex > -1) {
        const clientFurnitureItems = mockFurnitureItems.filter(item => item.userId === userId);
        const clientPurchasedItems = mockPurchasedItems.filter(item => item.userId === userId); // Consider purchased items too for contract value
        
        // Sum projectValue from FurnitureItem and totalPrice from PurchasedItem for contract value
        const furnitureValue = clientFurnitureItems.reduce((sum, item) => sum + (item.projectValue || 0), 0);
        // Assuming purchased items are one-off and their value isn't double-counted if also in furnitureItems as a project
        // This logic might need refinement based on how 'PurchasedItem' and 'FurnitureItem' relate.
        // For now, let's assume they might be distinct or PurchasedItem is for historical/separate things.
        // A simple sum might be incorrect if there's overlap.
        // A safer bet for now is to rely on active FurnitureItems marked with a projectValue for the *current* contract.
        // Let's assume projectValue on FurnitureItem is the primary driver for a contract.

        mockContractDetails[contractIndex].totalValue = furnitureValue; // Focus on active project values for now.
        saveMockContractDetailsToLocalStorage(); // Save after update
    }
};

// Initial calculation for all contracts if not already up-to-date
mockContractDetails.forEach(contract => updateContractTotalValue(contract.userId));


export const getFurnitureItems = (userId: string): Promise<FurnitureItem[]> => {
  return simulateApiCall(mockFurnitureItems.filter(item => item.userId === userId));
};

export const getFurnitureItemDetails = (itemId: string, userId: string): Promise<FurnitureItem | null> => {
  const item = mockFurnitureItems.find(f => f.id === itemId && f.userId === userId) || null;
  return simulateApiCall(item);
};

export const getDeadlines = (userId: string): Promise<Deadline[]> => {
  const userDeadlines = mockDeadlines.filter(d => d.userId === userId);
  return simulateApiCall(userDeadlines.sort((a,b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime() ));
};

export const getAssistanceRequests = (userId: string): Promise<AssistanceRequest[]> => {
  const userRequests = mockAssistanceRequests.filter(req => req.userId === userId);
  return simulateApiCall(userRequests.sort((a,b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime()));
};

export const submitAssistanceRequest = (
  userId: string, 
  requestData: Omit<AssistanceRequest, 'id' | 'date' | 'status' | 'userId'>
): Promise<AssistanceRequest> => {
  const newRequest: AssistanceRequest = {
    ...requestData,
    id: `ar${Date.now()}`,
    userId,
    date: new Date().toLocaleDateString('pt-BR'),
    status: AssistanceRequestStatus.Aberto,
    imageUrls: requestData.imageUrls || [] 
  };
  mockAssistanceRequests.unshift(newRequest);
  saveMockAssistanceRequestsToLocalStorage();
  return simulateApiCall(newRequest);
};

export const getMessages = (userId: string): Promise<Message[]> => {
  const userMessages = mockMessages.filter(msg => msg.userId === userId);
  return simulateApiCall(userMessages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
};

export const sendMessage = (userId: string, content: string, sender: 'cliente' | 'empresa' | 'admin'): Promise<Message> => {
  const newMessage: Message = {
    id: `m${Date.now()}`,
    userId,
    sender,
    content,
    timestamp: new Date().toLocaleString('pt-BR'),
    read: sender !== 'empresa' && sender !== 'admin' 
  };
  mockMessages.push(newMessage);
  saveMockMessagesToLocalStorage();
  return simulateApiCall(newMessage);
};

export const getPurchasedItems = (userId: string): Promise<PurchasedItem[]> => {
  return simulateApiCall(mockPurchasedItems.filter(item => item.userId === userId));
};

export const getContractDetails = async (userId: string): Promise<ContractDetails | null> => {
  const user = await getMockUserById(userId); 
  let contract = mockContractDetails.find(c => c.userId === userId);
  
  if (!contract && user) { // If contract doesn't exist, create a shell for this user
      console.log(`dataService: No contract found for user ${userId}. Creating a new shell contract.`);
      const newContractShell: ContractDetails = {
          userId: user.id,
          contractNumber: `CT-NEW-${user.id}-${Date.now().toString().slice(-3)}`,
          clientName: user.name,
          dateSigned: new Date().toLocaleDateString('pt-BR'),
          projectAddress: 'A ser definido',
          totalValue: 0,
          paymentTerms: 'A ser definido',
          scopeOfWork: 'Novo projeto, escopo a ser detalhado.',
          contractPdfUrl: ''
      };
      mockContractDetails.push(newContractShell);
      saveMockContractDetailsToLocalStorage();
      contract = newContractShell;
  }
  
  if (contract && user) {
    updateContractTotalValue(userId); 
    // Re-fetch contract after totalValue update as it might have changed
    const currentContract = mockContractDetails.find(c => c.userId === userId); 
    return simulateApiCall({...currentContract, clientName: user.name});
  }
  return simulateApiCall(null);
};


export const adminGetFurnitureItemsByUserId = (userId: string): Promise<FurnitureItem[]> => {
  return getFurnitureItems(userId); 
};

export const adminGetAllFurnitureItems = (): Promise<FurnitureItem[]> => {
  return simulateApiCall([...mockFurnitureItems]);
};

export const adminGetFurnitureItemDetails = (itemId: string): Promise<FurnitureItem | null> => {
    const item = mockFurnitureItems.find(f => f.id === itemId) || null;
    return simulateApiCall(item);
};


export const adminAddFurnitureItem = (userId: string, itemData: Omit<FurnitureItem, 'id' | 'userId' | 'manufacturingLog' | 'dimensions' | 'material'> & {projectValue?: number}): Promise<FurnitureItem> => {
  const newItem: FurnitureItem = {
    name: itemData.name,
    description: itemData.description,
    imageUrls: itemData.imageUrls,
    status: itemData.status || FurnitureStatus.PagamentoAprovado,
    estimatedCompletionDate: itemData.estimatedCompletionDate,
    projectValue: itemData.projectValue,
    id: `f${Date.now()}`,
    userId,
    manufacturingLog: createInitialManufacturingLog(itemData.status || FurnitureStatus.PagamentoAprovado)
  };
  mockFurnitureItems.push(newItem);
  saveMockFurnitureItemsToLocalStorage();
  updateContractTotalValue(userId);
  return simulateApiCall(newItem);
};

export const adminUpdateFurnitureItem = (itemId: string, updates: Partial<Omit<FurnitureItem, 'id' | 'userId' | 'manufacturingLog' | 'dimensions' | 'material'>> & {projectValue?: number}): Promise<FurnitureItem | null> => {
  const itemIndex = mockFurnitureItems.findIndex(item => item.id === itemId);
  if (itemIndex > -1) {
    const currentItem = mockFurnitureItems[itemIndex];
    const updatedData = { ...currentItem, ...updates };

    if (updates.status && updates.status !== currentItem.status) {
        // Find existing log for the new status or create it.
        let logEntryForNewStatus = updatedData.manufacturingLog.find(log => log.stage === updates.status);
        if (logEntryForNewStatus) {
            logEntryForNewStatus.date = new Date().toLocaleDateString('pt-BR'); // Update date to now
            logEntryForNewStatus.notes = `Status atualizado para ${updates.status} pelo administrador. (Log existente atualizado)`;
        } else {
             updatedData.manufacturingLog.push({
                stage: updates.status,
                date: new Date().toLocaleDateString('pt-BR'),
                notes: `Status atualizado para ${updates.status} pelo administrador.`
             });
        }
        // Ensure log is sorted by defined order
         updatedData.manufacturingLog.sort((a, b) => 
            FURNITURE_STATUS_ORDER.indexOf(a.stage as FurnitureStatus) - FURNITURE_STATUS_ORDER.indexOf(b.stage as FurnitureStatus)
        );
         // Prune future logs if status is moved backward, or fill in past logs if moved forward significantly
         // For simplicity, this example just adds/updates the current status log.
         // A more complex system might rebuild the log based on the new status.
    }

    mockFurnitureItems[itemIndex] = updatedData;
    saveMockFurnitureItemsToLocalStorage();
    updateContractTotalValue(currentItem.userId);
    return simulateApiCall(mockFurnitureItems[itemIndex]);
  }
  return simulateApiCall(null);
};

export const adminDeleteFurnitureItem = (itemId: string): Promise<boolean> => {
  const itemIndex = mockFurnitureItems.findIndex(item => item.id === itemId);
  if (itemIndex > -1) {
    const deletedItem = mockFurnitureItems.splice(itemIndex, 1)[0];
    saveMockFurnitureItemsToLocalStorage();
    updateContractTotalValue(deletedItem.userId);
    return simulateApiCall(true);
  }
  return simulateApiCall(false);
};


export const adminGetAssistanceRequestsByUserId = (userId: string): Promise<AssistanceRequest[]> => {
  return getAssistanceRequests(userId); 
};
export const adminGetAllAssistanceRequests = (): Promise<AssistanceRequest[]> => {
    const allRequests = mockAssistanceRequests.map(req => ({ ...req })); 
    return simulateApiCall(allRequests.sort((a,b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime()));
};


export const adminUpdateAssistanceRequest = (requestId: string, updates: Partial<AssistanceRequest>): Promise<AssistanceRequest | null> => {
  const requestIndex = mockAssistanceRequests.findIndex(req => req.id === requestId);
  if (requestIndex > -1) {
    const existingImageUrls = mockAssistanceRequests[requestIndex].imageUrls;
    mockAssistanceRequests[requestIndex] = { 
        ...mockAssistanceRequests[requestIndex], 
        ...updates,
        imageUrls: updates.imageUrls !== undefined ? updates.imageUrls : existingImageUrls 
    };
    saveMockAssistanceRequestsToLocalStorage();
    return simulateApiCall(mockAssistanceRequests[requestIndex]);
  }
  return simulateApiCall(null);
};

export const adminGetMessagesByUserId = (userId: string): Promise<Message[]> => {
  return getMessages(userId);
};

export const adminSendMessage = (userId: string, content: string): Promise<Message> => {
  return sendMessage(userId, content, 'admin'); // sendMessage already saves
};

export const adminGetPurchasedItemsByUserId = (userId: string): Promise<PurchasedItem[]> => {
  return simulateApiCall(mockPurchasedItems.filter(item => item.userId === userId));
};

export const adminAddPurchasedItem = (userId: string, itemData: Omit<PurchasedItem, 'id' | 'userId' | 'totalPrice'>): Promise<PurchasedItem> => {
  const newItem: PurchasedItem = {
    ...itemData,
    id: `pi${Date.now()}`,
    userId,
    totalPrice: itemData.quantity * itemData.unitPrice,
  };
  mockPurchasedItems.push(newItem);
  saveMockPurchasedItemsToLocalStorage();
  // updateContractTotalValue(userId); // Uncomment if purchased items should affect contract value
  return simulateApiCall(newItem);
};

export const adminUpdatePurchasedItem = (itemId: string, updates: Partial<Omit<PurchasedItem, 'id' | 'userId' | 'totalPrice'>>): Promise<PurchasedItem | null> => {
  const itemIndex = mockPurchasedItems.findIndex(item => item.id === itemId);
  if (itemIndex > -1) {
    const originalItem = mockPurchasedItems[itemIndex];
    const updatedItemData = { ...originalItem, ...updates };
    
    const quantity = typeof updatedItemData.quantity === 'number' ? updatedItemData.quantity : parseFloat(String(updatedItemData.quantity || '0'));
    const unitPrice = typeof updatedItemData.unitPrice === 'number' ? updatedItemData.unitPrice : parseFloat(String(updatedItemData.unitPrice || '0'));
    
    const updatedItem: PurchasedItem = {
        ...originalItem, 
        ...updates,     
        quantity,       
        unitPrice,      
        totalPrice: quantity * unitPrice, 
    };
    mockPurchasedItems[itemIndex] = updatedItem;
    saveMockPurchasedItemsToLocalStorage();
    // updateContractTotalValue(originalItem.userId); // Uncomment if purchased items should affect contract value
    return simulateApiCall(updatedItem);
  }
  return simulateApiCall(null);
};

export const adminDeletePurchasedItem = (itemId: string): Promise<boolean> => {
  const itemIndex = mockPurchasedItems.findIndex(item => item.id === itemId);
  if (itemIndex > -1) {
    const deletedItem = mockPurchasedItems.splice(itemIndex, 1)[0];
    saveMockPurchasedItemsToLocalStorage();
    // updateContractTotalValue(deletedItem.userId); // Uncomment if purchased items should affect contract value
    return simulateApiCall(true);
  }
  return simulateApiCall(false);
};

export const adminGetContractDetailsByUserId = (userId: string): Promise<ContractDetails | null> => {
  return getContractDetails(userId); // getContractDetails already calls updateContractTotalValue which saves
};

export const adminUpdateContractDetails = async (userId: string, details: Omit<ContractDetails, 'userId' | 'clientName' | 'totalValue'>): Promise<ContractDetails | null> => {
  let contract = mockContractDetails.find(c => c.userId === userId);
  const user = await getMockUserById(userId);

  if (!user) return simulateApiCall(null); 

  if (contract) {
    contract = { ...contract, ...details, clientName: user.name };
    mockContractDetails = mockContractDetails.map(c => c.userId === userId ? contract! : c);
  } else { // Create a new contract if one doesn't exist
    console.log(`dataService: Contract not found for user ${userId} during update. Creating new shell.`);
    contract = { 
        ...details, 
        userId, 
        clientName: user.name, 
        totalValue: 0 // Will be updated by updateContractTotalValue
    };
    mockContractDetails.push(contract);
  }
  saveMockContractDetailsToLocalStorage(); // Save before calling update that also saves
  updateContractTotalValue(userId); 
  const finalContract = mockContractDetails.find(c => c.userId === userId); 
    
  return simulateApiCall(finalContract || null);
};

export const adminGetDeadlinesByUserId = (userId: string): Promise<Deadline[]> => {
  return getDeadlines(userId);
};

export const adminAddDeadline = (userId: string, deadlineData: Omit<Deadline, 'id' | 'userId'>): Promise<Deadline> => {
  const newDeadline: Deadline = {
    ...deadlineData,
    id: `d${Date.now()}`,
    userId,
  };
  mockDeadlines.push(newDeadline);
  saveMockDeadlinesToLocalStorage();
  return simulateApiCall(newDeadline);
};

export const adminUpdateDeadline = (deadlineId: string, updates: Partial<Deadline>): Promise<Deadline | null> => {
  const deadlineIndex = mockDeadlines.findIndex(d => d.id === deadlineId);
  if (deadlineIndex > -1) {
    mockDeadlines[deadlineIndex] = { ...mockDeadlines[deadlineIndex], ...updates };
    saveMockDeadlinesToLocalStorage();
    return simulateApiCall(mockDeadlines[deadlineIndex]);
  }
  return simulateApiCall(null);
};

export const adminDeleteDeadline = (deadlineId: string): Promise<boolean> => {
  const initialLength = mockDeadlines.length;
  mockDeadlines = mockDeadlines.filter(d => d.id !== deadlineId);
  if (mockDeadlines.length < initialLength) {
    saveMockDeadlinesToLocalStorage();
    return simulateApiCall(true);
  }
  return simulateApiCall(false);
};

// Client User Management by Admin is handled by authService.ts, which already has localStorage.
// However, when a client is added or deleted, we might need to initialize or clean up their related data here.

// Re-exporting from authService, dataService doesn't manage user list directly
export { 
    getAllMockUsers as adminGetAllClients, 
    getMockUserById as adminGetClientById,
    addMockUser as adminAddClient, // authService will save the user
    updateMockUser as adminUpdateClient, // authService will save the user
} from './authService';

// Updated adminDeleteClient to also clean up associated data from dataService
import { deleteMockUser as authDeleteMockUser } from './authService';
export const adminDeleteClient = async (userId: string): Promise<boolean> => {
    console.log(`dataService: Attempting to delete client ${userId} and all associated data.`);
    const userDeletedFromAuth = await authDeleteMockUser(userId); 

    if (userDeletedFromAuth) {
        console.log(`dataService: Client ${userId} deleted from auth. Cleaning up associated data.`);
        mockFurnitureItems = mockFurnitureItems.filter(item => item.userId !== userId);
        saveMockFurnitureItemsToLocalStorage();
        mockDeadlines = mockDeadlines.filter(d => d.userId !== userId);
        saveMockDeadlinesToLocalStorage();
        mockAssistanceRequests = mockAssistanceRequests.filter(req => req.userId !== userId);
        saveMockAssistanceRequestsToLocalStorage();
        mockMessages = mockMessages.filter(msg => msg.userId !== userId);
        saveMockMessagesToLocalStorage();
        mockPurchasedItems = mockPurchasedItems.filter(item => item.userId !== userId); 
        saveMockPurchasedItemsToLocalStorage();
        mockContractDetails = mockContractDetails.filter(c => c.userId !== userId);
        saveMockContractDetailsToLocalStorage();
        console.log(`dataService: Finished cleaning associated data for client ${userId}.`);
        return simulateApiCall(true);
    }
    console.log(`dataService: Client ${userId} not found or not deleted from auth. No associated data cleaned.`);
    return simulateApiCall(false); 
};
