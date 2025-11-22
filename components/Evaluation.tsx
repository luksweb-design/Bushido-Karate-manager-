
import React, { useState, useEffect } from 'react';
import { DojoState, Evaluation as EvaluationType } from '../types';
import { generateSenseiFeedback } from '../services/geminiService';
import { CheckCircle, Sparkles, Save, TrendingUp, AlertCircle, MessageSquare } from 'lucide-react';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onFinish: () => void;
}

const Evaluation: React.FC<Props> = ({ state, updateState, onFinish }) => {
  // Filter only selected students
  const selectedStudents = state.students.filter(s => state.selectedStudentIds.includes(s.id));
  
  // Track loading state for AI feedback per student ID
  const [loadingFeedbackIds, setLoadingFeedbackIds] = useState<string[]>([]);

  // Initialize evaluations for students who don't have one yet
  useEffect(() => {
    let hasChanges = false;
    const newEvaluations = { ...state.evaluations };

    selectedStudents.forEach(student => {
      if (!newEvaluations[student.id]) {
        newEvaluations[student.id] = {
          studentId: student.id,
          kata: 0,
          kihon: 0,
          kumite: 0,
          teorico: 0,
          media: 0,
          status: 'Pendente',
          feedback: ''
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      updateState({ ...state, evaluations: newEvaluations });
    }
  }, [state.selectedStudentIds]);

  const updateScore = (studentId: string, field: keyof EvaluationType, value: number) => {
    const currentEval = state.evaluations[studentId];
    if (!currentEval) return;

    const numVal = Math.max(0, Math.min(10, value)); // Clamp 0-10
    const newEval = { ...currentEval, [field]: numVal };
    
    const scores = [
        field === 'kata' ? numVal : newEval.kata,
        field === 'kihon' ? numVal : newEval.kihon,
        field === 'kumite' ? numVal : newEval.kumite,
        field === 'teorico' ? numVal : newEval.teorico
    ];

    // Auto calc mean
    const media = scores.reduce((a, b) => a + b, 0) / 4;
    newEval.media = media;
    
    // --- STATUS LOGIC ---
    const system = state.config.approvalSystem || 'SPORT';

    if (system === 'SPORT') {
        // Standard Logic: Mean >= 6 Passes
        newEval.status = media >= 6 ? 'Aprovado' : 'Reprovado';
    } else {
        // Educational Logic
        if (media >= 6) {
            newEval.status = 'Aprovado';
        } else if (media < 5) {
            newEval.status = 'Reprovado';
        } else {
            // Range 5.0 to 5.9
            // Check for multiple 5.0s logic
            const lowScores = scores.filter(s => s >= 5 && s < 6).length;
            if (lowScores > 1) {
                newEval.status = 'Aprovado c/ Reforço';
            } else {
                newEval.status = 'Aprovado (Razoável)';
            }
        }
    }

    // Update Global State immediately
    updateState({
      ...state,
      evaluations: {
        ...state.evaluations,
        [studentId]: newEval
      }
    });
  };

  const handleGetFeedback = async (studentId: string) => {
    const student = state.students.find(s => s.id === studentId);
    const evaluation = state.evaluations[studentId];
    
    if (!student || !evaluation) return;

    setLoadingFeedbackIds(prev => [...prev, studentId]);
    
    const feedback = await generateSenseiFeedback(student, evaluation);
    
    updateState({
        ...state,
        evaluations: {
            ...state.evaluations,
            [studentId]: { ...evaluation, feedback }
        }
    });

    setLoadingFeedbackIds(prev => prev.filter(id => id !== studentId));
  };

  const handleFeedbackChange = (studentId: string, text: string) => {
    updateState({
        ...state,
        evaluations: {
            ...state.evaluations,
            [studentId]: { ...state.evaluations[studentId], feedback: text }
        }
    });
  };

  // Calculate Progress
  const evaluatedCount = selectedStudents.filter(s => {
     const ev = state.evaluations[s.id];
     return ev && ev.media > 0; // Simple check if started
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 font-jp">Painel de Avaliação</h2>
            <p className="text-gray-500 text-sm">
                {selectedStudents.length} alunos selecionados • {state.config.approvalSystem === 'EDUCATIONAL' ? 'Modo Educativo' : 'Modo Esportivo'}
            </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow border border-gray-200 flex items-center gap-3">
            <div className="text-right">
                <span className="text-xs text-gray-500 uppercase block">Avaliados</span>
                <span className="font-bold text-lg text-bushido-black">{evaluatedCount}/{selectedStudents.length}</span>
            </div>
            <div className="h-10 w-1 bg-gray-100 mx-2"></div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                <TrendingUp className="w-5 h-5" />
            </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {selectedStudents.map((student) => {
          const ev = state.evaluations[student.id] || { kata: 0, kihon: 0, kumite: 0, teorico: 0, media: 0, status: 'Pendente' };
          const isApproved = ev.status.includes('Aprovado');
          const isLoadingAI = loadingFeedbackIds.includes(student.id);

          return (
            <div key={student.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col">
              
              {/* Card Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-bushido-black text-white flex items-center justify-center font-bold border-2 border-bushido-red">
                        {ev.media.toFixed(1)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 leading-tight">{student.nome}</h3>
                        <span className="text-xs text-gray-500">{student.graduacao}</span>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold border ${
                    ev.status === 'Pendente' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                    isApproved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    {ev.status}
                </span>
              </div>

              {/* Inputs Area */}
              <div className="p-4 space-y-4 flex-1">
                 {['kata', 'kihon', 'kumite', 'teorico'].map((crit) => (
                    <div key={crit} className="flex items-center gap-3">
                        <label className="w-16 text-xs font-bold text-gray-500 uppercase">{crit}</label>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={(ev as any)[crit]}
                            onChange={(e) => updateScore(student.id, crit as keyof EvaluationType, parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-bushido-red"
                        />
                        <input 
                            type="number"
                            min="0" 
                            max="10"
                            className="w-12 text-center text-sm font-bold border border-gray-300 bg-gray-50 rounded p-1 focus:ring-bushido-red focus:border-bushido-red"
                            value={(ev as any)[crit]}
                            onChange={(e) => updateScore(student.id, crit as keyof EvaluationType, parseFloat(e.target.value))}
                        />
                    </div>
                 ))}
              </div>

              {/* Feedback Area */}
              <div className="px-4 pb-4 bg-white">
                  <div className="relative">
                    <textarea 
                        className="w-full bg-yellow-50 border border-yellow-200 rounded-md text-xs p-2 pr-8 focus:ring-yellow-400 focus:border-yellow-400 min-h-[60px] resize-none"
                        placeholder="Feedback do Sensei..."
                        value={ev.feedback || ''}
                        onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1">
                       <button 
                         onClick={() => handleGetFeedback(student.id)}
                         disabled={isLoadingAI}
                         className="p-1.5 bg-white rounded-full shadow hover:bg-indigo-50 text-indigo-600 transition-all disabled:opacity-50"
                         title="Gerar com IA"
                       >
                         {isLoadingAI ? <span className="animate-spin block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full"></span> : <Sparkles className="w-3 h-3" />}
                       </button>
                    </div>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
         <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="hidden md:block">
                <p className="text-sm text-gray-500">
                   <AlertCircle className="w-4 h-4 inline mr-1 text-yellow-500" />
                   Certifique-se de avaliar todos os alunos antes de finalizar.
                </p>
            </div>
            <button 
                onClick={onFinish}
                className="w-full md:w-auto bg-bushido-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                <CheckCircle className="w-5 h-5" />
                FINALIZAR EXAME E GERAR RESULTADOS
            </button>
         </div>
      </div>

    </div>
  );
};

export default Evaluation;
