import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  writeBatch, 
  collection, 
  serverTimestamp 
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { DojoState } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyAeksjqkSri7tEOehIkWLdyOZg4Dgkpy0E",
  authDomain: "bushido-karate-manager.firebaseapp.com",
  projectId: "bushido-karate-manager",
  storageBucket: "bushido-karate-manager.firebasestorage.app",
  messagingSenderId: "120530026214",
  appId: "1:120530026214:web:425ba3a61ca2171c5c0527",
  measurementId: "G-BGD1RSL3QR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export Auth Methods for Login Component
export { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut };

export const initFirebaseSync = (
  onDataUpdate: (data: DojoState) => void
) => {
  // Listen to Auth State
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Conectado ao Firebase como:", user.email);
      const docRef = doc(db, "dojos", user.uid);
      
      // Listen to Firestore Document
      onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as DojoState;
          if (!docSnap.metadata.hasPendingWrites) {
             onDataUpdate(remoteData);
          }
        } else {
            console.log("Perfil novo ou banco vazio. Dados locais serão salvos em breve.");
        }
      });
    } else {
      console.log("Usuário não autenticado.");
    }
  });
};

export const saveToFirestore = async (state: DojoState) => {
    const user = auth.currentUser;
    if (user) {
        try {
            const docRef = doc(db, "dojos", user.uid);
            await setDoc(docRef, state, { merge: true });
        } catch (e: any) {
            console.error("Erro ao salvar no Firestore:", e.message);
        }
    }
};

/**
 * Finaliza um exame de graduação, registrando o evento e atualizando os alunos atomicamente.
 * 
 * @param {Object} dadosExame - Metadados do evento.
 * @param {String} novaFaixa - A nova graduação conquistada.
 * @param {Array} listaAprovados - Lista contendo os objetos dos alunos (deve ter a propriedade 'id' ou 'uid').
 * @returns {Promise<String>} O ID do documento de exame criado.
 */
export async function finalizarExame(
  dadosExame: { data: string; dojo_id?: string; sensei_id?: string; local: string },
  novaFaixa: string,
  listaAprovados: any[]
) {
  // Garante que o DB está inicializado
  const dbInstance = db || getFirestore();
  const batch = writeBatch(dbInstance);

  try {
    // 1. Preparar a referência do novo Exame (Gera o ID automaticamente antes de salvar)
    const exameRef = doc(collection(dbInstance, "exames"));
    
    // Adiciona o exame ao Batch
    batch.set(exameRef, {
      ...dadosExame,
      faixa_alvo: novaFaixa,
      total_aprovados: listaAprovados.length,
      created_at: serverTimestamp(), // Timestamp do servidor para ordenação precisa
      // Mapeia para salvar apenas IDs, tratando tanto 'uid' quanto 'id' (nosso tipo Student usa 'id')
      aprovados_ids: listaAprovados.map(a => a.uid || a.id || a) 
    });

    // 2. Iterar sobre os aprovados para criar as operações de atualização
    listaAprovados.forEach((aluno) => {
      // Tratamento para garantir que temos o ID
      const uid = typeof aluno === 'string' ? aluno : (aluno.uid || aluno.id);

      if (!uid) {
        console.warn(`Aluno sem UID ignorado:`, aluno);
        return;
      }

      // 2a. Referência ao documento do Aluno (users/{uid})
      const userRef = doc(dbInstance, "users", uid);
      
      // Atualiza a graduação atual do aluno
      batch.update(userRef, { 
        graduacao_atual: novaFaixa,
        last_update: serverTimestamp()
      });

      // 2b. Referência ao novo item na Timeline (users/{uid}/timeline/{auto-id})
      const timelineRef = doc(collection(dbInstance, "users", uid, "timeline"));
      
      // Cria o registro histórico
      batch.set(timelineRef, {
        tipo: "graduacao",
        titulo: novaFaixa,
        data: dadosExame.data, // Data informada no objeto do exame
        fonte: "BGM", // Bushido Graduation Manager
        verificado: true,
        id_exame: exameRef.id, // Link para o documento pai do exame
        created_at: serverTimestamp()
      });
    });

    // 3. Executar todas as operações de uma vez (Commit)
    await batch.commit();

    console.log(`Exame finalizado com sucesso! ID: ${exameRef.id}`);
    return exameRef.id;

  } catch (error) {
    console.error("Erro crítico ao finalizar exame:", error);
    // Relança o erro para que a UI possa mostrar um feedback visual (Toast/Alert)
    throw error; 
  }
}