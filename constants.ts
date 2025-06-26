
import { FurnitureStatus } from './types';

export const APP_NAME = "Portal do Cliente - Móveis Planejados";
export const ADMIN_APP_NAME = "Admin - Gestão de Projetos";


export const FURNITURE_STATUS_ORDER: FurnitureStatus[] = [
  FurnitureStatus.PagamentoAprovado,
  FurnitureStatus.MedidaFinaConcluida,
  FurnitureStatus.ProducaoDescritivo,
  FurnitureStatus.DescritivoAprovado,
  FurnitureStatus.ProducaoIniciada,
  FurnitureStatus.ProntoParaEntrega,
  FurnitureStatus.MontagemAgendada,
  FurnitureStatus.EmMontagem,
  FurnitureStatus.RevisaoDeMontagem,
  FurnitureStatus.Concluido,
];

export const MOCK_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // This is a placeholder.
// In a real app, process.env.API_KEY would be used and set by the environment.