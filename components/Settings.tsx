import React, { useState, useRef } from 'react';
import { DojoState, ApprovalSystem } from '../types';
import { Trash2, Plus, Upload, AlertCircle, CheckCircle, Shield, GraduationCap, Medal, ScrollText, List, GripVertical, Check, X } from 'lucide-react';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
}

const Settings: React.FC<Props> = ({ state, updateState }) => {
  const [newRank, setNewRank] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'ranks' | 'certificate'>('general');
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Editing State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

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
    if (editingIndex === index) setEditingIndex(null);
  };

  const startEditing = (index: number, currentVal: string) => {
    setEditingIndex(index);
    setEditValue(currentVal);
  };

  const saveEdit = (index: number) => {
    if (editValue.trim()) {
        const newRanks = [...state.config.faixas];
        newRanks[index] = editValue;
        updateState({
            ...state,
            config: { ...state.config, faixas: newRanks }
        });
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
      setEditingIndex(null);
      setEditValue('');
  };

  // --- DnD Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, position: number) => {
    if (editingIndex !== null) {
        e.preventDefault(); // Prevent dragging while editing
        return;
    }
    dragItem.current = position;
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, position: number) => {
    dragOverItem.current = position;
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newRanks = [...state.config.faixas];
      const draggedItemContent = newRanks[dragItem.current];
      newRanks.splice(dragItem.current, 1);
      newRanks.splice(dragOverItem.current, 0, draggedItemContent);
      updateState({ ...state, config: { ...state.config, faixas: newRanks } });
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const setApprovalSystem = (system: ApprovalSystem) => {
    updateState({ ...state, config: { ...state.config, approvalSystem: system } });
  };

  const handleCertBgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateState({ ...state, config: { ...state.config, certificateConfig: { ...state.config.certificateConfig, bgUrl: reader.result as string } } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertTextChange = (text: string) => {
    updateState({ ...state, config: { ...state.config, certificateConfig: { ...state.config.certificateConfig, customText: text } } });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-12 border-b border-white/10 pb-6 flex items-end justify-between">
        <div>
           <h2 className="text-4xl font-display font-bold text-white uppercase tracking-widest leading-none">
              Configurações
           </h2>
           <p className="text-bushido-red mt-1 text-xs font-bold uppercase tracking-[0.3em]">Personalização do Sistema</p>
        </div>
        <SettingsIcon className="w-10 h-10 text-white opacity-20" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 mb-10">
        {[
            { id: 'general', icon: Medal, label: 'Regras de Aprovação' },
            { id: 'ranks', icon: List, label: 'Graduações (Faixas)' },
            { id: 'certificate', icon: ScrollText, label: 'Certificados' }
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`btn-blade flex items-center gap-3 px-8 py-4 font-display font-bold text-sm uppercase tracking-wider transition-all ${
                    activeTab === tab.id 
                    ? 'bg-bushido-red text-white shadow-lg' 
                    : 'bg-bushido-surface text-gray-500 hover:text-white border border-white/5'
                }`}
            >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
            </button>
        ))}
      </div>

      {/* --- TAB: APPROVAL SYSTEM --- */}
      {activeTab === 'general' && (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-bushido-card rounded-none shadow-xl border border-white/5 p-8 relative overflow-hidden">
            <h3 className="text-xl font-display font-bold text-white mb-8 uppercase tracking-wide border-l-4 border-bushido-red pl-4">Modelo de Avaliação</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card: Sportivo */}
              <div 
                onClick={() => setApprovalSystem('SPORT')}
                className={`cursor-pointer group relative p-8 transition-all duration-300 border ${
                  state.config.approvalSystem === 'SPORT' 
                    ? 'border-bushido-red bg-bushido-surface shadow-[0_0_30px_rgba(220,38,38,0.15)]' 
                    : 'border-white/5 bg-black/20 hover:border-white/20'
                }`}
              >
                {state.config.approvalSystem === 'SPORT' && (
                  <div className="absolute top-0 right-0 p-2 bg-bushido-red text-white">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
                <div className="flex items-center gap-5 mb-6">
                  <div className={`p-4 ${state.config.approvalSystem === 'SPORT' ? 'bg-bushido-red text-white' : 'bg-white/5 text-gray-600'} skew-x-[-10deg]`}>
                    <Medal className="w-8 h-8 skew-x-[10deg]" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xl text-white uppercase tracking-wide">Esportivo</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">WKF COMPETITION STYLE</p>
                  </div>
                </div>
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <ul className="text-sm text-gray-400 space-y-3 font-medium">
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-green-500"></span> <strong>Aprovado (Excelente):</strong> ≥ 7.0</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-green-700"></span> <strong>Aprovado (Ótimo):</strong> 6.7 - 6.9</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-yellow-600"></span> <strong>Risco:</strong> 6.1 - 6.3</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-red-600"></span> <strong>Reprovado:</strong> &lt; 6.1</li>
                  </ul>
                </div>
              </div>

              {/* Card: Educativo */}
              <div 
                onClick={() => setApprovalSystem('EDUCATIONAL')}
                className={`cursor-pointer group relative p-8 transition-all duration-300 border ${
                  state.config.approvalSystem === 'EDUCATIONAL' 
                    ? 'border-indigo-500 bg-bushido-surface shadow-[0_0_30px_rgba(99,102,241,0.15)]' 
                    : 'border-white/5 bg-black/20 hover:border-white/20'
                }`}
              >
                {state.config.approvalSystem === 'EDUCATIONAL' && (
                  <div className="absolute top-0 right-0 p-2 bg-indigo-500 text-white">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
                <div className="flex items-center gap-5 mb-6">
                   <div className={`p-4 ${state.config.approvalSystem === 'EDUCATIONAL' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-600'} skew-x-[-10deg]`}>
                    <GraduationCap className="w-8 h-8 skew-x-[10deg]" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xl text-white uppercase tracking-wide">Educativo</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pedagógico & Formativo</p>
                  </div>
                </div>
                <div className="space-y-4 border-t border-white/5 pt-4">
                   <ul className="text-sm text-gray-400 space-y-3 font-medium">
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-indigo-400"></span> <strong>Aprovado Pleno:</strong> ≥ 6.0</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-indigo-600"></span> <strong>Conceito Razoável:</strong> 5.0 - 5.9</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-yellow-600"></span> <strong>Reforço:</strong> &lt; 5.0</li>
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
          <div className="md:col-span-2 bg-bushido-card shadow-xl border border-white/5 p-8">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide">Hierarquia de Faixas</h3>
              <span className="text-[10px] bg-white/5 text-gray-400 px-3 py-1 font-bold uppercase tracking-wider border border-white/10">Total: {state.config.faixas.length}</span>
            </div>

            <div className="flex gap-3 mb-8">
              <input 
                type="text" 
                className="input-bushido flex-1 px-4 py-4 uppercase font-bold tracking-wide placeholder-gray-700"
                placeholder="EX: LARANJA (6º KYU)"
                value={newRank}
                onChange={e => setNewRank(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRank()}
              />
              <button 
                onClick={addRank}
                className="btn-blade bg-bushido-red text-white px-6 py-3 font-display font-bold uppercase tracking-wider hover:bg-bushido-red-dark flex items-center gap-2"
              >
                <span>Adicionar</span> <Plus className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-2">
              {state.config.faixas.map((rank, idx) => (
                <li 
                  key={idx} 
                  draggable={editingIndex !== idx}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnter={(e) => handleDragEnter(e, idx)}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  className={`group flex justify-between items-center p-4 border border-white/5 transition-all ${
                      editingIndex === idx ? 'bg-bushido-surface border-bushido-gold' : 'bg-black/40 hover:border-bushido-red/50 cursor-move active:opacity-50'
                  }`}
                >
                  {editingIndex === idx ? (
                     // --- EDIT MODE ---
                     <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-150">
                        <GripVertical className="w-5 h-5 text-gray-700 opacity-50" />
                        <span className="w-8 h-8 flex items-center justify-center bg-white/5 text-gray-400 text-xs font-bold font-display">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <input 
                            autoFocus
                            type="text" 
                            className="bg-black/50 text-white border border-bushido-gold/50 px-3 py-2 w-full font-display font-bold uppercase tracking-wide focus:outline-none focus:border-bushido-gold"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(idx);
                                if (e.key === 'Escape') cancelEdit();
                            }}
                            onBlur={() => saveEdit(idx)}
                        />
                        <div className="flex items-center gap-1">
                            <button onClick={() => saveEdit(idx)} className="p-2 text-green-500 hover:bg-green-900/20 rounded"><Check className="w-4 h-4" /></button>
                            <button onMouseDown={cancelEdit} className="p-2 text-red-500 hover:bg-red-900/20 rounded"><X className="w-4 h-4" /></button>
                        </div>
                     </div>
                  ) : (
                    // --- VIEW MODE ---
                    <>
                        <div 
                            className="flex items-center gap-4 flex-1"
                            onDoubleClick={() => startEditing(idx, rank)}
                            title="Clique duplo para editar"
                        >
                            <GripVertical className="w-5 h-5 text-gray-700 group-hover:text-bushido-red transition-colors" />
                            <span className="w-8 h-8 flex items-center justify-center bg-white/5 text-gray-400 text-xs font-bold font-display">
                            {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-display font-bold text-gray-200 uppercase tracking-wide group-hover:text-white transition-colors pl-2 select-none">
                                {rank}
                            </span>
                        </div>
                        <button 
                            onClick={() => removeRank(idx)}
                            className="text-gray-700 hover:text-red-500 p-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                  )}
                </li>
              ))}
              {state.config.faixas.length === 0 && (
                <li className="p-12 text-center border border-dashed border-white/10 opacity-50">
                  <p className="text-gray-500 font-display uppercase tracking-widest">Nenhuma faixa cadastrada</p>
                </li>
              )}
            </ul>
          </div>
          
          <div className="bg-gradient-to-b from-indigo-900/10 to-transparent p-8 border border-indigo-500/20 h-fit">
            <h4 className="text-indigo-400 font-bold mb-4 flex items-center gap-2 font-display uppercase tracking-wider text-sm">
              <AlertCircle className="w-4 h-4" /> Gestão de Graduações
            </h4>
            <div className="space-y-4 text-xs text-indigo-200/70 leading-relaxed mb-6">
                <p>A ordem definida aqui controla as promoções automáticas. A primeira faixa é a menor graduação.</p>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li><strong>Arraste</strong> para reordenar a hierarquia.</li>
                    <li><strong>Clique duplo</strong> sobre uma faixa para editar o nome.</li>
                    <li>Utilize os formatos padrão (ex: 7º Kyu, 1º Dan) para melhor organização.</li>
                </ul>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: CERTIFICATE --- */}
      {activeTab === 'certificate' && (
        <div className="animate-fadeIn space-y-8">
           <div className="bg-bushido-card shadow-xl border border-white/5 overflow-hidden">
             <div className="grid grid-cols-1 lg:grid-cols-3">
               
               {/* Left: Settings */}
               <div className="p-8 lg:border-r border-white/5 space-y-8 bg-bushido-surface">
                  <div>
                    <h3 className="text-lg font-display font-bold text-white mb-2 uppercase tracking-wide">Imagem de Fundo</h3>
                    <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-widest font-bold">A4 Paisagem (Landscape)</p>
                    
                    <div 
                      className="border-2 border-dashed border-white/10 bg-black/20 p-8 text-center hover:border-bushido-red/50 hover:bg-bushido-red/5 transition-colors cursor-pointer relative group"
                      onClick={() => bgInputRef.current?.click()}
                    >
                      {state.config.certificateConfig?.bgUrl ? (
                         <div className="flex flex-col items-center">
                            <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Imagem Carregada</span>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center">
                            <Upload className="w-8 h-8 text-gray-600 mb-3 group-hover:text-bushido-red transition-colors" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-white transition-colors">Fazer Upload</span>
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
                    <h3 className="text-lg font-display font-bold text-white mb-2 uppercase tracking-wide">Texto Padrão</h3>
                    <textarea 
                      className="input-bushido w-full h-40 p-4 text-xs font-mono resize-none leading-relaxed"
                      value={state.config.certificateConfig?.customText || ''}
                      onChange={e => handleCertTextChange(e.target.value)}
                      placeholder="Ex: cumpriu os requisitos técnicos exigidos e foi promovido(a) para:"
                    />
                  </div>
               </div>

               {/* Right: Preview */}
               <div className="lg:col-span-2 p-12 bg-black/60 flex flex-col items-center justify-center relative">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none"></div>
                  <h4 className="text-[10px] font-bold text-bushido-red uppercase tracking-[0.3em] mb-6 border-b border-bushido-red pb-1">Visualização (Mockup)</h4>
                  
                  <div className="relative w-full max-w-2xl aspect-[1.414] bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center justify-center text-center p-12">
                     {state.config.certificateConfig?.bgUrl && (
                       <img 
                         src={state.config.certificateConfig.bgUrl} 
                         className="absolute inset-0 w-full h-full object-cover opacity-80"
                         alt="Background"
                       />
                     )}
                     
                     <div className="relative z-10 w-full text-black">
                        <div className="mb-6">
                           <h1 className="text-5xl font-serif font-bold text-gray-900 tracking-wider">CERTIFICADO</h1>
                        </div>
                        <div className="mb-2">
                           <p className="text-gray-600 text-sm font-serif italic">Certificamos que</p>
                        </div>
                        <div className="mb-8">
                           <h2 className="text-4xl font-bold text-black font-serif uppercase border-b-4 border-red-800 inline-block pb-2">NOME DO ALUNO</h2>
                        </div>
                        <div className="mb-8 px-16">
                           <p className="text-gray-800 text-sm font-serif leading-relaxed">
                             {state.config.certificateConfig?.customText || "cumpriu os requisitos técnicos exigidos e foi promovido(a) para:"}
                           </p>
                        </div>
                        <div className="mb-12">
                           <h2 className="text-3xl font-extrabold text-red-800 uppercase font-sans tracking-[0.2em]">NOVA GRADUAÇÃO</h2>
                        </div>
                        
                        <div className="flex justify-between text-[10px] text-gray-600 border-t border-gray-400 pt-6 mt-10 mx-16 font-bold uppercase tracking-wider">
                           <span>{state.config.avaliador || 'Assinatura do Sensei'}</span>
                           <span>{state.config.academia || 'Nome do Dojo'}</span>
                        </div>
                     </div>
                  </div>
               </div>

             </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Simple Icon component helper
const SettingsIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
)

export default Settings;