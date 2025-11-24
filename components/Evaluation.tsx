
import React, { useEffect } from 'react';
import { DojoState, Evaluation as EvaluationType } from '../types';
import { CheckCircle, AlertCircle, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onFinish: () => void;
}

const Evaluation: React.FC<Props> = ({ state, updateState, onFinish }) => {
  const selectedStudents = state.students.filter(s => state.selectedStudentIds.includes(s.id));

  useEffect(() => {
    const newEvaluations = { ...state.evaluations };
    let changed = false;
    selectedStudents.forEach(s => {
       if (!newEvaluations[s.id]) {
          newEvaluations[s.id] = { studentId: s.id, kata: 0, kihon: 0, kumite: 0, teorico: 0, media: 0, status: 'Pendente' };
          changed = true;
       }
    });
    if (changed) updateState({ ...state, evaluations: newEvaluations });
  }, []);

  const updateScore = (id: string, field: keyof EvaluationType, val: number) => {
     const current = state.evaluations[id];
     if (!current) return;
     const num = Math.round(Math.max(0, Math.min(10, val)) * 10) / 10;
     const updated = { ...current, [field]: num };
     const scores = [field==='kata'?num:updated.kata, field==='kihon'?num:updated.kihon, field==='kumite'?num:updated.kumite, field==='teorico'?num:updated.teorico];
     
     let media = Math.round((scores.reduce((a,b)=>a+b,0)/4)*10)/10;
     updated.media = media;

     const reasonable = scores.filter(s => s >= 6.1 && s <= 6.3).length;
     if (media < 6.1) updated.status = 'Reprovado';
     else if (reasonable >= 2) updated.status = 'Reprovado (Inconsistente)';
     else if (media >= 7.0) updated.status = 'Aprovado (Excelente)';
     else if (media >= 6.7) updated.status = 'Aprovado (Ótimo)';
     else if (media >= 6.4) updated.status = 'Aprovado (Bom)';
     else updated.status = reasonable === 1 ? 'Aprovado c/ Reforço' : 'Aprovado (Razoável)';

     updateState({ ...state, evaluations: { ...state.evaluations, [id]: updated } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
       <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-3">
                <span className="text-bushido-red">///</span> Avaliação
            </h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] mt-1 ml-10">Painel de Notas</p>
          </div>
          <div className="hidden md:block">
             <div className="text-right text-[10px] text-gray-600 font-mono">
                <p>SISTEMA: {state.config.approvalSystem}</p>
                <p>AVALIADOR: {state.config.avaliador.toUpperCase()}</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {selectedStudents.map(s => {
             const ev = state.evaluations[s.id] || {};
             const isApproved = ev.status?.includes('Aprovado');
             const statusColor = isApproved ? 'text-green-500' : 'text-bushido-red';
             const borderColor = isApproved ? 'border-green-900/30' : 'border-red-900/30';
             const bgGlow = isApproved ? 'bg-green-500/5' : 'bg-red-500/5';

             return (
                <div key={s.id} className={`bg-bushido-card border ${borderColor} ${bgGlow} shadow-2xl relative overflow-hidden group transition-all duration-300 hover:border-white/20`}>
                   {/* Header Card */}
                   <div className="p-5 bg-black/40 flex justify-between items-center border-b border-white/5 relative z-10">
                      <div>
                          <h3 className="font-bold text-white font-display text-lg tracking-wide uppercase">{s.nome}</h3>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{s.graduacao}</p>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-1 uppercase border ${isApproved ? 'bg-green-950/40 border-green-800 text-green-400' : 'bg-red-950/40 border-red-800 text-red-400'}`}>
                        {ev.status === 'Pendente' ? '---' : isApproved ? 'APROVADO' : 'REPROVADO'}
                      </div>
                   </div>

                   {/* Sliders */}
                   <div className="p-6 space-y-4 relative z-10">
                      {['kata', 'kihon', 'kumite', 'teorico'].map(crit => (
                         <div key={crit} className="flex items-center gap-4 bg-black/20 p-2 border border-transparent hover:border-white/5 rounded transition-colors">
                            {/* Updated Label Styling */}
                            <span className="text-sm font-display font-bold text-white w-20 uppercase tracking-widest text-right border-r-2 border-bushido-red pr-3 shadow-[2px_0_10px_rgba(220,38,38,0.1)]">
                                {crit}
                            </span>
                            
                            <div className="flex-1 relative h-6 flex items-center">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="10" 
                                    step="0.1" 
                                    value={(ev as any)[crit]||0} 
                                    onChange={e=>updateScore(s.id, crit as keyof EvaluationType, parseFloat(e.target.value))} 
                                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-bushido-red focus:outline-none focus:ring-1 focus:ring-bushido-red/50" 
                                />
                            </div>
                            <div className="w-12 h-8 bg-bushido-surface border border-white/10 flex items-center justify-center text-white font-display font-bold text-lg shadow-inner">
                                {(ev as any)[crit]}
                            </div>
                         </div>
                      ))}

                      <div className="pt-6 border-t border-white/10 flex justify-between items-end mt-2">
                         <div className="flex flex-col">
                             <span className="text-gray-600 font-bold text-[9px] uppercase tracking-[0.2em] mb-1">Resultado Final</span>
                             <span className={`text-xs font-bold uppercase ${statusColor}`}>{ev.status}</span>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-gray-600 font-bold text-[9px] uppercase tracking-[0.2em] mb-1">Média</span>
                             <span className={`text-4xl font-display font-bold leading-none ${statusColor}`}>{ev.media?.toFixed(1)}</span>
                         </div>
                      </div>
                   </div>
                </div>
             )
          })}
       </div>

       <div className="fixed bottom-0 left-0 right-0 bg-bushido-black/90 backdrop-blur-md p-6 border-t border-white/10 flex justify-end z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
          <div className="max-w-7xl w-full mx-auto flex justify-end">
              <button onClick={onFinish} className="btn-blade bg-bushido-red hover:bg-bushido-red-dark text-white px-10 py-4 font-display font-bold uppercase tracking-wider flex items-center gap-3 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">
                  <span>Finalizar Exame</span> 
                  <CheckCircle className="w-6 h-6"/>
              </button>
          </div>
       </div>
    </div>
  );
};
export default Evaluation;
