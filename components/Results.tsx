
import React, { useMemo, useState } from 'react';
import { DojoState, Evaluation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Printer, Package, Loader2, Play, RotateCcw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onContinue: () => void;
  onFinish: () => void;
}

const Results: React.FC<Props> = ({ state, updateState, onContinue, onFinish }) => {
  const [isGenerating, setIsGenerating] = useState(false);

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

  // --- FUNÇÃO CORE: SALVAR PROGRESSO ---
  // Essa função é chamada automaticamente ao avançar grupos ou finalizar
  // Ela retorna a lista de alunos atualizada com o novo histórico
  const saveProgressToHistory = () => {
    return state.students.map(student => {
        const evaluation = state.evaluations[student.id];
        
        // Se o aluno tem avaliação e foi aprovado
        if (evaluation && evaluation.status && evaluation.status.includes('Aprovado')) {
            
            // Verifica se já salvamos esse histórico hoje (evita duplicidade)
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
                // Retorna aluno com histórico atualizado
                return {
                    ...student,
                    historicoExames: [...existingHistory, newHistoryItem]
                };
            }
        }
        return student;
    });
  };

  // AÇÃO 1: AVALIAR PRÓXIMO GRUPO
  // Salva o histórico, limpa a seleção, mas MANTÉM as avaliações para o pacote final acumulado
  const handleNextGroup = () => {
    const updatedStudents = saveProgressToHistory();
    
    updateState({
        ...state,
        students: updatedStudents, // Persiste o histórico no banco
        selectedStudentIds: []     // Limpa seleção para escolher novos alunos
    });
    
    onContinue(); // Volta para tela de seleção
  };

  // AÇÃO 2: NOVO EXAME (RESET TOTAL)
  // Finaliza o dia, garante o salvamento e reseta tudo para um novo evento
  const handleNewExam = () => {
    if (!window.confirm("INICIAR NOVO EXAME?\n\nCertifique-se de ter baixado o pacote do evento atual.\nIsso limpará todas as notas e preparará o sistema para um novo dia.")) {
        return;
    }
    
    // Garante que salvamos o último grupo antes de resetar
    const updatedStudents = saveProgressToHistory();

    // Data Local (Hoje) para o próximo exame
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const today = date.toISOString().split('T')[0];

    updateState({
        ...state,
        students: updatedStudents,
        evaluations: {},        // Limpa notas (Zera o evento)
        selectedStudentIds: [], // Limpa seleção
        config: {
            ...state.config,
            data: today,   // Reseta data para hoje
            local: '',     // Limpa local para forçar nova entrada
            status: 'OPEN'
        }
    });
    
    onFinish(); // Volta para o Dashboard
  };

  const handlePrint = () => window.print();

  // --- GERAÇÃO DE DOCUMENTOS ---
  const generateEventPackage = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const certFolder = zip.folder("Certificados");
      const reportFolder = zip.folder("Boletins");

      // 1. Relatório Geral (PDF)
      const docGeral = new jsPDF();
      if (state.dojoProfile.logoUrl) {
        try { docGeral.addImage(state.dojoProfile.logoUrl, 'PNG', 170, 10, 20, 20); } catch(e){}
      }
      docGeral.setFontSize(18);
      docGeral.setFont("helvetica", "bold");
      docGeral.text("Relatório de Exame de Graduação", 20, 20);
      docGeral.setFontSize(12);
      docGeral.setFont("helvetica", "normal");
      docGeral.text(`Academia: ${state.config.academia}`, 20, 30);
      docGeral.text(`Data: ${new Date(state.config.data).toLocaleDateString('pt-BR')} | Local: ${state.config.local}`, 20, 36);
      docGeral.text(`Avaliador: ${state.config.avaliador}`, 20, 42);
      
      let y = 60;
      docGeral.setFontSize(10);
      docGeral.setFillColor(240, 240, 240);
      docGeral.rect(20, 50, 170, 8, 'F');
      docGeral.setFont("helvetica", "bold");
      docGeral.text("Aluno", 22, 55);
      docGeral.text("Graduação", 80, 55);
      docGeral.text("Média", 140, 55);
      docGeral.text("Status", 160, 55);
      docGeral.setFont("helvetica", "normal");

      results.forEach((r) => {
          if (y > 280) { docGeral.addPage(); y = 20; }
          docGeral.text(r.student!.nome, 22, y);
          docGeral.text(r.student!.graduacao, 80, y);
          docGeral.text(r.media.toFixed(1), 140, y);
          docGeral.text(r.status, 160, y);
          docGeral.line(20, y+2, 190, y+2);
          y += 10;
      });
      zip.file("Relatorio_Geral_Evento.pdf", docGeral.output('blob'));

      // 2. Certificados e Boletins
      for (const r of results) {
        if (!r.student) continue;
        const safeName = r.student.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        // A. Certificado
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

        // B. Boletim (HTML)
        const htmlContent = `<html><body><h1>${r.student.nome}</h1><h2>${r.status}</h2><p>Média: ${r.media.toFixed(1)}</p></body></html>`; 
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
      alert("Erro ao gerar arquivos.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 print:p-0 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 no-print gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-jp">Resultados (Acumulado)</h2>
          <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-500 text-sm">
                {results.length} alunos avaliados • {passRate}% aprovação
              </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap justify-end">
           <button 
            onClick={handlePrint} 
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Imprimir</span>
          </button>
          
          {/* BOTÃO BAIXAR PACOTE (Sempre Liberado se houver resultados) */}
          <button 
              onClick={generateEventPackage} 
              disabled={results.length === 0 || isGenerating}
              className={`px-4 py-2 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                  results.length === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-bushido-black text-white hover:bg-gray-800'
              }`}
          >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              {isGenerating ? 'Gerando...' : `Baixar Pacote (${results.length})`}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8 no-print hidden md:block">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Desempenho Geral</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis domain={[0, 10]} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="media" fill="#D81111" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <ul className="divide-y divide-gray-200">
          {results.map((r) => (
            <li key={r.studentId} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-bushido-red font-bold border border-gray-300">
                        {r.media.toFixed(1)}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">{r.student?.nome}</h4>
                        <p className="text-xs text-gray-500">{r.student?.graduacao}</p>
                    </div>
                 </div>
                 <span className={`px-2 py-1 text-xs font-bold rounded-full ${r.status.includes('Aprovado') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {r.status}
                 </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* RODAPÉ DE AÇÃO */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 no-print">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* BOTÃO ESQUERDO: NOVO EXAME (Reset Completo) */}
            <div className="w-full md:w-auto order-2 md:order-1">
               <button 
                   onClick={handleNewExam}
                   className="w-full bg-white border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-200 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
               >
                   <RotateCcw className="w-5 h-5" />
                   Iniciar Novo Exame
               </button>
            </div>

            {/* BOTÃO DIREITO: PRÓXIMO GRUPO (Salva e Continua Loop) */}
            <div className="w-full md:w-auto order-1 md:order-2">
                <button 
                    onClick={handleNextGroup}
                    className="w-full bg-bushido-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
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
