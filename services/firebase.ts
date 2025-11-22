import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
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

// Helper to merge Deep objects (simple version)
const deepMerge = (local: any, remote: any): any => {
    return { ...local, ...remote };
};

export const initFirebaseSync = (
  onDataUpdate: (data: DojoState) => void
) => {
  // 1. Sign in Anonymously to get a UID (per project specs: Document ID = User UID)
  signInAnonymously(auth).catch((error) => {
      console.error("Erro na autenticação anônima:", error);
  });

  // 2. Listen to Auth State
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Conectado ao Firebase como:", user.uid);
      const docRef = doc(db, "dojos", user.uid);
      
      // 3. Listen to Firestore Document
      onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as DojoState;
          // Avoid updating if the snapshot is from a local write (latency compensation)
          if (!docSnap.metadata.hasPendingWrites) {
             onDataUpdate(remoteData);
          }
        } else {
            console.log("Documento não existe. Será criado ao salvar.");
        }
      });
    }
  });
};

export const saveToFirestore = async (state: DojoState) => {
    const user = auth.currentUser;
    if (user) {
        try {
            const docRef = doc(db, "dojos", user.uid);
            await setDoc(docRef, state, { merge: true });
        } catch (e) {
            console.error("Erro ao salvar no Firestore:", e);
        }
    }
};