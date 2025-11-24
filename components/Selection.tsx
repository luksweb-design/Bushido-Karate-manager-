import React, { useState, useMemo } from 'react';
import { DojoState, Evaluation } from '../types';
import { Search, Filter, CheckCircle, UserCheck, ArrowRight } from 'lucide-react';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onNext: () => void;
}

const Selection: React.FC<Props> = ({ state, updateState, onNext }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rankFilter, setRankFilter] = useState('Todos');

  const toggleSelection = (id: string) => {
    const isSelected = state.selectedStudentIds.includes(id);
    let newSelection;
    if (isSelected) {
      newSelection = state.selectedStudentIds.filter(sid => sid !== id);
    } else {
      newSelection = [...state.selectedStudentIds, id];
    }
    updateState({ ...state, selectedStudentIds: newSelection });
  };

  const toggleAllVisible = () => {
    const visibleIds = filteredStudents.map(s => s.id);
    const allVisibleSelected = visibleIds.every(id => state.selectedStudentIds.includes(id));
    
    let newSelection = [...state.selectedStudentIds];
    
    if (allVisibleSelected) {
      newSelection = newSelection.filter(id => !visibleIds.includes(id));
    } else {
      visibleIds.forEach(id => {
        if (!newSelection.includes(id)) newSelection.push(id);
      });
    }
    updateState({ ...state, selectedStudentIds: newSelection });
  };

  const filteredStudents = useMemo(() => {
    return state.students.filter(s => {
      const matchesSearch = s.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = rankFilter === 'Todos' || s.graduacao === rankFilter;
      const evaluation = state.evaluations[s.id] as Evaluation | undefined;
      const isAlreadyEvaluated = evaluation && evaluation.status !== 'Pendente';
      return matchesSearch && matchesRank && !isAlreadyEvaluated;
    });
  }, [state.students, state.evaluations, searchTerm, rankFilter]);

  const visibleSelectedCount = filteredStudents.filter(s => state.selectedStudentIds.includes(s.id)).length;
  const isAllVisibleSelected = filteredStudents.length > 0 && visibleSelectedCount === filteredStudents.length;
  
  const totalStudents = state.students.length;
  const alreadyEvaluatedCount = Object.values(state.evaluations).filter(e => (e as Evaluation).status !== 'Pendente').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-bushido-card rounded-none skew-x-[-1deg] shadow-2xl border border-white/5 overflow-hidden ring-1 ring-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 border-b border-white/5 gap-6 bg-bushido-surface">
          <div>
            <h2 className="text-3xl font-display font-bold text-white uppercase tracking-wider">Seleção</h2>
            <div className="flex gap-6 mt-2 text-xs font-bold uppercase tracking-widest">
                <p className="text-gray-500">
                  <span className="text-bushido-red text-base mr-1">{state.selectedStudentIds.length}</span> Selecionados
                </p>
                <p className="text-green-500 flex items-center gap-1 border-l border-white/10 pl-6">
                   <CheckCircle className="w-3 h-3" /> {alreadyEvaluatedCount} já avaliados
                </p>
            </div>
          </div>
          <button
            onClick={onNext}
            disabled={state.selectedStudentIds.length === 0}
            className={`btn-blade w-full md:w-auto px-10 py-5 font-display font-bold text-lg uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3 ${
              state.selectedStudentIds.length > 0 ? 'bg-bushido-red text-white hover:bg-bushido-red-dark shadow-red-900/20' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            <span>Iniciar Avaliação</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/20">
          <div className="relative col-span-2 group">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-600 group-focus-within:text-bushido-red transition-colors" />
            <input
              type="text"
              placeholder="FILTRAR POR NOME..."
              className="input-bushido w-full pl-12 pr-4 py-3 font-display uppercase tracking-wide border-transparent focus:border-bushido-red bg-bushido-surface"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative group">
            <Filter className="absolute left-4 top-3.5 h-5 w-5 text-gray-600 group-focus-within:text-bushido-red transition-colors" />
            <select
              className="input-bushido w-full pl-12 pr-4 py-3 appearance-none font-display uppercase tracking-wide text-gray-300 border-transparent focus:border-bushido-red bg-bushido-surface cursor-pointer"
              value={rankFilter}
              onChange={e => setRankFilter(e.target.value)}
            >
              <option value="Todos">Todas as Faixas</option>
              {state.config.faixas.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* List Header */}
        <div className="flex items-center bg-white/5 px-6 py-4 border-y border-white/5">
          <div className="relative flex items-center">
              <input 
                type="checkbox"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-bushido-surface checked:border-bushido-red checked:bg-bushido-red transition-all"
                checked={isAllVisibleSelected}
                onChange={toggleAllVisible}
                disabled={filteredStudents.length === 0}
              />
              <CheckCircle className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-3.5 h-3.5 left-0.5 top-0.5" />
          </div>
          <span className="ml-4 font-bold text-gray-400 text-xs uppercase tracking-[0.15em]">
            {filteredStudents.length === 0 ? 'LISTA VAZIA' : 'SELECIONAR GRUPO VISÍVEL'}
          </span>
        </div>

        {/* List */}
        <div className="max-h-[50vh] overflow-y-auto bg-bushido-card custom-scrollbar">
          {filteredStudents.length === 0 ? (
             <div className="p-20 text-center text-gray-600 flex flex-col items-center">
                <UserCheck className="w-16 h-16 text-gray-800 mb-6 opacity-30" />
                <p className="font-display font-bold text-xl uppercase tracking-widest opacity-50">Nenhum guerreiro encontrado</p>
             </div>
          ) : (
            filteredStudents.map(student => {
              const isSelected = state.selectedStudentIds.includes(student.id);
              return (
                <div 
                  key={student.id}
                  onClick={() => toggleSelection(student.id)}
                  className={`flex items-center px-6 py-5 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors group ${isSelected ? 'bg-bushido-red/10 border-l-4 border-l-bushido-red' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="relative flex items-center">
                    <input 
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-bushido-surface checked:border-bushido-red checked:bg-bushido-red transition-all"
                    />
                    <CheckCircle className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-3.5 h-3.5 left-0.5 top-0.5" />
                  </div>
                  
                  <div className="ml-5 flex-1">
                    <h3 className={`text-lg font-display font-bold uppercase tracking-wide transition-colors ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{student.nome}</h3>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1 group-hover:text-gray-500">{student.graduacao} • {student.matricula}</p>
                  </div>
                  {isSelected && (
                    <span className="btn-blade inline-flex items-center px-4 py-1 text-[10px] font-bold uppercase tracking-widest bg-bushido-red text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                      <span>Selecionado</span>
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Selection;