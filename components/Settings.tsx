
import React, { useState, useRef } from 'react';
import { DojoState, ApprovalSystem } from '../types';
import { Trash2, Plus, Upload, AlertCircle, CheckCircle, Shield, GraduationCap, Medal, ScrollText, List, GripVertical } from 'lucide-react';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
}

const Settings: React.FC<Props> = ({ state, updateState }) => {
  const [newRank, setNewRank] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'ranks' | 'certificate'>('general');
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- Ranks Logic ---
  const addRank = () => {
    if (newRank.trim()) {
      updateState({
        ...state,
        config: { ...state.config, faixas: [...state.config.faixas, newRank] }
      });
      setNewRank('');
    }
  };

  const removeRank = (index: number) => {
    const newRanks = [...state.config.faixas];
    newRanks.splice(index, 1);
    updateState({
      ...state,
      config: { ...state.config, faixas: newRanks }
    });
  };

  // --- DnD Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, position: number) => {
    dragItem.current = position;
    // Efeito visual opcional ao arrastar
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, position: number) => {
    dragOverItem.current = position;
    e.preventDefault(); // Necessário para permitir o drop
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault(); // Necessário para permitir o drop
  };

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newRanks = [...state.config.faixas];
      const draggedItemContent = newRanks[dragItem.current];
      
      // Remove do antigo index
      newRanks.splice(dragItem.current, 1);
      // Insere no novo index
      newRanks.splice(dragOverItem.current, 0, draggedItemContent);

      updateState({
        ...state,
        config: { ...state.config, faixas: newRanks }
      });
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  // --- Approval System Logic ---
  const setApprovalSystem = (system: ApprovalSystem) => {
    updateState({
      ...state,
      config: { ...state.config, approvalSystem: system }
    });
  };

  // --- Certificate Logic ---
  const handleCertBgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateState({
          ...state,
          config: { 
            ...state.config, 
            certificateConfig: { ...state.config.certificateConfig, bgUrl: reader.result as string } 
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertTextChange = (text: string) => {
    updateState({
      ...state,
      config: { 
        ...state.config, 
        certificateConfig: { ...state.config.certificateConfig, customText: text } 
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 font-jp flex items-center gap-3">
          <Shield className="w-10 h-10 text-bushido-red" />
          Configurações do Sistema
        </h2>
        <p className="text-gray-500 mt-2">Personalize as regras de graduação, o sistema de avaliação e a identidade visual dos documentos.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 mb-8">
        <button 
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'general' 
              ? 'border-bushido-red text-bushido-red bg-red-50/50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Medal className="w-4 h-4" />
          Regras de Aprovação
        </button>
        <button 
          onClick={() => setActiveTab('ranks')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'ranks' 
              ? 'border-bushido-red text-bushido-red bg-red-50/50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <List className="w-4 h-4" />
          Graduações (Faixas)
        </button>
        <button 
          onClick={() => setActiveTab('certificate')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'certificate' 
              ? 'border-bushido-red text-bushido-red bg-red-50/50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          Certificado Personalizado
        </button>
      </div>

      {/* --- TAB: APPROVAL SYSTEM --- */}
      {activeTab === 'general' && (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Escolha o Modelo de Avaliação</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card: Sportivo */}
              <div 
                onClick={() => setApprovalSystem('SPORT')}
                className={`cursor-pointer group relative rounded-2xl border-2 p-6 transition-all duration-300 ${
                  state.config.approvalSystem === 'SPORT' 
                    ? 'border-bushido-red bg-white shadow-xl scale-[1.02]' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {state.config.approvalSystem === 'SPORT' && (
                  <div className="absolute -top-3 -right-3 bg-bushido-red text-white p-1 rounded-full shadow">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${state.config.approvalSystem === 'SPORT' ? 'bg-red-100 text-bushido-red' : 'bg-gray-200 text-gray-500'}`}>
                    <Medal className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">Padrão Esportivo</h4>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Competitivo</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Ideal para avaliações técnicas objetivas focadas em performance.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Notas de 0 a 10</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Média de Corte: <strong>6.0</strong></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Status simples: Aprovado / Reprovado</li>
                  </ul>
                </div>
              </div>

              {/* Card: Educativo */}
              <div 
                onClick={() => setApprovalSystem('EDUCATIONAL')}
                className={`cursor-pointer group relative rounded-2xl border-2 p-6 transition-all duration-300 ${
                  state.config.approvalSystem === 'EDUCATIONAL' 
                    ? 'border-indigo-600 bg-white shadow-xl scale-[1.02]' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {state.config.approvalSystem === 'EDUCATIONAL' && (
                  <div className="absolute -top-3 -right-3 bg-indigo-600 text-white p-1 rounded-full shadow">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                   <div className={`p-3 rounded-lg ${state.config.approvalSystem === 'EDUCATIONAL' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">Padrão Educativo</h4>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Pedagógico</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Focado no desenvolvimento do aluno, com conceitos qualitativos e alertas de reforço.
                  </p>
                   <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-indigo-500" /> <strong>Média 6.0:</strong> Aprovado Pleno</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-indigo-500" /> <strong>5.0 a 5.9:</strong> Conceito Razoável (Aprova)</li>
                    <li className="flex items-center gap-2"><AlertCircle className="w-3 h-3 text-yellow-500" /> <strong>Reforço:</strong> Mais de uma nota 5.0 gera observação</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-blue-500" /> <strong>Conceitos:</strong> Ótimo (7.0+) e Excelente (8.0+)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: RANKS --- */}
      {activeTab === 'ranks' && (
        <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Lista de Faixas (Ordem de Graduação)</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Total: {state.config.faixas.length}</span>
            </div>

            <div className="flex gap-3 mb-6">
              <input 
                type="text" 
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-bushido-red focus:border-transparent outline-none transition-all"
                placeholder="Ex: Laranja (6º Kyu)"
                value={newRank}
                onChange={e => setNewRank(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRank()}
              />
              <button 
                onClick={addRank}
                className="bg-bushido-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 flex items-center gap-2 font-bold shadow-md active:transform active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" /> Adicionar
              </button>
            </div>

            <ul className="space-y-2">
              {state.config.faixas.map((rank, idx) => (
                <li 
                  key={idx} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnter={(e) => handleDragEnter(e, idx)}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  className="group flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg hover:shadow-md hover:border-gray-300 transition-all cursor-move active:cursor-grabbing active:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 text-xs font-bold rounded-full select-none">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-700 select-none">{rank}</span>
                  </div>
                  <button 
                    onClick={() => removeRank(idx)}
                    className="text-gray-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                    title="Remover Faixa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
              {state.config.faixas.length === 0 && (
                <li className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-400">Nenhuma faixa cadastrada.</p>
                  <p className="text-sm text-gray-400 mt-1">Adicione as graduações na ordem da menor para a maior.</p>
                </li>
              )}
            </ul>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 h-fit">
            <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Importante
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              A ordem definida aqui será usada nos filtros de seleção e na geração dos relatórios. 
            </p>
            <p className="text-sm text-blue-700 mt-2 font-medium">
              Arraste os itens pela alça lateral para reordenar.
            </p>
            <div className="mt-4 pt-4 border-t border-blue-200">
               <p className="text-xs text-blue-600">Dica: Inclua o Kyu ou Dan no nome para facilitar a identificação (ex: "Amarela - 6º Kyu").</p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: CERTIFICATE --- */}
      {activeTab === 'certificate' && (
        <div className="animate-fadeIn space-y-8">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="grid grid-cols-1 lg:grid-cols-3">
               
               {/* Left: Settings */}
               <div className="p-6 lg:border-r border-gray-200 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Fundo do Certificado</h3>
                    <p className="text-xs text-gray-500 mb-4">Recomendado: JPG/PNG em alta resolução (A4 Paisagem)</p>
                    
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group"
                      onClick={() => bgInputRef.current?.click()}
                    >
                      {state.config.certificateConfig?.bgUrl ? (
                         <div className="flex flex-col items-center">
                            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                            <span className="text-sm font-medium text-gray-700">Imagem Carregada</span>
                            <span className="text-xs text-gray-400 mt-1">Clique para trocar</span>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center">
                            <Upload className="w-8 h-8 text-gray-400 mb-2 group-hover:text-gray-600" />
                            <span className="text-sm font-medium text-gray-600">Fazer Upload</span>
                         </div>
                      )}
                      <input 
                        type="file" 
                        ref={bgInputRef} 
                        onChange={handleCertBgUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Texto de Aprovação</h3>
                    <p className="text-xs text-gray-500 mb-2">Frase de ligação entre o nome e a graduação.</p>
                    <textarea 
                      className="w-full h-32 border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:ring-2 focus:ring-bushido-red focus:border-transparent outline-none resize-none"
                      value={state.config.certificateConfig?.customText || ''}
                      onChange={e => handleCertTextChange(e.target.value)}
                      placeholder="Ex: cumpriu os requisitos técnicos exigidos e foi promovido(a) para:"
                    />
                  </div>
               </div>

               {/* Right: Preview */}
               <div className="lg:col-span-2 p-8 bg-gray-100 flex flex-col items-center justify-center">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Prévia Visual (Mockup)</h4>
                  
                  <div className="relative w-full max-w-xl aspect-[1.414] bg-white shadow-2xl rounded-sm overflow-hidden flex flex-col items-center justify-center text-center p-8 border border-gray-300">
                     {state.config.certificateConfig?.bgUrl && (
                       <img 
                         src={state.config.certificateConfig.bgUrl} 
                         className="absolute inset-0 w-full h-full object-cover opacity-50"
                         alt="Background"
                       />
                     )}
                     
                     <div className="relative z-10 w-full">
                        <div className="mb-4">
                           <h1 className="text-3xl font-serif font-bold text-gray-800">CERTIFICADO</h1>
                        </div>
                        <div className="mb-2">
                           <p className="text-gray-600 text-sm">Certificamos que</p>
                        </div>
                        <div className="mb-4">
                           <h2 className="text-2xl font-bold text-bushido-black font-serif italic">NOME DO ALUNO</h2>
                        </div>
                        <div className="mb-4 px-8">
                           <p className="text-gray-700 text-xs">
                             {state.config.certificateConfig?.customText || "cumpriu os requisitos técnicos exigidos e foi promovido(a) para:"}
                           </p>
                        </div>
                        <div className="mb-8">
                           <h2 className="text-xl font-bold text-red-700 uppercase">NOVA GRADUAÇÃO</h2>
                        </div>
                        
                        <div className="flex justify-between text-[10px] text-gray-500 border-t border-gray-400 pt-2 mt-4 mx-8">
                           <span>{state.config.avaliador || 'Assinatura do Sensei'}</span>
                           <span>{state.config.academia || 'Nome do Dojo'}</span>
                        </div>
                     </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">* A prévia é aproximada. O PDF final terá alta resolução.</p>
               </div>

             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
