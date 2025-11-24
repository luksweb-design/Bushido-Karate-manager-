import React, { useState, useRef } from 'react';
import { Student, DojoState } from '../types';
import { Plus, Trash2, Search, User, ArrowRight, Pencil, Camera, X, AlertTriangle, ShieldAlert, FileSpreadsheet, Download, Upload, FileText } from 'lucide-react';
// We import the generator from Results since it contains the logic
import { generateRIDHtml } from './Results'; 

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onNext: () => void;
}

const StudentManager: React.FC<Props> = ({ state, updateState, onNext }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingBP, setLoadingBP] = useState(false);
  
  // States for Modals
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  const [viewMode, setViewMode] = useState<'simple' | 'full'>('simple');
  const [formData, setFormData] = useState<Partial<Student>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const calculateAge = (dateString?: string) => {
    if (!dateString) return null;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const handleOpenNew = () => {
    setFormData({ historicoExames: [] });
    setViewMode('simple');
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setFormData({ ...student });
    setViewMode('full');
    setIsModalOpen(true);
  };

  const handleSaveStudent = () => {
    if (!formData.nome || !formData.graduacao || !formData.nascimento) {
      alert("Nome, Graduação e Data de Nascimento são obrigatórios.");
      return;
    }
    const isEditing = !!formData.id;
    const studentToSave: Student = {
      id: isEditing ? formData.id! : Date.now().toString(),
      nome: formData.nome,
      matricula: formData.matricula || `B${Date.now().toString().slice(-6)}`,
      nascimento: formData.nascimento,
      graduacao: formData.graduacao,
      email: formData.email || '',
      telefone: formData.telefone || '',
      endereco: formData.endereco || '',
      fotoUrl: formData.fotoUrl || '',
      responsavelNome: formData.responsavelNome || '',
      responsavelTelefone: formData.responsavelTelefone || '',
      instagram: formData.instagram || '',
      facebook: formData.facebook || '',
      historicoExames: formData.historicoExames || []
    };

    let newStudentsList;
    if (isEditing) {
      newStudentsList = state.students.map(s => s.id === studentToSave.id ? studentToSave : s);
    } else {
      newStudentsList = [...state.students, studentToSave];
    }
    updateState({ ...state, students: newStudentsList });
    setIsModalOpen(false);
    setFormData({});
  };

  // --- DELETE LOGIC ---
  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      updateState({
        ...state,
        students: state.students.filter(s => s.id !== studentToDelete.id),
        selectedStudentIds: state.selectedStudentIds.filter(sid => sid !== studentToDelete.id)
      });
      setStudentToDelete(null);
    }
  };
  
  const handleDownloadRID = (student: Student) => {
      if (!student.historicoExames || student.historicoExames.length === 0) {
          alert("Este aluno não possui histórico de exames para gerar o relatório.");
          return;
      }
      
      // Get the most recent exam
      const lastExam = student.historicoExames[student.historicoExames.length - 1];
      
      const htmlContent = generateRIDHtml(
          student, 
          undefined, 
          student.historicoExames, 
          state.dojoProfile.nome, 
          lastExam.data
      );
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = student.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.setAttribute('download', `RID_${safeName}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleBushidoPassActivation = async () => {
    setLoadingBP(true);
    setTimeout(() => { setLoadingBP(false); alert("Função simulada para demo."); }, 1000);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, fotoUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  // --- CSV Logic ---
  const parseFlexibleDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const cleanStr = dateStr.trim();
    const parts = cleanStr.split(/[\/\-\.]/);
    if (parts.length !== 3) return '';

    let day: number, month: number, year: number;
    if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
    } else {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
    }

    if (year < 100) year += (year < 30 ? 2000 : 1900);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
    if (month < 1 || month > 12) return '';
    if (day < 1 || day > 31) return '';

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const matchSystemRank = (inputRank: string): string => {
      if (!inputRank) return 'Branca (9º Kyu)';
      const cleanInput = inputRank.trim().toLowerCase().replace('faixa', '').trim();
      const systemRanks = state.config.faixas;
      const exact = systemRanks.find(r => r.toLowerCase() === inputRank.toLowerCase().trim());
      if (exact) return exact;
      const partial = systemRanks.find(r => r.toLowerCase().includes(cleanInput));
      if (partial) return partial;
      return inputRank.charAt(0).toUpperCase() + inputRank.slice(1);
  };

  const handleDownloadTemplate = () => {
    const headers = "Nome,Nascimento(DD/MM/AAAA),Graduacao\n";
    const example = "João Silva,20/05/2010,Branca\nMaria Oliveira,15-08-2012,Amarela";
    const bom = "\uFEFF"; 
    const csvContent = bom + headers + example;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_alunos_bushido.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const newStudents: Student[] = [];
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        if (cols.length < 3) continue;

        const rawName = cols[0].trim();
        const rawDate = cols[1].trim();
        const rawRank = cols[2].trim();

        if (!rawName) continue;
        const formattedDate = parseFlexibleDate(rawDate);
        if (!formattedDate) {
            console.warn(`Data inválida na linha ${i + 1}: ${rawDate}`);
            continue;
        }

        const matchedRank = matchSystemRank(rawRank);
        const student: Student = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            nome: rawName,
            matricula: `B${Date.now().toString().slice(-6) + i}`,
            nascimento: formattedDate,
            graduacao: matchedRank,
            email: '',
            telefone: '',
            responsavelNome: '',
            responsavelTelefone: '',
            historicoExames: []
        };
        newStudents.push(student);
        successCount++;
      }

      if (newStudents.length > 0) {
        updateState({ ...state, students: [...state.students, ...newStudents] });
        alert(`${successCount} alunos importados com sucesso!`);
      } else {
        alert("Nenhum dado válido encontrado. Verifique o formato das datas (DD/MM/AAAA) e se todas as colunas estão preenchidas.");
      }
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filteredStudents = state.students.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matricula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <div>
           <h2 className="text-4xl font-display font-bold text-white uppercase tracking-wider">Gestão de Alunos</h2>
           <p className="text-bushido-red text-xs font-bold uppercase tracking-[0.2em] mt-1">Base de dados do Dojo</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
           {/* CSV Actions Group */}
           <div className="flex gap-2 mr-2 border-r border-white/10 pr-4">
              <button 
                onClick={handleDownloadTemplate}
                className="btn-blade bg-bushido-surface border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white px-4 py-3 font-display font-bold uppercase text-xs tracking-wider flex items-center gap-2"
                title="Baixar Modelo (CSV)"
              >
                  <FileSpreadsheet className="w-4 h-4" /> <Download className="w-3 h-3" />
              </button>
              <button 
                onClick={() => csvInputRef.current?.click()}
                className="btn-blade bg-bushido-surface border border-white/10 hover:bg-white/5 text-bushido-gold px-4 py-3 font-display font-bold uppercase text-xs tracking-wider flex items-center gap-2"
                title="Importar Alunos"
              >
                  <span>Importar CSV</span> <Upload className="w-4 h-4" />
              </button>
              <input 
                 type="file" 
                 accept=".csv" 
                 ref={csvInputRef} 
                 className="hidden" 
                 onChange={handleCsvImport}
              />
           </div>

          <button onClick={handleOpenNew} className="btn-blade bg-bushido-red hover:bg-bushido-red-dark text-white px-8 py-3 font-display font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] flex-grow xl:flex-grow-0 justify-center">
             <span>Novo Aluno</span> <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative mb-8 group">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-bushido-red transition-colors" />
        <input
          type="text"
          placeholder="BUSCAR POR NOME OU MATRÍCULA..."
          className="input-bushido block w-full pl-12 pr-4 py-3 rounded-none skew-x-[-10deg] ml-2 leading-5 placeholder-gray-600 font-display uppercase tracking-wide focus:skew-x-[-10deg]"
          style={{ transform: 'skewX(-10deg)' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-bushido-card border border-white/5 shadow-2xl overflow-hidden mb-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-bushido-red/5 rounded-full blur-3xl pointer-events-none"></div>
        <ul className="divide-y divide-white/5">
          {filteredStudents.map((student) => {
            const age = calculateAge(student.nascimento);
            const hasHistory = student.historicoExames && student.historicoExames.length > 0;
            return (
            <li key={student.id} className="hover:bg-white/5 transition-colors group relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-bushido-red transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
              <div className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="flex-shrink-0 h-14 w-14 bg-bushido-surface border border-white/10 flex items-center justify-center overflow-hidden relative skew-x-[-10deg]">
                      {student.fotoUrl ? 
                        <img src={student.fotoUrl} alt="" className="h-full w-full object-cover skew-x-[10deg] scale-110"/> : 
                        <User className="text-gray-600 h-6 w-6 skew-x-[10deg]"/>
                      }
                  </div>
                  <div className="ml-5">
                    <div className="text-xl font-display font-bold text-white tracking-wide group-hover:text-bushido-red transition-colors uppercase">{student.nome}</div>
                    <div className="flex mt-1 text-xs text-gray-500 gap-3 font-bold uppercase tracking-wider items-center">
                         <span className="bg-white/5 px-2 py-0.5 text-gray-300 border border-white/10">{student.graduacao}</span>
                         <span>{student.matricula}</span>
                         {age !== null && <span className="text-bushido-gold">{age} anos</span>}
                    </div>
                  </div>
                </div>
                
                {/* ACTION BUTTONS */}
                <div className="ml-6 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  {hasHistory && (
                     <button 
                        onClick={() => handleDownloadRID(student)}
                        className="text-gray-400 hover:text-bushido-gold p-2 hover:bg-white/5 transition-all"
                        title="Baixar Relatório de Desempenho (Último Exame)"
                     >
                        <FileText className="h-5 w-5" />
                     </button>
                  )}
                  <button 
                    onClick={() => handleEdit(student)}
                    className="text-gray-400 hover:text-white p-2 hover:bg-white/5 transition-all"
                    title="Editar Aluno"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(student)}
                    className="text-gray-400 hover:text-bushido-red p-2 hover:bg-red-900/10 transition-all"
                    title="Excluir Aluno"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          )})}
          {filteredStudents.length === 0 && (
            <div className="p-16 text-center flex flex-col items-center justify-center text-gray-500">
                <User className="w-12 h-12 mb-4 opacity-20" />
                <span className="font-display uppercase tracking-widest">Nenhum guerreiro encontrado</span>
            </div>
          )}
        </ul>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          className="btn-blade bg-bushido-surface border border-white/10 text-white hover:bg-white/10 px-8 py-4 font-display font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg group"
        >
          <span>Ir para Seleção</span>
          <ArrowRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-bushido-card border-2 border-bushido-red w-full max-w-md p-1 shadow-[0_0_50px_rgba(220,38,38,0.3)] relative animate-in fade-in zoom-in duration-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-bushido-red shadow-[0_0_10px_#DC2626]"></div>
                
                <div className="p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-bushido-red/30">
                        <ShieldAlert className="w-8 h-8 text-bushido-red" />
                    </div>
                    
                    <h3 className="text-2xl font-display font-bold text-white uppercase tracking-wider mb-2">Excluir Guerreiro?</h3>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        Tem certeza que deseja remover <strong className="text-white">{studentToDelete.nome}</strong> do dojo? <br/>
                        <span className="text-red-500 font-bold uppercase text-xs tracking-widest mt-2 block">Esta ação não pode ser desfeita.</span>
                    </p>
                    
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => setStudentToDelete(null)}
                            className="px-6 py-3 font-display font-bold uppercase tracking-wider text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="btn-blade bg-bushido-red hover:bg-red-600 text-white px-8 py-3 font-display font-bold uppercase tracking-wider shadow-lg flex items-center gap-2"
                        >
                            <span>Confirmar Exclusão</span>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- EDIT/CREATE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div className="bg-bushido-card border border-white/10 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-bushido-red"></div>
                <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-bushido-surface relative">
                   <h3 className="font-display font-bold text-2xl text-white uppercase tracking-widest pl-4">{formData.id ? 'Editar Guerreiro' : 'Novo Recruta'}</h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/20">
                  <button 
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${viewMode === 'simple' ? 'text-bushido-red border-b-2 border-bushido-red bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setViewMode('simple')}
                  >
                    Cadastro Rápido
                  </button>
                  <button 
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${viewMode === 'full' ? 'text-bushido-red border-b-2 border-bushido-red bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setViewMode('full')}
                  >
                    Cadastro Completo
                  </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                   {viewMode === 'simple' ? (
                     <div className="space-y-6">
                       <div>
                         <label className="block text-xs font-bold text-bushido-red mb-2 uppercase tracking-wider">Nome do Aluno *</label>
                         <input type="text" className="input-bushido w-full p-4 text-lg font-display uppercase tracking-wide" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} autoFocus />
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Nascimento *</label>
                            <input type="date" className="input-bushido w-full p-3 text-gray-300" value={formData.nascimento || ''} onChange={e => setFormData({...formData, nascimento: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Graduação Atual *</label>
                            <select className="input-bushido w-full p-3 font-bold" value={formData.graduacao || ''} onChange={e => setFormData({...formData, graduacao: e.target.value})}>
                                <option value="">Selecione a faixa...</option>
                                {state.config.faixas.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-6">
                        {/* Full Form Content */}
                        <div className="flex flex-col md:flex-row gap-6">
                           <div className="w-32 h-32 bg-bushido-surface flex-shrink-0 flex items-center justify-center border-2 border-dashed border-white/10 cursor-pointer overflow-hidden relative group hover:border-bushido-red/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                              {formData.fotoUrl ? <img src={formData.fotoUrl} className="w-full h-full object-cover" /> : <Camera className="text-gray-600 group-hover:text-bushido-red transition-colors" />}
                              <input type="file" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                           </div>
                           <div className="flex-1 space-y-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nome Completo</label>
                                <input type="text" className="input-bushido w-full p-3 uppercase font-display tracking-wide" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nascimento</label>
                                    <input type="date" className="input-bushido w-full p-3 text-gray-300" value={formData.nascimento || ''} onChange={e => setFormData({...formData, nascimento: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Faixa</label>
                                    <select className="input-bushido w-full p-3" value={formData.graduacao || ''} onChange={e => setFormData({...formData, graduacao: e.target.value})}>
                                        <option value="">Selecione...</option>
                                        {state.config.faixas.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                              </div>
                           </div>
                        </div>

                        {/* More Fields (Contact, Guardian, BP) */}
                        <div className="border-t border-white/5 pt-6 mt-4">
                            <h4 className="font-display font-bold text-bushido-gold uppercase tracking-widest mb-4 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Contato & Responsável</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="TELEFONE ALUNO" className="input-bushido p-3 text-xs font-bold uppercase tracking-wide" value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                                <input type="email" placeholder="E-MAIL" className="input-bushido p-3 text-xs font-bold uppercase tracking-wide" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                                <input type="text" placeholder="NOME RESPONSÁVEL" className="input-bushido p-3 text-xs font-bold uppercase tracking-wide" value={formData.responsavelNome || ''} onChange={e => setFormData({...formData, responsavelNome: e.target.value})} />
                                <input type="text" placeholder="TEL. RESPONSÁVEL" className="input-bushido p-3 text-xs font-bold uppercase tracking-wide" value={formData.responsavelTelefone || ''} onChange={e => setFormData({...formData, responsavelTelefone: e.target.value})} />
                            </div>
                            <input type="text" placeholder="ENDEREÇO COMPLETO" className="input-bushido w-full p-3 mt-4 text-xs font-bold uppercase tracking-wide" value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} />
                        </div>
                        
                        {/* Bushido Pass Block - Styled Dark */}
                        <div className="bg-black/30 p-4 border border-white/5 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full pointer-events-none"></div>
                           <div className="flex justify-between items-center mb-2">
                              <h4 className="font-display font-bold text-gray-400 flex items-center gap-2 text-sm uppercase tracking-widest">Bushido Pass ID</h4>
                           </div>
                           <div className="flex gap-2">
                             <input type="text" placeholder="000000" className="flex-1 bg-bushido-surface border border-white/10 text-white p-2 text-center font-mono tracking-[0.2em] focus:border-bushido-red focus:outline-none" value={formData.matricula || ''} onChange={e => setFormData({...formData, matricula: e.target.value})} />
                             <button onClick={handleBushidoPassActivation} className="bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1 text-xs uppercase font-bold border border-white/10" disabled={loadingBP}>
                                 {loadingBP ? "..." : "Sincronizar"}
                              </button>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
                <div className="px-8 py-6 bg-bushido-surface flex justify-end gap-4 rounded-b-2xl border-t border-white/5">
                   <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 hover:text-white font-bold uppercase text-xs tracking-[0.2em] transition-colors">Cancelar</button>
                   <button onClick={handleSaveStudent} className="btn-blade bg-bushido-red text-white px-8 py-3 font-display font-bold uppercase tracking-wider hover:bg-bushido-red-dark shadow-lg">
                      <span>Salvar Guerreiro</span>
                   </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;