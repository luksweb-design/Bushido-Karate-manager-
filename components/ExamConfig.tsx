
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
        <div className="bg-bushido-black px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white font-jp flex items-center gap-2">
             <Calendar className="w-5 h-5 text-bushido-red" />
             Dados do Evento (Exame)
          </h2>
          <p className="text-gray-400 text-sm mt-1">Defina a data, local e avaliador para o evento atual.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Building className="w-4 h-4 text-gray-400" /> Nome da Academia/Dojo
              </label>
              <input
                type="text"
                className="block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                value={state.config.academia}
                onChange={(e) => handleChange('academia', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" /> Data do Exame
              </label>
              <input
                type="date"
                className="block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                value={state.config.data}
                onChange={(e) => handleChange('data', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                 <MapPin className="w-4 h-4 text-gray-400" /> Local
              </label>
              <input
                type="text"
                className="block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                value={state.config.local}
                onChange={(e) => handleChange('local', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-4 h-4 text-gray-400" /> Avaliador Principal
              </label>
              <input
                type="text"
                className="block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-bushido-red focus:border-bushido-red sm:text-sm"
                value={state.config.avaliador}
                onChange={(e) => handleChange('avaliador', e.target.value)}
              />
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Dica:</strong> Para alterar as faixas disponíveis ou o modelo do certificado, acesse o menu <strong>Configurações</strong> na barra superior.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={onNext}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-bushido-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bushido-red transition-colors"
            >
              Salvar e Gerenciar Alunos
              <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamConfigScreen;
