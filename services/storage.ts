
import { DojoState, DEFAULT_RANKS } from '../types';

const STORAGE_KEY = 'bushido_dojo_data_v4'; // Version bumped for schema change (status field)

const INITIAL_STATE: DojoState = {
  dojoProfile: {
    nome: 'Bushido Dojo Matriz',
    documento: '',
    email: '',
    telefone: '',
    endereco: '',
    bushidoPassId: '',
    logoUrl: ''
  },
  config: {
    academia: 'Bushido Dojo',
    data: new Date().toISOString().split('T')[0],
    local: 'Dojo Principal',
    avaliador: 'Sensei',
    faixas: DEFAULT_RANKS,
    approvalSystem: 'SPORT',
    status: 'OPEN', // Inicializa como aberto
    certificateConfig: {
      customText: 'cumpriu os requisitos técnicos exigidos e foi promovido(a) para:',
      bgUrl: ''
    }
  },
  students: [
    { 
      id: '1', 
      nome: 'João Silva', 
      matricula: 'B001', 
      nascimento: '2010-05-20', 
      graduacao: 'Branca (9º Kyu)',
      telefone: '11999999999',
      responsavelNome: 'Carlos Silva',
      historicoExames: []
    },
    { 
      id: '2', 
      nome: 'Maria Oliveira', 
      matricula: 'B002', 
      nascimento: '2012-08-15', 
      graduacao: 'Amarela (8º Kyu)',
      historicoExames: [
        { data: '2023-01-15', graduacao: 'Branca (9º Kyu)', local: 'Dojo Principal' }
      ]
    },
    { 
      id: '3', 
      nome: 'Pedro Santos', 
      matricula: 'B003', 
      nascimento: '2011-01-10', 
      graduacao: 'Branca (9º Kyu)',
      historicoExames: [] 
    }
  ],
  selectedStudentIds: [],
  evaluations: {},
  isTrial: true
};

export const loadState = (): DojoState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Deep merge logic for robustness
      return { 
        ...INITIAL_STATE, 
        ...parsed, 
        dojoProfile: { ...INITIAL_STATE.dojoProfile, ...(parsed.dojoProfile || {}) },
        config: { 
            ...INITIAL_STATE.config, 
            ...(parsed.config || {}),
            // Ensure status exists if loading from old version
            status: parsed.config?.status || 'OPEN',
            certificateConfig: {
                ...INITIAL_STATE.config.certificateConfig,
                ...(parsed.config?.certificateConfig || {})
            }
        } 
      };
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }
  return INITIAL_STATE;
};

export const saveState = (state: DojoState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const robustSave = (state: DojoState) => {
  saveState(state);
};
