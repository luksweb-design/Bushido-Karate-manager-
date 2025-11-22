
export interface ExamHistoryItem {
  data: string;
  graduacao: string;
  nota?: number;
  local?: string;
}

export interface Student {
  id: string;
  nome: string;
  matricula: string;
  nascimento: string;
  graduacao: string;
  email?: string;
  
  // Novos campos
  telefone?: string;
  endereco?: string;
  fotoUrl?: string;
  
  responsavelNome?: string;
  responsavelTelefone?: string;
  
  instagram?: string;
  facebook?: string;
  
  historicoExames?: ExamHistoryItem[];
}

export interface DojoProfile {
  nome: string;
  documento: string; // CPF ou CNPJ
  bushidoPassId?: string; // Integração futura
  email?: string;
  telefone?: string;
  endereco?: string;
  logoUrl?: string;
  website?: string;
  descricao?: string;
}

export type ApprovalSystem = 'SPORT' | 'EDUCATIONAL';

export interface CertificateConfig {
  customText?: string;
  bgUrl?: string;
}

export interface ExamConfig {
  academia: string; // Pode herdar do DojoProfile
  data: string;
  local: string;
  avaliador: string;
  faixas: string[];
  approvalSystem: ApprovalSystem;
  certificateConfig: CertificateConfig;
  status: 'OPEN' | 'CLOSED'; // CAMPO NOVO: Controla se o evento está encerrado ou aberto
}

export interface Evaluation {
  studentId: string;
  kata: number;
  kihon: number;
  kumite: number;
  teorico: number;
  media: number;
  status: string; // Changed to string to support 'Aprovado c/ Reforço' etc.
  feedback?: string;
}

export interface DojoState {
  dojoProfile: DojoProfile;
  config: ExamConfig;
  students: Student[];
  selectedStudentIds: string[]; // Persistent selection logic
  evaluations: Record<string, Evaluation>;
  isTrial: boolean;
}

export enum AppScreen {
  DOJO = 'DOJO',
  DASHBOARD = 'DASHBOARD', // Configuração do Exame
  SETTINGS = 'SETTINGS',   // Configurações Avançadas
  STUDENTS = 'STUDENTS',
  SELECTION = 'SELECTION',
  EVALUATION = 'EVALUATION',
  RESULTS = 'RESULTS',
}

export const DEFAULT_RANKS = [
  "Branca (9º Kyu)",
  "Amarela (8º Kyu)",
  "Vermelha (7º Kyu)",
  "Laranja (6º Kyu)",
  "Verde (5º Kyu)",
  "Roxa (4º Kyu)",
  "Marrom (3º Kyu)",
  "Marrom (2º Kyu)",
  "Marrom (1º Kyu)",
  "Preta (1º Dan)"
];
