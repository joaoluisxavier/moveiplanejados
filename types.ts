export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string; // Added for admin to set/change client password
}

export interface AdminUser {
  id: string;
  username: string;
  name: string; // Admin's name
  password?: string; // Added for admin credential management
}

export enum FurnitureStatus {
  PagamentoAprovado = 'Pagamento Aprovado',
  MedidaFinaConcluida = 'Medida Fina Concluída',
  ProducaoDescritivo = 'Produção de Descritivo',
  DescritivoAprovado = 'Descritivo Aprovado',
  ProducaoIniciada = 'Produção Iniciada',
  ProntoParaEntrega = 'Pronto para Entrega',
  MontagemAgendada = 'Montagem Agendada',
  EmMontagem = 'Em Montagem',
  RevisaoDeMontagem = 'Revisão de Montagem',
  Concluido = 'Concluído',
}

export interface ManufacturingLogEntry {
  stage: string; // Should correspond to a FurnitureStatus value
  date: string;
  notes?: string;
}

export interface FurnitureItem {
  id:string;
  userId: string; // Added to associate with a client
  name: string;
  description: string;
  imageUrls: string[]; // Changed from imageUrl: string
  status: FurnitureStatus;
  estimatedCompletionDate: string;
  manufacturingLog: ManufacturingLogEntry[];
  dimensions?: string; 
  material?: string;   
  projectValue?: number; 
}

export enum DeadlineType {
  Pagamento = 'Pagamento',
  EntregaEstimada = 'Entrega Estimada',
  MontagemEstimada = 'Montagem Estimada',
  InicioProducao = 'Início da Produção',
  FinalProducao = 'Final da Produção',
}

export interface Deadline {
  id: string;
  userId: string; // Added
  title: string;
  date: string;
  type: DeadlineType;
  details?: string;
}

export enum AssistanceRequestStatus {
  Aberto = 'Aberto',
  EmAnalise = 'Em Análise',
  Agendado = 'Visita Agendada',
  Resolvido = 'Resolvido',
  Fechado = 'Fechado',
}

export interface AssistanceRequest {
  id: string;
  userId: string; // Added
  date: string;
  subject: string;
  description: string;
  status: AssistanceRequestStatus;
  resolutionNotes?: string;
  imageUrls?: string[]; // Added for image uploads
}

export interface Message {
  id: string;
  userId: string; // Added
  sender: 'cliente' | 'empresa' | 'admin'; // 'admin' can also be 'empresa'
  content: string;
  timestamp: string;
  read: boolean;
}

export interface PurchasedItem {
  id: string;
  userId: string; // Added
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrls: string[]; // Changed from imageUrl: string
  details?: string;
}

export interface ContractDetails {
  id: string;
  userId: string; // Added
  contractNumber: string;
  clientName: string; // This will now come from User object
  dateSigned: string;
  projectAddress: string;
  totalValue: number;
  paymentTerms: string;
  scopeOfWork: string; // Brief summary
  contractPdfUrl?: string; // Link to the full PDF, filename of uploaded file, or a direct URL.
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}