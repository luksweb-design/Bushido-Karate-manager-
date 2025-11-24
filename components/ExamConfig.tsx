import React from 'react';
import { DojoState } from '../types';
import { ArrowRight, Calendar, MapPin, UserCheck, Building } from 'lucide-react';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onNext: () => void;
}

const ExamConfigScreen: React.FC<Props> = ({ state, updateState, onNext }) => {
  const handleChange = (field: string, value: string) => {
    updateState({
      ...state,
      config: { ...state.config, [field]: value }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-bushido-card shadow-2xl border border-white/5 relative overflow-hidden">
        {/* Decorative Blade Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-bushido-red/10 -skew-x-12 transform translate-x-10 -translate-y-10 pointer-events-none"></div>

        <div className="bg-bushido-surface px-8 py-6 border-b border-white/5 flex items-center justify-between">
           <div>
              <h2 className="text-3xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-3">
                 Configuração do Exame
              </h2>
              <p className="text-bushido-red text-xs font-bold uppercase tracking-[0.2em] mt-1 ml-1">Detalhes do Evento</p>
           </div>
           <Calendar className="w-10 h-10 text-gray-700" />
        </div>
        
        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-bushido-red" /> Academia / Dojo
              </label>
              <input
                type="text"
                className="input-bushido block w-full py-4 px-4 font-display font-bold uppercase tracking-wide text-lg"
                value={state.config.academia}
                onChange={(e) => handleChange('academia', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-bushido-red" /> Data do Evento
              </label>
              <input
                type="date"
                className="input-bushido block w-full py-4 px-4 text-gray-300 font-bold"
                value={state.config.data}
                onChange={(e) => handleChange('data', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-bushido-red" /> Local
              </label>
              <input
                type="text"
                className="input-bushido block w-full py-4 px-4 uppercase"
                value={state.config.local}
                onChange={(e) => handleChange('local', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-bushido-red" /> Sensei Avaliador
              </label>
              <input
                type="text"
                className="input-bushido block w-full py-4 px-4 uppercase font-bold"
                value={state.config.avaliador}
                onChange={(e) => handleChange('avaliador', e.target.value)}
              />
            </div>
          </div>

          <div className="bg-black/30 border-l-2 border-bushido-gold p-6 flex gap-4 items-center">
            <div className="ml-2">
               <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  <strong className="text-bushido-gold uppercase text-xs tracking-wider block mb-1">Atenção Sensei</strong> 
                  As faixas disponíveis e o modelo de certificado podem ser alterados no menu <strong>CONFIG</strong> antes de iniciar a avaliação.
               </p>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-white/5">
            <button
              onClick={onNext}
              className="btn-blade bg-bushido-red hover:bg-bushido-red-dark text-white px-10 py-4 font-display font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-3 transition-all"
            >
              <span>Gerenciar Alunos</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamConfigScreen;