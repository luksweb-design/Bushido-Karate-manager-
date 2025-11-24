import React, { useMemo, useState } from 'react';
import { DojoState, Evaluation, Student, ExamHistoryItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Printer, Package, Loader2, Play, RotateCcw, Download, CheckCircle, Save, Cloud, Shield, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { finalizarExame, auth } from '../services/firebase';

interface Props {
  state: DojoState;
  updateState: (s: DojoState) => void;
  onContinue: () => void;
  onFinish: () => void;
}

// --- HELPER: BRAZILIAN DATE FORMATTER ---
const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  // Handle YYYY-MM-DD (ISO)
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
  }
  return dateStr; // Return original if parse fails or already formatted
};

// --- HELPER: GET NEXT RANK ---
const getNextRank = (currentRank: string, rankList: string[]) => {
    if (!currentRank) return rankList[0] || 'Branca';
    const normalize = (s: string) => s.trim().toLowerCase();
    const idx = rankList.findIndex(r => normalize(r) === normalize(currentRank));
    
    // If found and not the last one, return next. Otherwise return current.
    if (idx !== -1 && idx < rankList.length - 1) {
        return rankList[idx + 1];
    }
    return currentRank; 
};

// --- GENERAL REPORT PDF GENERATOR (Spreadsheet Style) ---
const generateGeneralReportPDF = (
  results: { student: Student | undefined; media: number; status: string; kata: number; kihon: number; kumite: number; teorico: number }[],
  config: DojoState['config'],
  dojoProfile: DojoState['dojoProfile']
): Blob => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const formattedDate = formatDateBR(config.data);

    // Header
    doc.setFillColor(220, 38, 38); // Bushido Red
    doc.rect(0, 0, 297, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("RELATÓRIO GERAL DE EXAME", 10, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${dojoProfile.nome.toUpperCase()}  |  DATA: ${formattedDate}  |  LOCAL: ${config.local.toUpperCase()}`, 10, 22);

    // Table Config
    let y = 35;
    const startX = 10;
    const rowHeight = 8;
    const pageHeight = 210;
    
    // Columns config (width in mm)
    // Total A4 Landscape width = 297mm. Margins 10mm L/R = 277mm usable.
    const cols = [
        { header: "ALUNO", width: 70 },
        { header: "MATRÍCULA", width: 30 },
        { header: "GRADUAÇÃO ATUAL", width: 45 },
        { header: "KATA", width: 15 },
        { header: "KIHON", width: 15 },
        { header: "KUMITE", width: 15 },
        { header: "MÉDIA", width: 20 },
        { header: "RESULTADO", width: 67 }
    ];

    // Helper to draw Header
    const drawHeader = (currentY: number) => {
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, currentY - 5, 277, 8, 'F');
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        
        let currentX = startX;
        cols.forEach(col => {
            doc.text(col.header, currentX + 2, currentY);
            currentX += col.width;
        });
        
        // Header Border
        doc.setDrawColor(200, 200, 200);
        doc.line(startX, currentY + 3, startX + 277, currentY + 3);
    };

    drawHeader(y);
    y += 5;

    // Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    results.forEach((r, index) => {
        // Check Page Break
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
            drawHeader(y);
            y += 5;
        }

        const studentName = r.student?.nome || 'N/A';
        const matricula = r.student?.matricula || '-';
        const rank = r.student?.graduacao || '-';
        const status = r.status;
        
        let currentX = startX;

        // Draw Row Background for alternates
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(startX, y - 5, 277, rowHeight, 'F');
        }

        // 1. Aluno
        doc.text(studentName.length > 35 ? studentName.substring(0,35)+"..." : studentName, currentX + 2, y);
        currentX += cols[0].width;

        // 2. Matricula
        doc.text(matricula, currentX + 2, y);
        currentX += cols[1].width;

        // 3. Graduacao
        doc.text(rank, currentX + 2, y);
        currentX += cols[2].width;

        // 4. Scores (Centered)
        doc.text(r.kata.toString(), currentX + 5, y);
        currentX += cols[3].width;
        doc.text(r.kihon.toString(), currentX + 5, y);
        currentX += cols[4].width;
        doc.text(r.kumite.toString(), currentX + 5, y);
        currentX += cols[5].width;

        // 5. Media
        doc.setFont("helvetica", "bold");
        doc.text(r.media.toFixed(1), currentX + 5, y);
        doc.setFont("helvetica", "normal");
        currentX += cols[6].width;

        // 6. Status
        if (status.includes('Aprovado')) doc.setTextColor(0, 150, 0);
        else doc.setTextColor(220, 0, 0);
        doc.text(status, currentX + 2, y);
        doc.setTextColor(0, 0, 0);

        // Grid lines
        doc.setDrawColor(230, 230, 230);
        doc.line(startX, y + 3, startX + 277, y + 3); // Bottom line
        
        y += rowHeight;
    });

    // Footer Stats
    const approvedCount = results.filter(r => r.status.includes('Aprovado')).length;
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`TOTAL DE AVALIADOS: ${results.length}   |   APROVADOS: ${approvedCount}   |   TAXA: ${Math.round((approvedCount/results.length)*100)}%`, startX, y);

    // Signature Area
    const sigY = pageHeight - 30;
    if (y < sigY) {
         doc.setDrawColor(0, 0, 0);
         doc.line(50, sigY, 120, sigY);
         doc.line(170, sigY, 240, sigY);
         doc.setFontSize(8);
         doc.text(config.avaliador.toUpperCase(), 85, sigY + 5, { align: 'center' });
         doc.text("EXAMINADOR", 85, sigY + 9, { align: 'center' });
         
         doc.text(dojoProfile.nome.toUpperCase(), 205, sigY + 5, { align: 'center' });
         doc.text("DIREÇÃO TÉCNICA", 205, sigY + 9, { align: 'center' });
    }

    return doc.output('blob');
};

// --- GENERAL REPORT GENERATOR (HTML) ---
export const generateGeneralReportHtml = (
  results: { student: Student | undefined; media: number; status: string; kata: number; kihon: number; kumite: number; teorico: number }[],
  config: DojoState['config'],
  dojoProfile: DojoState['dojoProfile']
) => {
    const approvedCount = results.filter(r => r.status.includes('Aprovado')).length;
    const totalCount = results.length;
    const passRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
    const formattedDate = formatDateBR(config.data);
    
    const rows = results.map((r, idx) => `
        <tr class="border-b border-zinc-800 hover:bg-white/5 transition-colors">
            <td class="p-4 text-sm font-bold text-white text-left uppercase">${idx + 1}. ${r.student?.nome || 'N/A'}</td>
            <td class="p-4 text-xs text-gray-400 text-center uppercase">${r.student?.matricula || '-'}</td>
            <td class="p-4 text-xs font-bold text-gray-300 text-center uppercase">${r.student?.graduacao || '-'}</td>
            <td class="p-4 text-center font-mono text-zinc-500 text-xs">${r.kata}</td>
            <td class="p-4 text-center font-mono text-zinc-500 text-xs">${r.kihon}</td>
            <td class="p-4 text-center font-mono text-zinc-500 text-xs">${r.kumite}</td>
            <td class="p-4 text-center font-bold text-white text-sm">${r.media.toFixed(1)}</td>
            <td class="p-4 text-center">
                <span class="px-2 py-1 text-[10px] font-bold uppercase border ${r.status.includes('Aprovado') ? 'bg-green-900/20 border-green-800 text-green-500' : 'bg-red-900/20 border-red-800 text-red-500'}">
                    ${r.status}
                </span>
            </td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
    <meta charset="UTF-8">
    <title>Relatório Geral - ${formattedDate}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Oswald:wght@400;500;700&display=swap" rel="stylesheet">
    <script>
      tailwind.config = { theme: { extend: { fontFamily: { display: ['Oswald', 'sans-serif'], sans: ['Inter', 'sans-serif'] } } } }
    </script>
    <style>body { background-color: #050505; color: #e5e5e5; }</style>
</head>
<body class="p-8 max-w-[210mm] mx-auto bg-zinc-950 min-h-screen">
    <div class="border-b-4 border-red-600 pb-6 mb-8 flex justify-between items-end">
        <div>
            <h1 class="text-4xl font-display font-bold text-white uppercase tracking-wider">Relatório Geral</h1>
            <p class="text-red-500 text-sm font-bold uppercase tracking-[0.3em] mt-1">Exame de Graduação</p>
        </div>
        <div class="text-right">
            <h2 class="text-xl font-bold text-white uppercase">${dojoProfile.nome}</h2>
            <p class="text-xs text-gray-500 uppercase tracking-widest">${config.local} • ${formattedDate}</p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-4 mb-8">
        <div class="bg-zinc-900 p-4 border border-zinc-800">
            <div class="text-[10px] text-gray-500 uppercase tracking-widest">Total Avaliados</div>
            <div class="text-2xl font-display font-bold text-white">${totalCount}</div>
        </div>
        <div class="bg-zinc-900 p-4 border border-zinc-800">
            <div class="text-[10px] text-gray-500 uppercase tracking-widest">Aprovados</div>
            <div class="text-2xl font-display font-bold text-green-500">${approvedCount}</div>
        </div>
        <div class="bg-zinc-900 p-4 border border-zinc-800">
            <div class="text-[10px] text-gray-500 uppercase tracking-widest">Taxa de Apr.</div>
            <div class="text-2xl font-display font-bold text-white">${passRate}%</div>
        </div>
        <div class="bg-zinc-900 p-4 border border-zinc-800">
            <div class="text-[10px] text-gray-500 uppercase tracking-widest">Avaliador</div>
            <div class="text-lg font-display font-bold text-white truncate">${config.avaliador}</div>
        </div>
    </div>

    <!-- Table -->
    <div class="bg-zinc-900 border border-zinc-800 overflow-hidden mb-12">
        <table class="w-full">
            <thead class="bg-zinc-950 border-b border-zinc-800">
                <tr>
                    <th class="p-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Atleta</th>
                    <th class="p-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Matrícula</th>
                    <th class="p-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Faixa Atual</th>
                    <th class="p-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kata</th>
                    <th class="p-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kihon</th>
                    <th class="p-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kumite</th>
                    <th class="p-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Média</th>
                    <th class="p-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Resultado</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
                ${rows}
            </tbody>
        </table>
    </div>

    <!-- Signatures -->
    <div class="grid grid-cols-2 gap-20 mt-20 page-break-inside-avoid">
        <div class="text-center">
            <div class="border-t border-gray-600 w-full mb-2"></div>
            <p class="text-xs font-bold text-white uppercase tracking-wider">${config.avaliador}</p>
            <p class="text-[10px] text-gray-500 uppercase tracking-widest">Examinador Responsável</p>
        </div>
        <div class="text-center">
            <div class="border-t border-gray-600 w-full mb-2"></div>
            <p class="text-xs font-bold text-white uppercase tracking-wider">${dojoProfile.nome}</p>
            <p class="text-[10px] text-gray-500 uppercase tracking-widest">Direção Técnica</p>
        </div>
    </div>
    
    <div class="mt-12 text-center">
        <p class="text-[9px] text-zinc-700 font-mono">Gerado via Bushido Graduation Manager em ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>
</body>
</html>
    `;
};

// --- RID GENERATOR FUNCTION (Exported for reuse) ---
export const generateRIDHtml = (
  student: Student, 
  evaluation: Evaluation | undefined, 
  history: ExamHistoryItem[], 
  dojoName: string,
  examDate: string
) => {
  const safeName = student.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const formattedDate = formatDateBR(examDate);
  
  // Prepare History Data for Chart
  const allHistory = [...history];
  if (evaluation && evaluation.status.includes('Aprovado')) {
     allHistory.push({
         data: examDate,
         graduacao: student.graduacao, 
         nota: evaluation.media
     });
  }
  
  const recentHistory = allHistory.slice(-5);
  const chartBars = recentHistory.map(h => {
      const height = h.nota ? (h.nota * 10) : 0; 
      const color = (h.nota || 0) >= 7 ? '#22c55e' : (h.nota || 0) >= 6 ? '#eab308' : '#ef4444';
      return `
        <div class="flex flex-col items-center justify-end h-32 w-full gap-2 group">
            <div class="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">${h.nota?.toFixed(1)}</div>
            <div style="height: ${height}%; background-color: ${color}" class="w-full max-w-[20px] rounded-t-sm shadow-[0_0_10px_${color}40] transition-all hover:brightness-110"></div>
            <div class="text-[9px] font-bold text-gray-500 uppercase rotate-[-45deg] origin-top-left mt-2 whitespace-nowrap">${h.graduacao.split(' ')[0]}</div>
        </div>
      `;
  }).join('');

  const photoHtml = student.fotoUrl 
    ? `<img src="${student.fotoUrl}" class="w-24 h-24 object-cover rounded-full border-2 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]">`
    : `<div class="w-24 h-24 bg-zinc-800 rounded-full border-2 border-zinc-700 flex items-center justify-center text-zinc-500"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

  const scoresHtml = evaluation ? `
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-zinc-900/50 p-3 border-l-2 border-red-600">
            <div class="text-[10px] text-zinc-500 uppercase tracking-widest">Kata</div>
            <div class="text-2xl font-bold text-white font-display">${evaluation.kata}</div>
        </div>
        <div class="bg-zinc-900/50 p-3 border-l-2 border-red-600">
            <div class="text-[10px] text-zinc-500 uppercase tracking-widest">Kihon</div>
            <div class="text-2xl font-bold text-white font-display">${evaluation.kihon}</div>
        </div>
        <div class="bg-zinc-900/50 p-3 border-l-2 border-red-600">
            <div class="text-[10px] text-zinc-500 uppercase tracking-widest">Kumite</div>
            <div class="text-2xl font-bold text-white font-display">${evaluation.kumite}</div>
        </div>
        <div class="bg-zinc-900/50 p-3 border-l-2 border-red-600">
            <div class="text-[10px] text-zinc-500 uppercase tracking-widest">Teórico</div>
            <div class="text-2xl font-bold text-white font-display">${evaluation.teorico}</div>
        </div>
      </div>
      <div class="flex items-center justify-between bg-zinc-800/50 p-4 border border-zinc-700 mb-8">
         <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Média Final</span>
         <span class="text-4xl font-bold text-red-500 font-display">${evaluation.media.toFixed(1)}</span>
      </div>
  ` : `
     <div class="p-6 text-center border border-zinc-800 rounded bg-zinc-900/50 mb-8">
        <p class="text-zinc-500 text-xs uppercase tracking-widest">Detalhes técnicos arquivados.</p>
        <p class="text-zinc-300 font-bold mt-2">Nota Registrada: ${recentHistory[recentHistory.length-1]?.nota || 'N/A'}</p>
     </div>
  `;

  return `
<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RID - ${student.nome}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Oswald:wght@400;500;700&display=swap" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: { display: ['Oswald', 'sans-serif'], sans: ['Inter', 'sans-serif'] },
            colors: { 'bushido-red': '#DC2626' }
          }
        }
      }
    </script>
    <style>
       body { background-color: #050505; color: #e5e5e5; }
       .btn-blade { transform: skewX(-10deg); transition: all 0.2s; }
       .btn-blade > * { transform: skewX(10deg); }
       .btn-blade:hover { transform: skewX(-10deg) translateY(-2px); box-shadow: 0 0 15px rgba(220, 38, 38, 0.4); }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMDUwNTA1Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiPjwvcmVjdD4KPC9zdmc+')]">

    <div class="max-w-md w-full bg-[#121212] border border-zinc-800 shadow-2xl overflow-hidden relative">
        <div class="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
        
        <!-- Header -->
        <div class="p-6 text-center border-b border-zinc-800 relative overflow-hidden">
             <div class="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl"></div>
             <h1 class="font-display font-bold text-2xl text-white tracking-widest uppercase">Relatório de Desempenho</h1>
             <p class="text-[10px] text-red-500 font-bold uppercase tracking-[0.3em] mt-1">${dojoName} • ${formattedDate}</p>
        </div>

        <!-- Student Profile -->
        <div class="p-6 flex flex-col items-center">
            ${photoHtml}
            <h2 class="mt-4 text-xl font-display font-bold text-white uppercase tracking-wide text-center">${student.nome}</h2>
            <div class="mt-2 px-3 py-1 bg-zinc-900 border border-zinc-700 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                ${student.graduacao}
            </div>
            <div class="mt-1 text-[10px] text-zinc-600 font-mono tracking-widest">${student.matricula}</div>
        </div>

        <!-- Scores -->
        <div class="px-6">
            ${scoresHtml}
        </div>

        <!-- Evolution Chart -->
        <div class="px-6 pb-6">
            <h3 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                Evolução Técnica
            </h3>
            <div class="h-40 bg-zinc-900/30 border border-zinc-800/50 rounded p-4 flex items-end justify-between gap-2">
                ${chartBars}
            </div>
        </div>

        <!-- Actions -->
        <div class="bg-[#0a0a0a] p-6 border-t border-zinc-800 flex flex-col gap-3">
            <a href="./Certificado_${safeName}.pdf" download class="btn-blade bg-red-600 text-white py-3 flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider text-sm shadow-lg no-underline text-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                <span>Baixar Certificado</span>
            </a>
            <button onclick="shareReport()" class="btn-blade bg-zinc-800 text-zinc-400 hover:text-white py-3 flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider text-sm border border-zinc-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                <span>Compartilhar Resultado</span>
            </button>
        </div>
    </div>

    <script>
        function shareReport() {
            if (navigator.share) {
                navigator.share({
                    title: 'Resultado de Exame - Bushido Manager',
                    text: 'Confira meu desempenho no exame de graduação!',
                    url: window.location.href
                }).catch(console.error);
            } else {
                alert('Compartilhamento não suportado neste navegador.');
            }
        }
    </script>
</body>
</html>
  `;
};

const Results: React.FC<Props> = ({ state, updateState, onContinue, onFinish }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // ... (calculateAge, results, approvedCount, passRate logic remains same)
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

  const results = useMemo(() => {
    return (Object.values(state.evaluations) as Evaluation[]).map(evaluation => {
      const student = state.students.find(s => s.id === evaluation.studentId);
      return { student, ...evaluation };
    }).filter(r => r.student && r.media !== undefined);
  }, [state]);

  const handleNextGroup = () => {
    // Only resets selection, data saving handled in Finish
    updateState({ ...state, selectedStudentIds: [] });
    onContinue();
  };

  const handleFinishAndSave = async () => {
    if (!window.confirm("FINALIZAR E SALVAR?\n\nEsta ação irá:\n1. Promover os alunos aprovados.\n2. Salvar o histórico.\n3. Atualizar a base de dados (Nuvem).\n4. Resetar o evento.")) {
        return;
    }
    
    setIsSavingCloud(true);

    try {
        const rankList = state.config.faixas;
        const approvedGroupsForCloud: Record<string, Student[]> = {};
        let cloudSuccessCount = 0;

        // Create a new students list with updates applied (Immutable pattern)
        const updatedStudentsList = state.students.map(student => {
            const evaluation = state.evaluations[student.id];

            // Process only if evaluated in this session AND approved
            if (evaluation && evaluation.status && evaluation.status.includes('Aprovado')) {
                const nextRank = getNextRank(student.graduacao, rankList);
                
                // Create History Entry with NEW rank info
                const newHistoryItem: ExamHistoryItem = {
                    data: state.config.data,
                    graduacao: nextRank, // Records the rank they promoted TO
                    local: state.config.local,
                    nota: evaluation.media
                };

                const existingHistory = student.historicoExames || [];
                // Avoid duplicate history entries
                const alreadyHasHistory = existingHistory.some(h => 
                    h.data === state.config.data && h.graduacao === nextRank
                );

                const newHistory = alreadyHasHistory ? existingHistory : [...existingHistory, newHistoryItem];
                
                // Prepare the updated student object
                const updatedStudent = {
                    ...student,
                    graduacao: nextRank, // PROMOTE STUDENT
                    historicoExames: newHistory
                };

                // Group for Cloud Saving (Using the NEW Rank)
                if (!approvedGroupsForCloud[nextRank]) {
                    approvedGroupsForCloud[nextRank] = [];
                }
                approvedGroupsForCloud[nextRank].push(updatedStudent);
                cloudSuccessCount++;

                return updatedStudent;
            }
            
            return student; // No change for non-evaluated or failed students
        });

        // 1. CLOUD SAVE
        if (auth.currentUser) {
            // Iterate over the groups and save to Firebase using the TARGET rank
            for (const [targetRank, students] of Object.entries(approvedGroupsForCloud)) {
                if (students.length > 0) {
                    await finalizarExame(
                        { 
                            data: state.config.data, 
                            local: state.config.local, 
                            dojo_id: auth.currentUser.uid, 
                            sensei_id: state.config.avaliador 
                        }, 
                        targetRank, 
                        students
                    );
                }
            }
            if (cloudSuccessCount > 0) alert(`Sucesso! ${cloudSuccessCount} alunos promovidos e salvos na nuvem.`);
        } else {
            console.log("Modo offline. Alterações salvas apenas localmente.");
        }

        // 2. LOCAL STATE RESET & UPDATE
        const date = new Date();
        const today = date.toISOString().split('T')[0];

        updateState({
            ...state,
            students: updatedStudentsList, // Apply the promotions to the global state
            evaluations: {},
            selectedStudentIds: [],
            config: { ...state.config, data: today, local: '', status: 'OPEN' }
        });
        
        onFinish(); 

    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Houve um erro inesperado ao salvar. Verifique sua conexão e tente novamente.");
    } finally {
        setIsSavingCloud(false);
    }
  };

  const generateEventPackage = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      
      const evaluated = results.filter(r => r.student);
      const approved = evaluated.filter(r => r.status.includes('Aprovado'));

      // Create structured folders (FLAT STRUCTURE)
      const certFolder = zip.folder("Certificados");
      const ridFolder = zip.folder("Relatorios_Individuais");

      // 1. Generate Items for Each Approved Student
      for (const item of approved) {
        const student = item.student!;
        const safeName = student.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        // A. Generate PDF Certificate
        const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
        
        // Background
        if (state.config.certificateConfig?.bgUrl) {
           try {
              doc.addImage(state.config.certificateConfig.bgUrl, 'JPEG', 0, 0, 297, 210);
           } catch(e) { console.error("Img error", e); }
        } else {
           doc.setFillColor(255, 255, 255);
           doc.rect(0,0,297,210, 'F');
           doc.setDrawColor(220, 38, 38);
           doc.setLineWidth(2);
           doc.rect(10,10,277,190);
        }

        // Text Content
        doc.setFont("times", "bold");
        doc.setFontSize(40);
        doc.text("CERTIFICADO", 148.5, 50, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text("Certificamos que", 148.5, 70, { align: 'center' });
        
        doc.setFontSize(32);
        doc.text(student.nome.toUpperCase(), 148.5, 90, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        const text = state.config.certificateConfig?.customText || "cumpriu os requisitos técnicos exigidos e foi promovido(a) para:";
        doc.text(text, 148.5, 110, { align: 'center' });
        
        doc.setFontSize(28);
        doc.setTextColor(220, 38, 38);
        
        // Use next rank for certificate
        const rankList = state.config.faixas;
        const nextRank = getNextRank(student.graduacao, rankList);
        
        doc.text(nextRank.toUpperCase(), 148.5, 130, { align: 'center' });
        
        doc.setTextColor(0,0,0);
        doc.setFontSize(12);
        doc.text(`Data: ${formatDateBR(state.config.data)}`, 40, 170);
        doc.text("__________________________", 200, 170);
        doc.text(state.config.avaliador, 200, 175, { align: 'center' });

        // Add PDF to CertFolder
        if (certFolder) certFolder.file(`${safeName}.pdf`, doc.output('blob'));

        // B. Generate RID HTML to RIDFolder
        const ridHtml = generateRIDHtml(student, item as Evaluation, student.historicoExames || [], state.dojoProfile.nome, state.config.data);
        if (ridFolder) ridFolder.file(`${safeName}.html`, ridHtml);
      }

      // 3. Generate General Report (Summary of ALL evaluated students) - HTML
      const generalReportHtml = generateGeneralReportHtml(evaluated, state.config, state.dojoProfile);
      zip.file(`Relatorio_Geral.html`, generalReportHtml);

      // 4. Generate General Report (Spreadsheet style) - PDF
      const generalReportPdfBlob = generateGeneralReportPDF(evaluated, state.config, state.dojoProfile);
      zip.file(`Relatorio_Geral_Impressao.pdf`, generalReportPdfBlob);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Exame_Bushido_${state.config.data}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error(error);
      alert("Erro ao gerar o pacote.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-40">
      <div className="bg-bushido-card border border-white/5 p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-bushido-red/20 to-transparent pointer-events-none transform skew-x-[-20deg] translate-x-20"></div>
        
        <div className="z-10 relative">
          <h2 className="text-5xl font-display font-bold text-white tracking-widest flex items-center gap-4 leading-none">
             <Shield className="w-12 h-12 text-bushido-red" />
             RESULTADOS
          </h2>
          <div className="h-1 w-20 bg-bushido-red mt-4 mb-2"></div>
          <p className="text-gray-400 mt-2 font-bold uppercase tracking-[0.2em] text-xs">
            Sessão encerrada com {results.length} atletas.
          </p>
        </div>

        <button 
            onClick={generateEventPackage} 
            disabled={results.length === 0 || isGenerating}
            className={`btn-blade group relative px-12 py-6 shadow-[0_0_30px_rgba(220,38,38,0.3)] flex items-center justify-center gap-6 transition-all ${
                results.length === 0 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                : 'bg-bushido-red hover:bg-red-600 text-white'
            }`}
        >
            {isGenerating ? <Loader2 className="w-8 h-8 animate-spin" /> : <Package className="w-8 h-8" />}
            <div className="text-left">
              <span className="block text-[10px] font-bold opacity-70 uppercase tracking-widest">Relatórios & Certificados</span>
              <span className="block text-2xl font-display font-bold tracking-wide leading-none">BAIXAR PACOTE</span>
            </div>
        </button>
      </div>

      {/* LISTA DE AVALIADOS */}
      <div className="bg-bushido-card border border-white/5 shadow-2xl mb-8">
        <div className="px-8 py-5 border-b border-white/5 bg-bushido-surface flex items-center gap-3">
           <div className="w-2 h-2 bg-bushido-red rounded-full animate-pulse"></div>
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Registro de Performance</h3>
        </div>
        <ul className="divide-y divide-white/5">
          {results.map((r) => (
            <li key={r.studentId} className="px-8 py-6 hover:bg-white/5 transition-colors group">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-8">
                    <div className={`h-20 w-20 flex items-center justify-center font-display font-bold text-3xl border-2 transform -skew-x-6 shadow-lg ${
                        r.media >= 6 
                        ? 'bg-bushido-surface border-bushido-gold text-white shadow-bushido-gold/20' 
                        : 'bg-red-950/30 border-red-600 text-red-500 shadow-red-900/20'
                    }`}>
                        {r.media.toFixed(1)}
                    </div>
                    <div>
                        <h4 className="text-2xl font-display font-bold text-white tracking-wide group-hover:text-bushido-red transition-colors uppercase">{r.student?.nome}</h4>
                        <div className="flex items-center gap-3 mt-2">
                             <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 text-gray-400 uppercase tracking-widest border border-white/5">{r.student?.graduacao}</span>
                             <span className="text-[10px] font-mono text-gray-600 tracking-widest">{r.student?.matricula}</span>
                        </div>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-3">
                   <span className={`px-6 py-2 text-xs font-bold uppercase tracking-wider border skew-x-[-10deg] ${
                       r.status.includes('Aprovado') 
                       ? 'text-green-400 border-green-800 bg-green-900/20' 
                       : 'text-red-500 border-red-800 bg-red-900/20'
                   }`}>
                      <span className="skew-x-[10deg] block">{r.status}</span>
                   </span>
                   <span className="text-[10px] font-mono text-gray-500 tracking-widest">
                     KATA:{r.kata} | KIHON:{r.kihon} | KUMITE:{r.kumite}
                   </span>
                 </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-bushido-black/95 backdrop-blur-xl border-t border-white/10 p-6 z-30 no-print shadow-[0_-10px_50px_rgba(0,0,0,0.8)]">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="w-full md:w-auto order-2 md:order-1 flex-1">
               <button 
                   onClick={handleFinishAndSave}
                   disabled={isSavingCloud}
                   className="w-full btn-blade bg-bushido-surface border border-white/10 text-gray-400 hover:text-white hover:border-white/30 px-8 py-5 font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all"
               >
                   {isSavingCloud ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
                   <span>{isSavingCloud ? "Sincronizando..." : "Finalizar & Salvar Nuvem"}</span>
               </button>
            </div>

            <div className="w-full md:w-auto order-1 md:order-2 flex-[2]">
                <button 
                    onClick={handleNextGroup}
                    disabled={isSavingCloud}
                    className="w-full btn-blade bg-white text-black hover:bg-gray-200 px-10 py-5 font-display font-bold text-xl uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-4 transition-all"
                >
                    <Play className="w-6 h-6 fill-black" /> 
                    <span>Avaliar Próximo Grupo</span>
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Results;