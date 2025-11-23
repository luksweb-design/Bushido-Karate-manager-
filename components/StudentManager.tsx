
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

  // --- HTML REPORT GENERATION (BUSHIDO DIGITAL CARD) ---
  const generateStudentReport = (student: Student) => {
    const safeName = student.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Pega o último exame para exibir os dados "atuais"
    const lastExam = student.historicoExames && student.historicoExames.length > 0 
        ? student.historicoExames[student.historicoExames.length - 1] 
        : null;

    // Gera linhas do gráfico de histórico (CSS Charts)
    const historyChart = (student.historicoExames || []).map(exam => {
        const heightPercent = exam.nota ? (exam.nota * 10) : 0;
        return `
            <div class="chart-col">
                <div class="bar" style="height: ${heightPercent}%;">
                    <span class="bar-tooltip">${exam.nota?.toFixed(1) || '-'}</span>
                </div>
                <span class="label">${new Date(exam.data).toLocaleDateString('pt-BR').slice(0,5)}</span>
            </div>
        `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bushido Card - ${student.nome}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
          
          :root {
            --bushido-red: #D81111;
            --bushido-black: #111111;
            --bg-color: #f0f2f5;
            --card-bg: #ffffff;
          }

          body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-color);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            min-height: 100vh;
          }

          .digital-card {
            background: var(--card-bg);
            width: 100%;
            max-width: 420px;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            position: relative;
          }

          /* HERO HEADER */
          .hero {
            background: linear-gradient(135deg, #111 0%, #2a2a2a 100%);
            height: 160px;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .hero::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: var(--card-bg);
            border-radius: 24px 24px 0 0;
          }

          .dojo-name {
            color: rgba(255,255,255,0.2);
            font-weight: 800;
            font-size: 2rem;
            text-transform: uppercase;
            letter-spacing: 4px;
            position: absolute;
            top: 20px;
          }

          /* PROFILE IMAGE */
          .profile-wrapper {
            position: relative;
            margin-top: -80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 10;
          }

          .avatar-ring {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            background: linear-gradient(to bottom, var(--bushido-red), #ff4d4d);
            padding: 4px;
            box-shadow: 0 10px 20px rgba(216, 17, 17, 0.3);
          }

          .avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #eee;
            border: 4px solid white;
            object-fit: cover;
            display: block;
          }

          .rank-badge {
            background: var(--bushido-black);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: -16px;
            z-index: 11;
            border: 2px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          /* INFO SECTION */
          .info-section {
            text-align: center;
            padding: 10px 20px;
          }

          .student-name {
            font-size: 1.75rem;
            font-weight: 800;
            color: var(--bushido-black);
            margin: 10px 0 5px 0;
          }

          .congrats-text {
            color: var(--bushido-red);
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 20px;
          }

          /* STATS GRID (RPG STYLE) */
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            padding: 20px;
            background: #fafafa;
            border-radius: 16px;
            margin: 0 20px 20px 20px;
          }

          .stat-card {
            background: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .stat-card::before {
            content: '';
            position: absolute;
            left: 0; 
            top: 0;
            bottom: 0;
            width: 4px;
            background: var(--bushido-red);
          }

          .stat-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            color: #888;
            font-weight: 700;
            letter-spacing: 1px;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--bushido-black);
          }

          /* EVOLUTION CHART */
          .evolution-section {
            padding: 0 20px 20px 20px;
          }
          
          .section-title {
            font-size: 0.9rem;
            font-weight: 700;
            color: #444;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .chart-container {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            height: 100px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }

          .chart-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
          }

          .bar {
            width: 12px;
            background: linear-gradient(to top, #ddd, var(--bushido-red));
            border-radius: 6px 6px 0 0;
            position: relative;
            animation: grow 1s ease-out;
            min-height: 4px;
          }

          .bar-tooltip {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.7rem;
            font-weight: bold;
            color: var(--bushido-red);
          }

          .label {
            margin-top: 8px;
            font-size: 0.65rem;
            color: #999;
          }

          /* ACTIONS */
          .action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: var(--bushido-black);
            color: white;
            text-decoration: none;
            padding: 16px;
            margin: 20px;
            border-radius: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }

          .action-btn:active {
            transform: scale(0.98);
          }
          
          .action-icon {
            width: 20px;
            height: 20px;
          }

          .footer {
            text-align: center;
            font-size: 0.7rem;
            color: #aaa;
            padding-bottom: 20px;
          }

          @keyframes grow {
            from { height: 0; }
          }
        </style>
      </head>
      <body>
        <div class="digital-card">
          <div class="hero">
            <div class="dojo-name">BUSHIDO</div>
          </div>
          
          <div class="profile-wrapper">
            <div class="avatar-ring">
              ${student.fotoUrl 
                ? `<img src="${student.fotoUrl}" class="avatar" alt="${student.nome}" />` 
                : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-size:3rem;background:#fff;color:#ccc;">🥋</div>`
              }
            </div>
            <div class="rank-badge">${student.graduacao}</div>
          </div>

          <div class="info-section">
            <h1 class="student-name">${student.nome}</h1>
            <p class="congrats-text">🎉 Parabéns pela nova conquista!</p>
          </div>

          ${lastExam ? `
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Nota Média</div>
              <div class="stat-value" style="color: var(--bushido-red);">${lastExam.nota?.toFixed(1) || '-'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Graduação</div>
              <div class="stat-value" style="font-size:1rem;">${student.graduacao.split(' ')[0]}</div>
            </div>
            <div class="stat-card">
               <div class="stat-label">Data</div>
               <div class="stat-value" style="font-size:1rem;">${new Date(lastExam.data).toLocaleDateString('pt-BR').slice(0,5)}</div>
            </div>
            <div class="stat-card">
               <div class="stat-label">Local</div>
               <div class="stat-value" style="font-size:0.8rem;">${lastExam.local || 'Dojo'}</div>
            </div>
          </div>
          ` : ''}

          <div class="evolution-section">
            <div class="section-title">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
               Histórico de Evolução
            </div>
            <div class="chart-container">
               ${historyChart}
            </div>
          </div>

          <a href="../Certificados/Certificado_${safeName}.pdf" class="action-btn">
            <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar Certificado Digital
          </a>

          <div class="footer">
             Verificado por ${state.config.academia} • Bushido System
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BushidoCard_${safeName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                
                {/* ACTION BUTTONS */}
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
                    title="Gerar Bushido Card (HTML)"
                  >
                    <FileDown className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handlePromoteStudent(student)}
                    className="text-gray-300 hover:text-orange-500 p-2 rounded-full hover:bg-orange-50 transition-all transform hover:scale-110"
                    title="Promover Aluno Manualmente"
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
