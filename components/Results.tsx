import React, { useMemo, useState } from 'react';
import { DojoState, Evaluation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Printer, Package, Loader2, Play, RotateCcw, Download, CheckCircle, Save, Cloud } from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { finalizarExame, auth } from '../services/firebase';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onContinue: () => void;
  onFinish: () => void;
}

const Results: React.FC<Props> = ({ state, updateState, onContinue, onFinish }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // Helper para calcular idade
  const calculateAge = (dateString?: string) => {
    if (!dateString) return '';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age.toString();
  };

  // Calcula os resultados acumulados (Todos os grupos avaliados nesta sessão)
  const results = useMemo(() => {
    return (Object.values(state.evaluations) as Evaluation[]).map(evaluation => {
      const student = state.students.find(s => s.id === evaluation.studentId);
      return {
        student,
        ...evaluation
      };
    }).filter(r => r.student && r.media !== undefined);
  }, [state]);

  const approvedCount = results.filter(r => r.status && r.status.includes('Aprovado')).length;
  const passRate = results.length > 0 ? ((approvedCount / results.length) * 100).toFixed(0) : 0;

  const chartData = results.map(r => ({
    name: r.student?.nome.split(' ')[0],
    media: r.media
  }));

  // --- SALVAR PROGRESSO AUTOMÁTICO (LOCAL) ---
  const saveProgressToHistoryLocal = (): import("../types").Student[] => {
    return state.students.map(student => {
        const evaluation = state.evaluations[student.id];
        
        if (evaluation && evaluation.status && evaluation.status.includes('Aprovado')) {
            const existingHistory = student.historicoExames || [];
            const alreadySaved = existingHistory.some(h => 
                h.data === state.config.data && h.graduacao === student.graduacao
            );

            if (!alreadySaved) {
                const newHistoryItem = {
                    data: state.config.data,
                    graduacao: student.graduacao, 
                    local: state.config.local,
                    nota: evaluation.media
                };
                return {
                    ...student,
                    historicoExames: [...existingHistory, newHistoryItem]
                };
            }
        }
        return student;
    });
  };

  // --- FLUXO 1: AVALIAR PRÓXIMO GRUPO ---
  const handleNextGroup = () => {
    // 1. Salva histórico LOCAL
    const updatedStudents = saveProgressToHistoryLocal();
    
    // 2. Atualiza estado e limpa seleção visual (mantém evaluations para relatório cumulativo)
    updateState({
        ...state,
        students: updatedStudents,
        selectedStudentIds: [] 
    });
    
    // 3. Volta para seleção
    onContinue();
  };

  // --- FLUXO 2: FINALIZAR E SALVAR NO BANCO (NOVO EXAME) ---
  const handleFinishAndSave = async () => {
    if (!window.confirm("FINALIZAR E SALVAR?\n\nEsta ação irá:\n1. Salvar o registro oficial no banco de dados (se online).\n2. Atualizar a graduação dos alunos.\n3. Limpar a tela para um novo dia.")) {
        return;
    }
    
    setIsSavingCloud(true);

    try {
        // A. Salvar no Firebase (Se houver usuário logado)
        if (auth.currentUser) {
            // 1. Filtrar Aprovados
            const approved = results.filter(r => r.status.includes('Aprovado') && r.student);
            
            // 2. Agrupar por Faixa (Pois o batch do exame pede uma faixa alvo)
            const groupsByRank: Record<string, any[]> = {};
            
            approved.forEach(item => {
               const rank = item.student!.graduacao;
               if (!groupsByRank[rank]) groupsByRank[rank] = [];
               groupsByRank[rank].push(item.student);
            });

            // 3. Enviar lotes
            for (const [rank, students] of Object.entries(groupsByRank)) {
                await finalizarExame(
                    {
                        data: state.config.data,
                        local: state.config.local,
                        dojo_id: auth.currentUser.uid,
                        sensei_id: state.config.avaliador
                    },
                    rank, 
                    students
                );
            }
            
            if (approved.length > 0) {
                alert(`Sucesso! ${approved.length} alunos atualizados na nuvem.`);
            }
        } else {
            console.log("Modo Offline ou Desenvolvedor: Salvando apenas localmente.");
        }

        // B. Salvar Localmente e Resetar
        const updatedStudents = saveProgressToHistoryLocal();

        // Reseta data para hoje (local)
        const date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        const today = date.toISOString().split('T')[0];

        updateState({
            ...state,
            students: updatedStudents,
            evaluations: {},        // ZERA NOTAS
            selectedStudentIds: [], // ZERA SELEÇÃO
            config: {
                ...state.config,
                data: today,
                local: '',
                status: 'OPEN'
            }
        });
        
        onFinish(); // Volta para o Dashboard

    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Houve um erro ao salvar no banco de dados. Verifique sua conexão.");
    } finally {
        setIsSavingCloud(false);
    }
  };

  const handlePrint = () => window.print();

  // --- GERAÇÃO DO PACOTE ---
  const generateEventPackage = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const certFolder = zip.folder("Certificados");
      const reportFolder = zip.folder("Boletins");

      // 1. RELATÓRIO GERAL (PDF) - DESIGN PROFISSIONAL
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // --- CABEÇALHO ---
      // Fundo do Cabeçalho
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Logo (Se houver)
      if (state.dojoProfile.logoUrl) {
        try { 
            doc.addImage(state.dojoProfile.logoUrl, 'PNG', margin, 10, 25, 25); 
        } catch(e) {}
      }

      // Títulos
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      doc.text("RELATÓRIO GERAL DE AVALIAÇÃO", 50, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(state.config.academia.toUpperCase(), 50, 26);
      
      // Dados do Evento (Box Direita)
      doc.setFontSize(9);
      doc.text(`DATA: ${new Date(state.config.data).toLocaleDateString('pt-BR')}`, pageWidth - margin, 20, { align: 'right' });
      doc.text(`LOCAL: ${state.config.local}`, pageWidth - margin, 25, { align: 'right' });
      doc.text(`AVALIADOR: ${state.config.avaliador}`, pageWidth - margin, 30, { align: 'right' });

      // Linha divisória
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, 45, pageWidth - margin, 45);

      y = 55;

      // --- TABELA DE RESULTADOS ---
      // Configuração das Colunas
      const cols = [
          { header: "ALUNO", x: 15, w: 60 },
          { header: "IDADE", x: 75, w: 15 },
          { header: "GRADUAÇÃO", x: 90, w: 35 },
          { header: "KATA", x: 125, w: 12 },
          { header: "KIHON", x: 137, w: 12 },
          { header: "KUMI", x: 149, w: 12 },
          { header: "MÉDIA", x: 161, w: 15 },
          { header: "RESULTADO", x: 176, w: 25 }
      ];

      // Função para desenhar cabeçalho da tabela
      const drawTableHeader = (yPos: number) => {
          doc.setFillColor(220, 20, 20); // Bushido Red
          doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);

          cols.forEach(col => {
              doc.text(col.header, col.x + (col.header === "ALUNO" || col.header === "GRADUAÇÃO" ? 2 : (col.w/2)), yPos + 5.5, { 
                  align: (col.header === "ALUNO" || col.header === "GRADUAÇÃO") ? 'left' : 'center' 
              });
          });
      };

      drawTableHeader(y);
      y += 8;

      // Desenhar Linhas
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      results.forEach((r, index) => {
          if (y > pageHeight - 30) { 
              doc.addPage();
              y = 20;
              drawTableHeader(y);
              y += 8;
              doc.setTextColor(0, 0, 0);
              doc.setFont("helvetica", "normal");
          }

          // Zebra Striping
          if (index % 2 === 0) {
              doc.setFillColor(248, 248, 248);
              doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
          }

          const age = calculateAge(r.student?.nascimento);
          const isApproved = r.status.includes('Aprovado');

          // Dados
          doc.setFontSize(8);
          doc.text(r.student!.nome.substring(0, 28), cols[0].x + 2, y + 5.5); // Nome
          doc.text(age, cols[1].x + (cols[1].w/2), y + 5.5, { align: 'center' }); // Idade
          doc.text(r.student!.graduacao, cols[2].x + 2, y + 5.5); // Graduação
          
          // Notas
          doc.text(r.kata.toFixed(1), cols[3].x + (cols[3].w/2), y + 5.5, { align: 'center' });
          doc.text(r.kihon.toFixed(1), cols[4].x + (cols[4].w/2), y + 5.5, { align: 'center' });
          doc.text(r.kumite.toFixed(1), cols[5].x + (cols[5].w/2), y + 5.5, { align: 'center' });
          
          // Média (Bold)
          doc.setFont("helvetica", "bold");
          doc.text(r.media.toFixed(1), cols[6].x + (cols[6].w/2), y + 5.5, { align: 'center' });
          
          // Status (Colorido)
          doc.setTextColor(isApproved ? 0 : 200, isApproved ? 100 : 0, 0);
          let statusText = "APROVADO";
          if (r.status.includes('Reprovado')) statusText = "REPROVADO";
          else if (r.status.includes('Reforço')) statusText = "APROV (REF)";
          
          doc.text(statusText, cols[7].x + (cols[7].w/2), y + 5.5, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");

          // Linha inferior da célula
          doc.setDrawColor(230, 230, 230);
          doc.line(margin, y + 8, pageWidth - margin, y + 8);

          y += 8;
      });

      // --- RODAPÉ E ASSINATURAS ---
      // Calcula posição para não quebrar assinatura
      if (y + 30 > pageHeight - 20) {
          doc.addPage();
          y = 20;
      } else {
          y += 20;
      }
      
      // Estatísticas Rápidas
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total de Alunos: ${results.length} | Aprovados: ${approvedCount} (${passRate}%)`, margin, y);

      // Linha de Assinatura
      const sigY = y + 5;
      doc.setDrawColor(0, 0, 0);
      doc.line(pageWidth / 2 - 40, sigY, pageWidth / 2 + 40, sigY);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(state.config.avaliador, pageWidth / 2, sigY + 5, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("Examinador Responsável", pageWidth / 2, sigY + 9, { align: 'center' });

      zip.file(`Relatorio_Geral_${state.config.data}.pdf`, doc.output('blob'));

      // 2. Certificados e Boletins (MANTIDOS IGUAIS AO ANTERIOR)
      for (const r of results) {
        if (!r.student) continue;
        const safeName = r.student.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        if (r.status.includes('Aprovado')) {
          const docCert = new jsPDF({ orientation: 'landscape', format: 'a4' });
          const width = docCert.internal.pageSize.getWidth();
          const height = docCert.internal.pageSize.getHeight();

          if (state.config.certificateConfig?.bgUrl) {
             try { docCert.addImage(state.config.certificateConfig.bgUrl, 'JPEG', 0, 0, width, height); } catch (e) {}
          } else {
            docCert.setLineWidth(3);
            docCert.rect(10, 10, width - 20, height - 20);
          }
          if (state.dojoProfile.logoUrl) {
            try { docCert.addImage(state.dojoProfile.logoUrl, 'PNG', width / 2 - 15, 30, 30, 30); } catch(e) {}
          }
          
          docCert.setFont("helvetica", "bold");
          docCert.setFontSize(40);
          docCert.text("CERTIFICADO", width / 2, 80, { align: 'center' });
          
          docCert.setFontSize(16);
          docCert.setFont("helvetica", "normal");
          docCert.text("Certificamos que", width / 2, 100, { align: 'center' });
          
          docCert.setFont("times", "bolditalic");
          docCert.setFontSize(32);
          docCert.text(r.student.nome, width / 2, 120, { align: 'center' });
          
          docCert.setFont("helvetica", "normal");
          docCert.setFontSize(14);
          const customBodyText = state.config.certificateConfig?.customText || "cumpriu os requisitos técnicos exigidos e foi promovido(a) para:";
          docCert.text(customBodyText, width / 2, 135, { align: 'center' });
          
          docCert.setFont("helvetica", "bold");
          docCert.setFontSize(28);
          docCert.setTextColor(216, 17, 17);
          docCert.text(r.student.graduacao.toUpperCase(), width / 2, 155, { align: 'center' });
          
          docCert.setTextColor(0, 0, 0);
          docCert.setFont("helvetica", "normal");
          docCert.setFontSize(12);
          docCert.text(`${state.config.local}, ${new Date(state.config.data).toLocaleDateString('pt-BR')}`, width / 2, 175, { align: 'center' });
          
          certFolder?.file(`Certificado_${safeName}.pdf`, docCert.output('blob'));
        }

        // HTML REPORT (BUSHIDO DIGITAL CARD)
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <title>Boletim - ${r.student.nome}</title>
            <style>
               @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
               body { font-family: 'Outfit', sans-serif; background: #f4f4f4; padding: 20px; color: #333; display:flex; justify-content:center; }
               .card { background: white; width:100%; max-width:400px; border-radius:24px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.1); }
               .header { background:#111; height:120px; position:relative; }
               .avatar { width:100px; height:100px; background:#eee; border-radius:50%; border:4px solid white; margin:-50px auto 10px auto; position:relative; z-index:10; display:block; object-fit:cover; }
               .content { text-align:center; padding:20px; }
               .name { font-size:24px; font-weight:800; margin:0; }
               .rank { color:#D81111; font-weight:bold; text-transform:uppercase; margin-bottom:20px; display:block; }
               .grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
               .box { background:#f8f8f8; padding:10px; border-radius:12px; }
               .lbl { font-size:10px; text-transform:uppercase; color:#888; font-weight:bold; }
               .val { font-size:20px; font-weight:800; }
               .btn { display:block; background:#111; color:white; text-decoration:none; padding:15px; border-radius:12px; font-weight:bold; margin-top:20px; }
            </style>
          </head>
          <body>
             <div class="card">
                <div class="header"></div>
                ${r.student.fotoUrl ? `<img src="${r.student.fotoUrl}" class="avatar">` : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-size:40px">🥋</div>`}
                <div class="content">
                   <h1 class="name">${r.student.nome}</h1>
                   <span class="rank">${r.student.graduacao}</span>
                   
                   <div class="grid">
                      <div class="box"><div class="lbl">Média</div><div class="val" style="color:#D81111">${r.media.toFixed(1)}</div></div>
                      <div class="box"><div class="lbl">Resultado</div><div class="val" style="font-size:14px">${r.status.split(' ')[0]}</div></div>
                   </div>
                   
                   <div class="box" style="text-align:left; padding:15px;">
                      <div class="lbl">Notas Parciais</div>
                      <div style="display:flex; justify-content:space-between; margin-top:5px; font-weight:600; font-size:14px;">
                         <span>K: ${r.kata}</span> <span>Ki: ${r.kihon}</span> <span>Ku: ${r.kumite}</span>
                      </div>
                   </div>

                   ${r.status.includes('Aprovado') ? `<a href="../Certificados/Certificado_${safeName}.pdf" class="btn">Baixar Certificado</a>` : ''}
                </div>
             </div>
          </body>
          </html>`; 
        reportFolder?.file(`Boletim_${safeName}.html`, htmlContent);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Pacote_Exame_${state.config.data}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error(error);
      alert("Erro ao gerar o pacote. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-40">
      
      {/* --- CABEÇALHO COM AÇÃO PRINCIPAL --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 font-jp flex items-center gap-2">
             <CheckCircle className="text-green-600" /> Resultados Parciais
          </h2>
          <p className="text-gray-500 mt-1">
            {results.length} alunos já avaliados nesta sessão.
          </p>
        </div>

        {/* BOTÃO HERO: BAIXAR PACOTE */}
        <button 
            onClick={generateEventPackage} 
            disabled={results.length === 0 || isGenerating}
            className={`group relative overflow-hidden px-8 py-4 rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 ${
                results.length === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-bushido-black text-white hover:bg-gray-900'
            }`}
        >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Package className="w-6 h-6" />}
            <div className="text-left">
              <span className="block text-xs font-normal opacity-80 uppercase tracking-wider">Entrega de Valor</span>
              <span className="block text-lg font-bold">BAIXAR PACOTE COMPLETO</span>
            </div>
        </button>
      </div>

      {/* LISTA DE AVALIADOS */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8 border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
           <h3 className="text-sm font-bold text-gray-500 uppercase">Alunos Avaliados Hoje</h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {results.map((r) => (
            <li key={r.studentId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border ${r.media >= 6 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {r.media.toFixed(1)}
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-gray-900">{r.student?.nome}</h4>
                        <p className="text-xs text-gray-500">{r.student?.graduacao} • {r.student?.matricula}</p>
                    </div>
                 </div>
                 <div className="flex flex-col items-end">
                   <span className={`px-3 py-1 text-xs font-bold rounded-full ${r.status.includes('Aprovado') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {r.status}
                   </span>
                   <span className="text-[10px] text-gray-400 mt-1">
                     K:{r.kata} Ki:{r.kihon} Ku:{r.kumite}
                   </span>
                 </div>
              </div>
            </li>
          ))}
          {results.length === 0 && (
             <li className="px-6 py-12 text-center text-gray-400">
                Nenhum resultado registrado ainda.
             </li>
          )}
        </ul>
      </div>
      
      {/* RODAPÉ DE AÇÃO */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 no-print">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* NOVO EXAME */}
            <div className="w-full md:w-auto order-2 md:order-1">
               <button 
                   onClick={handleFinishAndSave}
                   disabled={isSavingCloud}
                   className="w-full bg-white border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
               >
                   {isSavingCloud ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
                   {isSavingCloud ? "Salvando..." : "Finalizar Dia & Salvar"}
               </button>
            </div>

            {/* PRÓXIMO GRUPO */}
            <div className="w-full md:w-auto order-1 md:order-2">
                <button 
                    onClick={handleNextGroup}
                    disabled={isSavingCloud}
                    className="w-full bg-bushido-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Play className="w-5 h-5" />
                    Avaliar Próximo Grupo
                </button>
                <p className="text-xs text-gray-400 text-center mt-1">Salva histórico automaticamente</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Results;