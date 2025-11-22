
import React, { useState, useMemo } from 'react';
import { DojoState, Evaluation } from '../types';
import { Search, Filter, CheckCircle } from 'lucide-react';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onNext: () => void;
}

const Selection: React.FC<Props> = ({ state, updateState, onNext }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rankFilter, setRankFilter] = useState('Todos');

  // Logic: Toggle selection in the persistent array
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

  // Logic: Select/Deselect All VISIBLE students
  const toggleAllVisible = () => {
    const visibleIds = filteredStudents.map(s => s.id);
    const allVisibleSelected = visibleIds.every(id => state.selectedStudentIds.includes(id));
    
    let newSelection = [...state.selectedStudentIds];
    
    if (allVisibleSelected) {
      // Deselect visible
      newSelection = newSelection.filter(id => !visibleIds.includes(id));
    } else {
      // Select visible (avoid duplicates)
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
      
      // CRITICAL CHANGE: Filter out students who are already evaluated in this event
      // We assume if they exist in state.evaluations with a status other than 'Pendente', they are done.
      // However, allowing re-evaluation of 'Pendente' is useful.
      const evaluation = state.evaluations[s.id] as Evaluation | undefined;
      const isAlreadyEvaluated = evaluation && evaluation.status !== 'Pendente';

      return matchesSearch && matchesRank && !isAlreadyEvaluated;
    });
  }, [state.students, state.evaluations, searchTerm, rankFilter]);

  const visibleSelectedCount = filteredStudents.filter(s => state.selectedStudentIds.includes(s.id)).length;
  const isAllVisibleSelected = filteredStudents.length > 0 && visibleSelectedCount === filteredStudents.length;
  
  // KPI Counters
  const totalStudents = state.students.length;
  const alreadyEvaluatedCount = Object.values(state.evaluations).filter(e => (e as Evaluation).status !== 'Pendente').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-jp">Seleção para Exame</h2>
            <div className="flex gap-4 mt-1 text-sm">
                <p className="text-gray-500">
                  <span className="font-bold text-bushido-red">{state.selectedStudentIds.length}</span> selecionados agora
                </p>
                <p className="text-green-600 flex items-center gap-1">
                   <CheckCircle className="w-3 h-3" /> {alreadyEvaluatedCount} já avaliados
                </p>
            </div>
          </div>
          <button
            onClick={onNext}
            disabled={state.selectedStudentIds.length === 0}
            className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold text-white transition-all shadow-md ${
              state.selectedStudentIds.length > 0 ? 'bg-bushido-red hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Iniciar Avaliação do Grupo &rarr;
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrar por nome..."
              className="pl-10 w-full bg-gray-50 border-gray-300 rounded-md shadow-sm focus:ring-bushido-red focus:border-bushido-red py-2 border"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <select
              className="pl-10 w-full bg-gray-50 border-gray-300 rounded-md shadow-sm focus:ring-bushido-red focus:border-bushido-red py-2 border"
              value={rankFilter}
              onChange={e => setRankFilter(e.target.value)}
            >
              <option value="Todos">Todas as Faixas</option>
              {state.config.faixas.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Table Header */}
        <div className="flex items-center bg-gray-50 p-3 rounded-t-md border border-gray-200">
          <input 
            type="checkbox"
            className="h-4 w-4 text-bushido-red focus:ring-bushido-red border-gray-300 rounded"
            checked={isAllVisibleSelected}
            onChange={toggleAllVisible}
            disabled={filteredStudents.length === 0}
          />
          <span className="ml-3 font-semibold text-gray-600 text-sm">
            {filteredStudents.length === 0 ? 'Nenhum aluno disponível para seleção' : 'Selecionar Grupo Visível'}
          </span>
        </div>

        {/* List */}
        <div className="border border-t-0 border-gray-200 rounded-b-md max-h-[60vh] overflow-y-auto bg-white">
          {filteredStudents.length === 0 ? (
             <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <CheckCircle className="w-12 h-12 text-gray-200 mb-2" />
                <p>Nenhum aluno pendente corresponde aos filtros.</p>
                <p className="text-xs mt-1">Alunos já avaliados não aparecem nesta lista.</p>
             </div>
          ) : (
            filteredStudents.map(student => {
              const isSelected = state.selectedStudentIds.includes(student.id);
              return (
                <div 
                  key={student.id}
                  onClick={() => toggleSelection(student.id)}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors ${isSelected ? 'bg-red-50' : ''}`}
                >
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="h-5 w-5 text-bushido-red focus:ring-bushido-red border-gray-300 rounded pointer-events-none"
                  />
                  <div className="ml-4 flex-1">
                    <h3 className={`text-sm font-bold ${isSelected ? 'text-bushido-red' : 'text-gray-900'}`}>{student.nome}</h3>
                    <p className="text-xs text-gray-500">{student.graduacao} • {student.matricula}</p>
                  </div>
                  {isSelected && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Selecionado
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
