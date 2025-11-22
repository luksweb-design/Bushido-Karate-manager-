import { GoogleGenAI } from "@google/genai";
import { Evaluation, Student } from "../types";

// Initialize Gemini Client
// Note: In a production app, ensure process.env.API_KEY is set correctly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'YOUR_API_KEY_HERE' });

export const generateSenseiFeedback = async (
  student: Student,
  evaluation: Evaluation
): Promise<string> => {
  try {
    const prompt = `
      Atue como um mestre de Karate experiente e sábio (Sensei).
      Gere um feedback curto e construtivo (máximo 2 frases) para o aluno ${student.nome} (${student.graduacao}).
      Notas (0-10):
      - Kata: ${evaluation.kata}
      - Kihon: ${evaluation.kihon}
      - Kumite: ${evaluation.kumite}
      - Teórico: ${evaluation.teorico}
      
      Média Final: ${evaluation.media.toFixed(1)}
      Status: ${evaluation.status}
      
      Se o status for Reprovado, seja encorajador. Se for Aprovado, inspire a continuar.
      Use termos tradicionais de karatê se apropriado (Oss, Zanshin, Kime).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Continue treinando duro. Oss!";
  } catch (error) {
    console.error("Error generating AI feedback:", error);
    return "Não foi possível gerar o feedback do Sensei no momento. Continue treinando!";
  }
};