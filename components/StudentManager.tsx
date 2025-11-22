
import React, { useState, useRef } from 'react';
import { Student, DojoState, ExamHistoryItem } from '../types';
import { Plus, Trash2, Search, User, ArrowRight, Upload, FileText, Pencil, Camera, Instagram, Facebook, X, Zap, LayoutList, BadgeCheck, Loader2, FileDown, Share2, ArrowUpCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onNext: () => void;
}

const StudentManager: React.FC<Props> = ({ state, updateState, onNext }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingBP, setLoadingBP] = useState(false);
  
  const [viewMode, setViewMode] = useState<'simple' | 'full'>('simple');
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [historyItem, setHistoryItem] = useState<Partial<ExamHistoryItem>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
      updateState({
        ...state,
        students: state.students.filter(s => s.id !== id),
        selectedStudentIds: state.selectedStudentIds.filter(sid => sid !== id)
      });
    }
  };

  // --- MANUAL PROMOTION LOGIC ---
  const handlePromoteStudent = (student: Student) => {
     const ranks = state.config.faixas;
     const currentIndex = ranks.indexOf(student.graduacao);
     
     if (currentIndex === -1) {
         alert("A graduação atual do aluno não está na lista de faixas configurada. Edite o aluno manualmente.");
         return;
     }

     if (currentIndex >= ranks.length - 1) {
         alert("O aluno já está na última faixa configurada!");
         return;
     }

     const nextRank = ranks[currentIndex + 1];

     if (confirm(`Promover ${student.nome}?\n\nDe: ${student.graduacao}\nPara: ${nextRank}`)) {
         const updatedStudent = { ...student, graduacao: nextRank };
         const newStudentsList = state.students.map(s => s.id === student.id ? updatedStudent : s);
         updateState({ ...state, students: newStudentsList });
     }
  };

  const generateStudentReport = (student: Student) => {
    const doc = new jsPDF();
    if (state.dojoProfile.logoUrl) {
        try { doc.addImage(state.dojoProfile.logoUrl, 'PNG', 170, 10, 20, 20); } catch (e) {}
    }
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Ficha Cadastral do Aluno", 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(state.config.academia, 20, 26);
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);
    
    let y = 55;
    doc.text(`Nome: ${student.nome}`, 20, y);
    doc.text(`Graduação: ${student.graduacao}`, 100, y);
    const safeName = student.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Ficha_${safeName}.pdf`);
  };

  const handleShareStudent = async (student: Student) => {
    const text = `🥋 *Ficha do Aluno*\nNome: ${student.nome}\nGraduação: ${student.graduacao}`;
    if (navigator.share) {
        try { await navigator.share({ title: student.nome, text: text }); } catch (err) {}
    } else {
        alert("Copie:\n" + text);
    }
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

  const filteredStudents = state.students.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matricula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 font-jp">Gestão de Alunos</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleOpenNew} className="bg-bushido-red hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all">
            <Plus className="w-4 h-4" /> Novo Aluno
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou matrícula..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 focus:ring-2 focus:ring-bushido-red focus:border-bushido-red"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
        <ul className="divide-y divide-gray-200">
          {filteredStudents.map((student) => {
            const age = calculateAge(student.nascimento);
            return (
            <li key={student.id}>
              <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50 transition-colors group">
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                        {student.fotoUrl ? <img src={student.fotoUrl} alt="" className="h-full w-full object-cover"/> : <User className="text-gray-500 h-6 w-6"/>}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-bushido-red truncate">{student.nome}</div>
                      <div className="flex mt-1 text-sm text-gray-500 gap-4">
                         <span>{student.graduacao}</span>
                         <span className="hidden sm:inline">• {student.matricula}</span>
                         {age !== null && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{age} anos</span>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* ACTION BUTTONS: Gray (faded) by default, Colored on Hover */}
                <div className="ml-5 flex-shrink-0 flex gap-2">
                  <button 
                    onClick={() => handleShareStudent(student)}
                    className="text-gray-300 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition-all transform hover:scale-110"
                    title="Compartilhar"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => generateStudentReport(student)}
                    className="text-gray-300 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition-all transform hover:scale-110"
                    title="Baixar Relatório (PDF)"
                  >
                    <FileDown className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handlePromoteStudent(student)}
                    className="text-gray-300 hover:text-orange-500 p-2 rounded-full hover:bg-orange-50 transition-all transform hover:scale-110"
                    title="Promover Aluno Manualmente (Próxima Faixa)"
                  >
                    <ArrowUpCircle className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleEdit(student)}
                    className="text-gray-300 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-all transform hover:scale-110"
                    title="Editar Aluno"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(student.id)}
                    className="text-gray-300 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all transform hover:scale-110"
                    title="Excluir Aluno"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          )})}
        </ul>
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-6">
        <button
          onClick={onNext}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-bushido-black hover:bg-gray-800 transition-colors"
        >
          Ir para Seleção de Exame
          <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
        </button>
      </div>

      {/* MODAL CODE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                   <h3 className="font-bold">{formData.id ? 'Editar Aluno' : 'Novo Aluno'}</h3>
                   <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6" /></button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  <button 
                    className={`flex-1 py-3 text-sm font-medium ${viewMode === 'simple' ? 'text-bushido-red border-b-2 border-bushido-red' : 'text-gray-500'}`}
                    onClick={() => setViewMode('simple')}
                  >
                    Cadastro Rápido
                  </button>
                  <button 
                    className={`flex-1 py-3 text-sm font-medium ${viewMode === 'full' ? 'text-bushido-red border-b-2 border-bushido-red' : 'text-gray-500'}`}
                    onClick={() => setViewMode('full')}
                  >
                    Cadastro Completo
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                   {viewMode === 'simple' ? (
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                         <input type="text" className="w-full border p-2 rounded bg-gray-50" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Data de Nascimento *</label>
                            <input type="date" className="w-full border p-2 rounded bg-gray-50" value={formData.nascimento || ''} onChange={e => setFormData({...formData, nascimento: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Graduação Atual *</label>
                            <select className="w-full border p-2 rounded bg-gray-50" value={formData.graduacao || ''} onChange={e => setFormData({...formData, graduacao: e.target.value})}>
                                <option value="">Selecione...</option>
                                {state.config.faixas.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-6">
                        {/* Full Form Content */}
                        <div className="flex gap-6">
                           <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden relative group" onClick={() => fileInputRef.current?.click()}>
                              {formData.fotoUrl ? <img src={formData.fotoUrl} className="w-full h-full object-cover" /> : <Camera className="text-gray-400" />}
                              <input type="file" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                           </div>
                           <div className="flex-1 space-y-4">
                              <input type="text" placeholder="Nome Completo" className="w-full border p-2 rounded bg-gray-50" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                              <div className="grid grid-cols-2 gap-4">
                                <input type="date" className="border p-2 rounded bg-gray-50" value={formData.nascimento || ''} onChange={e => setFormData({...formData, nascimento: e.target.value})} />
                                <select className="border p-2 rounded bg-gray-50" value={formData.graduacao || ''} onChange={e => setFormData({...formData, graduacao: e.target.value})}>
                                    <option value="">Faixa...</option>
                                    {state.config.faixas.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              </div>
                           </div>
                        </div>

                        {/* More Fields (Contact, Guardian, BP) */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-bold text-gray-700 mb-3">Contato & Responsável</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Telefone Aluno" className="border p-2 rounded bg-gray-50" value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                                <input type="email" placeholder="E-mail" className="border p-2 rounded bg-gray-50" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                                <input type="text" placeholder="Nome Responsável" className="border p-2 rounded bg-gray-50" value={formData.responsavelNome || ''} onChange={e => setFormData({...formData, responsavelNome: e.target.value})} />
                                <input type="text" placeholder="Tel. Responsável" className="border p-2 rounded bg-gray-50" value={formData.responsavelTelefone || ''} onChange={e => setFormData({...formData, responsavelTelefone: e.target.value})} />
                            </div>
                            <input type="text" placeholder="Endereço Completo" className="w-full border p-2 rounded mt-4 bg-gray-50" value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} />
                        </div>
                        
                        <div className="bg-indigo-50 p-4 rounded border border-indigo-100">
                           <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-indigo-900 flex items-center gap-2"><BadgeCheck className="w-4 h-4"/> Bushido Pass</h4>
                              <button onClick={handleBushidoPassActivation} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50" disabled={loadingBP}>
                                 {loadingBP ? <Loader2 className="w-3 h-3 animate-spin"/> : 'ATIVAR'}
                              </button>
                           </div>
                           <input type="text" placeholder="Matrícula / BP ID" className="w-full border p-2 rounded bg-white" value={formData.matricula || ''} onChange={e => setFormData({...formData, matricula: e.target.value})} />
                        </div>
                     </div>
                   )}
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                   <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-gray-200 rounded">Cancelar</button>
                   <button onClick={handleSaveStudent} className="px-6 py-2 bg-bushido-red text-white rounded hover:bg-red-700">Salvar Aluno</button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
